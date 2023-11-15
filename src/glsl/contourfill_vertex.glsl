#version 300 es
uniform mat4 u_matrix;

in vec2 a_pos;
in vec2 a_tex_coord;

out highp vec2 v_tex_coord;

void main() {
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    v_tex_coord = a_tex_coord;
}
