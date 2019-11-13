import { DynamicBody } from './dynamic-body';

export class DynamicSystem {
    private dt = 0.01;
    public bodies: DynamicBody[] = [];

    constructor() {
        //public bodies: DynamicBody[] = []
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
        this.bodies.push(newBody);
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
        this.bodies.push(newBody);
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
        this.bodies.push(newBody);
    }

    getCollisionsOfBodyWithIndex(bodyIndex: number): number[] {
        const result = [];
        let index = 0;
        const body1 = this.bodies[bodyIndex];
        for (const body2 of this.bodies) {
            if (body1 == body2) { continue; }
            const dx = body2.x - body1.x;
            const dy = body2.y - body1.y;
            const r2 = dx * dx + dy * dy;
            if (r2 < 0.0001) { result.push(index); }
            index++;
        }
        return result;
    }

    doTimeStepInline() {
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
    }

    doTimeStep() {
        this.updatePositions();
        this.updateAccelerations();
        this.updateVelocities();
    }

    private updateAccelerations() {
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            const body1 = this.bodies[bodyIndex1];
            body1.ax = 0;
            body1.ay = 0;
        }
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            const body1 = this.bodies[bodyIndex1];
            for (let bodyIndex2 = bodyIndex1 + 1; bodyIndex2 < this.bodies.length; bodyIndex2++) {
                const body2 = this.bodies[bodyIndex2];
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
        }
    }

    private updateVelocities() {
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body = this.bodies[bodyIndex1];
            body.vx += this.dt * body.ax;
            body.vy += this.dt * body.ay;
        }
    }

    private updatePositions() {
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.bodies.length; bodyIndex1++) {
            body = this.bodies[bodyIndex1];
            body.x += this.dt * body.vx;
            body.y += this.dt * body.vy;
            // if (body.x > 1) { body.x -= 1; }
            // if (body.x < 0) { body.x += 1; }
            // if (body.y > 1) { body.y -= 1; }
            // if (body.y < 0) { body.y += 1; }
        }
    }
}
