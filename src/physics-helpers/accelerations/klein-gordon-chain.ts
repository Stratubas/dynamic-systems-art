import { DynamicBody } from 'src/classes/dynamic-body';

export function addAccelerationsKleinGordon(bodies: DynamicBody[], epsilon: number = 0.1) {
    let body = bodies[0];
    let bodyY = body.y;
    let leftY = bodies[bodies.length - 1].y;
    let rightY = bodies[1].y;
    body.ay = -bodyY - bodyY * bodyY * bodyY + epsilon * (leftY + rightY - 2 * bodyY);
    for (let bodyIndex = 1; bodyIndex < bodies.length - 1; bodyIndex++) {
        body = bodies[bodyIndex];
        bodyY = body.y;
        leftY = bodies[bodyIndex - 1].y;
        rightY = bodies[bodyIndex + 1].y;
        body.ay = -bodyY - bodyY * bodyY * bodyY + epsilon * (leftY + rightY - 2 * bodyY);
    }
    body = bodies[bodies.length - 1];
    bodyY = body.y;
    leftY = bodies[bodies.length - 2].y;
    rightY = bodies[0].y;
    body.ay = -bodyY - bodyY * bodyY * bodyY + epsilon * (leftY + rightY - 2 * bodyY);
}
