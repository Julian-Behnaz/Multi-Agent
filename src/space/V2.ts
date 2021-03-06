import * as Space from "./";

export interface t {
    0: number,
    1: number
}

export function create(): t {
    return <t>(new Float32Array(2) as unknown);
}

export function fromValues(x: number, y: number): t {
    const res = create();
    res[0] = x;
    res[1] = y;
    return res;
}

export function perp(a: t): t {
    const res = create();
    res[0] = a[1];
    res[1] = -a[0];
    return res;
}

export function add(a: t, b: t): t {
    const res = create();
    res[0] = a[0] + b[0];
    res[1] = a[1] + b[1];
    return res;
}

export function sub(a: t, b: t): t {
    const res = create();
    res[0] = a[0] - b[0];
    res[1] = a[1] - b[1];
    return res;
}

export function dot(a: t, b: t): number {
    return a[0]*b[0] + a[1]*b[1];
}

export function copyTo(a: t, out: t): t {
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

export function scale(a: t, v: number): t {
    const res = create();
    res[0] = a[0] * v;
    res[1] = a[1] * v;
    return res;
}

export function inRect(a: t, cornerX: number, cornerY: number, width: number, height: number): boolean {
    return a[0] >= cornerX
    && a[0] <= cornerX + width
    && a[1] >= cornerY
    && a[1] <= cornerY + height;
}

export function dist(p0: t, p1: t): number {
    return Math.sqrt((p1[0] - p0[0])*(p1[0] - p0[0]) + (p1[1] - p0[1])*(p1[1] - p0[1]));
}

export function sqrDist(p0: t, p1: t): number {
    return (p1[0] - p0[0])*(p1[0] - p0[0]) + (p1[1] - p0[1])*(p1[1] - p0[1]);
}

export function length(v: t): number {
    return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
}

export function normalized(v: t): t {
    const len = length(v);
    if (len > 0) {
        return scale(v, 1/len);
    }
    return create();
}

export function normalize(v: t): void {
    const len = length(v);
    if (len > 0) {
        const invLen = 1/len;
        v[0] *= invLen;
        v[1] *= invLen;
        return;
    }
    v[0] = 0;
    v[1] = 0;
}

export function lerp(a: t, b: t, t: number): t {
    return fromValues(
        Space.lerp(a[0], b[0], t), 
        Space.lerp(a[1], b[1], t));
}