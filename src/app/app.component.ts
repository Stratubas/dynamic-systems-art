import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';
import { DynamicBody } from 'src/classes/dynamic-body';

const PIXEL_SIZE = 12; // Valid values for 1920x1080: 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120
const TOTAL_TIME_UNITS = 10;
const TIME_UNITS_PER_FRAME = 0.04;
const ANIMATION_DELAY = 30;
const SHOW_SIMULATION = false;
const REAL_TIME_PAINTING = true;
const LOOP_FOREVER = true;
const ACTIVE_PIXEL_STYLE = 'black';
const WIDTH = 1920;
const HEIGHT = 1080;
// const SYSTEM_X_RANGE = [0.4, 0.6];
// const SYSTEM_Y_RANGE = [0.325, 0.525];
// For spring system, use x = 0.5, y = 0.425, yHalfSize = 0.1
const SYSTEM_X_CENTER = 0.485;
const SYSTEM_Y_CENTER = 0.36;
const SYSTEM_Y_HALF_SIZE = 0.00025;
const SYSTEM_Y_RANGE = [SYSTEM_Y_CENTER - SYSTEM_Y_HALF_SIZE, SYSTEM_Y_CENTER + SYSTEM_Y_HALF_SIZE];
const SYSTEM_X_HALF_SIZE = SYSTEM_Y_HALF_SIZE * WIDTH / HEIGHT;
const SYSTEM_X_RANGE = [SYSTEM_X_CENTER - SYSTEM_X_HALF_SIZE, SYSTEM_X_CENTER + SYSTEM_X_HALF_SIZE];
// const SUN_MASS = 200;
const BATCH_SIZE = 9999999; // 7 * WIDTH / PIXEL_SIZE;
// const ANIMATION_SCALE = 1 / 4;

