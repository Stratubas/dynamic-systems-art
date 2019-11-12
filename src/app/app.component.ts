import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('myCanvas', { static: true }) public myCanvas: ElementRef;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  public system: DynamicSystem;
  constructor() {
    this.system = new DynamicSystem();
    for (let i = 0; i < 3; i++) {
      this.system.addRandomBody();
    }
    console.log('Bodies:');
    this.system.bodies.forEach(console.log);
  }

  ngOnInit() {
    this.canvas = this.myCanvas.nativeElement;
    this.context = this.canvas.getContext('2d');
    console.log(this.context);
    setInterval(() => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.system.doTimeStep();
      this.system.bodies.forEach(body => {
        const x = 400 * body.x - 5 * body.mass;
        const y = 400 * body.y - 5 * body.mass;
        const size = 10 * body.mass;
        this.context.fillRect(x, y, size, size);
      });
      // console.log('Bodies:');
      // this.system.bodies.forEach(console.log);
      // console.log('Drawing...');
    }, 100);
  }


}
