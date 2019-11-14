import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';

const PIXEL_SIZE = 8;
const GIVE_UP_ITERATIONS = 1000; // default: 100000
const SHOW_SIMULATION = true;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
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
    this.system.addEasyBody(0.3, -0.3, 10);
    this.system.addEasyBody(0.7, 0.3, 10);
  }

  ngOnInit() {
    this.canvas = this.myCanvas.nativeElement;
    this.context = this.canvas.getContext('2d');
    this.wallpaperContext = this.wallpaperCanvasRef.nativeElement.getContext('2d');
    this.doSimulations();
  }

  addWallpaperPixel(x: number, y: number, hitBodyIndex: number, iteration: number, size: number = 1) {
    const hue = ['0', '0', '240'][hitBodyIndex + 1];
    const light = iteration == GIVE_UP_ITERATIONS ? 1 : (Math.log(iteration) / Math.log(GIVE_UP_ITERATIONS));
    const style = 'hsl(' + hue + ',100%,' + Math.round(50 * Math.max(1 - light, 0)) + '%)';
    this.wallpaperContext.fillStyle = style;
    this.wallpaperContext.fillRect(x, y, size, size);
  }

  async doSimulationsBatch(xPixel: number, step: number) {
    const start = performance.now();
    this.resetSystem();
    for (let yPixel = 0; yPixel < 400; yPixel += step) {
      this.system.addRestingBody((xPixel + 0.5) / 400, (yPixel + 0.5) / 400, 0);
    }
    // this.printBodies();
    const hitIndexes: { [bodyIndex: number]: number } = {};
    const hitIterations: { [bodyIndex: number]: number } = {};
    for (let iteration = 1; iteration <= GIVE_UP_ITERATIONS; iteration++) {
      this.system.doTimeStep();
      for (let bodyIndex = 0; bodyIndex * step < 400; bodyIndex++) {
        const collisions = this.system.getCollisionsOfSmallBodyWithIndex(bodyIndex);
        if (collisions.length > 0) {
          hitIndexes[bodyIndex] = collisions[0];
          hitIterations[bodyIndex] = iteration;
          this.system.smallBodies[bodyIndex].x = 10;
          this.system.smallBodies[bodyIndex].vx = 10;
          if (Object.keys(hitIndexes).length == this.system.smallBodies.length) {
            break;
          }
        }
      }
      if (SHOW_SIMULATION && iteration % 4 == 0) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.system.allBodies.forEach(body => {
          const size = body.mass == 0 ? 4 : 10;//10 * body.mass;
          const x = 400 * body.x - size / 2;
          const y = 400 * body.y - size / 2;
          this.context.fillRect(x, y, size, size);
        });
        await new Promise(res => setTimeout(res, 5));
      }
    };
    // console.log(hitIterations);
    for (let bodyIndex = 0; bodyIndex * step < 400; bodyIndex++) {
      const yPixel = bodyIndex * step;
      const hitIndex = hitIndexes[bodyIndex] == undefined ? -1 : hitIndexes[bodyIndex];
      const iteration = hitIterations[bodyIndex] || GIVE_UP_ITERATIONS;
      this.addWallpaperPixel(xPixel, yPixel, hitIndex, iteration, step);
    }
    console.log('Last batch took:', performance.now() - start);
  }

  async doSimulations() {
    const start = performance.now();
    const step = PIXEL_SIZE;
    let xPixel = 0;
    const loop = async () => new Promise(resolve => {
      setTimeout(async () => {
        await this.doSimulationsBatch(xPixel, step);
        xPixel += step;
        if (xPixel < 400) { return await loop(); }
        console.log('All simulations took:', performance.now() - start);
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
