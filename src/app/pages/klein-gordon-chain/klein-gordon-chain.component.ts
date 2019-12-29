import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { DynamicSystem } from 'src/classes/dynamic-system';
import { getEnergies } from 'src/physics-helpers/klein-gordon-chain/get-energies';
import { DynamicBody } from 'src/classes/dynamic-body';

const DEFAULT_TOTAL_TIME_UNITS = 1000;
const DEFAULT_TIME_UNITS_PER_FRAME = 2;

const DEFAULT_ANIMATION_DELAY = 30; // TODO: ask browser for next frame callback

const DEFAULT_OSCILLATOR_COUNT = 101;
const DEFAULT_INITIAL_CENTER_MOMENTUM = 0.875;
const DEFAULT_ARRAY_PLOT_SCALE = 1;

@Component({
  selector: 'app-klein-gordon-chain',
  templateUrl: './klein-gordon-chain.component.html',
  styleUrls: ['./klein-gordon-chain.component.scss']
})
export class KleinGordonChainComponent implements OnInit, OnDestroy {

  public oscillatorCount: number;
  public initialMomentum: number;
  public arrayPlotHeight: number;
  public arrayPlotLength: number;
  public totalFrames: number;
  public arrayPlotScale: number;
  public totalTimeUnits: number;
  public timeUnitsPerFrame: number;
  public animationDelay: number;

  private arrayPlotArray: number[][];
  private energyRatioArray: number[];

  public currentTimeUnits = 0;

  private system: DynamicSystem;

  @ViewChild('displacementCanvas', { static: true }) public displacementCanvasRef: ElementRef;
  @ViewChild('energyCanvas', { static: true }) public energyCanvasRef: ElementRef;
  @ViewChild('energyRatioCanvas', { static: true }) public energyRatioCanvasRef: ElementRef;
  @ViewChild('arrayPlotCanvas', { static: true }) public arrayPlotCanvasRef: ElementRef;
  private displacementCanvas: HTMLCanvasElement;
  private energyCanvas: HTMLCanvasElement;
  private energyRatioCanvas: HTMLCanvasElement;
  private arrayPlotCanvas: HTMLCanvasElement;
  private displacementContext: CanvasRenderingContext2D;
  private energyContext: CanvasRenderingContext2D;
  private energyRatioContext: CanvasRenderingContext2D;
  private arrayPlotContext: CanvasRenderingContext2D;

  private readyToDraw: Promise<void> = Promise.resolve();
  private isDestroyed = false;

  private canDoNextFrame: Promise<void> = Promise.resolve();
  public nextFrameResolver: () => void;

  private currentSimulationIndex = 0;
  public fps = 0;

  constructor() {
    this.system = new DynamicSystem('klein-gordon');
    this.initVariables();
  }

  ngOnInit() {
    console.log('Klein-Gordon chain component is being initialized.');
    this.restartSimulation();
  }

  ngOnDestroy() {
    console.log('Klein-Gordon chain component is being destroyed.');
    this.system.shutdown();
    this.isDestroyed = true;
  }

