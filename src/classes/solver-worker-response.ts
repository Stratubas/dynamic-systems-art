import { DynamicBody } from './dynamic-body';
import { CollisionInfo } from 'src/physics-helpers/detect-collisions';

export interface SolverWorkerResponse {
    bodies: DynamicBody[];
    collisions: CollisionInfo[];
    bodyIndexOffset: number;
}
