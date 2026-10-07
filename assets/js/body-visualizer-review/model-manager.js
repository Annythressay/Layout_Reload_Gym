import {GLTFLoader} from '../../vendor/three/GLTFLoader.js';
import {loadBody as loadMale} from './glb-model.js';
import {loadFemaleCalibration,resolveFemale} from './female/resolver.js';
let femaleBytes=null;
export function createModelManager(){
  let loads=0,disposals=0,active=null;
  async function load(gender){
    if(gender==='male'){const body=await loadMale();loads++;active={...body,gender};return active;}
    const profiles=await loadFemaleCalibration();
    const url=new URL('../../../3D/female-review-v1.glb',import.meta.url);
    const bytes=profiles.modelBytes||profiles.glbBytes||await (femaleBytes??=(async()=>{const r=await fetch(url);if(!r.ok)throw Error('Female Review GLB HTTP '+r.status);return r.arrayBuffer();})());
    const gltf=await new GLTFLoader().parseAsync(bytes,new URL('.',url).href),group=gltf.scene;
    const meshes=[];group.traverse(m=>{if(m.isMesh)meshes.push(m);});
    const names=Object.keys(resolveFemale(profiles.defaults,profiles).weights);
    if(!meshes.length||meshes.some(m=>!m.morphTargetDictionary||Object.keys(m.morphTargetDictionary).length!==8||names.some((n,i)=>m.morphTargetDictionary[n]!==i)))throw Error('Female Review morph contract mismatch');
    const controller={
      apply(weights){for(const m of meshes){m.morphTargetInfluences.fill(0);for(const name of names){const v=weights?.[name]??0;if(!Number.isFinite(v))throw Error('Non-finite Female influence');m.morphTargetInfluences[m.morphTargetDictionary[name]]=v;}}group.position.y=weights?.$soleOffsetY??0;group.updateMatrixWorld(true);},
      resetProductionMorphs(){this.apply({});},
      inspect(){return meshes.map(m=>({name:m.name,dictionary:{...m.morphTargetDictionary},influences:[...m.morphTargetInfluences],scale:m.scale.toArray()}));}
    };
    function dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);for(const mat of [m.material].flat()){materials.add(mat);for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);}}});for(const item of [...textures,...materials,...geometries])item.dispose();}
    loads++;active={group,controller,dispose,gender,profiles};return active;
  }
  return {load,disposed(){disposals++;},inspect(){return {loads,disposals,activeGender:active?.gender,byteCache:true};}};
}
