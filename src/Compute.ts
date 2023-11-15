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
  program: WGLProgram;
  vertices: WGLBuffer;
  input_texture: WGLTexture;
  texcords: WGLBuffer;
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


function makeBuffer(gl: WebGL2RenderingContext, data: TypedArray) {
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
}


class Compute<ArrayType extends TypedArray> extends ComputeComponent {

  private readonly field: RawScalarField<ArrayType>;
  private gl_elems: ComputeGLElems|null;

  constructor(field: RawScalarField<ArrayType>) {
    super();
    this.field = field;
    this.gl_elems = null;
  }


  public async setup(map: MapType, gl: WebGL2RenderingContext) {

    const program = compileAndLinkShaders(gl, compute_vertex_shader_src, compute_fragment_shader_src);
	const {format, type, row_alignment} = getGLFormatTypeAlignment(gl, this.field.isFloat16());

	// put data in buffers
	//const aBuffer = makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
	//const bBuffer = makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);
  }

  public compute(gl: WebGL2RenderingContext) {
    if (this.gl_elems === null)
      return;
    const gl_elems = this.gl_elems;
  }
}

export default Compute;
// export type {ComputeOptions};
