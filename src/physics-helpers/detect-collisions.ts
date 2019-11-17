import { DynamicBody } from 'src/classes/dynamic-body';

export interface CollisionInfo {
    bodyIndex: number;
    collidedTargetIndexes: number[];
    collisionTime: number;
}

export function detectCollisions(
    bodies: DynamicBody[], targets: DynamicBody[], collisionTime: number,
    collisions: CollisionInfo[] = [], range: number = 0.02236,
) {
    if (targets.length !== 1) {
        console.error('Only a single target for collision detection supported.');
    }
    const target = targets[0];
    const collisionRadiusSquared = range * range;
    for (let bodyIndex = 0; bodyIndex < bodies.length; bodyIndex++) {
        const body = bodies[bodyIndex];
        if (body.dead) { continue; }
        const dx = body.x - target.x;
        const dy = body.y - target.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < collisionRadiusSquared) {
            collisions.push({ bodyIndex, collidedTargetIndexes: [0], collisionTime });
            body.dead = true;
            body.x = 999;
            body.vx = 0;
            body.y = 999;
            body.vy = 0;
            body.ax = 0;
            body.ay = 0;
        }
    }
    return collisions;
}
