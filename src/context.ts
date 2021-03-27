import { D2D, D2DGPU, W2D } from './drawing';
import { CanvasRenderer } from './renderers/canvasRenderer';
import { GLRenderer } from './renderers/gl/glRenderer';
import type { Color } from './space';
import { UI } from './ui';

export class Context {
    readonly rendererCanvas: CanvasRenderer
    readonly rendererGL: GLRenderer
    readonly D2DGPU: D2DGPU
    readonly D2D: D2D
    readonly W2D: W2D
    readonly UI: UI
    public dt: number = 0

    constructor() {
        const canvasGL = document.createElement('canvas');
        canvasGL.className = 'gl';
        const canvasCanvas = document.createElement('canvas');
        canvasCanvas.className = '2d';
        document.body.append(canvasGL);
        document.body.append(canvasCanvas);

        this.rendererGL = new GLRenderer(canvasGL);
        this.rendererCanvas = new CanvasRenderer(canvasCanvas);
        this.D2D = new D2D();
        this.W2D = new W2D(this.D2D);
        this.UI = new UI(this.D2D);

        this.D2DGPU = new D2DGPU(/* dbg */this.D2D);
    }

    readonly COLORS = {
        bg: 0x121212FF as Color.t,
        primary: 0xBB86FCFF as Color.t,
        primaryAlt: 0x3700B3FF as Color.t,
        secondary: 0x03DAC6FF as Color.t,
        onPrimary: 0x000000FF as Color.t,
        onSecondary: 0x000000FF as Color.t,
        onBg: 0xFFFFFFFF as Color.t,
        creature: 0xb598a3FF as Color.t
    }

    onFrameStart(dt: number) {
        this.dt = dt;
        this.D2D.resetBuffer();
        this.rendererCanvas.autoresize();
        this.rendererGL.autoresize();
        const dims = this.rendererGL.dims;
        this.W2D.setDims(dims[0], dims[1]);
        this.UI.onFrameStart();
    }

    onFrameEnd() {
        this.UI.onFrameEnd();
    }

    render() {
        this.rendererCanvas.render(this.D2D);
        this.rendererGL.render(this.D2DGPU);
    }
}

