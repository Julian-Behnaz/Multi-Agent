import { V2, M2x3 } from '../../space';
import * as Buffer from '../../drawing';
import type * as FontStyle from '../../fontStyle';
import fragSrc from './shaders/frag.fs';
import vertSrc from './shaders/vert.vs';

enum ShaderType {
    Frag = WebGL2RenderingContext.FRAGMENT_SHADER,
    Vert = WebGL2RenderingContext.VERTEX_SHADER,
}

export class GLRenderer {
    readonly gl: WebGL2RenderingContext
    readonly canvas: HTMLCanvasElement
    public dims: V2.t = V2.create()
    private program: WebGLProgram | null = null;
    private vao: WebGLVertexArrayObject | null = null;

    private indexBuffer: WebGLBuffer | null = null;
    private vertexBuffer: WebGLBuffer | null = null;

    attributes = {
        position: -1,
        color: -1,
        sdf: -1,
    };

    uniforms = {
        projection: null as WebGLUniformLocation | null
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = <WebGL2RenderingContext>canvas.getContext('webgl2');

        const gl = this.gl;
        const vs = GLRenderer.createShader(gl, ShaderType.Vert, vertSrc);
        const fs = GLRenderer.createShader(gl, ShaderType.Frag, fragSrc);
        const program = GLRenderer.tryCreateProgram(gl, vs, fs);

        if (program) {
            this.attributes.position = gl.getAttribLocation(program, "a_position");
            this.attributes.color = gl.getAttribLocation(program, "a_color");
            this.attributes.sdf = gl.getAttribLocation(program, "a_sdf");

            this.uniforms.projection = gl.getUniformLocation(program, "u_projection");
            
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            gl.enableVertexAttribArray(this.attributes.position);
            gl.enableVertexAttribArray(this.attributes.color);
            gl.enableVertexAttribArray(this.attributes.sdf);

            const attribStride = Buffer.VERTEX_SIZE_BYTES;
            { // Position
                // Tell the attribute how to get data out of ARRAY_BUFFER
                const size = 2;          // 2 components per iteration
                const type = gl.FLOAT;   // the data is 32bit floats
                const normalize = false; // don't normalize the data
                const offset = 0;        // start at the beginning of the buffer
                gl.vertexAttribPointer(
                    this.attributes.position, size, type, normalize, attribStride, offset);
            }
            { // Color
                // Tell the attribute how to get data out of ARRAY_BUFFER
                const size = 4; // components per iteration
                const type = gl.UNSIGNED_BYTE;
                const normalize = true;     
                const offset = 4+4; // Skip x,y
                gl.vertexAttribPointer(
                    this.attributes.color, size, type, normalize, attribStride, offset);
            }
            { // SDF
                // Tell the attribute how to get data out of ARRAY_BUFFER
                const size = 2; // components per iteration
                const type = gl.FLOAT;
                const normalize = false;     
                const offset = 4+4+4; // Skip x,y, color
                gl.vertexAttribPointer(
                    this.attributes.sdf, size, type, normalize, attribStride, offset);
            }
            this.program = program;
            this.vao = vao;
        }
    }

    autoresize() {
        const gl = this.gl;
        const canvas = this.canvas;
        const ratio = window.devicePixelRatio
        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth * ratio;
                canvas.height = canvas.clientHeight * ratio;
            // ctx.setTransform(ratio,0,0,ratio,0,0);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const dims = this.dims;
        dims[0] = width;
        dims[1] = height;   
    }

    static createShader(gl: WebGL2RenderingContext, type: ShaderType, source: string): WebGLShader | null {
        const shader = gl.createShader(type);
        if (!shader) {
            return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
          return shader;
        }
       
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    static tryCreateProgram(
            gl: WebGL2RenderingContext, 
            vertexShader: WebGLShader | null, 
            fragmentShader: WebGLShader | null): WebGLProgram | null {
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        const program = gl.createProgram();
        if (!program) {
            return null;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          return program;
        }
       
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

    private _allocatedVBufferBytes: number = 0;
    private _allocatedIBufferBytes: number = 0;
    private _projectionMatrix = new Float32Array(6);
    render(buffer: Buffer.D2DGPU): void {
        const gl = this.gl;
        
        gl.useProgram(this.program);
        /* 
        | Sx 0 tx
        | 0 Sy ty
        |      1
        */
       const projection = this._projectionMatrix;
       projection[0] = 1/this.dims[0]*2; // Sx
       projection[3] = -1/this.dims[1]*2; // Sy
       projection[4] = -1; // tx
       projection[5] = 1; // ty
        gl.uniformMatrix3x2fv(this.uniforms.projection, false, projection);

        // Clear transparent
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        if (this._allocatedVBufferBytes < buffer.vUsedBytes) {
            gl.bufferData(gl.ARRAY_BUFFER, buffer.vBufView, gl.DYNAMIC_DRAW, 0, /* bytes */buffer.vUsedBytes);
            this._allocatedVBufferBytes = buffer.vUsedBytes;
        } else {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer.vBufView, 0, /* bytes */buffer.vUsedBytes);
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        if (this._allocatedIBufferBytes < buffer.iUsed*4) {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer.iBuf, gl.DYNAMIC_DRAW, 0, /* bytes */buffer.iUsed*4);
            this._allocatedIBufferBytes = buffer.iUsed*4;
        } else {
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, buffer.iBuf, 0, /* bytes */buffer.iUsed*4);
        }

        gl.bindVertexArray(this.vao);

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = buffer.iUsed;
        var indexType = gl.UNSIGNED_INT;
        gl.drawElements(primitiveType, count, indexType, offset);
    }
}