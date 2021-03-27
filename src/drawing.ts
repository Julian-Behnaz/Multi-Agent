import { M2x3, TAU, Color } from './space';
import type * as FontStyle from './fontStyle';

export enum kCmd {
    Translate,
    SetFillColor,
    SetStrokeColor,
    SetStrokeThickness,
    SetFont,
    FillText,
    MoveTo,
    LineTo,
    Rect,
    ArcTo,
    BeginPath,
    ClosePath,
    Fill,
    Stroke,
    Ellipse,
    ClearScreen
}

export const VERTEX_SIZE_BYTES = 4+4+4+4+4; // float for x, float for y, u32 for color, 2floats for sdf
export class D2DGPU {
    private measureCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;

    iBuf: Uint32Array;
    iUsed: number = 0
    vBuf: ArrayBuffer;
    vBufView: DataView;
    vUsedBytes: number = 0

    currFill: Color.t = 0x00000000 as Color.t;
    currStroke: Color.t = 0x00000000 as Color.t;
    currStrokeThickness: number = 1
    currFontStyle: FontStyle.t | null = null;

    iPathBegin: number = -1;
    vPathBegin: number = -1;

    /** 
     * We stick JS objects in here if we can't easily & cheaply store them in our buffer.
     * For example: strings. In those cases, we push index handles to the buffer.
     */
    readonly parameterStash: unknown[] = []

    private DBG?: D2D

    constructor(dbg?: D2D) {
        this.iBuf = new Uint32Array(1024);
        this.vBuf = new ArrayBuffer(1024);
        this.vBufView = new DataView(this.vBuf);
        this.DBG = dbg;
    }

    readonly worldToLocal = M2x3.createIdentity();
    readonly localToWorld = M2x3.createIdentity();

    private doubleVMem() {
        {
            const newBackingMem = new ArrayBuffer(this.vBuf.byteLength * 2);
            const reader = new Uint8Array(this.vBuf);
            const writer = new Uint8Array(newBackingMem);
            writer.set(reader);
            this.vBuf = newBackingMem;
            this.vBufView = new DataView(newBackingMem);
        }
    }

    private doubleIMem() {
        {
            const newBackingMem = new Uint32Array(this.iBuf.length * 2);
            const reader = new Uint8Array(this.iBuf);
            const writer = new Uint8Array(newBackingMem);
            writer.set(reader);
            this.iBuf = newBackingMem;
        }
    }

    private ensureVSpaceFor(used: number, nBytes: number) {
        while (used + nBytes > this.vBuf.byteLength) {
            this.doubleVMem();
        }
    }

    private ensureISpaceFor(used: number, nIndices: number) {
        while (used + nIndices > this.iBuf.length) {
            this.doubleIMem();
        }
    }

    translate(x: number, y: number) {
        M2x3.translateIP(this.localToWorld, x, y);
        M2x3.translateIP(this.worldToLocal, -x, -y);
    }

    setFillColor(c: Color.t) {
        this.currFill = c;
    }

    setStrokeColor(c: Color.t) {
        this.currStroke = c;
    }

    setStrokeThickness(width: number) {
        this.currStrokeThickness = width;
    }

    private _lastSetFontStyle: FontStyle.t | null = null;
    setFont(fontStyle: FontStyle.t) {
        this.currFontStyle = fontStyle;
    }

    measureTextWidth(str: string): number {
        const fontStyle = this._lastSetFontStyle;
        const ctx = this.measureCtx;
        if (fontStyle) {
            ctx.font = fontStyle._canvasRep;
            ctx.textAlign = fontStyle._canvasAlign;
            ctx.textBaseline = fontStyle._canvasBaseline;
        }

        return this.measureCtx.measureText(str).width;
    }

    fillText(x: number, y: number, str: string) {
        // TODO: figure out what to do with this...
        // Render to offscreen canvas directly and pass texture region to command?

        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 13); // 1 + 4 + 4 + 4
        // const strHandle = this.parameterStash.push(str) - 1;

