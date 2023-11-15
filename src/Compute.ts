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
const program_cache =
    new Cache((gl: WebGLAnyRenderingContext) => new WGLProgram(
                  gl, compute_vertex_shader_src, compute_fragment_shader_src));

interface ComputeGLElems {
  program: WGLProgram;
  vertices: WGLBuffer;
  input_texture: WGLTexture;
  texcords: WGLBuffer;
}

class Compute<ArrayType extends TypedArray> extends ComputeComponent {

  private readonly field: RawScalarField<ArrayType>;
  private gl_elems: ComputeGLElems|null;

  constructor(field: RawScalarField<ArrayType>) {
    super();
    this.field = field;
    this.gl_elems = null;
  }

  public setup(map: MapType, gl: WebGLAnyRenderingContext) {
    const program = program_cache.getValue(gl);
    const {vertices : verts_buf, texcoords : tex_coords_buf} =
        await this.field.grid.getWGLBuffers(gl);
    const vertices = verts_buf;
    const texcoords = tex_coords_buf;

    const {format, type, row_alighment} =
        getGLFormatTypeAlignment(gl, this.field.isFloat16());

    const fill_image = {
      'format' : format,
      'type' : type,
      'width' : this.field.grid.ni,
      'height' : this.field.grid.nj,
      'image' : this.field.getTextureData(),
      'mag_filter' : gl.LINEAR,
      'row_alignment' : row_alignment,
    };

    const fill_texture = new WGLTexture(gl, fill_image);
    this.gl_elems = {
      map : map,
      program : program,
      vertices : vertices,
      texcoords : texcoords,
      fill_texture : fill_texture
    };
  }

  public compute(gl: WebGLAnyRenderingContext) {
    if (this.gl_elems === null)
      return;
    const gl_elems = this.gl_elems;

    let uniforms = {'u_matrix' : matrix};

    gl_elems.program.use({
      'a_pos' : gl_elems.vertices,
      'a_grid_cell_size' : gl_elems.grid_cell_size,
      'a_tex_coord' : gl_elems.texcoords
    },
                         uniforms, {'srcTex' : gl_elems.fill_texture});

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
                         gl.ONE_MINUS_SRC_ALPHA);

    gl_elems.program.draw();
  }
}

export default Compute;
// export type {ComputeOptions};
