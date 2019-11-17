import { DynamicBody } from './dynamic-body';

export interface SolverWorkerData {
    bodies: DynamicBody[];
    dt: number;
    steps: number;
}
