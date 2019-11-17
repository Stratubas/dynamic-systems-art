import { DynamicBody } from 'src/classes/dynamic-body';

export function resetAccelerations(bodies: DynamicBody[]) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        body.ax = 0;
        body.ay = 0;
    }
}
