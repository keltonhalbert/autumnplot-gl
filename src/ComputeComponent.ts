
import * as Comlink from 'comlink';

import {WebGLAnyRenderingContext} from './AutumnTypes';
import {ComputeComponentWorker} from './ComputeComponent.worker';
import {MapType} from './Map';

const worker =
    new Worker(new URL('./ComputeComponent.worker', import.meta.url));
const compute_layer_worker = Comlink.wrap<ComputeComponentWorker>(worker);

abstract class ComputeComponent {
  abstract setup(map: MapType, gl: WebGL2RenderingContext): Promise<void>;
  abstract compute(gl: WebGL2RenderingContext): void;
}

export {ComputeComponent, compute_layer_worker};
