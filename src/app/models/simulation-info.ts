import { DynamicBody } from "src/classes/dynamic-body";

export interface SimulationInfo {
    index: number;
    xPixelStart: number;
    yPixelStart: number;
    body: DynamicBody;
    showInResult: boolean;
}
