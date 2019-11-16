import { DynamicBody } from './dynamic-body';

export class DynamicSystem {
    public dt = 0.002;
    public massiveBodies: DynamicBody[] = [];
    public smallBodies: DynamicBody[] = [];
    public allBodies: DynamicBody[] = [];

    constructor() {
        //public bodies: DynamicBody[] = []
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
        const collisionRadiusSquared = 0.0005;
        const result = [];
        let index = 0;
        const body1 = this.smallBodies[bodyIndex];
        if (body1.dead) { return result; }
        for (const body2 of this.massiveBodies) {
            // if (body1 == body2) { continue; }
            const dx = body2.x - body1.x;
            const dy = body2.y - body1.y;
            const r2 = dx * dx + dy * dy;
            if (r2 < collisionRadiusSquared) { result.push(index); }
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
            // for (let bodyIndex2 = bodyIndex1 + 1; bodyIndex2 < this.massiveBodies.length; bodyIndex2++) {
            //     const body2 = this.massiveBodies[bodyIndex2];
            //     const dx = body2.x - body1.x;
            //     const dy = body2.y - body1.y;
            //     const r2 = dx * dx + dy * dy;
            //     const factor = this.dt / (r2 * Math.sqrt(r2));
            //     const dxf = dx * factor;
            //     const dyf = dy * factor;
            //     body1.ax += body2.mass * dxf;
            //     body1.ay += body2.mass * dyf;
            //     body2.ax -= body1.mass * dxf;
            //     body2.ay -= body1.mass * dyf;
            // }
            for (let bodyIndex2 = 0; bodyIndex2 < this.smallBodies.length; bodyIndex2++) {
                const body2 = this.smallBodies[bodyIndex2];
                if (body2.dead) { continue; }
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r2 = dx * dx + dy * dy;
                const radius = Math.sqrt(r2);
                const springLength = 0.145;
                const springStiffness = 0.1;
                const springForce = springStiffness * (-0.5 * springLength + radius);
                const magneticForce = 0; // 0.0001 / r2;
                const factor = this.dt * (springForce + magneticForce) / radius;
                // if (r2 > 100) { continue; }
                // const factor = this.dt / (r2 * Math.sqrt(r2));
                const dxf = dx * factor;
                const dyf = dy * factor;
                const gravityAcceleration = 1;
                const gravityPull = -gravityAcceleration* this.dt;
                body2.ax -= body1.mass * dxf;
                body2.ay -= body1.mass * dyf + gravityPull;
            }
            // const radius = Math.sqrt(r2);
            // const springForce = radius - 0.05;
            // const magneticForce = 0; // 0.00001 / r2;
            // const gravityForce = 0; // -0.1;
            // const factor = this.dt * (springForce + magneticForce) / radius;
            // // if (r2 > 100) { continue; }
            // // const factor = this.dt / (r2 * Math.sqrt(r2));
            // const dxf = dx * factor;
            // const dyf = dy * factor;
            // body2.ax -= body1.mass * dxf;
            // body2.ay -= body1.mass * dyf + gravityForce * this.dt;
        }
    }

    private updateVelocities() {
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            body = this.allBodies[bodyIndex1];
            if (body.dead) { continue; }
            body.vx += this.dt * body.ax;
            body.vy += this.dt * body.ay;
        }
    }

    private updatePositions() {
        let body: DynamicBody;
        for (let bodyIndex1 = 0; bodyIndex1 < this.allBodies.length; bodyIndex1++) {
            body = this.allBodies[bodyIndex1];
            if (body.dead) { continue; }
            body.x += this.dt * body.vx;
            body.y += this.dt * body.vy;
            // if (body.x > 1) { body.x -= 1; }
            // if (body.x < 0) { body.x += 1; }
            // if (body.y > 1) { body.y -= 1; }
            // if (body.y < 0) { body.y += 1; }
        }
    }
}
