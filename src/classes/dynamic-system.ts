import { DynamicBody } from './dynamic-body';
import * as GPU from 'src/libraries/gpu.js';

const gpu = new GPU();
const DT = 0.002;

export class DynamicSystem {
    public dt = DT;
    public massiveBodies: DynamicBody[] = [];
    public smallBodies: DynamicBody[] = [];
    public allBodies: DynamicBody[] = [];

    private doTimeStepInGpu: any;

    constructor() {
        //public bodies: DynamicBody[] = []
        // console.log(gpu);
    }

    reset() {
        this.massiveBodies = [];
        this.smallBodies = [];
        this.allBodies = [];
    }

    private addBody(newBody: DynamicBody) {
        (newBody.mass ? this.massiveBodies : this.smallBodies).push(newBody);
        this.allBodies.push(newBody);
    }

    initGpu() {
        const allBodies = this.allBodies;
        this.doTimeStepInGpu = gpu.createKernel(function (xyVxVy: number[], ratesOfChange: number[]) {
            return values[this.thread.x] + ratesOfChange[this.thread.x] * 0.002;
        }).setOutput([allBodies.length * 2]);
    }

    addRandomBody() {
        const newBody = new DynamicBody({
            x: Math.random(),
            y: Math.random(),
            vx: Math.random(),
            vy: Math.random(),
            ax: 0,
            ay: 0,
            mass: Math.pow(1 + Math.random(), 3) / 2,
        });
        this.addBody(newBody);
    }

    addEasyBody(x: number, vy: number, mass: number) {
        const newBody = new DynamicBody({
            x,
            y: 0.5,
            vx: 0,
            vy,
            ax: 0,
            ay: 0,
            mass,
        });
        this.addBody(newBody);
    }

    addRestingBody(x: number, y: number, mass: number) {
        const newBody = new DynamicBody({
            x,
            y,
            vx: 0,
            vy: 0,
            ax: 0,
            ay: 0,
            mass,
        });
        this.addBody(newBody);
    }

    getCollisionsOfSmallBodyWithIndex(bodyIndex: number): number[] {
        const result = [];
        let index = 0;
        const body1 = this.smallBodies[bodyIndex];
        // if (body1.dead) { return result; }
        for (const body2 of this.massiveBodies) {
            // if (body1 == body2) { continue; }
            const dx = body2.x - body1.x;
            const dy = body2.y - body1.y;
            const r2 = dx * dx + dy * dy;
            if (r2 < 0.0005) { result.push(index); }
            index++;
        }
        return result;
    }

    /*doTimeStepInline() {
        // this.updatePositions();
        let body1: DynamicBody;
        let body2: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body1 = this.bodies[bodyIndex1];
            body1.x += this.dt * body1.vx;
            body1.y += this.dt * body1.vy;
        }
        // this.updateAccelerations();
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body1 = this.bodies[bodyIndex1];
            body1.ax = 0;
            body1.ay = 0;
        }
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body1 = this.bodies[bodyIndex1];
            for (let bodyIndex2 = bodyIndex1 + 1; bodyIndex2 < this.bodies.length; bodyIndex2++) {
                body2 = this.bodies[bodyIndex2];
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r2 = dx * dx + dy * dy;
                const factor = this.dt / (r2 * Math.sqrt(r2));
                body1.ax += body2.mass * dx * factor;
                body1.ay += body2.mass * dy * factor;
                body2.ax -= body1.mass * dx * factor;
                body2.ay -= body1.mass * dy * factor;
            }
        }
        // this.updateVelocities();
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body1 = this.bodies[bodyIndex1];
            body1.vx += this.dt * body1.ax;
            body1.vy += this.dt * body1.ay;
        }
    }*/

    doTimeStep() {
        this.updatePositions();
        this.updateAccelerations();
        this.updateVelocities();
    }

    private updateAccelerations() {
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            const body1 = this.allBodies[bodyIndex1];
            // if (body1.dead) { continue; }
            body1.ax = 0;
            body1.ay = 0;
        }
        for (let bodyIndex1 = 0; bodyIndex1 < this.massiveBodies.length; bodyIndex1++) {
            const body1 = this.massiveBodies[bodyIndex1];
            for (let bodyIndex2 = bodyIndex1 + 1; bodyIndex2 < this.massiveBodies.length; bodyIndex2++) {
                const body2 = this.massiveBodies[bodyIndex2];
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r2 = dx * dx + dy * dy;
                const factor = this.dt / (r2 * Math.sqrt(r2));
                const dxf = dx * factor;
                const dyf = dy * factor;
                body1.ax += body2.mass * dxf;
                body1.ay += body2.mass * dyf;
                body2.ax -= body1.mass * dxf;
                body2.ay -= body1.mass * dyf;
            }
            for (let bodyIndex2 = 0; bodyIndex2 < this.smallBodies.length; bodyIndex2++) {
                const body2 = this.smallBodies[bodyIndex2];
                // if (body2.dead) { continue; }
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r2 = dx * dx + dy * dy;
                // if (r2 > 100) { continue; }
                const factor = this.dt / (r2 * Math.sqrt(r2));
                const dxf = dx * factor;
                const dyf = dy * factor;
                body2.ax -= body1.mass * dxf;
                body2.ay -= body1.mass * dyf;
            }
        }
    }

    private updateVelocities() {
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            body = this.allBodies[bodyIndex1];
            // if (body.dead) { continue; }
            body.vx += this.dt * body.ax;
            body.vy += this.dt * body.ay;
        }
    }

    private updatePositions() {
        const allXY = Array(this.allBodies.length * 2);
        const allVxVy = Array(this.allBodies.length * 2);
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            allXY[bodyIndex1] = this.allBodies[bodyIndex1].x;
            allXY[bodyIndex1 + this.allBodies.length] = this.allBodies[bodyIndex1].y;
            allVxVy[bodyIndex1] = this.allBodies[bodyIndex1].vx;
            allVxVy[bodyIndex1 + this.allBodies.length] = this.allBodies[bodyIndex1].vy;
        }
        const newXY = this.doTimeStepInGpu(allXY, allVxVy) as number[];
        // const newY = this.incrementInGpu(allY, allVy, this.dt) as number[];
        // console.log('GPU new X:', newPositions);
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            body = this.allBodies[bodyIndex1];
            // if (body.dead) { continue; }
            body.x = newXY[bodyIndex1];
            body.y = newXY[bodyIndex1 + this.allBodies.length];
            // body.x += this.dt * body.vx;
            // body.y += this.dt * body.vy;
        }
        // console.log('CPU new X:', this.allBodies.map(body => body.x));
    }
}
