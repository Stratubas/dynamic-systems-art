export type ColorAnchors = [number, number, number, number][];

export function getHex([r, g, b, a]: [number, number, number, number]) {
  return "#" + (((r << 24) | (g << 16) | (b << 8) | a) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

const defaultAnchors: ColorAnchors = [
  [0, 0, 0, 255],
  [95, 35, 129, 255],
  [201, 66, 69, 255],
  [250, 115, 13, 255],
  [255, 174, 33, 255],
  [255, 225, 125, 255],
  [255, 255, 255, 255],
];

export function getInterpolatedRgba(t: number, anchors = defaultAnchors): ColorAnchors[number] {

  const n = anchors.length - 1;
  const scaled = t * n;
  const i = Math.floor(scaled);
  const local = scaled - i;

  if (i >= n) {
    return anchors[n];
  }
  if (i < 0) {
    return anchors[0];
  }

  const c0 = anchors[i];
  const c1 = anchors[i + 1];
  const r = Math.min(Math.max(Math.round(c0[0] + (c1[0] - c0[0]) * local), 0), 255);
  const g = Math.min(Math.max(Math.round(c0[1] + (c1[1] - c0[1]) * local), 0), 255);
  const b = Math.min(Math.max(Math.round(c0[2] + (c1[2] - c0[2]) * local), 0), 255);
  const a = Math.min(Math.max(Math.round(c0[3] + (c1[3] - c0[3]) * local), 0), 255);
  return [r, g, b, a];

}
