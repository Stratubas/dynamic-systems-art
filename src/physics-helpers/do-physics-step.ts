import { DynamicBody } from 'src/classes/dynamic-body';
import { CollisionInfo, detectCollisions } from './detect-collisions';
import { updateAccelerations } from './update-accelarations';
import { updatePositions } from './update-positions';
import { updateVelocities } from './update-velocities';
import { SystemType } from 'src/app/models/system-type';

interface SubstepInfo {
    dt: number;
    type: 'x' | 'p';
}

function getSubsteps(dt: number, integrationOrder: 1 | 2 | 4): SubstepInfo[] {
    if (integrationOrder === 1) {
        return [
            { dt: dt, type: 'x' },
            { dt: dt, type: 'p' },
        ];
    }
    if (integrationOrder === 2) {
        return [
            { dt: 0.5 * dt, type: 'x' },
            { dt: dt, type: 'p' },
            { dt: 0.5 * dt, type: 'x' },
        ];
    }
    if (integrationOrder === 4) {
        return [
            { dt: 0.6756035959798288170238 * dt, type: 'x' },
            { dt: 1.351207191959657634048 * dt, type: 'p' },
            { dt: -0.1756035959798288170238 * dt, type: 'x' },
            { dt: -1.702414383919315268095 * dt, type: 'p' },
            { dt: -0.1756035959798288170238 * dt, type: 'x' },
            { dt: 1.351207191959657634048 * dt, type: 'p' },
            { dt: 0.6756035959798288170238 * dt, type: 'x' },
        ];
    }
    throw new Error(`Unsupported integration order: ${integrationOrder}`);
}

export function doPhysicsStep(
    bodies: { all: DynamicBody[]; massive: DynamicBody[]; small: DynamicBody[]; },
    dt: number, dynamicSystemTotalTime: number,
    collisions: CollisionInfo[], collisionTargets: DynamicBody[], activeSystem: SystemType,
) {
    const integrationOrder = activeSystem === 'planetary' ? 1 : 4;
    const substeps = getSubsteps(dt, integrationOrder);
    for (const substepInfo of substeps) {
        if (substepInfo.type === 'x') {
            updatePositions(bodies.all, substepInfo.dt);
        }
        else if (substepInfo.type === 'p') {
            updateAccelerations(bodies.all, bodies.massive, bodies.small, activeSystem);
            updateVelocities(bodies.all, substepInfo.dt);
        }
    }
    detectCollisions(bodies.all, collisionTargets, dynamicSystemTotalTime, collisions);
}
