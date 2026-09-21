import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createMorphController,productionMorphs,phenotypeMorphs} from '../../assets/js/body-visualizer/morph-controller.js';
import {compileCalibration,mapMeasurements} from '../../assets/js/body-visualizer/normalization.js';
const old=JSON.parse(fs.readFileSync(new URL('../body-measurement-calibration/measurements.json',import.meta.url))),hip=JSON.parse(fs.readFileSync(new URL('../hip-measurement-calibration/measurements.json',import.meta.url))),profiles=compileCalibration({...old,...hip});
// Deliberately reorder targets: controller must resolve names, never fixed indices.
const names=[...phenotypeMorphs,...productionMorphs].reverse(),dictionary=Object.fromEntries(names.map((n,i)=>[n,i])),initial=names.map(n=>phenotypeMorphs.includes(n)?[.3267660140991211,.3267660140991211,.3267660140991211,.9901999831199646][phenotypeMorphs.indexOf(n)]:0),mesh={isMesh:true,name:'shuffled-targets',morphTargetDictionary:dictionary,morphTargetInfluences:[...initial],scale:{toArray:()=>[1,1,1]}},root={traverse:fn=>fn(mesh)},controller=createMorphController(root),results=[];
const weight=n=>mesh.morphTargetInfluences[dictionary[n]],zeroOld=()=>['hip-scale-horiz','hip-scale-depth'].every(p=>weight(p+'-incr')===0&&weight(p+'-decr')===0);
function test(name,fn){fn();results.push({name,pass:true});}
test('all 18 targets bound with reordered dictionary',()=>{assert.equal(productionMorphs.length,18);assert.equal(controller.missing.length,0);});
for(const s of profiles.hip.samples)test('Hip mapping applied '+s.weight,()=>{controller.apply(mapMeasurements({hip:s.cm},profiles).weights);assert.equal(weight('measure-hips-circ-incr'),Math.max(0,s.weight));assert.equal(weight('measure-hips-circ-decr'),Math.max(0,-s.weight));assert(zeroOld());assert(controller.inspect()[0].phenotypePreserved);});
test('direct mutual exclusion both directions',()=>{controller.setMorph('measure-hips-circ-incr',1);controller.setMorph('measure-hips-circ-decr',.75);assert.equal(weight('measure-hips-circ-incr'),0);controller.setMorph('measure-hips-circ-incr',.5);assert.equal(weight('measure-hips-circ-decr'),0);});
test('apply clears previously active legacy hip scale',()=>{controller.setMorph('hip-scale-horiz-incr',1);controller.setMorph('hip-scale-depth-decr',1);controller.apply(mapMeasurements({hip:hip.hips.incr[1]},profiles).weights);assert(zeroOld());assert.equal(weight('measure-hips-circ-incr'),1);});
test('reset all 18 without phenotype edits',()=>{for(const n of productionMorphs)controller.setMorph(n,1);controller.resetProductionMorphs();assert.deepEqual(mesh.morphTargetInfluences,initial);});
test('nonfinite and unknown targets rejected',()=>{for(const v of [NaN,Infinity,-Infinity])assert.throws(()=>controller.setBidirectionalMorph('hip',v));assert.throws(()=>controller.setMorph('unknown',1));});
test('missing Hip calibration rejected',()=>assert.throws(()=>compileCalibration(old),/Invalid calibration: hips/));
test('six source profiles retain exact full precision',()=>{for(const [field,p] of Object.entries(profiles)){if(field==='hip')continue;const s=old[p.measurement];assert.equal(p.base,s.base);for(const point of p.samples)assert.equal(point.cm,point.weight===0?s.base:s[point.weight>0?'incr':'decr'][Math.abs(point.weight)]);}});
fs.writeFileSync(new URL('controller-results.json',import.meta.url),JSON.stringify({pass:true,results},null,2));console.log(JSON.stringify({pass:true,count:results.length}));
