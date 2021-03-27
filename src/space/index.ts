export * as V2 from './V2';
export * as M2x3 from './mat2x3';
export * as Color from './color';
import * as V2 from './V2';

export const TAU = 6.28318530717958647692528676655900576839433879875021;

export function clamp01(a: number): number {
    return Math.max(Math.min(a, 1), 0);
}

export function lerp(a: number, b: number, t: number): number {
    return (1-t)*a + t*b;
}

export function ilerp(a: number, b: number, v: number): number {
    return (v-a)/(b-a);
}

export function lerpCurve(curve: V2.t[], t: number): number {
    for (let i = 0; i < curve.length-1; i++) {
        if (curve[i][0] <= t && curve[i+1][0] >= t) {
            const localT = (t - curve[i][0])/(curve[i+1][0]-curve[i][0]);
            return lerp(curve[i][1], curve[i+1][1], localT);
        }
    }
    return curve[curve.length-1][1];
}

export function cubicInterp(a: number, b: number, c: number, d: number, t: number): number {
    const a0 = d - c - a + b;
    const a1 = a - b - a0;
    const a2 = c - a;
    const a3 = b;
    return a0*t*t*t + a1*t*t + a2*t + a3;
}

export function catmullInterp(a: number, b: number, c: number, d: number, t: number): number {
    const a0 = -0.5*a + 1.5*b - 1.5*c + 0.5*d;
    const a1 = a - 2.5*b + 2*c - 0.5*d;
    const a2 = -0.5*a + 0.5*c;
    const a3 = b;

    // const a0 = d - c - a + b;
    // const a1 = a - b - a0;
    // const a2 = c - a;
    // const a3 = b;
    return a0*t*t*t + a1*t*t + a2*t + a3;
}

export function getCircleIntersection(p0: V2.t, r0: number, p1: V2.t, r1: number): V2.t {
    let d = V2.dist(p0, p1);
    if (d > r0+r1) {
        // Circles are separate
        // TODO: pick point on p0 in dir of p1
        return [0,0];
    } else if (d < Math.abs(r0-r1)) {
        // One circle inside the other
        // TODO: pick point
        return [0,0];
    } else if (d === 0 && r0 === r1) {
        // Circles are the same
        // TODO: pick point
        return [0,0];
    }
    const a = (r0*r0 - r1*r1 + d*d)/(2*d);
    const h = Math.sqrt(r0*r0 - a*a);
    const p2X = p0[0] + a * (p1[0] - p0[0])/d;
    const p2Y = p0[1] + a * (p1[1] - p0[1])/d;
    const p3X = p2X + h * (p1[1]-p0[1])/d;
    const p3Y = p2Y - h * (p1[0]-p0[0])/d;
    return V2.fromValues(p3X, p3Y);
}