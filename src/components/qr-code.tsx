import qrcode from "qrcode-generator";

/** A QR code for a link, drawn as SVG. Always dark on white, which every phone camera can read. */
export function QrCode({ value, size = 148, label }: { value: string; size?: number; label: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 2;
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
  }
  const box = count + quiet * 2;
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${box} ${box}`} shapeRendering="crispEdges" className="shrink-0 rounded-lg">
      <rect width={box} height={box} fill="#fff" />
      <path d={path} fill="#0e1628" />
    </svg>
  );
}