        // this.byteView.setUint8(i, kCmd.FillText); i += 1;
        // this.byteView.setFloat32(i, x); i += 4;
        // this.byteView.setFloat32(i, y); i += 4;
        // this.byteView.setUint32(i, strHandle); i += 4;
        // this.usedBytes = i;
    }

    beginPath() {
        this.iPathBegin = this.iUsed;
        this.vPathBegin = this.vUsedBytes;
    }

    closePath() {
        // TODO:
        // Patch up data between this.iPathBegin and this.iUsed
        // and this.vPathBegin and this.vUsed appropriately
        this.iPathBegin = -1;
        this.vPathBegin = -1;
    }

    fill() {
        // TODO:
        // Patch up data between this.iPathBegin and this.iUsed
        // and this.vPathBegin and this.vUsed appropriately
        this.iPathBegin = -1;
        this.vPathBegin = -1;
    }

    stroke() {
        // TODO:
        // Patch up data between this.iPathBegin and this.iUsed
        // and this.vPathBegin and this.vUsed appropriately
        this.iPathBegin = -1;
        this.vPathBegin = -1;
    }

    moveTo(x: number, y: number) {
        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 9);
        // this.byteView.setUint8(i, kCmd.MoveTo); i += 1
        // this.byteView.setFloat32(i, x); i += 4;
        // this.byteView.setFloat32(i, y); i += 4;
        // this.usedBytes = i;
    }

    lineTo(x: number, y: number) {
        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 9);
        // this.byteView.setUint8(i, kCmd.LineTo); i += 1
        // this.byteView.setFloat32(i, x); i += 4;
        // this.byteView.setFloat32(i, y); i += 4;
        // this.usedBytes = i;
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 21);
        // this.byteView.setUint8(i, kCmd.ArcTo); i += 1
        // this.byteView.setFloat32(i, x1); i += 4;
        // this.byteView.setFloat32(i, y1); i += 4;
        // this.byteView.setFloat32(i, x2); i += 4;
        // this.byteView.setFloat32(i, y2); i += 4;
        // this.byteView.setFloat32(i, radius); i += 4;
        // this.usedBytes = i;
    }

    _rect(x: number, y: number, w: number, h: number) {
        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 17);
        // this.byteView.setUint8(i, kCmd.Rect); i += 1
        // this.byteView.setFloat32(i, x); i += 4;
        // this.byteView.setFloat32(i, y); i += 4;
        // this.byteView.setFloat32(i, w); i += 4;
        // this.byteView.setFloat32(i, h); i += 4;
        // this.usedBytes = i;
    }

    _ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number) {
        // let i = this.usedBytes;
        // this.ensureSpaceFor(i, 29);
        // this.byteView.setUint8(i, kCmd.Ellipse); i += 1
        // this.byteView.setFloat32(i, x); i += 4;
        // this.byteView.setFloat32(i, y); i += 4;
        // this.byteView.setFloat32(i, radiusX); i += 4;
        // this.byteView.setFloat32(i, radiusY); i += 4;
        // this.byteView.setFloat32(i, rotation); i += 4;
        // this.byteView.setFloat32(i, startAngle); i += 4;
        // this.byteView.setFloat32(i, endAngle); i += 4;
        // this.usedBytes = i;
    }

    beginPolyline() {
        
    }


    strokeLine(x0: number, y0: number, x1: number, y1: number) {
        /*

            0-------------1
            |            /|
        (x0, y0)       (x1, y1)
            | /           |
            2-------------3

        index: 012 213
        */

        const halfThickness = this.currStrokeThickness * 0.5;

        // Vector A2B along line segment:
        const a2b_x = x1 - x0; const a2b_y = y1 - y0;
        const a2b_len = Math.sqrt((a2b_x*a2b_x)+(a2b_y*a2b_y));
        if (a2b_len < 0.001) {
            return;
        }
        // Normalize Vector A2B
        const a2b_norm_x = a2b_x/a2b_len; const a2b_norm_y = a2b_y/a2b_len;
        // Perpendicular Vector scaled by thickness.
        // This vector provides an offset from the center line.
        const pS_x = a2b_norm_y * halfThickness;
        const pS_y = -a2b_norm_x * halfThickness;

        const DEBUG = false;
        if (this.DBG && DEBUG) {
            const DBG = this.DBG;
            DBG.setFillColor(0xFF00FFFF as Color.t);
            DBG.fillCircle(x0+pS_x, y0+pS_y, 3);
            DBG.fillCircle(x1+pS_x, y1+pS_y, 3);
            DBG.fillCircle(x0-pS_x, y0-pS_y, 3);
            DBG.fillCircle(x1-pS_x, y1-pS_y, 3);
            
            DBG.setStrokeColor(0xFF00FFFF as Color.t);
            DBG.strokeLine(
                x0 + a2b_x*0.5,
                y0 + a2b_y*0.5,
                //
                x0 + a2b_x*0.5 + a2b_norm_x * halfThickness, 
                y0 + a2b_y*0.5 + a2b_norm_y * halfThickness);

            DBG.setStrokeColor(0x0000FFFF as Color.t);
            DBG.strokeLine(
                x0 + a2b_x*0.5,
                y0 + a2b_y*0.5,
                //
                x0 + a2b_x*0.5 + pS_x,
                y0 + a2b_y*0.5 + pS_y);
        }

        const deltaI = 6;
        const deltaV = 4 * VERTEX_SIZE_BYTES;
        const iBuf = this.iBuf;
        const vBufView = this.vBufView;
        const rootIndex = this.vUsedBytes/VERTEX_SIZE_BYTES;
        const iUsed = this.iUsed;
        const color = this.currStroke;
        let vUsedBytes = this.vUsedBytes;
        this.ensureISpaceFor(iUsed, deltaI);
        this.ensureVSpaceFor(vUsedBytes, deltaV);

        iBuf[iUsed] = rootIndex;
        iBuf[iUsed+1] = rootIndex+1;
        iBuf[iUsed+2] = rootIndex+2;
        iBuf[iUsed+3] = rootIndex+2;
        iBuf[iUsed+4] = rootIndex+1;
        iBuf[iUsed+5] = rootIndex+3;
        this.iUsed = iUsed + deltaI;



        // We MUST specify little-endian for positions because by default, setFloat32 uses big endian. Because of course it does.
        // We specify color in big endian so we can directly set all channels and read in RGBA order
        { // 0
            // Pos
            vBufView.setFloat32(vUsedBytes, x0+pS_x, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, y0+pS_y, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 0, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
        }
        { // 1
            // Pos
            vBufView.setFloat32(vUsedBytes, x1+pS_x, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, y1+pS_y, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 0, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
        }
        { // 2
            // Pos
            vBufView.setFloat32(vUsedBytes, x0-pS_x, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, y0-pS_y, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 0, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
        }
        { // 3
            // Pos
            vBufView.setFloat32(vUsedBytes, x1-pS_x, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, y1-pS_y, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 0, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
        }

        this.vUsedBytes = vUsedBytes;
    }

    strokeCenteredTriangle(x: number, y: number, r: number = 5) {
        // this.beginPath();
        // // Optimization: Commented code replaced with precomputed values
        // // let initAngle = -TAU/4;
        // // let angStep = -TAU/3;
        // this.moveTo(
        //     x, //Math.cos(initAngle)*r+x,
        //     r + y // Math.sin(initAngle)*r+y
        // );
        // this.lineTo(
        //     -0.8660254037844388 * r + x, //Math.cos(initAngle + angStep)*r+x,
        //     -0.5 * r + y //Math.sin(initAngle + angStep)*r+y
        // );
        // this.lineTo(
        //     0.8660254037844384 * r + x, // Math.cos(initAngle + angStep*2)*r+x,
        //     -0.5 * r + y // Math.sin(initAngle + angStep*2)*r+y
        // );
        // this.lineTo(
        //     x, //Math.cos(initAngle)*r+x,
        //     r + y //Math.sin(initAngle)*r+y
        // );
        // this.stroke();
    }

    fillRect(cornerX: number, cornerY: number, width: number, height: number) {
        /*

        0---1
        |  /|
        | / |
        2---3

        index: 012 213
        */

        const deltaI = 6;
        const deltaV = 4 * VERTEX_SIZE_BYTES;
        const iBuf = this.iBuf;
        const vBufView = this.vBufView;
        const rootIndex = this.vUsedBytes/VERTEX_SIZE_BYTES;
        const iUsed = this.iUsed;
        const color = this.currFill;
        let vUsedBytes = this.vUsedBytes;
        this.ensureISpaceFor(iUsed, deltaI);
        this.ensureVSpaceFor(vUsedBytes, deltaV);

        iBuf[iUsed] = rootIndex;
        iBuf[iUsed+1] = rootIndex+1;
        iBuf[iUsed+2] = rootIndex+2;
        iBuf[iUsed+3] = rootIndex+2;
        iBuf[iUsed+4] = rootIndex+1;
        iBuf[iUsed+5] = rootIndex+3;
        this.iUsed = iUsed + deltaI;

        // We MUST specify little-endian for positions because by default, setFloat32 uses big endian. Because of course it does.
        // We specify color in big endian so we can directly set all channels and read in RGBA order
        { // 0
            // Pos
            vBufView.setFloat32(vUsedBytes, cornerX, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, cornerY, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
        }
        { // 1
            // Pos
            vBufView.setFloat32(vUsedBytes, cornerX + width, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, cornerY, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
        }
        { // 2
            // Pos
            vBufView.setFloat32(vUsedBytes, cornerX, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, cornerY + height, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
        }
        { // 3
            // Pos
            vBufView.setFloat32(vUsedBytes, cornerX + width, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, cornerY + height, true); vUsedBytes += 4;
            // Color
            vBufView.setUint32(vUsedBytes, color, false); vUsedBytes += 4;
            // SDF
            vBufView.setFloat32(vUsedBytes, 1, true); vUsedBytes += 4;
            vBufView.setFloat32(vUsedBytes, -1, true); vUsedBytes += 4;
        }

        this.vUsedBytes = vUsedBytes;
    }

    strokeRect(cornerX: number, cornerY: number, width: number, height: number) {
        // this.beginPath();
        // this._rect(cornerX, cornerY, width, height);
        // this.stroke();
    }

    fillCenterRect(centerX: number, centerY: number, width: number, height: number) {
        // this.fillRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
    }

    strokeCenterRect(centerX: number, centerY: number, width: number, height: number) {
        // this.strokeRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
    }

    strokeRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        // this.beginPath();
        // this.moveTo(x + r, y);
        // this.arcTo(x + w, y, x + w, y + h, r);
        // this.arcTo(x + w, y + h, x, y + h, r);
        // this.arcTo(x, y + h, x, y, r);
        // this.arcTo(x, y, x + w, y, r);
        // this.closePath();
        // this.stroke();
    }

    fillRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        // this.beginPath();
        // this.moveTo(x + r, y);
        // this.arcTo(x + w, y, x + w, y + h, r);
        // this.arcTo(x + w, y + h, x, y + h, r);
        // this.arcTo(x, y + h, x, y, r);
        // this.arcTo(x, y, x + w, y, r);
        // this.closePath();
        // this.fill();
    }

    fillCircle(x: number, y: number, r: number) {
        // this.beginPath();
        // this._ellipse(x, y, r, r, 0, 0, Math.PI * 2);
        // this.fill();
    }

    strokeCircle(x: number, y: number, r: number) {
        // this.beginPath();
        // this._ellipse(x, y, r, r, 0, 0, Math.PI * 2);
        // this.stroke();
    }

    strokeCrosshair(x: number, y: number, r: number = 5) {
        // this.beginPath();
        // this.moveTo(x - r, y);
        // this.lineTo(x + r, y);
        // this.moveTo(x, y - r);
        // this.lineTo(x, y + r);
        // this.stroke();
    }

    clearScreen(): void {
        // Clearing the screen isn't really something we can do well with geometry data,
        // so we reset the buffers, which means that nothing prepped so far will be drawn.
        // There might be a better way...
    }

    resetBuffer() {
        this.parameterStash.length = 0;
        this.iUsed = 0;
        this.vUsedBytes = 0;
    }
}

export class D2D {
    private measureCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
    private backingMem: ArrayBuffer;
    byteView: DataView;
    usedBytes: number = 0
    /** 
     * We stick JS objects in here if we can't easily & cheaply store them in our buffer.
     * For example: strings. In those cases, we push index handles to the buffer.
     */
    readonly parameterStash: unknown[] = []

    constructor() {
        this.backingMem = new ArrayBuffer(1024);
        this.byteView = new DataView(this.backingMem);
    }

    readonly worldToLocal = M2x3.createIdentity();
    readonly localToWorld = M2x3.createIdentity();

    private doubleMem() {
        const newBackingMem = new ArrayBuffer(this.backingMem.byteLength * 2);
        const reader = new Uint8Array(this.backingMem);
        const writer = new Uint8Array(newBackingMem);
        writer.set(reader);
        this.backingMem = newBackingMem;
        this.byteView = new DataView(newBackingMem);
    }

    private ensureSpaceFor(used: number, nBytes: number) {
        while (used + nBytes > this.backingMem.byteLength) {
            this.doubleMem();
        }
    }

    translate(x: number, y: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 9); // 1 + 4 + 4
        this.byteView.setUint8(i, kCmd.Translate); i += 1;
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.usedBytes = i;

        M2x3.translateIP(this.localToWorld, x, y);
        M2x3.translateIP(this.worldToLocal, -x, -y);
    }

    setFillColor(c: Color.t) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 5); // 1 + 4
        this.byteView.setUint8(i, kCmd.SetFillColor); i += 1;
        this.byteView.setUint32(i, c); i += 4;
        this.usedBytes = i;
    }

    setStrokeColor(c: Color.t) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 5); // 1 + 4
        this.byteView.setUint8(i, kCmd.SetStrokeColor); i += 1;
        this.byteView.setUint32(i, c); i += 4;
        this.usedBytes = i;
    }

    setStrokeThickness(width: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 5); // 1 + 4
        this.byteView.setUint8(i, kCmd.SetStrokeThickness); i += 1;
        this.byteView.setFloat32(i, width); i += 4;
        this.usedBytes = i;
    }

    private _lastSetFontStyle: FontStyle.t | null = null;
    setFont(fontStyle: FontStyle.t) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 5);

        const styleHandle = this.parameterStash.push(fontStyle) - 1;

        this.byteView.setUint8(i, kCmd.SetFont); i += 1;
        this.byteView.setUint32(i, styleHandle); i += 4;
        this.usedBytes = i;
        this._lastSetFontStyle = fontStyle;
    }

    measureTextWidth(str: string): number {
        const fontStyle = this._lastSetFontStyle;
        const ctx = this.measureCtx;
        if (fontStyle) {
            ctx.font = fontStyle._canvasRep;
            ctx.textAlign = fontStyle._canvasAlign;
            ctx.textBaseline = fontStyle._canvasBaseline;
        }

        return this.measureCtx.measureText(str).width;
    }

    fillText(x: number, y: number, str: string) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 13); // 1 + 4 + 4 + 4
        const strHandle = this.parameterStash.push(str) - 1;

        this.byteView.setUint8(i, kCmd.FillText); i += 1;
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.byteView.setUint32(i, strHandle); i += 4;
        this.usedBytes = i;
    }

    beginPath() {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 1);
        this.byteView.setUint8(i, kCmd.BeginPath);  i += 1
        this.usedBytes = i;
    }

    closePath() {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 1);
        this.byteView.setUint8(i, kCmd.ClosePath);  i += 1
        this.usedBytes = i;
    }

    fill() {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 1);
        this.byteView.setUint8(i, kCmd.Fill);  i += 1
        this.usedBytes = i;
    }

    stroke() {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 1);
        this.byteView.setUint8(i, kCmd.Stroke);  i += 1
        this.usedBytes = i;
    }

    moveTo(x: number, y: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 9);
        this.byteView.setUint8(i, kCmd.MoveTo); i += 1
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.usedBytes = i;
    }

    lineTo(x: number, y: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 9);
        this.byteView.setUint8(i, kCmd.LineTo); i += 1
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.usedBytes = i;
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 21);
        this.byteView.setUint8(i, kCmd.ArcTo); i += 1
        this.byteView.setFloat32(i, x1); i += 4;
        this.byteView.setFloat32(i, y1); i += 4;
        this.byteView.setFloat32(i, x2); i += 4;
        this.byteView.setFloat32(i, y2); i += 4;
        this.byteView.setFloat32(i, radius); i += 4;
        this.usedBytes = i;
    }

    _rect(x: number, y: number, w: number, h: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 17);
        this.byteView.setUint8(i, kCmd.Rect); i += 1
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.byteView.setFloat32(i, w); i += 4;
        this.byteView.setFloat32(i, h); i += 4;
        this.usedBytes = i;
    }

    _ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number) {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 29);
        this.byteView.setUint8(i, kCmd.Ellipse); i += 1
        this.byteView.setFloat32(i, x); i += 4;
        this.byteView.setFloat32(i, y); i += 4;
        this.byteView.setFloat32(i, radiusX); i += 4;
        this.byteView.setFloat32(i, radiusY); i += 4;
        this.byteView.setFloat32(i, rotation); i += 4;
        this.byteView.setFloat32(i, startAngle); i += 4;
        this.byteView.setFloat32(i, endAngle); i += 4;
        this.usedBytes = i;
    }


    strokeLine(x0: number, y0: number, x1: number, y1: number) {
        this.beginPath();
        this.moveTo(x0, y0);
        this.lineTo(x1, y1);
        this.stroke();
    }

    strokeCenteredTriangle(x: number, y: number, r: number = 5) {
        this.beginPath();
        // Optimization: Commented code replaced with precomputed values
        // let initAngle = -TAU/4;
        // let angStep = -TAU/3;
        this.moveTo(
            x, //Math.cos(initAngle)*r+x,
            r + y // Math.sin(initAngle)*r+y
        );
        this.lineTo(
            -0.8660254037844388 * r + x, //Math.cos(initAngle + angStep)*r+x,
            -0.5 * r + y //Math.sin(initAngle + angStep)*r+y
        );
        this.lineTo(
            0.8660254037844384 * r + x, // Math.cos(initAngle + angStep*2)*r+x,
            -0.5 * r + y // Math.sin(initAngle + angStep*2)*r+y
        );
        this.lineTo(
            x, //Math.cos(initAngle)*r+x,
            r + y //Math.sin(initAngle)*r+y
        );
        this.stroke();
    }

    fillRect(cornerX: number, cornerY: number, width: number, height: number) {
        this.beginPath();
        this._rect(cornerX, cornerY, width, height);
        this.fill();
    }

    strokeRect(cornerX: number, cornerY: number, width: number, height: number) {
        this.beginPath();
        this._rect(cornerX, cornerY, width, height);
        this.stroke();
    }

    fillCenterRect(centerX: number, centerY: number, width: number, height: number) {
        this.fillRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
    }

    strokeCenterRect(centerX: number, centerY: number, width: number, height: number) {
        this.strokeRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
    }

    strokeRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        this.stroke();
    }

    fillRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        this.fill();
    }

    fillCircle(x: number, y: number, r: number) {
        this.beginPath();
        this._ellipse(x, y, r, r, 0, 0, Math.PI * 2);
        this.fill();
    }

    strokeCircle(x: number, y: number, r: number) {
        this.beginPath();
        this._ellipse(x, y, r, r, 0, 0, Math.PI * 2);
        this.stroke();
    }

    strokeCrosshair(x: number, y: number, r: number = 5) {
        this.beginPath();
        this.moveTo(x - r, y);
        this.lineTo(x + r, y);
        this.moveTo(x, y - r);
        this.lineTo(x, y + r);
        this.stroke();
    }

    clearScreen(): void {
        let i = this.usedBytes;
        this.ensureSpaceFor(i, 1);
        this.byteView.setUint8(i, kCmd.ClearScreen); i += 1
        this.usedBytes = i;
    }

    resetBuffer() {
        this.parameterStash.length = 0;
        this.usedBytes = 0;
    }
}

