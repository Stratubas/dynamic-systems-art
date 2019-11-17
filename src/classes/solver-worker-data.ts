import { DynamicBody } from './dynamic-body';

export interface SolverWorkerData {
    bodies: DynamicBody[];
    bodyIndexOffset: number;
    dt: number;
    dynamicSystemTotalTime: number;
    steps: number;
    collisionTargets: DynamicBody[];
}
