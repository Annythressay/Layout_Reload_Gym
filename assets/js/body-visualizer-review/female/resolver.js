import {createFemaleHeightCalibration} from './calibration/female-v1-height-calibration/profiles/female-height-calibration-candidate-v1.mjs';
import {createFemaleBustCalibration} from './calibration/female-v1-bust-calibration/profiles/female-bust-calibration-candidate-v1.mjs';
import {createFemaleWaistCalibration} from './calibration/female-v1-waist-calibration/profiles/female-waist-calibration-candidate-v1-review-adapter.mjs';
import {createFemaleHipsCalibration} from './calibration/female-v1-hips-calibration/profiles/female-hips-calibration-candidate-v1-review-adapter.mjs';
import {createFemaleCalfCalibration} from './calibration/female-v1-calf-prototype/profiles/female-calf-calibration-candidate-v1-review-adapter.mjs';
import {reviewArtifactBytes,clearReviewArtifactCache} from './calibration/review-artifact-fetch.js';

export const femaleMorphNames = Object.freeze([
  'RND_female_height_min_native_v1',
  'RND_female_height_max_native_v1',
  'RND_female_bust_decr_native_v1',
  'RND_female_bust_incr_native_v1',
  'RND_female_waist_signed_native_v1',
  'RND_female_hips_decr_native_v1',
  'RND_female_hips_incr_native_v1',
  'RND_female_calf_signed_native_v1'
]);

const profilePaths = Object.freeze({
  height:'female-v1-height-calibration/profiles/female-height-calibration-candidate-v1.json',
  bust:'female-v1-bust-calibration/profiles/female-bust-calibration-candidate-v1.json',
  waist:'female-v1-waist-calibration/profiles/female-waist-calibration-candidate-v1.json',
  hips:'female-v1-hips-calibration/profiles/female-hips-calibration-candidate-v1.json',
  calf:'female-v1-calf-prototype/profiles/female-calf-calibration-candidate-v1.json'
});
const profileHashes = Object.freeze({
  height:'25F7BB801AD8AF3D1D26F8B75793772FC0AF5271A4B47FA0E1794341515DBC6A',
  bust:'6D091FB74CDB8BE6BD43F1F682B10F595AA4774ADFED250D035DC7D4D2121640',
  waist:'5E82CF217E636785508A560F9720BE8EB37E7B54AC41B4244EF00EAECF31415C',
  hips:'15BB680324E9CEA3EE4151C95A8738DEB7D81441C6BB63100356282F3E9BAC0F',
  calf:'8BEF3ACA3588B700C088B1956CB76D34E2376C4E0538BB2E6983BF3D818CADD1'
});
const glbSource = 'female-v1-calf-prototype/candidate/female-calf-prototype-v1.glb';
const glbHash = '8449C7417650542B7F73D6372B150D3917DCCF0961CC6F817931333492EC06DA';
const sha = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
let calibrationPromise;

export function parseFemaleReviewGeometry(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 || view.getUint32(8,true)!==buffer.byteLength) throw Error('Invalid Female Review GLB');
  let document, binaryOffset;
  for (let offset=12; offset<buffer.byteLength;) {
    const length=view.getUint32(offset,true), type=view.getUint32(offset+4,true);
    if (type===0x4e4f534a) document=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset+8,length)));
    if (type===0x004e4942) binaryOffset=offset+8;
    offset+=8+length;
  }
  if (!document || binaryOffset===undefined || document.meshes?.length!==1 || document.meshes[0].primitives.length!==1) throw Error('Female Review mesh contract');
  const primitive=document.meshes[0].primitives[0], names=document.meshes[0].extras.targetNames;
  if (JSON.stringify(names)!==JSON.stringify(femaleMorphNames) || primitive.targets.length!==8) throw Error('Female Review morph contract');
  function accessor(index) {
    const a=document.accessors[index], b=document.bufferViews[a.bufferView], width={SCALAR:1,VEC3:3}[a.type];
    if (a.sparse || !width || b.buffer!==0) throw Error('Female Review accessor contract');
    const componentBytes={5123:2,5125:4,5126:4}[a.componentType];
    if (!componentBytes) throw Error('Female Review component contract');
    const result=a.componentType===5126?new Float32Array(a.count*width):new Uint32Array(a.count*width);
    const stride=b.byteStride || width*componentBytes, base=binaryOffset+(b.byteOffset||0)+(a.byteOffset||0);
    for (let i=0;i<a.count;i++) for(let k=0;k<width;k++) {
      const offset=base+i*stride+k*componentBytes;
      result[i*width+k]=a.componentType===5126?view.getFloat32(offset,true):a.componentType===5125?view.getUint32(offset,true):view.getUint16(offset,true);
    }
    return result;
  }
  // Export is Y-up; locked rulers consume native Blender XYZ in meters.
  // Preserve signed zero: native Y is exactly -export Z.
  function native(array) {
    const result=new Float32Array(array.length);
    for(let i=0;i<array.length;i+=3) { result[i]=array[i]; result[i+1]=-array[i+2]; result[i+2]=array[i+1]; }
    return result;
  }
  return {basis:native(accessor(primitive.attributes.POSITION)),deltas:primitive.targets.map(t=>native(accessor(t.POSITION))),triangles:accessor(primitive.indices),document};
}

