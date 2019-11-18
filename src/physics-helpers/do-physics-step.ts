import { DynamicBody } from 'src/classes/dynamic-body';
import { CollisionInfo, detectCollisions } from './detect-collisions';
import { SPRING_ANCHOR, updateAccelerations } from './update-accelarations';
import { updatePositions } from './update-positions';
import { updateVelocities } from './update-velocities';

export function doPhysicsStep(
    bodies: DynamicBody[], dt: number, dynamicSystemTotalTime: number,
    collisions: CollisionInfo[] = [], collisionTargets: DynamicBody[] = [SPRING_ANCHOR]
) {
    updatePositions(bodies, dt);
    detectCollisions(bodies, collisionTargets, dynamicSystemTotalTime, collisions);
    updateAccelerations(bodies);
    updateVelocities(bodies, dt);
}
