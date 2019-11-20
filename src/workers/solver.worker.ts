/// <reference lib="webworker" />

import { DynamicBody } from 'src/classes/dynamic-body';
import { CollisionInfo } from 'src/physics-helpers/detect-collisions';
import { doPhysicsStep } from 'src/physics-helpers/do-physics-step';
import { SolverWorkerData } from 'src/classes/solver-worker-data';
import { SolverWorkerResponse } from 'src/classes/solver-worker-response';

addEventListener('message', ({ data }) => {
  const solverData: SolverWorkerData = data;
  const bodies: DynamicBody[] = solverData.bodies;
  const bodyIndexOffset: number = solverData.bodyIndexOffset;
  const dt: number = solverData.dt;
  const steps: number = solverData.steps;
  const collisions: CollisionInfo[] = [];
  const collisionTargets = bodies.filter(body => body.mass);
  for (let step = 0; step < steps; step++) {
    const currentTime = solverData.dynamicSystemTotalTime + step * dt;
    // doPhysicsStep(bodies, dt, currentTime, collisions, collisionTargets); // TODO
  }
  const response: SolverWorkerResponse = { bodies, bodyIndexOffset, collisions };
  postMessage(response);
});
