import { DynamicBody } from 'src/classes/dynamic-body';
import { CollisionInfo, detectCollisions } from './detect-collisions';
import { SPRING_ANCHOR, updateAccelerations } from './update-accelarations';
import { updatePositions } from './update-positions';
import { updateVelocities } from './update-velocities';

export function doPhysicsStep(
    bodies: { all: DynamicBody[]; massive: DynamicBody[]; small: DynamicBody[]; },
    dt: number, dynamicSystemTotalTime: number,
    collisions: CollisionInfo[], collisionTargets: DynamicBody[],
) {
    updatePositions(bodies.all, dt);
    detectCollisions(bodies.all, collisionTargets, dynamicSystemTotalTime, collisions);
    updateAccelerations(bodies.all, bodies.massive, bodies.small);
    updateVelocities(bodies.all, dt);
}
