import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileCalibration,measurementCmToMorphWeight,mapMeasurements} from '../../assets/js/body-visualizer/normalization.js';
import {configureCalibrationFields,validateMeasurement} from '../../assets/js/body-visualizer/state.js';
const source=JSON.parse(fs.readFileSync(new URL('../body-measurement-calibration/measurements.json',import.meta.url))),profiles=compileCalibration({...source,...JSON.parse(fs.readFileSync(new URL('../hip-measurement-calibration/measurements.json',import.meta.url)))}),results=[];
configureCalibrationFields(profiles);
const close=(actual,expected)=>assert(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
function test(name,fn){fn();results.push({name,pass:true});}
for(const [field,p] of Object.entries(profiles)){
 for(const sample of p.samples)test(field+' sample '+sample.weight,()=>{const r=measurementCmToMorphWeight(sample.cm,p);close(r.signedWeight,sample.weight);assert(!r.clamped);assert(r.increase===0||r.decrease===0);close(validateMeasurement(field,String(sample.cm)),sample.cm);});
 for(let i=1;i<p.samples.length;i++)test(field+' midpoint '+i,()=>{const a=p.samples[i-1],b=p.samples[i],r=measurementCmToMorphWeight((a.cm+b.cm)/2,p);close(r.signedWeight,(a.weight+b.weight)/2);assert(r.increase===0||r.decrease===0);});
 for(const [value,expected,direction] of [[p.min-100,-1,'below'],[p.max+100,1,'above']])test(field+' clamp '+direction,()=>{const r=measurementCmToMorphWeight(value,p);assert(r.clamped&&r.clampDirection===direction);close(r.signedWeight,expected);assert.equal(r.input,value);});
 for(const value of [null,undefined,'','  ',NaN,Infinity,-Infinity,'invalid',true,{},[]])test(field+' invalid/empty '+String(value),()=>{const r=measurementCmToMorphWeight(value,p);assert(!r.valid&&!r.clamped);assert.equal(r.signedWeight,0);assert.equal(r.increase,0);assert.equal(r.decrease,0);});
 test(field+' numeric input string',()=>close(measurementCmToMorphWeight(String(p.base),p).signedWeight,0));
}
test('non-monotonic data rejected',()=>{const bad=structuredClone(source);bad.waist.incr['0.5']=bad.waist.base;assert.throws(()=>compileCalibration({...bad,...JSON.parse(fs.readFileSync(new URL('../hip-measurement-calibration/measurements.json',import.meta.url)))}),/Non-monotonic/);});
test('missing sample rejected',()=>{const bad=structuredClone(source);delete bad.calf.decr['0.75'];assert.throws(()=>compileCalibration(bad),/Missing/);});
test('missing field rejected',()=>assert.throws(()=>compileCalibration({}),/Invalid/));
test('excluded Height Weight Inseam Gender',()=>{const a=mapMeasurements({},profiles).weights,b=mapMeasurements({height:210,weight:180,inseam:110,gender:'female'},profiles).weights;assert.deepEqual(a,b);assert(Object.values(a).every(v=>v===0));});
test('empty state stays zero / no baseline injection',()=>{const body={};mapMeasurements(body,profiles);assert.deepEqual(body,{});});
const output={source:'qa/body-measurement-calibration/measurements.json',pass:true,count:results.length,results};fs.writeFileSync(new URL('unit-results.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify({pass:true,count:results.length}));
