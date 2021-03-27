import * as _drawing from './drawing';
import type { V2, cubicInterp, lerp, catmullInterp, Color, TAU } from './space';
import * as _ui from './ui';

import { Context } from './context';

const CTX = new Context();

let lastElapsed = 0;
function renderLoop(elapsed: number) {
    CTX.onFrameStart((elapsed - lastElapsed) * 0.001);
    const dims = CTX.rendererGL.dims;
    const dt = CTX.dt;

    lastElapsed = elapsed;

    CTX.D2D.clearScreen();
    
    CTX.D2DGPU.setStrokeColor(0xFFFFFFFF as Color.t);
    CTX.D2D.setStrokeColor(0xFFFFFFFF as Color.t);
    {
        const alpha = elapsed * 0.001;
        const scale = 100;
        const x = Math.cos(alpha) * scale;
        const y = Math.sin(alpha) * scale;
        CTX.D2DGPU.setStrokeThickness(1.3);
        CTX.D2DGPU.strokeLine(400, 400, 400 + x, 400 + y);

        CTX.D2D.setStrokeThickness(1);
        CTX.D2D.strokeLine(400 + x, 400 + y, 400 + x*2.0, 400 + y*2.0);
    }

    CTX.render();
    CTX.onFrameEnd();

    CTX.D2DGPU.resetBuffer();

    window.requestAnimationFrame(renderLoop);
}
window.requestAnimationFrame(renderLoop);