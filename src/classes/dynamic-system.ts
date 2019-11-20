import { DynamicBody } from './dynamic-body';
import { SPRING_ANCHOR } from 'src/physics-helpers/update-accelarations';
import { CollisionInfo } from 'src/physics-helpers/detect-collisions';
import { SolverWorkerData } from './solver-worker-data';
import { SolverWorkerResponse } from './solver-worker-response';
import { doPhysicsStep } from 'src/physics-helpers/do-physics-step';

const WORKERS_COUNT = 3; // 0 to disable, navigator.hardwareConcurrency to get CPU threads
let workers: Worker[];
if (WORKERS_COUNT && typeof Worker !== 'undefined') {
    console.log('Working with', WORKERS_COUNT, 'worker(s).');
    workers = Array(WORKERS_COUNT).fill(null).map(() => new Worker('../workers/solver.worker', { type: 'module' }));
} else if (WORKERS_COUNT) {
    console.error('Workers not available!');
    alert('Your browser is not compatible with web workers.\n\nFalling back to doing calculations in the UI thread :(');
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
    private workerWorks: Promise<any>[] = Array(WORKERS_COUNT).fill(null).map((_, i) => Promise.resolve(i));

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

    doTimeStepsInMainThread(steps: number, collisionsToMutate: CollisionInfo[]): void {
        for (let step = 0; step < steps; step++) {
            const totalTime = (this.totalSteps + step) * this.dt;
            doPhysicsStep(this.smallBodies, this.dt, totalTime, collisionsToMutate);
        }
    }

    async doTimeStepsInWorkers(steps: number, collisionsToMutate: CollisionInfo[]): Promise<void> {
        const bodiesPerBodyBatch = Math.ceil(0.125 * this.smallBodies.length / this.workers.length);
        const bodyBatchesCount = Math.ceil(this.smallBodies.length / bodiesPerBodyBatch);
        const bodyBatches = Array(bodyBatchesCount).fill(null).map(() => []);
        for (let bodyIndex = 0; bodyIndex < this.smallBodies.length; bodyIndex++) {
            const body = this.smallBodies[bodyIndex];
            const bodyBatchIndex = Math.floor(bodyIndex / bodiesPerBodyBatch);
            bodyBatches[bodyBatchIndex].push(body);
        }
        const tasks: SolverWorkerData[] = bodyBatches.map((bodies, taskIndex) => {
            const data: SolverWorkerData = {
                bodies,
                bodyIndexOffset: taskIndex * bodiesPerBodyBatch,
                dt: this.dt,
                dynamicSystemTotalTime: this.totalSteps * this.dt,
                steps,
                collisionTargets: [SPRING_ANCHOR],
            };
            return data;
        });
        // console.log('Split the simulation of', this.smallBodies.length, 'bodies into', tasks.length, 'tasks.');
        const tasksDoneByWorker = this.workers.map(() => []);
        const collisionsPromises: Promise<CollisionInfo[]>[] = [];
        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const task = tasks[taskIndex];
            const nextFreeWorkerIndex = await Promise.race(this.workerWorks);
            tasksDoneByWorker[nextFreeWorkerIndex].push(taskIndex);
            const nextFreeWorker = this.workers[nextFreeWorkerIndex];
            const nextCollisionsPromise = new Promise<CollisionInfo[]>(resolve => {
                this.workerCollisionsResolvers[nextFreeWorkerIndex] = resolve;
            });
            collisionsPromises.push(nextCollisionsPromise);
            this.workerWorks[nextFreeWorkerIndex] = nextCollisionsPromise.then(() => nextFreeWorkerIndex);
            nextFreeWorker.postMessage(task);
        }
        // console.log(tasksDoneByWorker);
        const nestedCollisions = await Promise.all(collisionsPromises);
        for (const extraCollisions of nestedCollisions) {
            for (const collision of extraCollisions) {
                collisionsToMutate.push(collision);
            }
        }
    }

    async doTimeSteps(timeUnits: number): Promise<CollisionInfo[]> {
        const steps = Math.round(timeUnits / this.dt);
        const collisions: CollisionInfo[] = [];
        if (this.workers) {
            await this.doTimeStepsInWorkers(steps, collisions);
        } else {
            this.doTimeStepsInMainThread(steps, collisions);
        }
        this.totalSteps += steps;
        return collisions;
    }
}
