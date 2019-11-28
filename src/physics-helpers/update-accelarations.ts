import { DynamicBody } from 'src/classes/dynamic-body';
import { resetAccelerations } from './reset-accelerations';
import { addAccelerationsSpring } from './add-accelerations-spring';
import { addAccelerationsGeneric } from './add-accelerations-generic';
import { addAccelerationsGravity } from './add-accelerations-gravity';
import { addAccelerationsKleinGordon } from './accelerations/klein-gordon-chain';
import { SystemType } from 'src/app/models/system-type';

export const SPRING_ANCHOR = { x: 0.5, y: 0.5 };
const GRAVITY_G = 0.005;

export function updateAccelerations(bodies: DynamicBody[], massiveBodies: DynamicBody[], smallBodies: DynamicBody[], activeSystem: SystemType) {
    resetAccelerations(bodies);
    if (activeSystem === 'spring') {
        addAccelerationsSpring(bodies, SPRING_ANCHOR);
        addAccelerationsGeneric(bodies, GRAVITY_G);
    } else if (activeSystem === 'planetary') {
        addAccelerationsGravity(massiveBodies, smallBodies);
    } else if (activeSystem === 'klein-gordon') {
        addAccelerationsKleinGordon(bodies);
    } else {
        throw new Error(`Unknown system type - can't add accelerations.`);
    }
}
