import fs from 'node:fs';
import assert from 'node:assert/strict';
import {heightBaselineSamples} from '../../assets/js/body-visualizer/height-baselines.js';
import {mapHeight,baselinesAtHeight,heightInfluenceToCm,HEIGHT_TARGET,HEIGHT_BASE_CM,HEIGHT_MIN_CM,HEIGHT_MAX_CM} from '../../assets/js/body-visualizer/height-calibration.js';
import {compileCalibration,mapMeasurements,measurementCmToMorphWeight} from '../../assets/js/body-visualizer/normalization.js';
import {createMorphController,productionMorphs,phenotypeMorphs,morphPairs} from '../../assets/js/body-visualizer/morph-controller.js';
import {configureCalibrationFields,validateMeasurement,calculateBMI} from '../../assets/js/body-visualizer/state.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),dataset=read('../height-full-range/baseline-dataset.json'),profiles=compileCalibration({...read('../body-measurement-calibration/measurements.json'),...read('../hip-measurement-calibration/measurements.json')}),results=[];
const close=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`),test=(name,fn)=>{fn();results.push({name,pass:true});};
configureCalibrationFields(profiles);
test('production dataset preserves every full-precision source sample',()=>assert.deepEqual(heightBaselineSamples,dataset.samples));
for(const h of [151.21778195689558,155,160,165,170,HEIGHT_BASE_CM,175,180,185,190,194.6037856625685,140,200])test('Height inverse and clamp '+h,()=>{const m=mapHeight(h);close(heightInfluenceToCm(m.influence),Math.max(HEIGHT_MIN_CM,Math.min(HEIGHT_MAX_CM,h)));assert.equal(m.clamped,h<HEIGHT_MIN_CM||h>HEIGHT_MAX_CM);assert.equal(m.requestedCm,h);});
for(const input of [null,undefined,'',' ',NaN,Infinity,-Infinity,'abc',{},[],true,0,-3])test('invalid Height '+String(input),()=>{const m=mapHeight(input);assert.equal(m.influence,0);assert.equal(m.valid,false);assert.equal(m.clampedCm,HEIGHT_BASE_CM);});
for(let i=0;i<dataset.samples.length;i++){
 const s=dataset.samples[i];test('baseline exact '+s.heightInfluence,()=>assert.deepEqual(baselinesAtHeight(s.heightInfluence),s.baselines));
 if(i){const a=dataset.samples[i-1];test('baseline midpoint '+i,()=>{const b=baselinesAtHeight((a.heightInfluence+s.heightInfluence)/2);for(const k of Object.keys(b))close(b[k],(a.baselines[k]+s.baselines[k])/2);});}
}
test('baseline clamps before lookup',()=>{assert.deepEqual(baselinesAtHeight(-999),dataset.samples[0].baselines);assert.deepEqual(baselinesAtHeight(999),dataset.samples.at(-1).baselines);});
for(const h of [-.3,-.2,-.125,0,.1,.275,.3])for(const [field,p] of Object.entries(profiles)){
 const base=baselinesAtHeight(h)[p.measurement];
 for(const sample of p.samples)test(`${h} ${field} sample ${sample.weight}`,()=>{const requested=base+sample.cm-p.base,r=mapMeasurements({height:heightInfluenceToCm(h),[field]:requested},profiles);close(r.weights[field],sample.weight);close(r.debug[field].equivalentBaseHeightMeasurement,sample.cm);close(r.debug[field].heightAdjustedBaseline,base);close(validateMeasurement(field,String(requested)),requested);});
 for(let i=1;i<p.samples.length;i++)test(`${h} ${field} segment ${i}`,()=>{const a=p.samples[i-1],b=p.samples[i],requested=base+(a.cm+b.cm)/2-p.base;close(mapMeasurements({height:heightInfluenceToCm(h),[field]:requested},profiles).weights[field],(a.weight+b.weight)/2);});
}
for(const [field,p] of Object.entries(profiles)){
 for(const input of [null,undefined,'',' ',NaN,Infinity,'abc',true,{},[],-1,0])test('invalid measurement '+field+' '+String(input),()=>assert.equal(mapMeasurements({height:180,[field]:input},profiles).weights[field],0));
 for(const h of [-.3,0,.3])for(const [cm,w] of [[p.min-1,-1],[p.max+1,1]])test(`measurement clamp ${field} ${h} ${w}`,()=>{const requested=baselinesAtHeight(h)[p.measurement]+cm-p.base,r=mapMeasurements({height:heightInfluenceToCm(h),[field]:requested},profiles);close(r.weights[field],w);assert(r.debug[field].clamped);});
 for(const sample of p.samples)test('original curve unchanged '+field+' '+sample.weight,()=>close(measurementCmToMorphWeight(sample.cm,p).signedWeight,sample.weight));
}
const names=[...phenotypeMorphs,...productionMorphs].reverse(),dictionary=Object.fromEntries(names.map((n,i)=>[n,i])),initial=names.map(n=>phenotypeMorphs.includes(n)?[.3267660140991211,.3267660140991211,.3267660140991211,.9901999831199646][phenotypeMorphs.indexOf(n)]:0),mesh={isMesh:true,name:'reordered',morphTargetDictionary:dictionary,morphTargetInfluences:[...initial],scale:{toArray:()=>[1,1,1]}},controller=createMorphController({traverse:fn=>fn(mesh)}),weight=n=>mesh.morphTargetInfluences[dictionary[n]];
test('19 targets resolved by dictionary, no legacy bindings',()=>{assert.equal(names.length,19);assert.equal(controller.missing.length,0);assert(!names.some(n=>/hip-scale|leg-height|min\$hg/.test(n)));});
for(const h of [-1,-.3,-.1,0,.1,.3,1])test('signed controller '+h,()=>{controller.setMorph(HEIGHT_TARGET,h);close(weight(HEIGHT_TARGET),Math.max(-.3,Math.min(.3,h)));});
for(const [key,prefix] of Object.entries(morphPairs))test('measurement bounds and exclusion '+key,()=>{controller.setMorph(prefix+'-incr',2);assert.equal(weight(prefix+'-incr'),1);controller.setMorph(prefix+'-decr',.5);assert.equal(weight(prefix+'-incr'),0);controller.setMorph(prefix+'-incr',.75);assert.equal(weight(prefix+'-decr'),0);controller.setMorph(prefix+'-incr',-1);assert.equal(weight(prefix+'-incr'),0);});
test('nonfinite target and unknown target rejected',()=>{for(const v of [NaN,Infinity])assert.throws(()=>controller.setMorph(HEIGHT_TARGET,v));assert.throws(()=>controller.setMorph('missing',1));});
test('central apply clears previous channels and preserves phenotype',()=>{controller.apply(mapMeasurements({height:155,hip:100},profiles).weights);assert(weight(HEIGHT_TARGET)<0);assert(controller.inspect()[0].phenotypePreserved);controller.apply(mapMeasurements({},profiles).weights);assert.deepEqual(mesh.morphTargetInfluences,initial);});
test('reset exact initial phenotype',()=>{for(const n of productionMorphs)controller.setMorph(n,1);controller.resetProductionMorphs();assert.deepEqual(mesh.morphTargetInfluences,initial);});
test('Weight/inseam/gender excluded; Height still feeds BMI',()=>{const a={height:180,waist:80},b={...a,weight:150,inseam:90,gender:'female'};assert.deepEqual(mapMeasurements(a,profiles),mapMeasurements(b,profiles));assert.equal(calculateBMI(180,80),'24.7');assert.equal(calculateBMI(null,80),null);});
fs.writeFileSync(new URL('unit-results.json',import.meta.url),JSON.stringify({pass:true,count:results.length,results},null,2));console.log(JSON.stringify({pass:true,count:results.length}));

