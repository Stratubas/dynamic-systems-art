import { DynamicBody } from 'src/classes/dynamic-body';

export function updateAccelerations(bodies: DynamicBody[], dt: number) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        body.ax = 0;
        body.ay = 0;
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
            const gravityPull = -gravityAcceleration * this.dt;
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