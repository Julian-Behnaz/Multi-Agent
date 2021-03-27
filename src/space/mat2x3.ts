import { V2 } from './index';

/*
  A 2x3 matrix is a more efficient
  3x3 matrix
    x  y  t
  [ 1  0  0
    0  1  0
    0  0  1 ]

    x  y  t
  [ a  c  e
    b  d  f
    0  0  1 ]

  xBasis = a,b
  yBasis = c,d
  translation = e,f
*/

/**
 * Stored in column-major order
 */
export interface t {
    /** a -- xBasis.x */
    0: number,
    /** b -- xBasis.y */
    1: number,
    /** c -- yBasis.x */
    2: number,
    /** d -- yBasis.y */
    3: number,
    /** e -- translate.x */
    4: number,
    /** f -- translate.y */
    5: number,
}

export function createIdentity(): t {
    const res = <t>(new Float32Array(6) as unknown);
    res[0] = 1;
    res[3] = 1;
    return res;
}

export function setIP(m: t, a: number, c: number, e: number, b: number, d: number, f: number) {
    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = e;
    m[5] = f;
}

export function translateIP(m: t, tx: number, ty: number) {
    /* 
      [ a  c  e      [ 1  0  tx     [ 1a+0b+0tx 1c+0d+0tx 1e+0f+1tx ]
        b  d  f    *   0  1  ty   = [ 0a+1b+0ty 0c+1d+0ty 0e+1f+1ty ]
        0  0  1 ]      0  0  1 ]    [ 0a+0b+0*1 0c+0d+0*1 0e+0f+1*1 ]
        [ a c e+tx ]
        [ b d f+ty ]
        [ 0 0 1    ]
    */
    m[4] += tx; // e + tx
    m[5] += ty; // f + ty
}

export function transformPoint(m: t, pt: V2.t): V2.t {
    const x = m[0]*pt[0] + m[2]*pt[1] + m[4]*1;
    const y = m[1]*pt[0] + m[3]*pt[1] + m[5]*1;
    return V2.fromValues(x, y);
}

export function transformVector(m: t, v: V2.t): V2.t {
    const x = m[0]*v[0] + m[2]*v[1];// + m[4]*0;
    const y = m[1]*v[0] + m[3]*v[1];// + m[5]*0;
    return V2.fromValues(x, y);
}