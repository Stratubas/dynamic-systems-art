import { DynamicBody } from 'src/classes/dynamic-body';
import { resetAccelerations } from './reset-accelerations';
import { addAccelerationsSpring } from './add-accelerations-spring';
import { addAccelerationsGeneric } from './add-accelerations-generic';
import { addAccelerationsGravity } from './add-accelerations-gravity';

export const SPRING_ANCHOR = { x: 0.5, y: 0.5 };
const GRAVITY_G = 0.005;

const SYSTEM_TYPE: 'spring' | 'planetary' = 'planetary';

export function updateAccelerations(bodies: DynamicBody[], massiveBodies: DynamicBody[], smallBodies: DynamicBody[]) {
    resetAccelerations(bodies);
    if (SYSTEM_TYPE === 'spring') {
        addAccelerationsSpring(bodies, SPRING_ANCHOR);
        addAccelerationsGeneric(bodies, GRAVITY_G);
    } else if (SYSTEM_TYPE === 'planetary') {
        addAccelerationsGravity(massiveBodies, smallBodies);
    } else {
        throw new Error(`Unknown system type - can't add accelerations.`);
    }
}
