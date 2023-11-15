#version 300 es

#define MAX_N_CONTOURS 64

in highp vec2 v_tex_coord;
in highp float v_grid_cell_size;
in highp float v_map_scale_fac;

uniform sampler2D u_fill_sampler;

uniform lowp float u_contour_levels[MAX_N_CONTOURS];
uniform int u_num_contours;
//uniform highp vec2 u_step_size;
uniform lowp float u_zoom_fac;

precision highp float;
out highp vec4 fragColor;

void main() {

	int contour_found = 0;
	lowp float base_width = 0.25*(log(u_zoom_fac) + 1.0);
	lowp float line_width = 1.5 * base_width;
	lowp vec2 ihat = vec2(dFdx(v_tex_coord.x)*line_width, 0.0);
	lowp vec2 jhat = vec2(0.0, dFdy(v_tex_coord.y)*line_width);

	highp float field_ll = texture(u_fill_sampler, v_tex_coord).r;
	highp float field_lr = texture(u_fill_sampler, v_tex_coord + ihat).r;
	highp float field_ul = texture(u_fill_sampler, v_tex_coord + jhat).r;
	highp float field_ur = texture(u_fill_sampler, v_tex_coord + ihat+jhat).r;

	highp float field_avg = (field_ll + field_lr + field_ul + field_ur) / 4.0;
	lowp float max_alpha = 0.0;

	for (int cntr_id = 0; cntr_id < u_num_contours; ++cntr_id) {
		lowp float contour_interval = u_contour_levels[cntr_id];

		int config = 0;
		// Check the condition for each corner and build the 4-bit index
		// Bitwise left-shift by 3 to position the bit at the most significant bit
		config |= int(field_ul > contour_interval) << 3;  
		config |= int(field_ur > contour_interval) << 2;  // Bitwise left-shift by 2
		config |= int(field_lr > contour_interval) << 1;  // Bitwise left-shift by 1
		config |= int(field_ll > contour_interval);  

		// no contour in this 2x2 matrix
		if ((config == 0) || (config == 15)) {
			continue;
		}
		else {
			contour_found = 1;
			max_alpha = field_avg / contour_interval;
			break;
		}
	}

	if (contour_found == 0) {
		discard;
	}

	float dash_pattern_x = mod(v_tex_coord.x*2000., 10.0);
	float dash_pattern_y = mod(v_tex_coord.y*2000., 10.0);
    //if ((dash_pattern_x < 2.) || (dash_pattern_y < 2.)) {
    //    discard; // Skip drawing for dashed segments
    //}


    fragColor = vec4(0.0, 0.0, 0.0, max_alpha);

}
