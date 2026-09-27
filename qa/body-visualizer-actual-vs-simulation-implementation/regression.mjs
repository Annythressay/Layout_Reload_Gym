import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileCalibration,calibratedFields,mapMeasurements} from '../../assets/js/body-visualizer/normalization.js';
import {supportedRange,normalizeMeasurement,validateDraft,displayedRange} from '../../assets/js/body-visualizer/measurement-constraints.js';
import {deriveSimulation,actualDifference} from '../../assets/js/body-visualizer/simulation-values.js';
import {defaults,createState,calculateBMI} from '../../assets/js/body-visualizer/state.js';
import {inputPolicyRange} from '../../assets/js/body-visualizer/input-policy.js';
const dir='qa/body-visualizer-actual-vs-simulation-implementation/';
const profiles=compileCalibration({...JSON.parse(fs.readFileSync('qa/body-measurement-calibration/measurements.json')),hips:JSON.parse(fs.readFileSync('qa/hip-measurement-calibration/measurements.json')).hips});
const write=(name,data)=>fs.writeFileSync(dir+name+'.json',JSON.stringify(data,null,2));
let maxDifference=0;const matrix=[];
for(const height of [160,165,170,180,190])for(const key of Object.keys(calibratedFields)){
 const range=supportedRange(key,height,profiles);
 for(const value of [range.min,range.neutral,range.max,...Object.values(displayedRange(range)),(range.min+range.max)/2]){
 const actual={...defaults,height,[key]:value},sim=deriveSimulation(actual,profiles);
 const old={...actual};for(const k of ['height',...Object.keys(calibratedFields)])if(old[k]!=null)old[k]=normalizeMeasurement(old[k],supportedRange(k,height,profiles));
 const legacy=mapMeasurements(old,profiles).weights,next=mapMeasurements(sim.sceneBody,profiles).weights;
 for(const k of Object.keys(next)){const d=Math.abs(legacy[k]-next[k]);maxDifference=Math.max(maxDifference,d);assert(d<1e-10,`${height}/${key}/${value}/${k}: ${d}`);}
 }
 for(const [value,status,weight] of [[range.min-5,'BELOW_SIMULATION_RANGE',-1],[range.max+5,'ABOVE_SIMULATION_RANGE',1]]){
 const sim=deriveSimulation({...defaults,height,[key]:value},profiles);assert.equal(sim.fields[key].actualValue,value);assert.equal(sim.fields[key].simulationStatus,status);assert(Math.abs(mapMeasurements(sim.sceneBody,profiles).weights[key]-weight)<1e-10);
 }
 matrix.push({height,key,pass:true});
}
write('legacy-parity',{pass:true,maximumMappingDifference:maxDifference,matrix});
const product=[];for(const [key,values] of Object.entries({thigh:[40,46.9,52,61.5,68,72,75],arm:[18,28,38,45,48,50],waist:[55,72,83,100,120,150],chest:[70,88,108,120,140],height:[145,151.2,165,194.6,205]}))for(const actual of values){assert(validateDraft(key,String(actual)).valid);const sim=deriveSimulation({...defaults,[key]:actual},profiles);product.push({key,...sim.fields[key]});}
write('product-range-tests',{pass:true,cases:product});
for(const key of Object.keys(defaults).filter(k=>k!=='gender')){const r=inputPolicyRange(key);for(const v of [r.min-1,r.max+1,Infinity,'abc',''])assert.equal(validateDraft(key,v).valid,false);}
assert.equal(validateDraft('calf','',{allowEmpty:true}).value,null);
assert.equal(deriveSimulation(defaults,profiles).sceneBody.calf,null);
assert.equal(deriveSimulation(defaults,null).fields.thigh.simulationStatus,'SIMULATION_UNAVAILABLE');
assert.equal(calculateBMI(205,60),'14.3');
const transitions=[190,160,205,190].map(height=>deriveSimulation({...defaults,height,thigh:65},profiles));assert.equal(transitions[0].fields.thigh.simulationStatus,'SUPPORTED');assert.equal(transitions[1].fields.thigh.simulationStatus,'ABOVE_SIMULATION_RANGE');assert.equal(transitions[3].fields.thigh.simulationStatus,'SUPPORTED');assert.equal(transitions[2].simulationHeight,194.6037856625685);write('height-transition-tests',{pass:true,derivations:transitions});
const current={...defaults,thigh:72},goal={...current,thigh:75};assert.equal(actualDifference(current,goal,'thigh'),3);assert.equal(deriveSimulation(current,profiles).sceneBody.thigh,deriveSimulation(goal,profiles).sceneBody.thigh);assert.deepEqual(createState().currentBody,defaults);write('compare-tests',{pass:true,difference:3,current,goal});
write('architecture-regression',{pass:true,matrix,invalidDrafts:true,nullCalf:true,bmiActual:true,resetDefaults:true,missingCalibration:true});console.log({pass:true,maxDifference,matrix:matrix.length});
// Additional invariants: immutable actuals, future profile support, nongeometry.
const precise=Object.freeze({...defaults,thigh:52.1234});
assert.equal(deriveSimulation(precise,profiles).fields.thigh.simulationValue,52.1234);
assert.equal(deriveSimulation(precise,profiles).sceneBody.thigh,52.1);
assert.equal(deriveSimulation({...defaults,thigh:52},profiles).fields.thigh.simulationStatus,'SUPPORTED');
assert.equal(deriveSimulation(goal,profiles).fields.thigh.simulationStatus,'ABOVE_SIMULATION_RANGE');
const future={...profiles,thigh:{...profiles.thigh,max:profiles.thigh.max+30}};
assert.equal(deriveSimulation({...defaults,thigh:68},future).fields.thigh.simulationValue,68);
assert.deepEqual(mapMeasurements(deriveSimulation({...defaults,weight:200,inseam:110},profiles).sceneBody,profiles).weights,mapMeasurements(deriveSimulation(defaults,profiles).sceneBody,profiles).weights);
write('architecture-regression',{pass:true,matrix,invalidDrafts:true,nullCalf:true,bmiActual:true,resetDefaults:true,missingCalibration:true,preciseActualRetention:true,futureModelSupport:true,nongeometryParity:true,currentSupportedGoalAbove:true});
