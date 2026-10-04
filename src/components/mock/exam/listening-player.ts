"use client";

import type { ScriptLine } from "@/lib/mock/format";

// Plays the Listening section once, part after part, like the real test: an uploaded recording, or
// — for tests without one — the script read aloud by the device's own English voices, a different
// voice for each speaker. Must be started from a click (browsers only play sound after one).

export type PartSource = { audio: string | null; script: ScriptLine[] | null };
type Handlers = { onPart: (index: number) => void; onEnd: () => void; onError: (message: string) => void };

const FEMALE = /zira|hazel|susan|libby|sonia|karen|moira|samantha|serena|kate|fiona|tessa|victoria|female|woman|emma|amy|olivia|natasha|aria|jenny|catherine|nicky/i;
const MALE = /david|george|ryan|daniel|mark|alex|fred|oliver|arthur|thomas|male|man\b|guy|james|william|rishi|brian|eric|lee/i;

function englishVoices() {
  const all = typeof speechSynthesis === "undefined" ? [] : speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
  const rank = (v: SpeechSynthesisVoice) => (/en[-_]GB/i.test(v.lang) ? 0 : /en[-_](AU|IE|NZ)/i.test(v.lang) ? 1 : 2) + (v.localService ? 0 : 0.5);
  return all.sort((a, b) => rank(a) - rank(b));
}

/** Voices load in the background in some browsers; wait for them briefly. */
export function voicesReady(): Promise<void> {
  if (typeof speechSynthesis === "undefined" || speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Long lines are split into sentences: some browsers stop speaking in the middle of long ones. */
function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]*["')]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/** An empty WAV file. */
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

export class ListeningPlayer {
  private audio: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private part = -1;
  private stopped = false;
  private volume = 1;
  private voices = new Map<string, { voice?: SpeechSynthesisVoice; pitch: number }>();

  constructor(
    private parts: PartSource[],
    private handlers: Handlers,
  ) {}

  /** Starts (or restarts) at the beginning of a part. Call from a click handler. */
  start(fromPart = 0) {
    this.stop();
    this.stopped = false;
    // Created inside the click so later parts may play without another click (Safari needs this).
    this.audio ??= new Audio();
    this.audio.volume = this.volume;
    // A moment of silence unlocks this element for the recordings that follow.
    this.audio.src = SILENCE;
    this.audio.play().catch(() => {});
    this.playPart(fromPart);
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.audio?.pause();
    if (canSpeak()) speechSynthesis.cancel();
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.audio) this.audio.volume = volume;
  }

  private next() {
    if (this.stopped) return;
    // A short silence between parts, as in the real recording.
    this.timer = setTimeout(() => this.playPart(this.part + 1), 1500);
  }

  private playPart(index: number) {
    if (this.stopped) return;
    while (index < this.parts.length && !this.parts[index].audio && !this.parts[index].script?.length) index++;
    if (index >= this.parts.length) {
      this.handlers.onEnd();
      return;
    }
    this.part = index;
    this.handlers.onPart(index);
    const source = this.parts[index];
    if (source.audio) {
      const audio = this.audio!;
      audio.onended = () => this.next();
      audio.onerror = () => {
        this.handlers.onError(`The recording for Part ${index + 1} couldn't be played.`);
        this.next();
      };
      audio.src = source.audio;
      audio.play().catch(() => this.handlers.onError("Press Play to continue the recording."));
    } else {
      void this.speakScript(source.script!);
    }
  }

  private async speakScript(lines: ScriptLine[]) {
    if (!canSpeak()) {
      this.handlers.onError("This browser can't read the recording aloud. Use Chrome, Edge or Safari.");
      this.next();
      return;
    }
    await voicesReady();
    const queue: ScriptLine[] = lines.flatMap((l): ScriptLine[] => ("pause" in l ? [l] : sentences(l.text).map((text) => ({ speaker: l.speaker, text }))));
    let i = 0;
    const step = () => {
      if (this.stopped) return;
      if (i >= queue.length) return this.next();
      const item = queue[i++];
      if ("pause" in item) {
        this.timer = setTimeout(step, item.pause * 1000);
        return;
      }
      const u = new SpeechSynthesisUtterance(item.text);
      const { voice, pitch } = this.voiceFor(item.speaker);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else u.lang = "en-GB";
      u.pitch = pitch;
      u.rate = 0.95;
      u.volume = this.volume;
      u.onend = () => step();
      u.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") step();
      };
      speechSynthesis.speak(u);
    };
    step();
  }

  /** The same voice for a speaker throughout; different speakers get different voices where the device has them. */
  private voiceFor(speaker: string) {
    const known = this.voices.get(speaker);
    if (known) return known;
    const voices = englishVoices();
    const used = new Set([...this.voices.values()].map((v) => v.voice?.voiceURI));
    const wantFemale = /woman|girl|female|mrs|ms|miss|lady|mother|receptionist/i.test(speaker);
    const wantMale = /\bman\b|boy|male|mr\b|gentleman|father/i.test(speaker);
    const fresh = voices.filter((v) => !used.has(v.voiceURI));
    const pick =
      (wantFemale && fresh.find((v) => FEMALE.test(v.name))) ||
      (wantMale && fresh.find((v) => MALE.test(v.name))) ||
      // Alternate: a speaker unlike the previous one where possible.
      fresh.find((v) => (this.voices.size % 2 ? FEMALE : MALE).test(v.name)) ||
      fresh[0] ||
      voices[this.voices.size % Math.max(voices.length, 1)];
    // With a single voice on the device, speakers still sound different by pitch.
    const pitch = fresh.length ? 1 : [1, 0.8, 1.2, 0.9, 1.1][this.voices.size % 5];
    const entry = { voice: pick, pitch };
    this.voices.set(speaker, entry);
    return entry;
  }
}

/** A short line through the speakers or headphones before Listening starts. */
export async function soundCheck(volume: number) {
  if (canSpeak()) {
    await voicesReady();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("This is a sound check. You should hear this voice clearly through your headphones.");
    const voice = englishVoices()[0];
    if (voice) u.voice = voice;
    u.volume = volume;
    speechSynthesis.speak(u);
    return;
  }
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.2 * volume;
  osc.connect(gain).connect(ctx.destination);
  osc.frequency.value = 660;
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}
