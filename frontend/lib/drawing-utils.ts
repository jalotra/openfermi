export interface StrokeData {
  id: string;
  points: number[][];
  color: string;
  size: number;
  timestamp: number;
}

export interface DrawingData {
  strokes: StrokeData[];
}

const average = (a: number, b: number) => (a + b) / 2;

export function getSvgPathFromStroke(
  points: number[][],
  closed = true,
): string {
  const len = points.length;

  if (len < 4) {
    return "";
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function hitTestStroke(
  stroke: StrokeData,
  point: [number, number],
  threshold = 10,
): boolean {
  const pts = stroke.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const dist = distanceToSegment(
      point[0],
      point[1],
      pts[i][0],
      pts[i][1],
      pts[i + 1][0],
      pts[i + 1][1],
    );
    if (dist < threshold + stroke.size / 2) {
      return true;
    }
  }
  return false;
}

export async function exportSvgToPng(
  svgElement: SVGSVGElement,
  filename: string,
): Promise<void> {
  const bbox = svgElement.getBBox();
  const padding = 20;
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;

  const cloned = svgElement.cloneNode(true) as SVGSVGElement;
  cloned.setAttribute(
    "viewBox",
    `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`,
  );
  cloned.setAttribute("width", String(width));
  cloned.setAttribute("height", String(height));
  cloned.style.backgroundColor = "white";

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(cloned);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = URL.createObjectURL(pngBlob);
        link.click();
        URL.revokeObjectURL(link.href);
        resolve();
      }, "image/png");
    };
    img.onerror = reject;
  });
}

export function generateStrokeId(): string {
  return `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
