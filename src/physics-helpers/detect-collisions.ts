import { DynamicBody } from 'src/classes/dynamic-body';

export function detectCollisions(bodies: DynamicBody[], targets: DynamicBody[], range: number = 0.02236) {
    if (targets.length !== 1) {
        console.error('Only a single target for collision detection supported.');
    }
    const target = targets[0];
    const collisionRadiusSquared = range * range;
    const bodyCollisions = Array(bodies.length);
    for (let bodyIndex = 0; bodyIndex < bodies.length; bodyIndex++) {
        const body = bodies[bodyIndex];
        if (body.dead) { bodyCollisions[bodyIndex] = []; continue; }
        const dx = body.x - target.x;
        const dy = body.y - target.y;
        const r2 = dx * dx + dy * dy;
        bodyCollisions[bodyIndex] = (r2 < collisionRadiusSquared) ? [0] : [];
    }
    return bodyCollisions;
}
