import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';

const PIXEL_SIZE = 2;
const STEPS_PER_ITERATION = 1000;
const GIVE_UP_ITERATIONS = 100000; // default: 100000
const ANIMATION_DELAY = 0;
const SHOW_SIMULATION = false;
const LOOP_FOREVER = false;
const WIDTH = 50;
const HEIGHT = 50;
const SYSTEM_X_RANGE = [0.4, 0.6];
const SYSTEM_Y_RANGE = [0.325, 0.525];
// const SUN_MASS = 200;
const ANIMATION_ITERATIONS_STEP = 1000;
const BATCH_SIZE = 10;
// const ANIMATION_SCALE = 1 / 4;

type SimulationInfo = { index: number, xPixelStart: number, yPixelStart: number, xBodyCoord: number, yBodyCoord: number };

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
    const wallpaperCanvas: HTMLCanvasElement = this.wallpaperCanvasRef.nativeElement;
    this.wallpaperContext = wallpaperCanvas.getContext('2d');
    setTimeout(() => {
      // this.wallpaperContext.fillRect(0, 0, WIDTH, HEIGHT);
      this.doSimulations();
    });
  }

  addWallpaperPixel(x: number, y: number, hitBodyIndex: number, collisionTime: number, customStyle?: string) {
    const didGiveUp = Math.round(collisionTime / this.system.dt) == GIVE_UP_ITERATIONS;
    const hue = ['0', '0', '240'][hitBodyIndex + 1];
    // const timeToFall = iteration * this.system.dt;
    // const maxTime = GIVE_UP_ITERATIONS * this.system.dt;
    // const zeroToOne = Math.min(1, timeToFall / maxTime);
    let light = 1 / (1 + collisionTime / 100); // Math.pow(10, -timeToFall / 1000);
    if (didGiveUp && !LOOP_FOREVER) { light = 0; }
    // if (LOOP_FOREVER) { light = 1; }
    // const darkness = Math.pow(zeroToOne, 1 / 2);
    const style = customStyle || ('hsl(' + hue + ',100%,' + 50 * Math.max(light, 0) + '%)');
    // const style = 'hsl(' + (2 * timeToFall % 360) + ',100%,' + 50 + '%)';
    this.wallpaperContext.fillStyle = style;
    this.wallpaperContext.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
  }

  async doSimulationsBatch(simulationsInfo: SimulationInfo[]) {
    this.resetSystem();
    for (const simulationInfo of simulationsInfo) {
      const xCoord = simulationInfo.xBodyCoord;
      const yCoord = simulationInfo.yBodyCoord;
      this.system.addRestingBody(xCoord, yCoord, 0);
      const xPixelStart = simulationInfo.xPixelStart;
      const yPixelStart = simulationInfo.yPixelStart;
      this.addWallpaperPixel(xPixelStart, yPixelStart, 0, 0, 'gray');
    }
    await new Promise(res => setTimeout(res, ANIMATION_DELAY));
    const hitIndexes: { [bodyIndex: number]: number } = {};
    const hitTimes: { [bodyIndex: number]: number } = {};
    for (let iteration = 0; iteration <= GIVE_UP_ITERATIONS || LOOP_FOREVER; iteration += STEPS_PER_ITERATION) {
      const collisions = await this.system.doTimeSteps(STEPS_PER_ITERATION);
      // if (collisions.length) { console.log('Got', collisions.length, 'collisions.'); }
      for (const collision of collisions) {
        const batchBodyIndex = collision.bodyIndex;
        // const simulationBodyIndex = simulationsInfo
        hitIndexes[batchBodyIndex] = collision.collidedTargetIndexes[0];
        hitTimes[batchBodyIndex] = collision.collisionTime;
        if (SHOW_SIMULATION) {
          const simulationInfo = simulationsInfo[batchBodyIndex];
          const xPixelStart = simulationInfo.xPixelStart;
          const yPixelStart = simulationInfo.yPixelStart;
          this.addWallpaperPixel(xPixelStart, yPixelStart, hitIndexes[batchBodyIndex], hitTimes[batchBodyIndex]);
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
      if (Object.keys(hitIndexes).length == this.system.smallBodies.length) {
        break;
      }
    };
    // const collisionTimes = simulationsInfo.map(info => hitTimes[info.index]);
    // console.log(simulationsInfo);
    // console.log(hitTimes);
    // console.log(collisionTimes);
    for (let simulationInfoIndex = 0; simulationInfoIndex < simulationsInfo.length; simulationInfoIndex++) {
      const simulationInfo = simulationsInfo[simulationInfoIndex];
      const xPixel = simulationInfo.xPixelStart;
      const yPixel = simulationInfo.yPixelStart;
      const collisionTime = hitTimes[simulationInfoIndex];
      if (collisionTime === undefined) {
        this.addWallpaperPixel(xPixel, yPixel, 0, 0, 'black');
      } else {
        this.addWallpaperPixel(xPixel, yPixel, 0, collisionTime);
      }
    }
  }

  async doSimulations() {
    if (WIDTH % PIXEL_SIZE || HEIGHT % PIXEL_SIZE) {
      alert('Please use a pixel size that fits in the image dimensions precisely.');
      return;
    }
    const allSimulations: SimulationInfo[] = [];
    for (let xPixelStart = 0; xPixelStart < WIDTH; xPixelStart += PIXEL_SIZE) {
      const xPixelEnd = xPixelStart + PIXEL_SIZE;
      const xPixelCenter = (xPixelStart + xPixelEnd) / 2;
      const xRatio = xPixelCenter / WIDTH;
      const xBodyCoord = SYSTEM_X_RANGE[0] + xRatio * (SYSTEM_X_RANGE[1] - SYSTEM_X_RANGE[0]);
      for (let yPixelStart = 0; yPixelStart < WIDTH; yPixelStart += PIXEL_SIZE) {
        const yPixelEnd = yPixelStart + PIXEL_SIZE;
        const yPixelCenter = (yPixelStart + yPixelEnd) / 2;
        const yRatio = yPixelCenter / WIDTH;
        const yBodyCoord = SYSTEM_Y_RANGE[0] + yRatio * (SYSTEM_Y_RANGE[1] - SYSTEM_Y_RANGE[0]);
        const simulationInfo = { index: allSimulations.length, xPixelStart, yPixelStart, xBodyCoord, yBodyCoord };
        allSimulations.push(simulationInfo);
      }
    }
    const batchesCount = Math.ceil(allSimulations.length / BATCH_SIZE);
    console.log('Must do', batchesCount, 'batches.');
    const batches = Array(batchesCount).fill(null).map(() => []);
    for (const simulationInfo of allSimulations) {
      batches[simulationInfo.index % batchesCount].push(simulationInfo);
    }
    const startTime = performance.now();
    for (let batchIndex = 0; batchIndex < batchesCount; batchIndex++) {
      const batchStartTime = performance.now();
      const batch = batches[batchIndex];
      await this.doSimulationsBatch(batch);
      const batchTotalTime = performance.now() - batchStartTime;
      console.log('Batch', batchIndex, 'of', batchesCount, 'took', batchTotalTime);
    }
    const totalTime = performance.now() - startTime;
    console.log('Finished all', batchesCount, 'batches in', totalTime);
    const totalSystemTime = this.system.dt * GIVE_UP_ITERATIONS;
    console.log('Total dynamic system time:', totalSystemTime);
  }

}
