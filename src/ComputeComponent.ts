
import * as Comlink from 'comlink';

import {WebGLAnyRenderingContext} from './AutumnTypes';
import {ComputeComponentWorker} from './ComputeComponent.worker';
import {MapType} from './Map';

const worker =
    new Worker(new URL('./ComputeComponent.worker', import.meta.url));
const compute_layer_worker = Comlink.wrap<ComputeComponentWorker>(worker);

abstract class ComputeComponent {
  public abstract setup(gl: WebGLAnyRenderingContext) : void;
  public abstract compute(gl: WebGLAnyRenderingContext) : void;
}

export {ComputeComponent, compute_layer_worker};
