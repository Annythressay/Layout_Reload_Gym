export const morphPairs=Object.freeze({
  hipHorizontal:'hip-scale-horiz',hipDepth:'hip-scale-depth',waist:'measure-waist-circ',
  chest:'measure-bust-circ',shoulder:'measure-shoulder-dist',arm:'measure-upperarm-circ',
  thigh:'measure-thigh-circ',calf:'measure-calf-circ',hip:'measure-hips-circ'
});
export const productionMorphs=Object.freeze(Object.values(morphPairs).flatMap(p=>[p+'-incr',p+'-decr']));
export const phenotypeMorphs=Object.freeze(['$md-$as-$ma-$yn','$md-$ca-$ma-$yn','$md-$af-$ma-$yn','$md-universal-$ma-$yn-$av$mu-$av$wg']);
const finite=value=>{if(!Number.isFinite(value))throw new TypeError('Morph weight must be finite');return value;};
export function createMorphController(root,{warn=message=>console.warn(message)}={}){
  const meshes=[],bindings=new Map(productionMorphs.map(name=>[name,[]]));
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.morphTargetDictionary){
    meshes.push({mesh,initial:[...mesh.morphTargetInfluences]});
    for(const name of productionMorphs){const index=mesh.morphTargetDictionary[name];if(index!==undefined)bindings.get(name).push({mesh,index});}
  }});
  const missing=productionMorphs.filter(name=>!bindings.get(name).length);
  if(missing.length)warn('RELOAD GLB missing production morph targets: '+missing.join(', '));
  function write(name,value){for(const {mesh,index} of bindings.get(name))mesh.morphTargetInfluences[index]=value;}
  function setMorph(name,value){
    if(!bindings.has(name))throw new RangeError('Not a production morph: '+name);
    const weight=Math.min(1,Math.max(0,finite(value)));
    if(weight>0)write(name.replace(/-(incr|decr)$/,(_,direction)=>direction==='incr'?'-decr':'-incr'),0);
    write(name,weight);
  }
  function setBidirectionalMorph(key,value){
    const prefix=morphPairs[key];if(!prefix)throw new RangeError('Unknown morph control: '+key);
    const weight=Math.max(-1,Math.min(1,finite(value)));
    write(prefix+'-incr',Math.max(0,weight));write(prefix+'-decr',Math.max(0,-weight));
  }
  function resetProductionMorphs(){for(const name of productionMorphs)write(name,0);}
  function apply(values){for(const key of Object.keys(morphPairs))setBidirectionalMorph(key,values[key]??0);}
  function inspect(){return meshes.map(({mesh,initial})=>({name:mesh.name,dictionary:{...mesh.morphTargetDictionary},initial:[...initial],influences:[...mesh.morphTargetInfluences],scale:mesh.scale.toArray(),phenotypePreserved:phenotypeMorphs.every(name=>{const i=mesh.morphTargetDictionary[name];return i!==undefined&&mesh.morphTargetInfluences[i]===initial[i];})}));}
  return {setMorph,setBidirectionalMorph,resetProductionMorphs,apply,inspect,missing:[...missing]};
}
