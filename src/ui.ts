import type { D2D } from './drawing';
import * as FontStyle from './fontStyle';
import { V2, M2x3, clamp01, lerp, Color } from './space';

export enum HandleType {
    Crosshair,
    Box,
    Triangle
}

interface State {
    hovered: unknown
    nextHovered: unknown
    hot: unknown
    mousePos: V2.t
    mouseDown: boolean
    lastMouseDown: boolean
}

export class UI {
    state: State = {
        hovered: null,
        nextHovered: null,
        hot: null,
        mousePos: V2.create(),
        mouseDown: false,
        lastMouseDown: false,
    }

    didMouseGoDown(): boolean {
        return this.state.mouseDown && !this.state.lastMouseDown;
    }

    didMouseGoUp(): boolean {
        return !this.state.mouseDown && this.state.lastMouseDown;
    }

    getMousePos(): V2.t {
        return this.state.mousePos;
    }

    getMousePosLocal(worldToLocal: M2x3.t): V2.t {
        return M2x3.transformPoint(worldToLocal, this.state.mousePos);
    }

    isMouseInRect(x:number, y:number, width:number, height:number): boolean {
        return V2.inRect(this.state.mousePos, x, y, width, height);
    }

    isMouseInRectLocal(worldToLocal: M2x3.t, x:number, y:number, width:number, height:number): boolean {
        const localMouse = this.getMousePosLocal(worldToLocal);
        return V2.inRect(localMouse, x, y, width, height);
    }

    isHovered(wid: unknown): boolean {
        return this.state.hovered === wid;
    }

    isHot(wid: unknown): boolean {
        return this.state.hot === wid;
    }

    isNothingHot(): boolean {
        return this.state.hot === null;
    }

    setNextHovered(wid: unknown): void {
        this.state.nextHovered = wid;
    }

    setHot(wid: unknown): void {
        this.state.hot = wid;
    }

    COLORS = {
        outline: 0xFFFFFFFF as Color.t,
        disabled: 0x666666FF as Color.t,
        interactive: 0xBB86FCFF as Color.t,
        hot: 0x03DAC6FF as Color.t,
    }

    FONTS = {
        label: FontStyle.create(
            15,
            'Arial',
            FontStyle.kTextAlign.Right,
            FontStyle.kTextBaseline.Middle
        ),
        readout: FontStyle.create(
            12,
            'Arial',
            FontStyle.kTextAlign.Left,
            FontStyle.kTextBaseline.Middle,
        )
    }

    LAYOUT = {
        radius: 3,
        rowContentHeight: 15,
        rowHeight: 20,
    }

    constructor (private D2D: D2D) {
        const uiState = this.state;
        document.addEventListener('mousemove', (e) => {
            uiState.mousePos[0] = e.clientX;
            uiState.mousePos[1] = e.clientY;
        })
        
        document.addEventListener('mousedown', (e) => {
            uiState.mouseDown = true;
        })
        
        document.addEventListener('mouseup', (e) => {
            uiState.mouseDown = false;
        })
    }

    _sliderData = {
        startX: 0,
        initV: 0
    }
    slider01Bare(wid: unknown, px: number, py: number, val: number, width = 100, height = 15) {
        const uiState = this.state;
        const D2D = this.D2D;
        const COLORS = this.COLORS;
        const LAYOUT = this.LAYOUT;
    
        const isHovered = uiState.hovered === wid;
        const isHot = uiState.hot === wid;
        let res = val;

        D2D.setFillColor(COLORS.interactive);
        if (isHovered || isHot) {
            D2D.setStrokeColor(COLORS.hot);
            // D2D.setFillColor(COLORS.hot);
        } else {
            D2D.setStrokeColor(COLORS.outline);
        }

        const handleWidth = 5;
        D2D.fillRoundedRect(px + val*(width-handleWidth), py, handleWidth, height, LAYOUT.radius);
        D2D.strokeRoundedRect(px, py, width, height, LAYOUT.radius);

        if (isHovered && uiState.mouseDown && !uiState.lastMouseDown) {
            uiState.hot = wid;
            this._sliderData.startX = uiState.mousePos[0] - px;
            this._sliderData.initV = val;
        }
        if (isHot && !uiState.mouseDown) {
            uiState.hot = null;
        }
    
        if (isHot) {
            res = (this._sliderData.initV * width + uiState.mousePos[0] - px - this._sliderData.startX)/width;
        }
    
        if (!uiState.hot && V2.inRect(uiState.mousePos, px, py, width, height)) {
            uiState.nextHovered = wid;
        }
    
        return clamp01(res);
    }

    slider (label: string, px: number, py: number, min: number, max: number, val: number): number {
        const D2D = this.D2D;
        const FONTS = this.FONTS;
        const LAYOUT = this.LAYOUT;
        const width = 100, height = LAYOUT.rowContentHeight;
        const res = lerp(min, max, this.slider01Bare(label, px, py, (val-min)/(max-min), width, height));

        D2D.setFont(FONTS.readout);
        D2D.fillText(px + width + 5, py+height/2, val.toFixed(2));
        D2D.setFont(FONTS.label);
        D2D.fillText(px - 5, py+height/2, label);
        return res;
    }

