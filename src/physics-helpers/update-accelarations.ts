import { DynamicBody } from 'src/classes/dynamic-body';
import { resetAccelerations } from './reset-accelerations';
import { addAccelerationsSpring } from './add-accelerations-spring';
import { addAccelerationsGeneric } from './add-accelerations-generic';

export const SPRING_ANCHOR = { x: 0.5, y: 0.5 };
const GRAVITY_G = 0.005;

export function updateAccelerations(bodies: DynamicBody[]) {
    resetAccelerations(bodies);
    addAccelerationsSpring(bodies, SPRING_ANCHOR);
    addAccelerationsGeneric(bodies, GRAVITY_G);
}
