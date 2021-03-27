export interface t {
    0: number, // x
    1: number, // y
    2: number, // w
    3: number, // h
}

export function create(): t {
    return <t>(new Float32Array(4) as unknown);
}

export function add(a: t, b: t): t {
    const res = create();
    res[0] = a[0] + b[0];
    res[1] = a[1] + b[1];
    return res;
}