import { DynamicBody } from './dynamic-body';
import { SystemType } from 'src/app/models/system-type';

export interface SolverWorkerData {
    bodies: DynamicBody[];
    bodyIndexOffset: number;
    dt: number;
    dynamicSystemTotalTime: number;
    steps: number;
    collisionTargets: DynamicBody[];
    activeSystem: SystemType;
}
