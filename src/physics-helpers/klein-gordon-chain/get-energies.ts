import { DynamicBody } from 'src/classes/dynamic-body';

function getBodyEnergy(body: DynamicBody, leftBody: DynamicBody, rightBody: DynamicBody, epsilon: number = 0.1): number {
    let nrg = body.y;
    nrg = 0.5 * nrg * nrg; // x^2 / 2
    nrg += nrg * nrg; // + x^4 / 4
    nrg += 0.5 * body.vy * body.vy; // + p^2 / 2
    const dLeft = body.y - leftBody.y;
    const dRight = body.y - rightBody.y;
    nrg += 0.25 * epsilon * (dLeft * dLeft + dRight * dRight); // + coupling / 2
    return nrg;
}

export function getEnergies(bodies: DynamicBody[], epsilon: number = 0.1): number[] {
    const result = Array(bodies.length);
    let centerIndex = 0;
    let body = bodies[centerIndex];
    let leftBody = bodies[bodies.length - 1];
    let rightBody = bodies[1];
    result[centerIndex] = getBodyEnergy(body, leftBody, rightBody, epsilon);
    for (centerIndex = 1; centerIndex < bodies.length - 1; centerIndex++) {
        body = bodies[centerIndex];
        leftBody = bodies[centerIndex - 1];
        rightBody = bodies[centerIndex + 1];
        result[centerIndex] = getBodyEnergy(body, leftBody, rightBody, epsilon);
    }
    body = bodies[centerIndex];
    leftBody = bodies[centerIndex - 1];
    rightBody = bodies[0];
    result[centerIndex] = getBodyEnergy(body, leftBody, rightBody, epsilon);
    return result;
}
