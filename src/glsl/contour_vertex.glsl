#version 300 es
uniform mat4 u_matrix;

in vec2 a_pos;
in float a_grid_cell_size;
in vec2 a_tex_coord;

out highp vec2 v_tex_coord;
out highp float v_grid_cell_size;
out highp float v_map_scale_fac;

void main() {
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    v_tex_coord = a_tex_coord;
    v_grid_cell_size = a_grid_cell_size;

    // Figure out the latitude from the position vector
    highp float lat = 2. * atan(exp(a_pos.y / 6371229.0)) - 3.1414592654 / 2.;
    v_map_scale_fac = cos(lat);
}
