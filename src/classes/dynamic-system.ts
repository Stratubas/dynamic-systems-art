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

    doTimeStep() {
        this.updatePositions();
        this.updateAccelerations();
        this.updateVelocities();
    }

    private updateAccelerations() {
        for (const body1 of this.bodies) {
            body1.ax = 0;
            body1.ay = 0;
            for (const body2 of this.bodies) {
                if (body1 == body2 || body2.mass == 0) { continue; }
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r2 = dx * dx + dy * dy;
                const rInv3 = 1 / (r2 * Math.sqrt(r2));
                const factor = body2.mass * this.dt * rInv3;
                body1.ax += dx * factor;
                body1.ay += dy * factor;
            }
        }
    }

    private updateVelocities() {
        for (const body of this.bodies) {
            body.vx += this.dt * body.ax;
            body.vy += this.dt * body.ay;
        }
    }

    private updatePositions() {
        for (const body of this.bodies) {
            body.x += this.dt * body.vx;
            body.y += this.dt * body.vy;
            // if (body.x > 1) { body.x -= 1; }
            // if (body.x < 0) { body.x += 1; }
            // if (body.y > 1) { body.y -= 1; }
            // if (body.y < 0) { body.y += 1; }
        }
    }
}
