import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ColorAnchors, getHex, getInterpolatedRgba } from 'src/app/shared/helpers/colors';
import { add, multiply } from 'src/app/shared/helpers/complex';
import { Point, cartesianToPolar, getRadius2, polarToCartesian } from 'src/app/shared/helpers/coordinates';
import { environment } from 'src/environments/environment';


const bottomLeft: Point = { x: -2, y: -2 };
const topRight: Point = { x: 2, y: 2 };
const defaultC: Point = { x: -0.7, y: -0.3 };
const f = (z: Point, c: Point) => {
  const z2 = multiply(z, z);
  return add(z2, c);
};
const SMOOTHING_STEPS = 3;
const PLOT_SCALE = 4 / 1;
const xStep = PLOT_SCALE / 300;
const yStep = PLOT_SCALE / 300;
const xStepCount = Math.round((topRight.x - bottomLeft.x) / xStep);
const yStepCount = Math.round((topRight.y - bottomLeft.y) / yStep);

const colorAnchors: ColorAnchors = [
  [255, 255 * 2, 0, -255],
  [255, 40, 0, 255],
  [140, 0, 0, 255],
  [20, 0, 0, 255],
];
const bgColorScale = 1 / 10;
const bgColor = getHex(getInterpolatedRgba(bgColorScale, colorAnchors));

const WIDTH = 1200 / PLOT_SCALE;
const HEIGHT = Math.round(WIDTH * yStepCount / xStepCount);
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
  sliderColor = getHex(getInterpolatedRgba(0.4));

  buffer = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

  c = defaultC;
  maxIterations = 200;
  rotation = 0;

  pendingWork?: Promise<void>;

  resultIterations?: number[];

  isDev = !environment.production;

  constructor() { }

  ngOnInit() {
    this.wallpaperCanvas = this.wallpaperCanvasRef.nativeElement;
    this.wallpaperContext = this.wallpaperCanvas.getContext('2d');
    this.onParamChange();
  }

  async onParamChange() {
    const requestedC = { ...this.c };
    const requestedRotation = this.rotation;
    await this.pendingWork;
    if (requestedC.x !== this.c.x || requestedC.y !== this.c.y || requestedRotation !== this.rotation) {
      return; // Parameters have changed
    }
    this.pendingWork = new Promise(res => {
      this.go({ ...this.c });
      setTimeout(res);
    });
  }

  go(c: Point) {
    this.wallpaperContext.reset();
    const startTime = performance.now();
    const calcPoints: Point[] = [];
    for (let yi = 0; yi < yStepCount; yi++) {
      const y = bottomLeft.y + yi * yStep + yStep / 2;
      for (let xi = 0; xi < xStepCount; xi++) {
        const x = bottomLeft.x + xi * xStep + xStep / 2;
        const point = { x, y };
        if (!this.rotation) {
          calcPoints.push(point);
          continue;
        }
        const polarPoint = cartesianToPolar({ x, y });
        const rotated = { r: polarPoint.r, t: polarPoint.t - this.rotation };
        const calcPoint = polarToCartesian(rotated)
        calcPoints.push(calcPoint);
      }
    }

    this.resultIterations = calcPoints.map(point => this.getPointIterations(point, c));
    let min = this.maxIterations;
    let max = 0;
    this.resultIterations.forEach(r => {
      min = Math.min(min, r);
      max = Math.max(max, r);
    });
    const calcTime = performance.now() - startTime;
    if (this.isDev) {
      console.log('Calculated', calcPoints.length, 'points', { min, max, calcTime });
    }
    const maxIntensity = this.getPixelIntensity(max, min, max);
    this.resultIterations.forEach((iterations, pointIndex) => {
      const intensity = this.getPixelIntensity(iterations, min, max) / maxIntensity;
      const rgba = getInterpolatedRgba(intensity, colorAnchors);
      this.buffer.set(rgba, pointIndex * 4 /* r, g, b, a */);
    });
    const imageData = new ImageData(this.buffer, WIDTH);
    this.wallpaperContext.putImageData(imageData, 0, 0);
    if (this.isDev) {
      console.log('Drawing took', performance.now() - startTime - calcTime, 'ms');
    }
  }

  getPixelIntensity(iterations: number, min = 0, max = 1): number {
    const scale = (iterations - min) / max;
    if (scale < 0) {
      return 0;
    }
    const intensity = Math.log(1 + 5 * scale); // `scale ** 0.4` works nice too
    if (intensity <= bgColorScale) {
      return 0;
    }
    return intensity;
  }

  getPointIterations(point: Point, c: Point) {
    let p = { ...point };
    let i = 0;
    const escapeRadius2 = 4;
    while (i < this.maxIterations) {
      const distance2 = getRadius2(p);
      if (distance2 >= escapeRadius2) {
        if (SMOOTHING_STEPS) {
          // https://linas.org/art-gallery/escape/escape.html
          for (let s = 0; s < SMOOTHING_STEPS; s++) {
            p = f(p, c);
            i++;
          }
          i = i + 1 - Math.LOG2E * Math.log(0.5 * Math.log(getRadius2(p)));
        }
        break;
      }
      p = f(p, c);
      i++;
    }
    return i;
  }

}
