import { DynamicBody } from './dynamic-body';
import { SPRING_ANCHOR } from 'src/physics-helpers/update-accelarations';
import { CollisionInfo } from 'src/physics-helpers/detect-collisions';
import { SolverWorkerData } from './solver-worker-data';
import { SolverWorkerResponse } from './solver-worker-response';
import { doPhysicsStep } from 'src/physics-helpers/do-physics-step';

const WORKERS_COUNT = 4; // 0 to disable, navigator.hardwareConcurrency to get CPU threads
let workers: Worker[];
if (WORKERS_COUNT && typeof Worker !== 'undefined') {
    console.log('Working with', WORKERS_COUNT, 'worker(s).');
    try {
        workers = Array(WORKERS_COUNT).fill(null).map(() => new Worker('../workers/solver.worker', { type: 'module' }));
    } catch (error) {
        console.log(error)
    }
} else if (WORKERS_COUNT) {
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

    private workers: Worker[];
    private workerCollisionsResolvers: ((collisions: CollisionInfo[]) => void)[] = Array(WORKERS_COUNT);

    constructor(public dt: number = 0.1) {
        if (workers) {
            this.workers = workers;
            workers.forEach((worker, workerIndex) => {
                worker.onmessage = ({ data }) => {
                    const response: SolverWorkerResponse = data;
                    this.processWorkerResponse(response, workerIndex);
                };
            });
        }
    }

    processWorkerResponse(response: SolverWorkerResponse, workerIndex: number) {
        const bodyIndexOffset = response.bodyIndexOffset;
        const newBodies = response.bodies;
        for (let bodyIndex = 0; bodyIndex < newBodies.length; bodyIndex++) {
            const newBody = newBodies[bodyIndex];
            const thisBodyIndex = bodyIndex + bodyIndexOffset;
            const thisBody = this.smallBodies[thisBodyIndex];
            thisBody.x = newBody.x;
            thisBody.y = newBody.y;
            thisBody.vx = newBody.vx;
            thisBody.vy = newBody.vy;
            thisBody.dead = newBody.dead;
        }
        for (const collisionInfo of response.collisions) {
            collisionInfo.bodyIndex += bodyIndexOffset;
        }
        const resolverFunction = this.workerCollisionsResolvers[workerIndex];
        resolverFunction(response.collisions);
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

    async doTimeSteps(timeUnits: number, parallel: number = 2): Promise<CollisionInfo[]> {
        const steps = Math.round(timeUnits / this.dt);
        const collisions: CollisionInfo[] = [];
        if (this.workers) {
            const bodiesPerWorker = Math.ceil(this.smallBodies.length / this.workers.length);
            const workersData: SolverWorkerData[] = [];
            this.workers.forEach((_worker, workerIndex) => {
                const data: SolverWorkerData = {
                    bodies: [],
                    bodyIndexOffset: workerIndex * bodiesPerWorker,
                    dt: this.dt,
                    dynamicSystemTotalTime: this.totalSteps * this.dt,
                    steps,
                    collisionTargets: [SPRING_ANCHOR],
                };
                workersData.push(data);
            });
            for (let bodyIndex = 0; bodyIndex < this.smallBodies.length; bodyIndex++) {
                const body = this.smallBodies[bodyIndex];
                const workerIndex = Math.floor(bodyIndex / bodiesPerWorker);
                workersData[workerIndex].bodies.push(body);
            }
            const collisionsPromises: Promise<CollisionInfo[]>[] = [];
            this.workers.forEach((worker, workerIndex) => {
                const collisionsPromise = new Promise<CollisionInfo[]>(resolve => {
                    this.workerCollisionsResolvers[workerIndex] = resolve;
                });
                collisionsPromises.push(collisionsPromise);
                worker.postMessage(workersData[workerIndex]);
            });
            const nestedCollisions = await Promise.all(collisionsPromises);
            for (const extraCollisions of nestedCollisions) {
                for (const collision of extraCollisions) {
                    collisions.push(collision);
                }
            }
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
