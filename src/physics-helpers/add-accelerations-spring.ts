import { DynamicBody } from 'src/classes/dynamic-body';

export interface SpringParams {
    stiffness: number;
    length: number;
    inverseMass: number;
}

const DEFAULT_SPRING_PARAMS = {
    length: 0.0725,
    stiffness: 0.1,
    inverseMass: 1,
};

export function addAccelerationsSpring(bodies: DynamicBody[], anchor: DynamicBody, params: SpringParams = DEFAULT_SPRING_PARAMS) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        const dx = anchor.x - body.x;
        const dy = anchor.y - body.y;
        const r2 = dx * dx + dy * dy;
        const radius = Math.sqrt(r2);
        const deformation = radius - params.length;
        const forceMagnitude = params.stiffness * deformation;
        const accelerationOverRadius = forceMagnitude * params.inverseMass / radius;
        body.ax += dx * accelerationOverRadius;
        body.ay += dy * accelerationOverRadius;
    }
}
