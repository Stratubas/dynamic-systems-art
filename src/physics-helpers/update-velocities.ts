import { DynamicBody } from 'src/classes/dynamic-body';

export function updateVelocities(bodies: DynamicBody[], dt: number) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        body.vx += dt * body.ax;
        body.vy += dt * body.ay;
    }
}
