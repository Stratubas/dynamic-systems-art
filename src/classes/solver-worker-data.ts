import { DynamicBody } from './dynamic-body';

export interface SolverWorkerData {
    bodies: DynamicBody[];
    dt: number;
    dynamicSystemTotalTime: number;
    steps: number;
    collisionTargets: DynamicBody[];
}
