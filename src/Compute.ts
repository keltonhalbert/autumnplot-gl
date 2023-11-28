import {WGLBuffer, WGLProgram, WGLTexture} from 'autumn-wgl';

import {TypedArray, WebGLAnyRenderingContext} from './AutumnTypes';
import {ComputeComponent} from './ComputeComponent';
import {MapType} from './Map';
import {getGLFormatTypeAlignment} from './PlotComponent';
import {RawScalarField} from './RawField';
import {Cache, hex2rgba} from './utils';

const compute_vertex_shader_src = require('./glsl/compute_demo_vertex.glsl');
const compute_fragment_shader_src =
    require('./glsl/compute_demo_fragment.glsl');

interface ComputeGLElems {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  tf: WebGLTransformFeedback;

  sumBuffer: WebGLBuffer;
  differenceBuffer: WebGLBuffer;
  productBuffer: WebGLBuffer; 
}

const compileAndLinkShaders = (gl: WebGL2RenderingContext, vertex_shader_src: string, frag_shader_src: string): WebGLProgram => {
    // create a vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (vertexShader === null) {
        throw "Could not create vertex shader";
    }

    gl.shaderSource(vertexShader, vertex_shader_src);
    gl.compileShader(vertexShader);

    const vertexCompiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);

    if (!vertexCompiled) {
        const compilationLog = gl.getShaderInfoLog(vertexShader);
        console.log('Vertex shader compiler log: ' + compilationLog);
    }
    
    // create a fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragmentShader === null) {
        throw "Could not create fragment shader";
    }

    gl.shaderSource(fragmentShader, frag_shader_src);
    gl.compileShader(fragmentShader);

    const fragmentCompiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);

    if (!fragmentCompiled) {
        const compilationLog = gl.getShaderInfoLog(fragmentShader);
        console.log('Fragment shader compiler log: ' + compilationLog);
    }

    // link the two shaders into a WebGL program
    const program = gl.createProgram();
    if (program === null) {
        throw "Could not create shader program";
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // set up the transform feedback
	// To-Do: the compileAndLinkShaders function was lifted from the 
	// autumn-wgl library, and it would be good for compute shader
	// functionality to be added there. Ideally, this would be done
	// in a WGLCompute class.
    gl.transformFeedbackVaryings(
        program,
        [ 'sum', 'difference', 'product' ],
        gl.SEPARATE_ATTRIBS,
    );

    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!linked) {
        const linkLog = gl.getProgramInfoLog(program);
        console.log('Linker log: ' + linkLog);
    }

    return program;
}


function makeBuffer(gl: WebGL2RenderingContext, data: any) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buf;
}

function makeBufferAndSetAttribute(gl: WebGL2RenderingContext, data: TypedArray, gl_type: GLenum, loc: number) {
  const buf = makeBuffer(gl, data);
  // setup our attributes to tell WebGL how to pull
  // the data from the buffer above to the attribute
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(
      loc,
      1,         // size (num components)
      gl_type,  // type of data in buffer
      false,     // normalize
      0,         // stride (0 = auto)
      0,         // offset
  );

  return buf;
}


class Compute<ArrayType extends TypedArray> extends ComputeComponent {
    public a: Float32Array;
    public b: Float32Array;
    public readonly type: 'custom';
    public readonly id: string;
    private gl_elems: ComputeGLElems | null;


  constructor(id: string) {
    super();
    this.type = 'custom';
    this.id = id;

    this.a = new Float32Array([1, 2, 3, 4, 5, 6]);
    this.b = new Float32Array([3, 6, 9, 12, 15, 18]);

    this.gl_elems = null;

  }


  public setup(gl: WebGL2RenderingContext) {

    const {format, type, row_alignment} = getGLFormatTypeAlignment(gl, false);

    const program = compileAndLinkShaders(gl, compute_vertex_shader_src, compute_fragment_shader_src);

    // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const aLoc = gl.getAttribLocation(program, 'a');
    const bLoc = gl.getAttribLocation(program, 'b');
    const aBuffer = makeBufferAndSetAttribute(gl, this.a, gl.FLOAT, aLoc);
    const bBuffer = makeBufferAndSetAttribute(gl, this.b, gl.FLOAT, bLoc);
    // make buffers for output
    const sumBuffer = makeBuffer(gl, <GLint>(this.a.length * 4));
    const differenceBuffer = makeBuffer(gl, <GLint>(this.a.length * 4));
    const productBuffer = makeBuffer(gl, <GLint>(this.a.length * 4));

    // Create and fill out a transform feedback
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
     
     
    // bind the buffers to the transform feedback
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);
     
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
     
    // buffer's we are writing to can not be bound else where
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // productBuffer was still bound to ARRAY_BUFFER so unbind it

    this.gl_elems = {
        program: program, vao: vao, tf: tf, sumBuffer: sumBuffer, productBuffer: productBuffer, differenceBuffer: differenceBuffer
    };
  }

  public printResults(gl: WebGL2RenderingContext, buffer: WebGLBuffer, label: string) {
    const results = new Float32Array(this.a.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(
        gl.ARRAY_BUFFER,
        0,    // byte offset into GPU buffer,
        results,
    );
    // print the results
    console.log(`${label}: ${results}`);
  }

  public compute(gl: WebGL2RenderingContext) {
    if (this.gl_elems === null) return;

    gl.useProgram(this.gl_elems.program);
     
    // bind our input attribute state for the a and b buffers
    gl.bindVertexArray(this.gl_elems.vao);
     
    // no need to call the fragment shader
    //gl.enable(gl.RASTERIZER_DISCARD);
     
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.gl_elems.tf);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.a.length);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
     
    // turn on using fragment shaders again
    //gl.disable(gl.RASTERIZER_DISCARD);

    console.log(`a: ${this.a}`);
    console.log(`b: ${this.b}`);
     
    this.printResults(gl, this.gl_elems.sumBuffer, 'sums');
    this.printResults(gl, this.gl_elems.differenceBuffer, 'differences');
    this.printResults(gl, this.gl_elems.productBuffer, 'products');
  }
}

export default Compute;
// export type {ComputeOptions};
