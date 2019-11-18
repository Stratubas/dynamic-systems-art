import { DynamicBody } from 'src/classes/dynamic-body';

export function addAccelerationsGeneric(bodies: DynamicBody[], yAccel: number, xAccel: number = 0) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        body.ay += yAccel;
        body.ax += xAccel;
    }
}
