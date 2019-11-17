/// <reference lib="webworker" />

import { DynamicBody } from "src/classes/dynamic-body";
import { updatePositions } from 'src/physics-helpers/update-positions';
import { updateAccelerations } from 'src/physics-helpers/update-accelarations';
import { updateVelocities } from 'src/physics-helpers/update-velocities';

addEventListener('message', ({ data }) => {
  const bodies: DynamicBody[] = data.bodies;
  const dt: number = data.dt;
  const steps: number = data.steps;
  for (let step = 0; step < steps; step++) {
    updatePositions(bodies, dt);
    updateAccelerations(bodies);
    updateVelocities(bodies, dt);
  }
  postMessage(bodies);
});
