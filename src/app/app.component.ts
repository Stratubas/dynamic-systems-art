import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';

const PIXEL_SIZE = 5;
const GIVE_UP_ITERATIONS = 100000; // default: 100000
const ANIMATION_DELAY = 100;
const SHOW_SIMULATION = true;
const LOOP_FOREVER = true;
const WIDTH = 400;
const HEIGHT = 200;
const SYSTEM_X_RANGE = [0.4, 0.6];
const SYSTEM_Y_RANGE = [0.325, 0.525];
const SUN_MASS = 200;
const ANIMATION_ITERATIONS_STEP = 1000;
const BATCH_COLUMN_SIZE = 1080;
// const ANIMATION_SCALE = 1 / 4;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  canvasWidth = WIDTH;
  canvasHeight = HEIGHT;
  animationWidth = 400; // Math.round(400 * WIDTH / HEIGHT);
  // animationWidth = WIDTH * ANIMATION_SCALE;
  // animationHeight = HEIGHT * ANIMATION_SCALE;

  @ViewChild('myCanvas', { static: true }) public myCanvas: ElementRef;
  @ViewChild('wallpaperCanvas', { static: true }) public wallpaperCanvasRef: ElementRef;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private wallpaperContext: CanvasRenderingContext2D;

  public system: DynamicSystem;
  constructor() {
    this.system = new DynamicSystem();
  }

  printBodies() {
    console.log('All bodies:');
    this.system.allBodies.forEach(body => console.log(body));
    console.log('Small bodies:');
    this.system.smallBodies.forEach(body => console.log(body));
    console.log('Massive bodies:');
    this.system.massiveBodies.forEach(body => console.log(body));
  }

  resetSystem() {
    this.system.reset();
    // this.system.addEasyBody(0.5, 0, SUN_MASS);
    // this.system.addEasyBody(0.5 + 0.25 * 0.2, -0.025, 2 * SUN_MASS);
    // this.system.addEasyBody(0.5 - 0.2, 0.1, 0.5 * SUN_MASS);
  }

  ngOnInit() {
    this.canvas = this.myCanvas.nativeElement;
    this.context = this.canvas.getContext('2d');
    this.wallpaperContext = this.wallpaperCanvasRef.nativeElement.getContext('2d');
    setTimeout(() => this.wallpaperContext.fillRect(0, 0, WIDTH, HEIGHT));
    this.doSimulations();
  }

  addWallpaperPixel(x: number, y: number, hitBodyIndex: number, iteration: number, size: number = 1) {
    const hue = ['0', '0', '240'][hitBodyIndex + 1];
    const timeToFall = iteration * this.system.dt;
    // const maxTime = GIVE_UP_ITERATIONS * this.system.dt;
    // const zeroToOne = Math.min(1, timeToFall / maxTime);
    let light = 1 / (1 + timeToFall / 100); // Math.pow(10, -timeToFall / 1000);
    if (iteration == GIVE_UP_ITERATIONS && !LOOP_FOREVER) { light = 0; }
    // if (LOOP_FOREVER) { light = 1; }
    // const darkness = Math.pow(zeroToOne, 1 / 2);
    const style = 'hsl(' + hue + ',100%,' + 50 * Math.max(light, 0) + '%)';
    // const style = 'hsl(' + (2 * timeToFall % 360) + ',100%,' + 50 + '%)';
    this.wallpaperContext.fillStyle = style;
    this.wallpaperContext.fillRect(x, y, size, size);
  }

  async doSimulationsBatch(xPixels: number[], step: number, results: any[]) {
    const start = performance.now();
    this.resetSystem();
    const bodyPixels = [];
    const minDimension = Math.min(WIDTH, HEIGHT);
    const paddingX = Math.max(0, WIDTH - minDimension) / 2;
    const paddingY = Math.max(0, HEIGHT - minDimension) / 2;
    for (const xPixel of xPixels) {
      for (let yPixel = 0; yPixel < HEIGHT; yPixel += step) {
        const scaleX = SYSTEM_X_RANGE[1] - SYSTEM_X_RANGE[0];
        const scaleY = SYSTEM_Y_RANGE[1] - SYSTEM_Y_RANGE[0];
        const xCoord = SYSTEM_X_RANGE[0] + scaleX * (-paddingX + xPixel + PIXEL_SIZE / 2) / minDimension;
        const yCoord = SYSTEM_Y_RANGE[0] + scaleY * (-paddingY + yPixel + PIXEL_SIZE / 2) / minDimension;
        this.system.addRestingBody(xCoord, yCoord, 0);
        // console.log(xCoord, yCoord);
        bodyPixels.push({ xPixel, yPixel });
      }
    }
    // this.printBodies();
    const hitIndexes: { [bodyIndex: number]: number } = {};
    const hitIterations: { [bodyIndex: number]: number } = {};
    for (let iteration = 1; iteration <= GIVE_UP_ITERATIONS || LOOP_FOREVER; iteration++) {
      await this.system.doTimeStep();
      for (let bodyIndex = 0; bodyIndex < bodyPixels.length; bodyIndex++) {
        const collisions = this.system.getCollisionsOfSmallBodyWithIndex(bodyIndex);
        if (collisions.length > 0) {
          hitIndexes[bodyIndex] = collisions[0];
          hitIterations[bodyIndex] = iteration;
          this.system.smallBodies[bodyIndex].x = 10;
          this.system.smallBodies[bodyIndex].vx = 10;
          if (SHOW_SIMULATION) {
            const pixels = bodyPixels[bodyIndex];
            this.addWallpaperPixel(pixels.xPixel, pixels.yPixel, collisions[0], iteration, step);
          }
          this.system.smallBodies[bodyIndex].dead = true;
          if (Object.keys(hitIndexes).length == this.system.smallBodies.length) {
            break;
          }
        }
      }
      if (SHOW_SIMULATION && iteration % ANIMATION_ITERATIONS_STEP == 0) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.system.allBodies.forEach(body => {
          const size = body.mass == 0 ? 4 : 10;//10 * body.mass;
          const x = 400 * body.x - size / 2;
          const y = 400 * body.y - size / 2;
          this.context.fillRect(x, y, size, size);
        });
        await new Promise(res => setTimeout(res, ANIMATION_DELAY));
      }
    };
    // console.log(hitIterations);
    for (let bodyIndex = 0; bodyIndex < bodyPixels.length; bodyIndex++) {
      const xPixel = bodyPixels[bodyIndex].xPixel;
      const yPixel = bodyPixels[bodyIndex].yPixel;
      const hitIndex = hitIndexes[bodyIndex] == undefined ? -1 : hitIndexes[bodyIndex];
      const iteration = hitIterations[bodyIndex] || GIVE_UP_ITERATIONS;
      // results.push({xPixel, yPixel, hitIndex, iteration, step});
      this.addWallpaperPixel(xPixel, yPixel, hitIndex, iteration, step);
    }
    console.log('Last batch took:', performance.now() - start);
  }

  async doSimulations() {
    const results = [];
    const start = performance.now();
    const step = PIXEL_SIZE;
    let xPixel = 0;
    const batchColumnsSize = BATCH_COLUMN_SIZE;
    const loop = async () => new Promise(resolve => {
      setTimeout(async () => {
        const xPixels = [];
        for (let column = 0; column < batchColumnsSize; column++) {
          const nextXPixel = xPixel + column * step;
          if (nextXPixel >= WIDTH) { break; }
          xPixels.push(nextXPixel);
        }
        await this.doSimulationsBatch(xPixels, step, results);
        xPixel = xPixels[xPixels.length - 1] + step;
        if (xPixel < WIDTH) { return await loop(); }
        console.log('All simulations took:', performance.now() - start);
        // const resultsString = JSON.stringify(results);
        // localStorage.setItem('springResults', resultsString);
        // console.log(localStorage.getItem('springResults'));
        resolve();
      });
    });
    await loop();
    // // This is the equivalent using setInterval
    // const interval = setInterval(() => {
    //   this.doSimulationsBatch(xPixel, step);
    //   xPixel += step;
    //   if (xPixel >= 400) {
    //     clearInterval(interval);
    //     console.log('All simulations took:', performance.now() - start);
    //   }
    // });
  }

}
