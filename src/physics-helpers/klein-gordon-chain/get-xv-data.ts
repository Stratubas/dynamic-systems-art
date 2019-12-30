import { DynamicBody } from 'src/classes/dynamic-body';

export function getXvData(bodies: DynamicBody[]): number[] {
    const result = Array(bodies.length * 2);
    for (let bodyIndex = 0; bodyIndex < bodies.length; bodyIndex++) {
        const body = bodies[bodyIndex];
        result[bodyIndex] = body.y;
        result[bodyIndex + bodies.length] = body.vy;
    }
    return result;
}
