import { Markdown } from "@/components/markdown";

const SHEET = `
| Shape | Formulas |
|---|---|
| Circle | $A = \\pi r^2$, $\;C = 2\\pi r$ |
| Rectangle | $A = \\ell w$ |
| Triangle | $A = \\tfrac{1}{2}bh$ |
| Right triangle | $c^2 = a^2 + b^2$ |
| Special right triangles | $x,\\ x\\sqrt{3},\\ 2x$ (30°-60°-90°) · $s,\\ s,\\ s\\sqrt{2}$ (45°-45°-90°) |
| Rectangular prism | $V = \\ell w h$ |
| Cylinder | $V = \\pi r^2 h$ |
| Sphere | $V = \\tfrac{4}{3}\\pi r^3$ |
| Cone | $V = \\tfrac{1}{3}\\pi r^2 h$ |
| Pyramid | $V = \\tfrac{1}{3}\\ell w h$ |

The number of degrees of arc in a circle is 360. The number of radians of arc in a circle is $2\\pi$. The sum of the measures in degrees of the angles of a triangle is 180.
`;

export function ReferenceSheet() {
  return <Markdown className="text-sm">{SHEET}</Markdown>;
}
