
import { DateTime } from 'luxon';
import { AutumnMap } from './AutumnMap';

import { Field } from './Field';

const ENV_FMT = 'yyyyMMddHH';

abstract class AutumnFieldLayerBase {
    readonly type: 'custom';
    readonly id: string;

    constructor(id: string) {
        this.type = 'custom';
        this.id = id;
    }

    abstract onAdd(map: AutumnMap, gl: WebGLRenderingContext) : void;
    abstract render(gl: WebGLRenderingContext, matrix: number[]) : void;
}

/** 
 * A static map layer. The data are assumed to be static in time. If the data have a time component (e.g., a model forecast), an {@link AutumnTimeFieldLayer} 
 * may be more appropriate.
 * @example
 * // Create map layers from provided fields
 * const height_layer = new AutumnFieldLayer('height-contours', height_contours);
 * const wind_speed_layer = new AutumnFieldLayer('wind-speed-fill', wind_speed_fill);
 * const barb_layer = new AutumnFieldLayer('barbs', wind_barbs);
 */
class AutumnFieldLayer extends AutumnFieldLayerBase {
    readonly field: Field;

    /**
     * Create a map layer from a field
     * @param id    - A unique id for this layer
     * @param field - The field to plot in this layer
     */
    constructor(id: string, field: Field) {
        super(id);
        this.field = field;
    }

    /**
     * @internal
     * Add this layer to a map
     */
    onAdd(map: AutumnMap, gl: WebGLRenderingContext) {
        this.field.onAdd(map, gl);
    }

    /**
     * @internal
     * Render this layer
     */
    render(gl: WebGLRenderingContext, matrix: number[]) {
        this.field.render(gl, matrix);
    }
}

/**
 * A time-varying map layer. If the data don't have a time component that you wish to display, it might be easier to use an {@link AutumnFieldLayer} instead.
 * @example
 * // Create a time-varying map layer
 * height_layer = new AutumnTimeFieldLayer('height-contours');
 * 
 * // Add some fields to it
 * height_layer.addField(height_contour_f00, DateTime.utc(2023, 1, 12, 12, 0));
 * height_layer.addField(height_contour_f01, DateTime.utc(2023, 1, 12, 13, 0));
 * height_layer.addField(height_contour_f02, DateTime.utc(2023, 1, 12, 14, 0));
 * 
 * // Set the date/time in the map layer
 * height_layer.setDatetime(Datetime.utc(2023, 1, 12, 12, 0));
 */
class AutumnTimeFieldLayer extends AutumnFieldLayerBase {
    /** @private */
    fields: Record<string, Field>;
    /** @private */
    field_key: string | null;

    /** @private */
    map: AutumnMap | null;
    /** @private */
    gl: WebGLRenderingContext | null

    /**
     * Create a time-varying map layer
     * @param id - A unique id for this layer
     */
    constructor(id: string) {
        super(id);

        this.fields = {};
        this.field_key = null;
        this.map = null;
        this.gl = null;
    }

    /**
     * @internal
     * Add this layer to a map
     */
    onAdd(map: AutumnMap, gl: WebGLRenderingContext) {
        this.map = map;
        this.gl = gl;

        Object.values(this.fields).forEach(field => {
            field.onAdd(map, gl).then(res => {
                this._repaintIfNecessary(null);
            });
        });

        this._repaintIfNecessary(null);
    }

    /**
     * @internal
     * Render this layer
     */
    render(gl: WebGLRenderingContext, matrix: number[]) {
        if (this.map !== null && this.gl !== null && this.field_key !== null 
            && this.fields.hasOwnProperty(this.field_key) && this.fields[this.field_key] !== null) {
            this.fields[this.field_key].render(gl, matrix);
        }
    }

    /**
     * Set the layer's date/time
     * @param dt - The new date/time
     */
    setDatetime(dt: DateTime) {
        const key = dt.toFormat(ENV_FMT);

        const old_field_key = this.field_key;
        this.field_key = key;

        this._repaintIfNecessary(old_field_key);
    }

    /**
     * Get a list of all dates/times that have been added to the layer
     * @returns An array of dates/times
     */
    getDatetimes() {
        let dts = Object.keys(this.fields).map(key => DateTime.fromFormat(key, ENV_FMT, {'zone': 'utc'}));
        dts.sort((a, b) => a.toMillis() - b.toMillis());
        return dts;
    }

    /**
     * Add a field valid at a specific date/time
     * @param field - The field to add
     * @param dt    - The date/time at which the field is valid
     */
    addField(field: Field, dt: DateTime) {
        const key = dt.toFormat(ENV_FMT);
        const old_field_key = this.field_key;

        if (this.map !== null && this.gl !== null && field !== null) {
            field.onAdd(this.map, this.gl).then(res => {
                this._repaintIfNecessary(null);
            });
        }

        this.fields[key] = field;
        
        if (this.field_key === null) {
            this.field_key = key;
        }
    }

    /** @private */
    _repaintIfNecessary(old_field_key: string | null) {
        if (this.map !== null && old_field_key !== this.field_key) {
            this.map.triggerRepaint();
        }
    }
}

export {AutumnFieldLayer, AutumnTimeFieldLayer};