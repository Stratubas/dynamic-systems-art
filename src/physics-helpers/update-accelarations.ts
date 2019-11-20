import { DynamicBody } from 'src/classes/dynamic-body';
import { resetAccelerations } from './reset-accelerations';
import { addAccelerationsSpring } from './add-accelerations-spring';
import { addAccelerationsGeneric } from './add-accelerations-generic';
import { addAccelerationsGravity } from './add-accelerations-gravity';
import { addAccelerationsKleinGordon } from './accelerations/klein-gordon-chain';

export const SPRING_ANCHOR = { x: 0.5, y: 0.5 };
const GRAVITY_G = 0.005;

export const ACTIVE_SYSTEM: 'spring' | 'planetary' | 'klein-gordon' = 'klein-gordon';

export function updateAccelerations(bodies: DynamicBody[], massiveBodies: DynamicBody[], smallBodies: DynamicBody[]) {
    resetAccelerations(bodies);
    if (ACTIVE_SYSTEM === 'spring') {
        addAccelerationsSpring(bodies, SPRING_ANCHOR);
        addAccelerationsGeneric(bodies, GRAVITY_G);
    } else if (ACTIVE_SYSTEM === 'planetary') {
        addAccelerationsGravity(massiveBodies, smallBodies);
    } else if (ACTIVE_SYSTEM === 'klein-gordon') {
        addAccelerationsKleinGordon(bodies);
    } else {
        throw new Error(`Unknown system type - can't add accelerations.`);
    }
}
