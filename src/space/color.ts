type Brand<K, T> = K & { __brand: T }

export type t = Brand<number, 'RGBA32'>;

export function toString(v: t) {
    return `#${(v >>> 0).toString(16).padStart(8, '0')}`;
}

export function fromRGB(r: number, g: number, b: number): t {
    return ((r << 24) | (g << 16) | (b << 8) | 0xFF) as t;
}

export function fromRGBA(r: number, g: number, b: number, a: number): t {
    return ((r << 24) | (g << 16) | (b << 8) | a) as t;
}
