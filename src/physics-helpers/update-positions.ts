import { DynamicBody } from 'src/classes/dynamic-body';

export function updatePositions(bodies: DynamicBody[], dt: number) {
    for (const body of bodies) {
        if (body.dead) { continue; }
        body.x += dt * body.vx;
        body.y += dt * body.vy;
    }
}
