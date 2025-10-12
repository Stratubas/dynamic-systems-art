import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

interface PolarPoint {
  r: number;
  t: number;
}

function multiply(p1: Point, p2: Point): Point {
  return {
    x: p1.x * p2.x - p1.y * p2.y,
    y: p1.x * p2.y + p1.y * p2.x,
  };
}

function add(p1: Point, p2: Point): Point {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  };
}

function getRadius2(p: Point): number {
  return p.x * p.x + p.y * p.y;
}

function cartesianToPolar(p: Point): PolarPoint {
  const r = Math.sqrt(p.x * p.x + p.y * p.y);
  const t = Math.atan2(p.y, p.x);
  return { r, t };
}

function polarToCartesian(polar: PolarPoint): Point {
  return {
    x: polar.r * Math.cos(polar.t),
    y: polar.r * Math.sin(polar.t),
  };
}

function getHex([r, g, b]: [number, number, number]) {
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0").toUpperCase();
}

function getColor(t: number) {

  const anchors: [number, number, number][] = [
    [0, 0, 0],
    [95, 35, 129],
    [201, 66, 69],
    [250, 115, 13],
    [255, 174, 33],
    [255, 225, 125],
    [255, 255, 255],
  ];

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

const ROTATION = 0; // Math.PI / 4;
// const calcLimits = {
//   bottomLeft: { x: -1.6, y: -1 },
//   topRight: { x: 1.6, y: 1 },
// };
// const polarLimits = {
//   bottomLeft: cartesianToPolar(calcLimits.bottomLeft),
//   topRight: cartesianToPolar(calcLimits.topRight),
// };
// const plotLimits = {
//   bottomLeft: polarToCartesian({ r: polarLimits.bottomLeft.r, t: polarLimits.bottomLeft.t - ROTATION }),
//   topRight: polarToCartesian({ r: polarLimits.topRight.r, t: polarLimits.topRight.t - ROTATION }),
// };

const offset = 0; // 0.0001717171717;
// const bottomLeft: Point = { x: -1.2 + offset, y: -1.4 + offset };
// const topRight: Point = { x: 1.2 + offset, y: 1.4 + offset };
const bottomLeft: Point = { x: -1.6, y: -1 };
const topRight: Point = { x: 1.6, y: 1 };
const f = (z: Point) => {
  const z2 = multiply(z, z);
  const c: Point = { x: -0.7, y: -0.3 };
  return add(z2, c);
};
const SMOOTHING_STEPS = 3;
const PLOT_SCALE = 2 / 2;
const xStep = PLOT_SCALE / 375;
const yStep = PLOT_SCALE / 375;
const xStepCount = Math.round((topRight.x - bottomLeft.x) / xStep);
const yStepCount = Math.round((topRight.y - bottomLeft.y) / yStep);
const bgColorScale = 1 / 8;
const bgColor = getColor(bgColorScale);

const WIDTH = 1200 / PLOT_SCALE;
const HEIGHT = Math.round(WIDTH * yStepCount / xStepCount);
const maxIterations = 400;
const pointWidth = WIDTH / xStepCount;
const pointHeight = HEIGHT / yStepCount;
console.log({ WIDTH, HEIGHT, xStepCount, yStepCount, bottomLeft, topRight, xStep, yStep, pointWidth, pointHeight });


@Component({
  selector: 'app-julia-set',
  templateUrl: './julia-set.component.html',
  styleUrls: ['./julia-set.component.scss']
})
export class JuliaSetComponent implements OnInit {

  @ViewChild('wallpaperCanvas', { static: true }) public wallpaperCanvasRef: ElementRef;
  private wallpaperCanvas: HTMLCanvasElement;
  private wallpaperContext: CanvasRenderingContext2D;

  canvasWidth = WIDTH;
  canvasHeight = HEIGHT;

  bgColor = bgColor;

  results?: { plotPoint: Point, iterations: number }[];

  constructor() { }

  ngOnInit() {
    this.wallpaperCanvas = this.wallpaperCanvasRef.nativeElement;
    this.wallpaperContext = this.wallpaperCanvas.getContext('2d');
  }

  go() {
    const startTime = performance.now();
    const items: { plotPoint: Point, calcPoint: Point }[] = [];
    for (let xi = 0; xi < xStepCount; xi++) {
      const x = bottomLeft.x + xi * xStep + xStep / 2;
      for (let yi = 0; yi < yStepCount; yi++) {
        const y = bottomLeft.y + yi * yStep + yStep / 2;
        const plotPoint = { x, y };
        const polarPoint = cartesianToPolar({ x, y });
        const rotated = { r: polarPoint.r, t: polarPoint.t - ROTATION };
        const calcPoint = polarToCartesian(rotated)
        items.push({ plotPoint, calcPoint });
      }
    }

    this.results = items.map(item => ({
      plotPoint: item.plotPoint,
      calcPoint: item.calcPoint,
      iterations: this.getPointIterations(item.calcPoint),
    }));
    let min = maxIterations;
    let max = 0;
    this.results.forEach(r => {
      min = Math.min(min, r.iterations);
      max = Math.max(max, r.iterations);
    });
    const calcTime = performance.now() - startTime;
    console.log('Calculated', this.results.length, 'points', { min, max, calcTime });
    // console.log(results);
    this.results.forEach(result => {
      const { x, y } = result.plotPoint;
      this.paintPixel(x, y, result.iterations, min, max);
    });
    console.log('Drawing took', performance.now() - startTime - calcTime, 'ms');
  }

  paintPixel(x: number, y: number, iterations: number, min = 0, max = maxIterations) {
    // const hue = '240'; // ['0', '0', '240'][hitBodyIndex + 1];
    // const light = Math.pow(10, -iterations / maxIterations);
    const scale = (iterations - min) / max;
    if (scale <= 0) {
      return;
    }
    // const hue = 240 + 30 * Math.pow(scale, 1);
    // const light = 50 * Math.pow(scale, 2 / 1);
    // const style = 'hsl(' + hue + ',100%,' + 50 * Math.max(intensity, 0) + '%)';
    // const style = 'hsl(' + hue + ',100%,' + light + '%)';
    // const style = getColor((iterations + 5) ** (1 / 16) - 1.2);
    const intensity = scale ** 0.4;
    if (intensity <= bgColorScale) {
      return;
    }
    const style = getColor(intensity);
    this.wallpaperContext.fillStyle = style;
    const xScaled = Math.round(WIDTH * (x - xStep / 2 - bottomLeft.x) / (topRight.x - bottomLeft.x));
    const yScaled = Math.round(HEIGHT * (y - yStep / 2 - bottomLeft.y) / (topRight.y - bottomLeft.y));
    // console.log({w, h});
    this.wallpaperContext.fillRect(xScaled, yScaled, pointWidth, pointHeight);
  }

  getPointIterations(point: Point) {
    let p = { ...point };
    let i = 0;
    const escapeRadius2 = 4;
    while (i < maxIterations) {
      const distance2 = getRadius2(p);
      if (distance2 >= escapeRadius2) {
        if (SMOOTHING_STEPS) {
          // https://linas.org/art-gallery/escape/escape.html
          for (let s = 0; s < SMOOTHING_STEPS; s++) {
            p = f(p);
            i++;
          }
          i = i + 1 - Math.LOG2E * Math.log(0.5 * Math.log(getRadius2(p)));
        }
        break;
      }
      p = f(p);
      i++;
    }
    return i;
  }


}
