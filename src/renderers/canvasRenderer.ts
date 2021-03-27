import { V2 } from '../space';
import { kCmd } from '../drawing';
import type * as Buffer from '../drawing';
import type * as FontStyle from '../fontStyle';

export class CanvasRenderer {
    readonly ctx: CanvasRenderingContext2D
    readonly canvas: HTMLCanvasElement
    public dims: V2.t = V2.create()

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    }

    autoresize() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const ratio = window.devicePixelRatio
        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth * ratio;
                canvas.height = canvas.clientHeight * ratio;
            ctx.setTransform(ratio,0,0,ratio,0,0);
        }
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const dims = this.dims;
        dims[0] = width;
        dims[1] = height;   
    }

    render(buffer: Buffer.D2D): void {
        const ctx = this.ctx;

        const len = buffer.usedBytes;
        const byteView = buffer.byteView;
        const parameterStash = buffer.parameterStash;
        let i = 0;
        while (i < len) {
            const type: kCmd = byteView.getUint8(i); i++;
            switch (type) {
                case kCmd.Translate: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    ctx.translate(x, y);
                } break;
                case kCmd.SetFillColor: {
                    const c = byteView.getUint32(i); i += 4;
                    ctx.fillStyle = `#${(c >>> 0).toString(16).padStart(8, '0')}`;
                } break;
                case kCmd.SetStrokeColor: {
                    const c = byteView.getUint32(i); i += 4;
                    ctx.strokeStyle = `#${(c >>> 0).toString(16).padStart(8, '0')}`;
                } break;
                case kCmd.SetStrokeThickness: {
                    ctx.lineWidth = byteView.getFloat32(i); i += 4;
                } break;
                case kCmd.SetFont: {
                    const familyHandle = byteView.getUint32(i); i += 4;
                    const style = parameterStash[familyHandle] as FontStyle.t;
                    ctx.font = style._canvasRep;
                    ctx.textAlign = style._canvasAlign;
                    ctx.textBaseline = style._canvasBaseline;
                } break;
                case kCmd.FillText: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    const strHandle = byteView.getUint32(i); i += 4;
                    const str = parameterStash[strHandle] as string;
                    ctx.fillText(str, x, y);
                } break;
                case kCmd.MoveTo: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    ctx.moveTo(x, y);
                } break;
                case kCmd.LineTo: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    ctx.lineTo(x, y);
                } break;
                case kCmd.Rect: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    const w = byteView.getFloat32(i); i += 4;
                    const h = byteView.getFloat32(i); i += 4;
                    ctx.rect(x, y, w, h);
                } break;
                case kCmd.ArcTo: {
                    const x1 = byteView.getFloat32(i); i += 4;
                    const y1 = byteView.getFloat32(i); i += 4;
                    const x2 = byteView.getFloat32(i); i += 4;
                    const y2 = byteView.getFloat32(i); i += 4;
                    const radius = byteView.getFloat32(i); i += 4;
                    ctx.arcTo(x1, y1, x2, y2, radius);
                } break;
                case kCmd.BeginPath: {
                    ctx.beginPath();
                } break;
                case kCmd.ClosePath: {
                    ctx.closePath();
                } break;
                case kCmd.Fill: {
                    ctx.fill();
                } break;
                case kCmd.Stroke: {
                    ctx.stroke();
                } break;
                case kCmd.Ellipse: {
                    const x = byteView.getFloat32(i); i += 4;
                    const y = byteView.getFloat32(i); i += 4;
                    const radiusX = byteView.getFloat32(i); i += 4;
                    const radiusY = byteView.getFloat32(i); i += 4;
                    const rotation = byteView.getFloat32(i); i += 4;
                    const startAngle = byteView.getFloat32(i); i += 4;
                    const endAngle = byteView.getFloat32(i); i += 4;
                    ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
                } break;
                case kCmd.ClearScreen: {
                    ctx.clearRect(0,0,ctx.canvas.clientWidth, ctx.canvas.clientHeight);
                } break;
            }
        }
    }
}