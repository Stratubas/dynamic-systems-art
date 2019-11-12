export class DynamicBody {
    x?: number = 0;
    y?: number = 0;
    vx?: number = 0;
    vy?: number = 0;
    ax?: number = 0;
    ay?: number = 0;
    mass?: number = 1;
    constructor(params?: DynamicBody) {
        for (const key of Object.keys(params || {})) {
            this[key] = params[key];
        }
    }
}