    slider01 (label: string, px: number, py: number, val: number): number {
        const D2D = this.D2D;
        const FONTS = this.FONTS;
        const LAYOUT = this.LAYOUT;
        const width = 100, height = LAYOUT.rowContentHeight;

        const res = this.slider01Bare(label, px, py, val, width, height);
        D2D.setFont(FONTS.readout);
        D2D.fillText(px + width + 5, py+height/2, val.toFixed(2));
        D2D.setFont(FONTS.label);
        D2D.fillText(px - 5, py+height/2, label);
        return res;
    }

    checkboxBare(wid: unknown, px: number, py: number, val: boolean, size: number): boolean {
        const uiState = this.state;
        const D2D = this.D2D;
        const COLORS = this.COLORS;
        const LAYOUT = this.LAYOUT;
    
        const isHovered = uiState.hovered === wid;
        const isHot = uiState.hot === wid;
        let res = val;
    
        D2D.setStrokeColor(COLORS.outline);
        D2D.setFillColor(COLORS.interactive);
        if (isHovered || isHot) {
            D2D.setStrokeColor(COLORS.hot);
        }

        if (val) {
            D2D.fillCenterRect(px + size * 0.5, py + size * 0.5, size * 0.50, size * 0.50);
        }
        D2D.strokeRoundedRect(px, py, size, size, LAYOUT.radius);

        if (isHovered && uiState.mouseDown && !uiState.lastMouseDown) {
            res = !res;
        }
    
        if (!uiState.hot && V2.inRect(uiState.mousePos, px, py, size, size)) {
            uiState.nextHovered = wid;
        }
    
        return res;
    }

    label(label: string, px: number, py: number) {
        const D2D = this.D2D;
        const FONTS = this.FONTS;
        const COLORS = this.COLORS;

        D2D.setFillColor(COLORS.outline);
        D2D.setFont(FONTS.label);
        D2D.fillText(px, py, label);
    }

    checkbox(label: string, px: number, py: number, val: boolean): boolean {
        const D2D = this.D2D;
        const FONTS = this.FONTS;
        const LAYOUT = this.LAYOUT;
        const height = LAYOUT.rowContentHeight;

        D2D.setFont(FONTS.label);
        const res = this.checkboxBare(label, px, py, val, height);
        D2D.fillText(px - 5, py+height/2, label);
        return res;
    }

    cycleButton(label: string, px: number, py: number, cycleLookup: Record<number, string>, idx: number, len: number): number {
        const uiState = this.state;
        const D2D = this.D2D;
        const FONTS = this.FONTS;
        const COLORS = this.COLORS;
        const LAYOUT = this.LAYOUT;

        const wid = label;
    
        const readoutFont = FONTS.readout;
        const labelFont = FONTS.label;    
        const readout = `${cycleLookup[idx]}`;

        D2D.setFont(readoutFont);
        const width = D2D.measureTextWidth(readout) + 10;

        const height = LAYOUT.rowContentHeight;
    
        const isHovered = uiState.hovered === wid;
        let res = idx;
    
        if (isHovered) {
            D2D.setStrokeColor(COLORS.hot);
        } else {
            D2D.setStrokeColor(COLORS.outline);
        }
        if (isHovered && uiState.mouseDown && !uiState.lastMouseDown) {
            res = (idx + 1)%len;
        }
    
        if (V2.inRect(uiState.mousePos, px, py, width, height)) {
            uiState.nextHovered = wid;
        }
    
        D2D.setFillColor(COLORS.interactive);
        D2D.strokeRoundedRect(px, py, width, height, this.LAYOUT.radius);
        D2D.fillText(px+5, py+height/2+1, readout);

        D2D.setFont(labelFont);
        D2D.fillText(px - 5, py+height/2, label);
    
        return res;
    }

