function getHex([r, g, b]: [number, number, number]) {
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0").toUpperCase();
}

const defaultAnchors: [number, number, number][] = [
  [0, 0, 0],
  [95, 35, 129],
  [201, 66, 69],
  [250, 115, 13],
  [255, 174, 33],
  [255, 225, 125],
  [255, 255, 255],
];

export function getInterpolatedColor(t: number, anchors = defaultAnchors) {

  const n = anchors.length - 1;
  const scaled = t * n;
  const i = Math.floor(scaled);
  const local = scaled - i;

  if (i >= n) {
    return getHex(anchors[n]);
  }
  if (i < 0) {
    return getHex(anchors[0]);
  }

  const c0 = anchors[i];
  const c1 = anchors[i + 1];
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * local);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * local);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * local);
  return getHex([r, g, b]);

}
