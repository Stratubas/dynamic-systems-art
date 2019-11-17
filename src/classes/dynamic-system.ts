import { DynamicBody } from './dynamic-body';
import { updatePositions } from 'src/physics-helpers/update-positions';
import { updateAccelerations } from 'src/physics-helpers/update-accelarations';
import { updateVelocities } from 'src/physics-helpers/update-velocities';
import { detectCollisions } from 'src/physics-helpers/detect-collisions';

const DO_WITH_WORKER = true;
let worker: Worker;
if (DO_WITH_WORKER && typeof Worker !== 'undefined') {
    console.log('Working with workers.');
    worker = new Worker('../workers/solver.worker', { type: 'module' });
} else if (DO_WITH_WORKER) {
    console.error('Workers not available!');
    alert('Your browser is not compatible :(');
} else {
    console.log('Working without workers.');
}

export class DynamicSystem {
    public dt = 0.002;
    public massiveBodies: DynamicBody[] = [];
    public smallBodies: DynamicBody[] = [];
    public allBodies: DynamicBody[] = [];

    private worker: Worker;
    private workerResolver: () => void;

    constructor() {
        if (worker) {
            this.worker = worker;
            worker.onmessage = ({ data }) => {
                for (let bodyIndex = 0; bodyIndex < this.smallBodies.length; bodyIndex++) {
                    this.smallBodies[bodyIndex].x = data[bodyIndex].x;
                    this.smallBodies[bodyIndex].y = data[bodyIndex].y;
                    this.smallBodies[bodyIndex].vx = data[bodyIndex].vx;
                    this.smallBodies[bodyIndex].vy = data[bodyIndex].vy;
                    this.smallBodies[bodyIndex].dead = data[bodyIndex].dead;
                }
                this.workerResolver();
            };
        }
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
        return detectCollisions([this.smallBodies[bodyIndex]], [{ x: 0.5, y: 0.5 }])[0];
    }

    async doTimeSteps(steps: number = 1) {
        if (this.worker) {
            const data = {
                bodies: this.smallBodies,
                dt: this.dt,
                steps,
            };
            const promise = new Promise(resolve => this.workerResolver = resolve);
            // console.log('Posting message...', id);
            this.worker.postMessage(data);
            await promise;
            // console.log('Promise is done...', id);
            // await new Promise(res => setTimeout(res, 100));
            // console.log('Done time step!');
        } else {
            for (let step = 0; step < steps; step++) {
                updatePositions(this.smallBodies, this.dt);
                updateAccelerations(this.smallBodies);
                updateVelocities(this.smallBodies, this.dt);
            }
        }
    }
}
