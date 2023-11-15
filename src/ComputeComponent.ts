
import * as Comlink from 'comlink';

import {WebGLAnyRenderingContext} from './AutumnTypes';
import {ComputeComponentWorker} from './ComputeComponent.worker';
import {MapType} from './Map';

const worker =
    new Worker(new URL('./ComputeComponent.worker', import.meta.url));
const compute_layer_worker = Comlink.wrap<ComputeComponentWorker>(worker);

abstract class ComputeComponent {
  abstract setup(map: MapType, gl: WebGLAnyRenderingContext): Promise<void>;
  abstract compute(gl: WebGLAnyRenderingContext): void;
}

export {ComputeComponent, compute_layer_worker};
