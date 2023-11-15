import * as Comlink from 'comlink';

import {LngLat} from "./Map";

function makeDomainVerticesAndTexCoords(
    field_lats: Float32Array, field_lons: Float32Array, field_ni: number,
    field_nj: number, texcoord_margin_r: number, texcoord_margin_s: number) {

  const verts =
      new Float32Array(2 * 2 * (field_ni - 1) * (field_nj + 1)).fill(0);
  const tex_coords =
      new Float32Array(2 * 2 * (field_ni - 1) * (field_nj + 1)).fill(0);
  const grid_cell_size =
      new Float32Array(1 * 2 * (field_ni - 1) * (field_nj + 1)).fill(0);

  let ivert = 0
  let itexcoord = 0;

  for (let i = 0; i < field_ni - 1; i++) {
    for (let j = 0; j < field_nj; j++) {
      const idx = i + j * field_ni;

      const pt = new LngLat(field_lons[idx], field_lats[idx]).toMercatorCoord();
      const pt_ip1 = new LngLat(field_lons[idx + 1], field_lats[idx + 1])
                         .toMercatorCoord();

      const r =
          i / (field_ni - 1) * (1 - 2 * texcoord_margin_r) + texcoord_margin_r;
      const rp1 = (i + 1) / (field_ni - 1) * (1 - 2 * texcoord_margin_r) +
                  texcoord_margin_r;
      const s =
          j / (field_nj - 1) * (1 - 2 * texcoord_margin_s) + texcoord_margin_s;

      if (j == 0) {
        verts[ivert] = pt.x;
        verts[ivert + 1] = pt.y;
        ivert += 2

        tex_coords[itexcoord] = r;
        tex_coords[itexcoord + 1] = s;
        itexcoord += 2;
      }

      verts[ivert] = pt.x;
      verts[ivert + 1] = pt.y;
      verts[ivert + 2] = pt_ip1.x;
      verts[ivert + 3] = pt_ip1.y;
      ivert += 4;

      tex_coords[itexcoord] = r;
      tex_coords[itexcoord + 1] = s;
      tex_coords[itexcoord + 2] = rp1;
      tex_coords[itexcoord + 3] = s;
      itexcoord += 4;

      if (j == field_nj - 1) {
        verts[ivert] = pt_ip1.x;
        verts[ivert + 1] = pt_ip1.y;
        ivert += 2;

        tex_coords[itexcoord] = rp1;
        tex_coords[itexcoord + 1] = s;
        itexcoord += 2;
      }
    }
  }

  let igcs = 0;
  for (let i = 0; i < field_ni - 1; i++) {
    for (let j = 0; j < field_nj - 1; j++) {
      const ivert = j == 0 ? 2 * (igcs + 1) : 2 * igcs;
      const x_ll = verts[ivert], y_ll = verts[ivert + 1],
            x_lr = verts[ivert + 2], y_lr = verts[ivert + 3],
            x_ul = verts[ivert + 4], y_ul = verts[ivert + 5],
            x_ur = verts[ivert + 6], y_ur = verts[ivert + 7];

      const area = 0.5 * Math.abs(x_ll * (y_lr - y_ul) + x_lr * (y_ul - y_ll) +
                                  x_ul * (y_ll - y_lr) + x_ur * (y_ul - y_lr) +
                                  x_ul * (y_lr - y_ur) + x_lr * (y_ur - y_ul));

      if (j == 0) {
        grid_cell_size[igcs] = area;
        igcs += 1;
      }

      grid_cell_size[igcs] = area;
      grid_cell_size[igcs + 1] = area;
      igcs += 2;

      if (j == field_nj - 2) {
        grid_cell_size[igcs] = area;
        grid_cell_size[igcs + 1] = area;
        grid_cell_size[igcs + 2] = area;
        igcs += 3;
      }
    }
  }

  return {
    'vertices' : verts,
    'tex_coords' : tex_coords,
    'grid_cell_size' : grid_cell_size
  };
}

const ep_interface = {
  'makeDomainVerticesAndTexCoords' : makeDomainVerticesAndTexCoords
}

type ComputeComponentWorker = typeof ep_interface;

Comlink.expose(ep_interface);

export type { ComputeComponentWorker }
