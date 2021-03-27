export enum kTextAlign {
    Center,
    End,
    Left,
    Right,
    Start,
}

export enum kTextBaseline {
    Alphabetic,
    Bottom,
    Hanging,
    Ideographic,
    Middle,
    Top,
}

export interface t {
    readonly size: number,
    readonly family: string,
    readonly align: kTextAlign,
    readonly baseline: kTextBaseline
    readonly _canvasRep: string
    readonly _canvasAlign: CanvasTextAlign
    readonly _canvasBaseline: CanvasTextBaseline
}

export function create(size: number, family: string, align: kTextAlign, baseline: kTextBaseline): t {
    let _canvasAlign: CanvasTextAlign;
    switch (align) {
        case kTextAlign.Center:
            _canvasAlign = 'center';
            break;
        case kTextAlign.End:
            _canvasAlign = 'end';
            break;
        case kTextAlign.Left:
            _canvasAlign = 'left';
            break;
        case kTextAlign.Right:
            _canvasAlign = 'right';
            break;
        case kTextAlign.Start:
            _canvasAlign = 'start';
            break;
    }
    let _canvasBaseline: CanvasTextBaseline;
    switch (baseline) {
        case kTextBaseline.Alphabetic:
            _canvasBaseline = 'alphabetic';
            break;
        case kTextBaseline.Bottom:
            _canvasBaseline = 'bottom';
            break;
        case kTextBaseline.Hanging:
            _canvasBaseline = 'hanging';
            break;
        case kTextBaseline.Ideographic:
            _canvasBaseline = 'ideographic';
            break;
        case kTextBaseline.Middle:
            _canvasBaseline = 'middle';
            break;
        case kTextBaseline.Top:
            _canvasBaseline = 'top';
            break;
    }
    return {
        _canvasRep: `${size}px ${family}`,
        _canvasBaseline,
        _canvasAlign,
        align,
        baseline,
        family,
        size
    };
}