export class W2D {
    _height: number = 0;

    constructor(readonly buffer: D2D) { }

    setDims(width: number, height: number): void {
        this._height = height;
    }

    translate(x: number, y: number) {
        this.buffer.translate(x, -y);
    }

    fillText(x: number, y: number, str: string) {
        this.buffer.fillText(x, this._height - y, str);
    }

    strokeLine(x0: number, y0: number, x1: number, y1: number) {
        this.buffer.strokeLine(x0, this._height - y0, x1, this._height - y1);
    }

    fillRect(cornerX: number, cornerY: number, width: number, height: number) {
        this.buffer.fillRect(cornerX, this._height - cornerY, width, height);
    }

    strokeRect(cornerX: number, cornerY: number, width: number, height: number) {
        this.buffer.strokeRect(cornerX, this._height - cornerY, width, height);
    }

    fillCenterRect(centerX: number, centerY: number, width: number, height: number) {
        this.buffer.fillCenterRect(centerX, this._height - centerY, width, height);
    }

    strokeCenterRect(centerX: number, centerY: number, width: number, height: number) {
        this.buffer.strokeCenterRect(centerX, this._height - centerY, width, height);
    }

    strokeRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        this.buffer.strokeRoundedRect(x, this._height - y, w, h, r);
    }

    fillRoundedRect(x: number, y: number, w: number, h: number, r: number) {
        this.buffer.fillRoundedRect(x, this._height - y, w, h, r);
    }

    fillCircle(x: number, y: number, r: number) {
        this.buffer.fillCircle(x, this._height - y, r);
    }

    strokeCircle(x: number, y: number, r: number) {
        this.buffer.strokeCircle(x, this._height - y, r);
    }

    strokeCrosshair(x: number, y: number, r: number = 5) {
        this.buffer.strokeCrosshair(x, this._height - y, r);
    }

    clearScreen() {
        this.buffer.clearScreen();
    }

    setFillColor(c: Color.t) {
        this.buffer.setFillColor(c);
    }

    setStrokeColor(c: Color.t) {
        this.buffer.setStrokeColor(c);
    }

    setStrokeThickness(width: number) {
        this.buffer.setStrokeThickness(width);
    }

    setFont(fontStyle: FontStyle.t) {
        this.buffer.setFont(fontStyle);
    }

    beginPath() {
        this.buffer.beginPath();
    }

    closePath() {
        this.buffer.closePath();
    }

    fill() {
        this.buffer.fill();
    }

    stroke() {
        this.buffer.stroke();
    }

    moveTo(x: number, y: number) {
        this.buffer.moveTo(x, this._height - y);
    }
    
    lineTo(x: number, y: number) {
        this.buffer.lineTo(x, this._height - y);
    }
    
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.buffer.arcTo(x1, this._height - y1, x2, this._height - y2, radius);
    }
    
    _rect(x: number, y: number, w: number, h: number) {
        this.buffer._rect(x, this._height - y, w, h);
    }
    
    _ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number) {
        // The rotation is backwards due to the coordinate inversion
        this.buffer._ellipse(x, this._height - y, radiusX, radiusY, TAU - rotation, TAU - startAngle, TAU - endAngle);
    }
    
    strokeCenteredTriangle(x: number, y: number, r: number = 5) {
        this.buffer.strokeCenteredTriangle(x, y, r);
    }

    resetBuffer() {
        this.buffer.resetBuffer();
    }
}