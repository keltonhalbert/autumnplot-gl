
import {TypedArray, WebGLAnyRenderingContext, WindProfile} from "./AutumnTypes";
import Barbs, {BarbsOptions} from "./Barbs";
import {
  ColorBarOptions,
  ColorbarOrientation,
  ColorbarTickDirection,
  makeColorBar,
  makePaintballKey,
  PaintballKeyOptions
} from "./ColorBar";
import {
  bluered,
  Color,
  ColorMap,
  nws_storm_clear_refl,
  pw_cape,
  pw_speed500mb,
  pw_speed850mb,
  pw_t2m,
  pw_td2m,
  redblue
} from './Colormap';
import {Compute} from './Compute';
import Contour, {ContourOptions} from "./Contour";
import {ContourFill, ContourFillOptions, Raster, RasterOptions} from "./Fill";
import Hodographs, {HodographOptions} from './Hodographs';
import {MapType} from "./Map";
import Paintball, {PaintballOptions} from "./Paintball";
import {PlotComponent} from "./PlotComponent";
import {MultiPlotLayer, PlotLayer} from './PlotLayer';
import {
  Grid,
  GridType,
  LambertGrid,
  PlateCarreeGrid,
  PlateCarreeRotatedGrid,
  RawProfileField,
  RawScalarField,
  RawVectorField,
  RawVectorFieldOptions,
  VectorRelativeTo
} from "./RawField";

const colormaps = {
  bluered : bluered,
  redblue : redblue,
  pw_speed500mb : pw_speed500mb,
  pw_speed850mb : pw_speed850mb,
  pw_cape : pw_cape,
  pw_t2m : pw_t2m,
  pw_td2m : pw_td2m,
  nws_storm_clear_refl : nws_storm_clear_refl,
}

export {
  PlotComponent,
  Barbs,
  BarbsOptions,
  Contour,
  ContourOptions,
  ContourFill,
  Raster,
  ContourFillOptions,
  RasterOptions,
  Paintball,
  PaintballOptions,
  Hodographs,
  HodographOptions,
  WindProfile,
  PlotLayer,
  MultiPlotLayer,
  MapType,
  Compute,
  ColorMap,
  colormaps,
  makeColorBar,
  makePaintballKey,
  Color,
  ColorbarOrientation,
  ColorbarTickDirection,
  ColorBarOptions,
  PaintballKeyOptions,
  RawScalarField,
  RawVectorField,
  RawProfileField,
  Grid,
  GridType,
  VectorRelativeTo,
  RawVectorFieldOptions,
  PlateCarreeGrid,
  PlateCarreeRotatedGrid,
  LambertGrid,
  WebGLAnyRenderingContext,
  TypedArray
};
