import {mapHeight,baselinesAtHeight,baseHeightBaselines} from './height-calibration.js';
// Keep original shape-response curves; shift absolute inputs by measured Height drift.
export const calibrationURL=new URL('../../../qa/body-measurement-calibration/measurements.json',import.meta.url);
export const hipCalibrationURL=new URL('../../../qa/hip-measurement-calibration/measurements.json',import.meta.url);
export const calibratedFields=Object.freeze({waist:'waist',chest:'bust',shoulder:'shoulder',arm:'upperarm',thigh:'thigh',calf:'calf',hip:'hips'});
let calibrationPromise=null;
export function compileCalibration(data){
  const profiles={};
  for(const [field,measurement] of Object.entries(calibratedFields)){
    const source=data[measurement];if(!source||!Number.isFinite(source.base))throw new Error('Invalid calibration: '+measurement);
    const samples=[{cm:source.base,weight:0}];
    for(const [branch,sign] of [['decr',-1],['incr',1]])for(const weight of [.25,.5,.75,1]){
      const cm=source[branch]?.[weight];if(!Number.isFinite(cm))throw new Error('Missing calibration sample: '+measurement+' '+branch+' '+weight);
      samples.push({cm,weight:sign*weight});
    }
    samples.sort((a,b)=>a.weight-b.weight);
    if(samples.some((s,i)=>i&&s.cm<=samples[i-1].cm))throw new Error('Non-monotonic calibration: '+measurement);
    profiles[field]=Object.freeze({measurement,base:source.base,min:samples[0].cm,max:samples.at(-1).cm,samples:Object.freeze(samples.map(Object.freeze))});
  }
  return Object.freeze(profiles);
}
export function loadCalibration(){return calibrationPromise??=(async()=>{
  const [body,hip]=await Promise.all([calibrationURL,hipCalibrationURL].map(async url=>{
    const response=await fetch(url);if(!response.ok)throw new Error('Calibration HTTP '+response.status);
    return response.json();
  }));
  return compileCalibration({...body,hips:hip.hips});
})().catch(error=>{calibrationPromise=null;throw error;});}
export function measurementCmToMorphWeight(input,profile){
  const empty=input==null||(typeof input==='string'&&input.trim()==='');
  const cm=!empty&&(typeof input==='number'||typeof input==='string')?Number(input):NaN;
  const valid=Number.isFinite(cm);
  const result={input:typeof input==='number'&&!Number.isFinite(input)?String(input):input??null,base:profile.base,min:profile.min,max:profile.max,valid,branch:empty?'empty':valid?'base':'invalid',signedWeight:0,weight:0,increase:0,decrease:0,clamped:false,clampDirection:null,effectiveCm:null,segment:null};
  if(!valid)return result;
  const effective=Math.max(profile.min,Math.min(profile.max,cm));result.effectiveCm=effective;result.clamped=effective!==cm;result.clampDirection=cm<profile.min?'below':cm>profile.max?'above':null;
  const exact=profile.samples.find(s=>Math.abs(s.cm-effective)<=1e-10);
  let signed=0;
  if(exact){signed=exact.weight;result.segment=[exact,exact];}
  else{const high=profile.samples.findIndex(s=>s.cm>effective),a=profile.samples[high-1],b=profile.samples[high];signed=a.weight+(b.weight-a.weight)*(effective-a.cm)/(b.cm-a.cm);result.segment=[a,b];}
  result.signedWeight=Math.max(-1,Math.min(1,signed));result.weight=Math.abs(result.signedWeight);result.branch=signed<0?'decrease':signed>0?'increase':'base';result.increase=Math.max(0,result.signedWeight);result.decrease=Math.max(0,-result.signedWeight);return result;
}
export function mapMeasurements(body,profiles){
  const height=mapHeight(body.height),baselines=baselinesAtHeight(height.influence);
  const weights={height:height.influence},debug={};
  for(const [field,region] of Object.entries(calibratedFields)){
    const input=body[field],empty=input==null||(typeof input==='string'&&input.trim()==='');
    const requested=!empty&&['number','string'].includes(typeof input)?Number(input):NaN;
    const valid=Number.isFinite(requested)&&requested>0;
    const equivalent=valid?baseHeightBaselines[region]+(requested-baselines[region]):empty?null:NaN;
    debug[field]={...measurementCmToMorphWeight(equivalent,profiles[field]),requestedCm:valid?requested:null,heightAdjustedBaseline:baselines[region],equivalentBaseHeightMeasurement:valid?equivalent:null};
    weights[field]=debug[field].signedWeight;
  }
  return {weights,debug,height:{...height,baselines}};
}
export function measurementsToMorphs(body,profiles){return mapMeasurements(body,profiles).weights;}
