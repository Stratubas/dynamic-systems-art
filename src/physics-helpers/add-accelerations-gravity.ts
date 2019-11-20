import { DynamicBody } from 'src/classes/dynamic-body';

function addForceXY(body1: DynamicBody, body2: DynamicBody, gravitationalConstant: number = 0.002) {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const r2 = dx * dx + dy * dy;
    const forceOverMassProductOverRadius = gravitationalConstant / (r2 * Math.sqrt(r2));
    const xForceOverMassProduct = dx * forceOverMassProductOverRadius;
    const yForceOverMassProduct = dy * forceOverMassProductOverRadius;
    if (body2.mass) {
        body1.ax += body2.mass * xForceOverMassProduct;
        body1.ay += body2.mass * yForceOverMassProduct;
    }
    if (body1.mass) {
        body2.ax -= body1.mass * xForceOverMassProduct;
        body2.ay -= body1.mass * yForceOverMassProduct;
    }
}

export function addAccelerationsGravity(massiveBodies: DynamicBody[], smallBodies: DynamicBody[]) {
    for (let massiveBodyIndex1 = 0; massiveBodyIndex1 < massiveBodies.length; massiveBodyIndex1++) {
        const massiveBody1 = massiveBodies[massiveBodyIndex1];
        if (massiveBody1.dead) { continue; }
        for (let massiveBodyIndex2 = massiveBodyIndex1 + 1; massiveBodyIndex2 < massiveBodies.length; massiveBodyIndex2++) {
            const massiveBody2 = massiveBodies[massiveBodyIndex2];
            if (massiveBody2.dead) { continue; }
            addForceXY(massiveBody1, massiveBody2);
        }
        for (const smallBody of smallBodies) {
            if (smallBody.dead) { continue; }
            addForceXY(massiveBody1, smallBody);
        }
    }
}
