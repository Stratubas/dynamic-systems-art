export interface Point {
  x: number;
  y: number;
}

export interface PolarPoint {
  r: number;
  t: number;
}

export function getRadius2(p: Point): number {
  return p.x * p.x + p.y * p.y;
}

export function cartesianToPolar(p: Point): PolarPoint {
  const r = Math.sqrt(p.x * p.x + p.y * p.y);
  const t = Math.atan2(p.y, p.x);
  return { r, t };
}

export function polarToCartesian(polar: PolarPoint): Point {
  return {
    x: polar.r * Math.cos(polar.t),
    y: polar.r * Math.sin(polar.t),
  };
}