export function loadFemaleCalibration() {
  if (!calibrationPromise) calibrationPromise=initializeFemaleCalibration().catch(error=>{
    calibrationPromise=undefined;
    clearReviewArtifactCache();
    throw error;
  });
  return calibrationPromise;
}

async function initializeFemaleCalibration() {
  const raw={};
  const tasks=Object.entries(profilePaths).map(async ([field,path])=>{
    const bytes=await reviewArtifactBytes(path);
    if (await sha(bytes)!==profileHashes[field]) throw Error('Female Review profile hash: '+field);
    raw[field]=JSON.parse(new TextDecoder().decode(bytes));
  });
  const modelTask=reviewArtifactBytes(glbSource);
  const loaded=await Promise.all([...tasks,modelTask]);
  const modelBytes=loaded.at(-1).slice().buffer;
  if (await sha(modelBytes)!==glbHash) throw Error('Female Review model hash');
  const geometry=parseFemaleReviewGeometry(modelBytes);
  const slice=count=>({basis:geometry.basis,deltas:geometry.deltas.slice(0,count),triangles:geometry.triangles});
  const height=createFemaleHeightCalibration(raw.height,{basis:geometry.basis,minDelta:geometry.deltas[0],maxDelta:geometry.deltas[1]});
  const bust=await createFemaleBustCalibration(raw.bust,slice(4),raw.height);
  const waist=await createFemaleWaistCalibration(raw.waist,slice(5),raw.height,raw.bust);
  const hips=await createFemaleHipsCalibration(raw.hips,slice(7),raw.height,raw.bust,raw.waist);
  const calf=await createFemaleCalfCalibration(raw.calf,slice(8),raw.height);
  const evaluators=Object.freeze({height,bust,waist,hips,calf});
  for(const [field,evaluator] of Object.entries(evaluators)) if(!evaluator.usable) throw Error('Locked Female resolver unavailable: '+field);
  const h=height.resolveFemaleHeight(raw.height.neutralHeightCm);
  const chest=bust.supportAtHeight(h.simulation).measuredNeutralBust;
  const b=bust.resolveFemaleBust(chest,h);
  const waistCm=waist.supportAtState(h,b).neutralWaist;
  const w=waist.resolveFemaleWaist(waistCm,h,b);
  const hip=hips.supportAtState(h,b,w).neutralHips;
  const calfCm=calf.supportAtHeight(h).neutralCalf;
  const defaults=Object.freeze({height:h.actual,chest,waist:waistCm,hip,calf:calfCm});
  const profiles=Object.freeze({
    modelId:'reload-body-female-v1-review',reviewOnly:true,raw,evaluators,geometry,
    modelBytes,glbBytes:modelBytes,morphNames:femaleMorphNames,defaults,neutral:defaults,
    heightSupport:Object.freeze({min:raw.height.support.lowerCm,max:raw.height.support.upperCm})
  });
  const neutral=resolveFemale(defaults,profiles);
  if (!neutral.usable || Object.values(neutral.weights).some(value=>value!==0) || neutral.soleOffsetY!==0) throw Error('Female Review neutral fidelity');
  return profiles;
}

function field(raw,lower,upper,mapping) {
  return {...raw,actualValue:raw.actual,simulationValue:raw.simulation,simulationStatus:raw.status,
    simulationMin:raw[lower],simulationMax:raw[upper],mappingValue:mapping,raw};
}

export function resolveFemale(body,profiles) {
  const e=profiles.evaluators;
  const height=e.height.resolveFemaleHeight(body.height);
  const bust=e.bust.resolveFemaleBust(body.chest,height);
  const waist=e.waist.resolveFemaleWaist(body.waist,height,bust);
  const hips=e.hips.resolveFemaleHips(body.hip,height,bust,waist);
  const calf=e.calf.resolveFemaleCalf(body.calf,height);
  const states=[height,bust,waist,hips,calf];
  const usable=states.every(s=>s.status!=='SIMULATION_UNAVAILABLE');
  const values=[height.minInfluence,height.maxInfluence,bust.decrInfluence,bust.incrInfluence,waist.signedInfluence,hips.decrInfluence,hips.incrInfluence,calf.signedInfluence];
  // Always supply a fresh full morph map. Unavailable state fails closed to Basis.
  const weights=Object.fromEntries(femaleMorphNames.map((name,index)=>[name,usable?values[index]:0]));
  const fields={
    height:{...field(height,'lowerCm','upperCm',height.simulation),simulationMin:profiles.heightSupport.min,simulationMax:profiles.heightSupport.max},
    chest:field(bust,'lowerSupportBust','upperSupportBust',bust.simulation),
    waist:field(waist,'lowerWaist','upperWaist',waist.simulation),
    hip:field(hips,'lowerHips','upperHips',hips.simulation),
    calf:field(calf,'lowerCalf','upperCalf',calf.simulation)
  };
  return {modelId:profiles.modelId,usable,weights,fields,soleOffsetY:usable?height.solePlacement:0,
    resolverOrder:['height','chest','waist','hip','calf'],dependencies:{height,bust,waist,hips,calf},raw:{height,bust,waist,hips,calf}};
}
