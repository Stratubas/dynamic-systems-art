import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ColorAnchors, getHex, getInterpolatedRgba } from 'src/app/shared/helpers/colors';
import { add, multiply } from 'src/app/shared/helpers/complex';
import { Point, cartesianToPolar, getRadius2, polarToCartesian } from 'src/app/shared/helpers/coordinates';
import { environment } from 'src/environments/environment';


const bottomLeft: Point = { x: -2, y: -2 };
const topRight: Point = { x: 2, y: 2 }; // TODO: dynamic bounds & aspect ratio
const defaultC: Point = { x: -0.7, y: -0.3 };
const f = (z: Point, c: Point) => {
  const z2 = multiply(z, z);
  return add(z2, c);
};
const SMOOTHING_STEPS = 3;

const colorAnchors: ColorAnchors = [
  [255, 255 * 2, 0, -255],
  [255, 40, 0, 255],
  [140, 0, 0, 255],
  [20, 0, 0, 255],
];
const bgColorScale = 1 / 10;
const bgColor = getHex(getInterpolatedRgba(bgColorScale, colorAnchors));


@Component({
  selector: 'app-julia-set',
  templateUrl: './julia-set.component.html',
  styleUrls: ['./julia-set.component.scss']
})
export class JuliaSetComponent implements OnInit {

  @ViewChild('previewCanvas', { static: true }) public previewCanvasRef: ElementRef;
  private previewCanvas: HTMLCanvasElement;
  private previewContext: CanvasRenderingContext2D;

  previewSize = 300;

  bgColor = bgColor;
  sliderColor = getHex(getInterpolatedRgba(0.4));

  c = defaultC;
  maxIterations = 200;
  rotation = 0;

  pendingWork?: Promise<void>;

  isDev = !environment.production;

  constructor() { }

  ngOnInit() {
    this.previewCanvas = this.previewCanvasRef.nativeElement;
    this.previewContext = this.previewCanvas.getContext('2d');
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
      this.go();
      setTimeout(res);
    });
  }

  getCalcPoints(size: number): Point[] {
    const calcPoints: Point[] = [];
    const dx = topRight.x - bottomLeft.x;
    const dy = topRight.y - bottomLeft.y;
    const [width, height] = [size, size];
    for (let yi = 0; yi < height; yi++) {
      const y = bottomLeft.y + dy * (yi + 0.5) / height;
      for (let xi = 0; xi < width; xi++) {
        const x = bottomLeft.x + dx * (xi + 0.5) / width;
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
    return calcPoints;
  }

  getResults(calcPoints: Point[]): { min: number, max: number, values: number[] } {
    const values = calcPoints.map(point => this.getPointIterations(point, this.c));
    let min = this.maxIterations;
    let max = 0;
    values.forEach(r => {
      min = Math.min(min, r);
      max = Math.max(max, r);
    });
    if (Number.isNaN(min)) {
      throw values;
    }
    return { min, max, values };
  }

  getImageData(results: ReturnType<JuliaSetComponent['getResults']>): ImageData {
    const { min, max, values } = results;
    const maxIntensity = this.getPixelIntensity(max, min, max);
    const buffer = new Uint8ClampedArray(values.length * 4);
    values.forEach((iterations, pointIndex) => {
      try {
        const intensity = this.getPixelIntensity(iterations, min, max) / maxIntensity;
        const rgba = getInterpolatedRgba(intensity, colorAnchors);
        buffer.set(rgba, pointIndex * 4 /* r, g, b, a */);
      } catch {
        console.warn(iterations, maxIntensity);
        buffer.set([0, 255, 0, 255], pointIndex * 4 /* r, g, b, a */);
      }
    });
    const width = Math.sqrt(values.length);
    // @ts-ignore:next-line
    const imageData = new ImageData(buffer, width);
    return imageData;
  }

  drawPreview(imageData: ImageData) {
    // @ts-ignore:next-line
    this.previewContext.reset();
    this.previewContext.putImageData(imageData, 0, 0);
  }

  go() {
    const startTime = performance.now();
    const calcPoints = this.getCalcPoints(this.previewSize);
    const results = this.getResults(calcPoints);
    const calcTime = performance.now() - startTime;
    if (this.isDev) {
      const { min, max } = results;
      console.log('Calculated', calcPoints.length, 'points', { min, max, calcTime });
    }
    const imageData = this.getImageData(results);
    this.drawPreview(imageData);
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
    const escapeRadius2 = 5;
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

  async export() {
    const sizeString = prompt('What size? (in pixels) (big values take a while)', '1080');
    if (!sizeString) {
      return;
    }
    const size = parseInt(sizeString);
    const calcPoints = this.getCalcPoints(size);
    const results = this.getResults(calcPoints);
    const imageData = this.getImageData(results);

    // @ts-ignore:next-line
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    const anchor = document.createElement('a');
    const now = new Date().toISOString();
    anchor.download = `julia-set_${size}px_${now}.png`;
    anchor.href = URL.createObjectURL(await canvas.convertToBlob());
    anchor.dataset.downloadurl = ['image/png', anchor.download, anchor.href].join(':');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

}