  downloadResults() {
    const float64View = new Float64Array(this.oscillatorCount * this.totalFrames);
    let i = 0;
    for (const stepEnergies of this.arrayPlotArray) {
      for (const oscillatorEnergy of stepEnergies) {
        float64View[i++] = oscillatorEnergy;
      }
    }
    const blob = new Blob([float64View]);
    const exportName = `export-${Date.now()}.bin`;
    // // For json:
    // const data = { data: this.arrayPlotArray };
    // const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    const url = window.URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', url);
    downloadAnchorNode.setAttribute('download', exportName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    window.URL.revokeObjectURL(url);
  }

  updateTotalFrames() {
    this.totalFrames = Math.round(this.totalTimeUnits / this.timeUnitsPerFrame);
    this.arrayPlotHeight = 200;
    this.arrayPlotLength = this.totalFrames;
  }

  initVariables() {
    const config: any = JSON.parse(localStorage.getItem('config') || '{}');
    this.oscillatorCount = config.oscillatorCount || DEFAULT_OSCILLATOR_COUNT;
    this.initialMomentum = config.initialMomentum || DEFAULT_INITIAL_CENTER_MOMENTUM;
    this.totalTimeUnits = config.totalTimeUnits || DEFAULT_TOTAL_TIME_UNITS;
    this.timeUnitsPerFrame = config.timeUnitsPerFrame || DEFAULT_TIME_UNITS_PER_FRAME;
    this.arrayPlotScale = config.arrayPlotScale || DEFAULT_ARRAY_PLOT_SCALE;
    this.animationDelay = config.animationDelay || DEFAULT_ANIMATION_DELAY; // TODO: typescript ?? operator
    this.updateTotalFrames();
  }

  saveConfig(toDefault = false) {
    if (toDefault) {
      localStorage.removeItem('config');
    } else {
      const config = {
        oscillatorCount: this.oscillatorCount,
        initialMomentum: this.initialMomentum,
        totalTimeUnits: this.totalTimeUnits,
        timeUnitsPerFrame: this.timeUnitsPerFrame,
        arrayPlotScale: this.arrayPlotScale,
        animationDelay: this.animationDelay,
      };
      localStorage.setItem('config', JSON.stringify(config));
    }
    this.initVariables();
  }

  restartSimulation() {
    this.initCanvases();
    this.currentSimulationIndex++;
    this.runSimulation();
  }

  pauseSimulation() {
    if (this.nextFrameResolver) { return; }
    this.canDoNextFrame = new Promise(resolve => {
      this.nextFrameResolver = resolve;
    });
  }

  continueSimulation() {
    if (!this.nextFrameResolver) { return; }
    this.nextFrameResolver();
    this.nextFrameResolver = null;
  }

  initCanvases() {
    this.displacementCanvas = this.displacementCanvasRef.nativeElement;
    this.energyCanvas = this.energyCanvasRef.nativeElement;
    this.energyRatioCanvas = this.energyRatioCanvasRef.nativeElement;
    this.arrayPlotCanvas = this.arrayPlotCanvasRef.nativeElement;

    this.displacementContext = this.displacementCanvas.getContext('2d');
    this.energyContext = this.energyCanvas.getContext('2d');
    this.energyRatioContext = this.energyRatioCanvas.getContext('2d');
    this.arrayPlotContext = this.arrayPlotCanvas.getContext('2d');

    this.arrayPlotContext.clearRect(0, 0, this.arrayPlotCanvas.width, this.arrayPlotCanvas.height);
  }

  async drawFrame(currentTimeUnits: number) {
    await this.readyToDraw;
    this.readyToDraw = new Promise(res => setTimeout(res, this.animationDelay));
    this.currentTimeUnits = currentTimeUnits;
    this.drawDisplacement();
    const energies = this.drawEnergy();
    this.drawArrayPlotColumn(energies);
    this.drawEnergyRatio(energies);
  }

  drawEnergyRatio(energies: number[]) {
    const nextIndex = this.energyRatioArray.findIndex(value => value === undefined);
    if (nextIndex === 0) {
      this.energyRatioContext.fillStyle = 'white';
      this.energyRatioContext.fillRect(0, 0, this.energyRatioCanvas.width, this.energyRatioCanvas.height);
      this.energyRatioContext.fillStyle = 'black';
    }
    if (nextIndex === -1) { return; }
    const canvas = this.energyRatioCanvas;
    const canvasHeight = canvas.height;
    const itemHalfHeight = 0.5 * (canvas.clientWidth * canvas.height / (canvas.width * canvas.clientHeight));
    // const itemHeight = Math.round(2 * itemHalfHeight);
    let centerEnergy = 0;
    let totalEnergy = 0;
    const from = (energies.length + 1) * 0.5 - 5;
    const to = from + 10;
    for (let index = 0; index < energies.length; index++) {
      const energy = energies[index];
      totalEnergy += energy;
      if (index >= from && index <= to) {
        centerEnergy += energy;
      }
    }
    const energyRatio = centerEnergy / totalEnergy;
    this.energyRatioArray[nextIndex] = energyRatio;
    const previousEnergyRatio = nextIndex ? this.energyRatioArray[nextIndex - 1] : energyRatio;
    const yPixel = Math.round(canvasHeight * (1 - energyRatio) - itemHalfHeight);
    const yPreviousPixel = Math.round(canvasHeight * (1 - previousEnergyRatio) - itemHalfHeight);
    const context = this.energyRatioContext;
    context.beginPath();
    context.moveTo(nextIndex - 1 + 0.5, yPreviousPixel + 0.5);
    context.lineTo(nextIndex + 0.5, yPixel + 0.5);
    context.stroke();
    // context.fillRect(nextIndex - 2, yPixel - 2, 5, 5);
  }

  drawDisplacement() {
    const canvas = this.displacementCanvas;
    const canvasHeight = canvas.height;
    const itemHalfHeight = 0.5 * (canvas.clientWidth * canvas.height / (canvas.width * canvas.clientHeight));
    const itemHeight = Math.round(2 * itemHalfHeight);
    // console.log(canvas.clientWidth, canvas.width, canvas.clientHeight, canvas.height, itemHeight);
    this.displacementContext.clearRect(0, 0, canvas.width, canvasHeight);
    const displacements = this.system.allBodies.map(body => body.y);
    // console.log(JSON.parse(JSON.stringify(this.system.allBodies)));
    const p2 = this.initialMomentum * this.initialMomentum;
    const maxDisplacement = Math.sqrt(0.1 * (Math.sqrt(121 + 200 * p2) - 11));
    displacements.forEach((displacement, oscillatorIndex) => {
      const xPixel = oscillatorIndex;
      const yPixel = Math.round(canvasHeight * 0.5 * (1 - displacement / maxDisplacement) - itemHalfHeight);
      this.displacementContext.fillRect(xPixel, yPixel, 1, itemHeight);
    });
  }

  drawEnergy(): number[] {
    const canvas = this.energyCanvas;
    const itemHalfHeight = 0.5 * (canvas.clientWidth * canvas.height / (canvas.width * canvas.clientHeight));
    const itemHeight = Math.round(2 * itemHalfHeight);
    const context = this.energyContext;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const energies = getEnergies(this.system.allBodies);
    const maxEnergy = 0.5 * this.initialMomentum * this.initialMomentum;
    energies.forEach((energy, oscillatorIndex) => {
      const xPixel = oscillatorIndex;
      const yPixel = Math.round(canvas.height * (1 - Math.sqrt(energy / maxEnergy)) - itemHalfHeight);
      context.fillRect(xPixel, yPixel, 1, itemHeight);
    });
    return energies;
  }

  drawArrayPlotColumn(newPlotColumn: number[]) {
    const nextIndex = this.arrayPlotArray.findIndex(subarray => !subarray);
    if (nextIndex === -1) { return; }
    this.arrayPlotArray[nextIndex] = newPlotColumn;
    const array = this.arrayPlotArray;
    // const scale = 1 / array.reduce((max, subarray) => Math.max(max, Math.max(...subarray)), 0);
    const width = this.arrayPlotCanvas.width;
    const height = this.arrayPlotCanvas.height;
    const myImageData = this.arrayPlotContext.createImageData(1, height);
    const data = myImageData.data;
    interface RgbObject { r: number; g: number; b: number; }
    const maxValue = 0.5 * this.initialMomentum * this.initialMomentum;
    const colorFunction: (value: number) => RgbObject = (value) => {
      const transformedValue = this.arrayPlotScale * value; // Math.sqrt(value);
      const checkpoints = [
        { at: maxValue * 0 / 20, rgb: { r: 0, g: 0, b: 0 } },
        { at: maxValue * 1 / 20, rgb: { r: 255, g: 0, b: 0 } },
        { at: maxValue * 2 / 20, rgb: { r: 255, g: 255, b: 255 } },
      ];
      const checkpointIndex = checkpoints.findIndex(checkpoint => checkpoint.at >= transformedValue);
      if (checkpointIndex === 0) { return checkpoints[0].rgb; }
      if (checkpointIndex === -1) { return checkpoints[checkpoints.length - 1].rgb; }
      const checkpoint1 = checkpoints[checkpointIndex - 1];
      const checkpoint2 = checkpoints[checkpointIndex];
      const maxDistance = checkpoint2.at - checkpoint1.at;
      const distance1 = transformedValue - checkpoint1.at;
      const distance2 = checkpoint2.at - transformedValue;
      const ratio1 = distance2 / maxDistance;
      const ratio2 = distance1 / maxDistance;
      const result: RgbObject = {
        r: Math.round(checkpoint1.rgb.r * ratio1 + checkpoint2.rgb.r * ratio2),
        g: Math.round(checkpoint1.rgb.g * ratio1 + checkpoint2.rgb.g * ratio2),
        b: Math.round(checkpoint1.rgb.b * ratio1 + checkpoint2.rgb.b * ratio2),
      };
      return result;
    };
    for (let plotColumnIndex = 0; plotColumnIndex < width; plotColumnIndex++) {
      if (nextIndex !== plotColumnIndex) { continue; }
      const arrayRow = array[plotColumnIndex]; // drawing rows into columns and columns into rows
      if (arrayRow === undefined) { continue; }
      for (let plotRowIndex = 0; plotRowIndex < height; plotRowIndex++) {
        const arrayColumn = arrayRow[plotRowIndex];
        if (arrayColumn === undefined) { continue; }
        const color: RgbObject = colorFunction(arrayColumn);
        const dataIndex = 4 * plotRowIndex; // 4 * (plotRowIndex * width + plotColumnIndex);
        ({ r: data[dataIndex + 0], g: data[dataIndex + 1], b: data[dataIndex + 2] } = color);
        data[dataIndex + 3] = 255; // alpha
      }
    }
    this.arrayPlotContext.putImageData(myImageData, nextIndex, 0);
  }

  async runSimulation() {
    this.system.reset();
    this.currentTimeUnits = 0;
    this.arrayPlotArray = Array(this.arrayPlotLength);
    this.energyRatioArray = Array(this.arrayPlotLength);
    for (let oscillatorIndex = 0; oscillatorIndex < this.oscillatorCount; oscillatorIndex++) {
      const body: DynamicBody = {
        x: oscillatorIndex + 0.5, // not realy necessary
        y: 0,
        vx: 0,
        vy: oscillatorIndex === (this.oscillatorCount - 1) / 2 ? this.initialMomentum : 0,
        mass: 0,
      };
      this.system.addBody(body);
    }
    await this.drawFrame(0);
    let perfTime = performance.now();
    const startTime = perfTime;
    const frameTimesBufferSize = 100;
    const frameTimes = Array(frameTimesBufferSize);
    const thisSimulationIndex = this.currentSimulationIndex;
    let frameTimesSum = 0;
    for (let frameIndex = 0; frameIndex < this.totalFrames && !this.isDestroyed;) {
      await this.canDoNextFrame;
      await this.system.doTimeSteps(this.timeUnitsPerFrame);
      if (thisSimulationIndex !== this.currentSimulationIndex) { break; }
      await this.drawFrame(++frameIndex * this.timeUnitsPerFrame);
      const ms = Math.round(-perfTime + (perfTime = performance.now()));
      frameTimes[frameIndex % frameTimesBufferSize] = ms;
      frameTimesSum += ms;
      if (frameIndex % frameTimesBufferSize === frameTimesBufferSize - 1) {
        const msPerFrame = frameTimesSum / frameTimesBufferSize;
        this.fps = Math.round(1000 / msPerFrame);
        const etaSeconds = Math.round((this.totalFrames - frameIndex) / this.fps);
        const etaMinutes = (etaSeconds / 60).toFixed(3);
        const fpsMsg = `Ms/frame: ${msPerFrame.toFixed(3)} (${this.fps} fps).`;
        const progressMsg = `Progress: ${frameIndex + 1}/${this.totalFrames} frames, ETA: ${etaSeconds} s (${etaMinutes} min).`;
        console.log(fpsMsg, progressMsg);
        frameTimesSum = 0;
      }
      await this.canDoNextFrame;
    }
    const status = this.isDestroyed ? 'aborted' : 'completed';
    console.log('Simulation was', status, 'in', Math.round(performance.now() - startTime), 'ms.');
  }

}
