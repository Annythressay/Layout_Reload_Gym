import {GLTFLoader} from '../../vendor/three/GLTFLoader.js';
import {createMorphController} from './morph-controller.js';
export const modelURL=new URL('../../../3D/male-mpfb-production-morph-v3.glb',import.meta.url);
let bytesPromise=null;
// Cache source bytes across a context-loss retry; no duplicate network GLB load.
function loadBytes(){return bytesPromise??=(async()=>{const response=await fetch(modelURL);if(!response.ok)throw new Error(`GLB HTTP ${response.status}`);return response.arrayBuffer();})().catch(error=>{bytesPromise=null;throw error;});}
export async function loadBody(){
  const gltf=await new GLTFLoader().parseAsync(await loadBytes(),new URL('.',modelURL).href);
  const group=gltf.scene,controller=createMorphController(group);
  const dispose=()=>{const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of [o.material].flat()){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});for(const x of [...textures,...materials,...geometries])x.dispose();};
  if(controller.missing.length){dispose();throw new Error('Incomplete production morph asset');}
  controller.resetProductionMorphs();
  return {group,controller,dispose};
}