// TODO: refactor this to contain more info and have a better name and a separate file
interface SimulationInfo { index: number; xPixelStart: number; yPixelStart: number; body: DynamicBody; showInResult: boolean; }

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

  private readyToDraw: Promise<void> = Promise.resolve();

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

  addWallpaperPixel(simulationInfo: SimulationInfo, hitBodyIndex: number, collisionTime: number, customStyle?: string) {
    if (!simulationInfo.showInResult) {
      return;
    }
    const x = simulationInfo.xPixelStart;
    const y = simulationInfo.yPixelStart;
    const hue = ['0', '0', '240'][hitBodyIndex + 1];
    const light = Math.pow(10, -collisionTime / 1000);
    // For springs, use 100 as denominator
    // const light = 1 / (1 + collisionTime / 5);
    const style = customStyle || ('hsl(' + hue + ',100%,' + 50 * Math.max(light, 0) + '%)');
    // const style = 'hsl(' + (2 * timeToFall % 360) + ',100%,' + 50 + '%)';
    this.wallpaperContext.fillStyle = style;
    this.wallpaperContext.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
  }

  async drawAnimationFrame() {
    await this.readyToDraw;
    this.readyToDraw = new Promise(res => setTimeout(res, ANIMATION_DELAY));
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.system.allBodies.forEach((body, i) => {
      const size = body.mass === 0 ? 4 : 10;
      const style = body.mass ? (['red', 'blue'][i % 2]) : 'black'; // TODO: identify the body properly
      const x = 400 * body.x - size / 2;
      const y = 400 * body.y - size / 2;
      this.context.fillStyle = style;
      this.context.fillRect(x, y, size, size);
    });
  }

  async doSimulationsBatch(simulationsInfo: SimulationInfo[]) {
    this.resetSystem();
    let fallenCount = 0;
    for (const simulationInfo of simulationsInfo) {
      this.system.addBody(simulationInfo.body);
      this.addWallpaperPixel(simulationInfo, 0, 0, ACTIVE_PIXEL_STYLE);
    }
    await this.drawAnimationFrame();
    const hitIndexes: { [bodyIndex: number]: number } = {};
    const hitTimes: { [bodyIndex: number]: number } = {};
    const totalFrames = LOOP_FOREVER ? Infinity : Math.round(TOTAL_TIME_UNITS / TIME_UNITS_PER_FRAME);
    let perfTime = performance.now();
    const frameTimesBufferSize = 100;
    const frameTimes = Array(frameTimesBufferSize);
    let frameTimesSum = 0;
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const collisions = await this.system.doTimeSteps(TIME_UNITS_PER_FRAME);
      const ms = Math.round(-perfTime + (perfTime = performance.now()));
      frameTimes[frameIndex % frameTimesBufferSize] = ms;
      frameTimesSum += ms;
      if (frameIndex % frameTimesBufferSize === frameTimesBufferSize - 1) {
        const msPerFrame = frameTimesSum / frameTimesBufferSize;
        const fps = Math.round(1000 / msPerFrame);
        const etaSeconds = Math.round((totalFrames - frameIndex) / fps);
        const etaMinutes = (etaSeconds / 60).toFixed(3);
        const fpsMsg = `Ms/frame: ${msPerFrame.toFixed(3)} (${fps} fps).`;
        const progressMsg = `Progress: ${frameIndex + 1}/${totalFrames} frames, ETA: ${etaSeconds} s (${etaMinutes} min).`;
        console.log(fpsMsg, progressMsg);
        frameTimesSum = 0;
      }
      for (const collision of collisions) {
        const batchBodyIndex = collision.bodyIndex;
        hitIndexes[batchBodyIndex] = collision.collidedTargetIndexes[0];
        hitTimes[batchBodyIndex] = collision.collisionTime;
        if (REAL_TIME_PAINTING) {
          const simulationInfo = simulationsInfo[batchBodyIndex];
          this.addWallpaperPixel(simulationInfo, hitIndexes[batchBodyIndex], hitTimes[batchBodyIndex]);
        }
      }
      if (collisions.length) {
        fallenCount += collisions.length;
        console.log(fallenCount, '/', simulationsInfo.length);
      }
      if (SHOW_SIMULATION) {
        await this.drawAnimationFrame();
      }
      await new Promise(res => setTimeout(res));
      if (Object.keys(hitIndexes).length === this.system.allBodies.length) {
        break;
      }
    }
    // console.log('Done', frameTimes.length, 'frames with times:', frameTimes);
    for (let simulationInfoIndex = 0; simulationInfoIndex < simulationsInfo.length; simulationInfoIndex++) {
      const simulationInfo = simulationsInfo[simulationInfoIndex];
      const collisionTime = hitTimes[simulationInfoIndex];
      if (collisionTime === undefined) {
        this.addWallpaperPixel(simulationInfo, 0, 0, 'black');
      } else {
        this.addWallpaperPixel(simulationInfo, 0, collisionTime);
      }
    }
  }

  // async doSimulations(parallelCount: number = 2) {
  async doSimulations() {
    if (WIDTH % PIXEL_SIZE || HEIGHT % PIXEL_SIZE) {
      alert('Please use a pixel size that fits in the image dimensions precisely.');
      return;
    }
    const allSimulations: SimulationInfo[] = [];
    const getSimulationInfo = (index: number, xPixelStart: number, yPixelStart: number, customBody?: DynamicBody): SimulationInfo => {
      const xPixelEnd = xPixelStart + PIXEL_SIZE;
      const yPixelEnd = yPixelStart + PIXEL_SIZE;
      const xPixelCenter = (xPixelStart + xPixelEnd) / 2;
      const yPixelCenter = (yPixelStart + yPixelEnd) / 2;
      const xRatio = xPixelCenter / WIDTH;
      const yRatio = yPixelCenter / HEIGHT;
      const xBodyCoord = SYSTEM_X_RANGE[0] + xRatio * (SYSTEM_X_RANGE[1] - SYSTEM_X_RANGE[0]);
      const yBodyCoord = SYSTEM_Y_RANGE[0] + yRatio * (SYSTEM_Y_RANGE[1] - SYSTEM_Y_RANGE[0]);
      const body: DynamicBody = customBody || { x: xBodyCoord, y: yBodyCoord, vx: 0, vy: 0, mass: 0 };
      const simulationInfo: SimulationInfo = { index, xPixelStart, yPixelStart, body, showInResult: !customBody };
      return simulationInfo;
    };
    for (let xPixelStart = 0; xPixelStart < WIDTH; xPixelStart += PIXEL_SIZE) {
      for (let yPixelStart = 0; yPixelStart < HEIGHT; yPixelStart += PIXEL_SIZE) {
        const simulationInfo = getSimulationInfo(allSimulations.length, xPixelStart, yPixelStart);
        allSimulations.push(simulationInfo);
      }
    }
    const batchesCount = Math.ceil(allSimulations.length / BATCH_SIZE);
    console.log('Splitting', allSimulations.length, 'simulations into batches of size', BATCH_SIZE, '->', batchesCount, 'batches.');
    const batches = Array(batchesCount).fill(null).map(() => []);
    for (const simulationInfo of allSimulations) {
      batches[simulationInfo.index % batchesCount].push(simulationInfo);
    }
    // Adding necessary common bodies in every batch
    let extraIndex = allSimulations.length;
    for (const batch of batches) {
      const massiveBody1: DynamicBody = { x: 0.3, y: 0.5, vx: 0, vy: -0.1, mass: 5 };
      const massiveBody2: DynamicBody = { x: 0.7, y: 0.5, vx: 0, vy: 0.1, mass: 5 };
      const massiveBodyInfo1 = getSimulationInfo(extraIndex++, PIXEL_SIZE, PIXEL_SIZE, massiveBody1);
      const massiveBodyInfo2 = getSimulationInfo(extraIndex++, 3 * PIXEL_SIZE, PIXEL_SIZE, massiveBody2);
      batch.push(massiveBodyInfo1, massiveBodyInfo2);
    }
    const startTime = performance.now();
    for (let batchIndex = 0; batchIndex < batchesCount; batchIndex++) {
      const batchStartTime = performance.now();
      const batch = batches[batchIndex];
      // const parallelBatches = Array(parallelCount).fill(null).map((_, i) => batches[batchIndex + i]);
      await this.doSimulationsBatch(batch);
      const batchTotalTime = performance.now() - batchStartTime;
      console.log('Batch', batchIndex + 1, 'of', batchesCount, 'took', batchTotalTime);
    }
    const totalTime = performance.now() - startTime;
    console.log('Finished all', batchesCount, 'batches in', totalTime);
  }

}
