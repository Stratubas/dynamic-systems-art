import { DynamicBody } from './dynamic-body';
import { SPRING_ANCHOR } from 'src/physics-helpers/update-accelarations';
import { CollisionInfo } from 'src/physics-helpers/detect-collisions';
import { SolverWorkerData } from './solver-worker-data';
import { SolverWorkerResponse } from './solver-worker-response';
import { doPhysicsStep } from 'src/physics-helpers/do-physics-step';

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
    private totalSteps = 0;
    public massiveBodies: DynamicBody[] = [];
    public smallBodies: DynamicBody[] = [];
    public allBodies: DynamicBody[] = [];

    private worker: Worker;
    private workerCollisionsResolver: (collisions: CollisionInfo[]) => void;

    constructor(public dt: number = 0.02) {
        if (worker) {
            this.worker = worker;
            worker.onmessage = ({ data }) => {
                const response: SolverWorkerResponse = data;
                const newBodies = response.bodies;
                for (let bodyIndex = 0; bodyIndex < this.smallBodies.length; bodyIndex++) {
                    this.smallBodies[bodyIndex].x = newBodies[bodyIndex].x;
                    this.smallBodies[bodyIndex].y = newBodies[bodyIndex].y;
                    this.smallBodies[bodyIndex].vx = newBodies[bodyIndex].vx;
                    this.smallBodies[bodyIndex].vy = newBodies[bodyIndex].vy;
                    this.smallBodies[bodyIndex].dead = newBodies[bodyIndex].dead;
                }
                this.workerCollisionsResolver(response.collisions);
            };
        }
    }

    reset() {
        this.totalSteps = 0;
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

    async doTimeSteps(timeUnits: number): Promise<CollisionInfo[]> {
        const steps = Math.round(timeUnits / this.dt);
        let collisions: CollisionInfo[] = [];
        if (this.worker) {
            const data: SolverWorkerData = {
                bodies: this.smallBodies,
                dt: this.dt,
                dynamicSystemTotalTime: this.totalSteps * this.dt,
                steps,
                collisionTargets: [SPRING_ANCHOR],
            };
            const collisionsPromise = new Promise<CollisionInfo[]>(resolve => this.workerCollisionsResolver = resolve);
            this.worker.postMessage(data);
            collisions = await collisionsPromise;

        } else {
            for (let step = 0; step < steps; step++) {
                const totalTime = (this.totalSteps + step) * this.dt;
                doPhysicsStep(this.smallBodies, this.dt, totalTime, collisions);
            }
        }
        this.totalSteps += steps;
        return collisions;
    }
}
