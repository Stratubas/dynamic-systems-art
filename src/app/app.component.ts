import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';

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
    // for (let i = 0; i < 3; i++) {
    //   this.system.addRandomBody();
    // }
    console.log('Bodies:');
    this.system.bodies.forEach(console.log);
  }

  resetSystem() {
    this.system.bodies = [];
    this.system.addEasyBody(0.3, -0.3, 10);
    this.system.addEasyBody(0.7, 0.3, 10);
  }

  ngOnInit() {
    this.canvas = this.myCanvas.nativeElement;
    this.context = this.canvas.getContext('2d');
    this.wallpaperContext = this.wallpaperCanvasRef.nativeElement.getContext('2d');
    console.log(this.context);
    this.doSimulations();
  }

  addWallpaperPixel(x: number, y: number, hitBodyIndex: number) {
    const color = ['black', 'red', '#4444ff'][hitBodyIndex + 1];
    this.wallpaperContext.fillStyle = color;
    this.wallpaperContext.fillRect(x, y, 1, 1);
  }

  async doSimulations() {
    for (let xPixel = 0; xPixel < 400; xPixel += 1) {
      for (let yPixel = 0; yPixel < 400; yPixel += 1) {
        this.resetSystem();
        if (yPixel == 0) {
          await new Promise(res => setTimeout(res));
        }
        this.system.addRestingBody((xPixel + 0.5) / 400, (yPixel + 0.5) / 400, 0);
        const hitIndex: number = await new Promise(async resolve => {
          for (let iteration = 0; iteration < 100000; iteration++) {
            // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.system.doTimeStep();
            // this.system.bodies.forEach(body => {
            //   const x = 400 * body.x - 5 * body.mass;
            //   const y = 400 * body.y - 5 * body.mass;
            //   const size = 10 * body.mass;
            //   this.context.fillRect(x, y, size, size);
            // });
            const collisions = this.system.getCollisionsOfBodyWithIndex(2);
            if (collisions.length > 0) {
              resolve(collisions[0]);
            }
            // console.log('Bodies:');
            // this.system.bodies.forEach(console.log);
            // console.log('Drawing...');
          };
          resolve(-1);
        });
        // console.log(hitIndex);
        this.addWallpaperPixel(xPixel, yPixel, hitIndex);
      }
    }
  }

}