    animCurveLinear(label: string, px: number, py: number, pts: V2.t[], {width = 300, height = 150, frac, evalFrac}: AnimCurveProps = {}): void {
        const uiState = this.state;
        const D2D = this.D2D;
        const COLORS = this.COLORS;
        const LAYOUT = this.LAYOUT;
        const FONTS = this.FONTS;

        const wid = label;

        D2D.setStrokeColor(COLORS.outline);
        D2D.strokeRoundedRect(px,py,width, height, LAYOUT.radius);

        if (pts.length) {
            const handleSide = 10;
            for (let i = 0; i < pts.length-1; i++) {
                D2D.strokeLine(pts[i][0]*width+px, height - pts[i][1]*height+py, pts[i+1][0]*width+px, height - pts[i+1][1]*height+py)
            }
                
            for (let i = 0; i < pts.length; i++) {
                const handleWid = `${wid}-${i}`
                const isHovered = uiState.hovered === handleWid;
                const isHot = uiState.hot === handleWid;
    
                const handleX = pts[i][0]*width+px - handleSide/2;
                const handleY = height - pts[i][1]*height+py - handleSide/2;
                if (isHovered || isHot) {
                    D2D.setStrokeColor(COLORS.hot);
                    D2D.strokeRoundedRect(handleX, handleY, handleSide, handleSide, LAYOUT.radius);

                    const readoutFont = FONTS.readout;
                    D2D.setFont(readoutFont);
                    D2D.fillText(handleX, handleY+20, `${pts[i][0].toFixed(2)}, ${pts[i][1].toFixed(2)}`);
                } else {
                    D2D.setStrokeColor(COLORS.interactive);
                    D2D.strokeRoundedRect(handleX, handleY, handleSide, handleSide, LAYOUT.radius);
                }
                if (isHovered && uiState.mouseDown && !uiState.lastMouseDown) {
                    uiState.hot = handleWid;
                }
                if (isHot && !uiState.mouseDown) {
                    uiState.hot = null;
                }
                if (isHot) {
                    if (i > 0 && i < pts.length - 1) {
                        pts[i][0] = (uiState.mousePos[0] - px)/width;
                    }
                    pts[i][1] = (height - (uiState.mousePos[1] - py))/height;
                }
    
                const interactionRad = 10;
                if (V2.inRect(uiState.mousePos, handleX-interactionRad/2, handleY-interactionRad/2, handleSide+interactionRad, handleSide+interactionRad)) {
                    uiState.nextHovered = handleWid;
                }
            }
        }

        D2D.setStrokeColor(COLORS.disabled);
        if (frac !== undefined) {
            D2D.strokeLine(px + width * frac, py, px + width * frac, py+height);
        }
        if (evalFrac !== undefined) {
            D2D.strokeLine(px, py + height - height * evalFrac, px + width, py + height - height * evalFrac);
        }

        D2D.setFont(FONTS.label);
        D2D.fillText(px - 5, py+LAYOUT.rowContentHeight/2, label);
    }    
    
    movableHandle(
        wid: unknown,
        type: HandleType,
        oh: number,
        pt: V2.t, out: V2.t) {
        const D2D = this.D2D;
        const isHovered = this.isHovered(wid);
        const isHot = this.isHot(wid);
        const handleRad = 5;
        if (isHovered || isHot) {
            D2D.setStrokeColor(this.COLORS.hot);
            D2D.setFillColor(this.COLORS.outline);
            D2D.setFont(this.FONTS.readout);
            D2D.fillText(
                pt[0] - handleRad,
                (oh - pt[1]) - handleRad * 2,
                `${pt[0].toFixed(2)}, ${pt[1].toFixed(2)}`);
        } else {
            D2D.setStrokeColor(this.COLORS.interactive);
        }
        switch (type) {
            case HandleType.Box: {
                D2D.strokeRoundedRect(
                    pt[0] - handleRad,
                    (oh - pt[1]) - handleRad,
                    handleRad * 2,
                    handleRad * 2,
                    this.LAYOUT.radius);
            } break;
            case HandleType.Crosshair: {
                D2D.strokeCrosshair(pt[0], oh - pt[1], handleRad);
            }
            case HandleType.Triangle: {
                D2D.strokeCenteredTriangle(pt[0], oh - pt[1], handleRad);
            }
        }
        this._handleMoveableHandleMove(wid, D2D.worldToLocal, oh, pt, /* out */out);
    }
    
    static _ixnOffset = V2.create();
    private _handleMoveableHandleMove(
        wid: unknown,
        worldToLocal: M2x3.t,
        oh: number, pt: V2.t, out: V2.t) {
        const _ixnOffset = UI._ixnOffset;

        const ixnRad = 8;
        const isHovered = this.isHovered(wid);
        const isHot = this.isHot(wid);
        if (this.isNothingHot() && this.isMouseInRectLocal(
            worldToLocal,
            pt[0] - ixnRad,
            (oh - pt[1]) - ixnRad,
            ixnRad * 2,
            ixnRad * 2)) {
            this.setNextHovered(wid);
        }
    
        if (isHovered && this.didMouseGoDown()) {
            const mousePos = this.getMousePosLocal(worldToLocal);
            _ixnOffset[0] = pt[0] - mousePos[0];
            _ixnOffset[1] = (oh - pt[1]) - mousePos[1];
            this.setHot(wid);
        }
    
        if (isHot) {
            if (this.didMouseGoUp()) {
                this.setHot(null);
            } else {
                const mousePos = this.getMousePosLocal(worldToLocal);
                out[0] = mousePos[0] + _ixnOffset[0];
                out[1] = oh - (mousePos[1] + _ixnOffset[1]);
            }
        }
    }

    onFrameStart() {
        const uiState = this.state;
        uiState.hovered = uiState.nextHovered;
        uiState.nextHovered = null;
    }

    onFrameEnd() {
        const uiState = this.state;
        uiState.lastMouseDown = uiState.mouseDown;
    }
}

interface AnimCurveProps {
    width?: number
    height?: number
    frac?: number
    evalFrac?: number
}