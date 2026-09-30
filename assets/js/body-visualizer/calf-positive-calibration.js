import {mapHeight,baseHeightBaselines,HEIGHT_MIN_CM,HEIGHT_MAX_CM} from './height-calibration.js';

// Measured circumference offsets, already calibrated to the locked V20 endpoint.
// The factor is provenance only; never scale these offsets again.
export const calfPositiveProvenance=Object.freeze({
  release:'V5 + Waist90 + Calf50',
  candidateGlbSHA256:'568ADABC862BCD7D613BB364405F549CD7EF77D4D54B8A8FB2622DEA55144EF5',
  v20SHA256:'089EA90490A856B075384EDE4FE3D5CFDB28527F7E013F37FD0BDF949FEED6D2',
  seedSHA256:'C971747D5CB471C855111B87B8B14C431AB5A4FB97841D86AE41544F1934D338',
  sourceCalibrationSHA256:'1300EDF291749E45F852F82DB61FF9784681195A77B7234F3239E63C611EE303',
  factor:1.516100,
  coverage:'pinned production phenotype'
});
const positiveWeights=Object.freeze([.25,.5,.75,1]);
export const calfPositiveHeightRows=Object.freeze([
  [151.21778195689558,3.7733010252032457,7.461979530252151,11.090410061010218,14.649671323723744],
  [155,3.7739016190402026,7.466426214297918,11.101384562095468,14.674332812207133],
  [160,3.7744589743874215,7.471578514471716,11.114458455037685,14.702971272541618],
  [165,3.7749692484610833,7.4763950532792265,11.12648021291703,14.725675928333885],
  [170,3.7746468211509097,7.480671773950803,11.137341666405419,14.745870524309424],
  [172.91078380973204,3.7745820381305464,7.483089275916939,11.143387095762108,14.756959861618661],
  [175,3.7742991233411303,7.484508400530281,11.14731540103542,14.764355699165925],
  [180,3.7741891123289193,7.488227995968408,11.156706867040974,14.781606914173196],
  [185,3.7738749781483847,7.491432473699945,11.165167510556323,14.79736377462833],
  [190,3.7736342216513563,7.494553201798347,11.173182131165596,14.812172350240843],
  [194.6037856625685,3.7730403554098473,7.497364316316698,11.180216183873057,14.82506903415468]
].map(([height,...offsets])=>Object.freeze({height,samples:Object.freeze(offsets.map((offsetCm,i)=>Object.freeze({weight:positiveWeights[i],offsetCm})))})));
const negativeReferenceSamples=Object.freeze([
  [28.108762831526136,-1],[30.61789482633779,-.75],
  [33.14272906617282,-.5],[35.670579234403704,-.25],[38.183614349092764,0]
].map(([cm,weight])=>Object.freeze({cm,weight})));

export function resolveCalfPositiveProfile(original,requestedHeight){
  const height=mapHeight(requestedHeight).clampedCm;
  const exact=calfPositiveHeightRows.find(row=>row.height===height);
  let a=exact,b=exact,t=0;
  if(!exact){
    const high=calfPositiveHeightRows.findIndex(row=>row.height>height);
    a=calfPositiveHeightRows[high-1];b=calfPositiveHeightRows[high];
    t=(height-a.height)/(b.height-a.height);
  }
  const positive=a.samples.map((sample,i)=>Object.freeze({
    weight:sample.weight,
    cm:baseHeightBaselines.calf+sample.offsetCm+t*(b.samples[i].offsetCm-sample.offsetCm)
  }));
  // Keep the original negative/neutral sample objects and reference endpoints.
  const samples=Object.freeze([...original.samples.filter(sample=>sample.weight<=0),...positive]);
  return Object.freeze({...original,max:positive.at(-1).cm,samples});
}

// Called during loadCalibration(), so failures reach the existing viewer error UX.
export function validateCalfPositiveCalibration(original){
  const fail=message=>{throw new Error('Invalid Calf positive calibration: '+message);};
  if(!original||original.measurement!=='calf'||!Number.isFinite(original.base)||!Number.isFinite(original.min)||!Number.isFinite(original.max)||!Array.isArray(original.samples))fail('missing Calf profile/base');
  if(original.samples.some(sample=>!Number.isFinite(sample.cm)||!Number.isFinite(sample.weight)))fail('non-finite original sample');
  const negative=original.samples.filter(sample=>sample.weight<=0);
  if(original.base!==baseHeightBaselines.calf||negative.length!==negativeReferenceSamples.length||negative.some((sample,i)=>sample.cm!==negativeReferenceSamples[i].cm||sample.weight!==negativeReferenceSamples[i].weight)||original.min!==negative[0].cm)fail('original negative/neutral samples changed');
  if(calfPositiveHeightRows.length!==11)fail('expected 11 Height rows');
  if(calfPositiveHeightRows[0].height!==HEIGHT_MIN_CM||calfPositiveHeightRows.at(-1).height!==HEIGHT_MAX_CM)fail('incomplete Height domain');
  for(const [i,row] of calfPositiveHeightRows.entries()){
    if(!Number.isFinite(row.height)||(i&&row.height<=calfPositiveHeightRows[i-1].height))fail('Height rows must strictly increase');
    if(row.samples.length!==4)fail('expected four positive weights');
    for(const [j,sample] of row.samples.entries()){
      if(sample.weight!==positiveWeights[j]||!Number.isFinite(sample.offsetCm)||sample.offsetCm<=0||(j&&sample.offsetCm<=row.samples[j-1].offsetCm))fail('invalid positive offsets/weights');
      const cm=baseHeightBaselines.calf+sample.offsetCm;
      if(!Number.isFinite(cm)||cm<=original.base)fail('positive cm must exceed neutral');
    }
    const resolved=resolveCalfPositiveProfile(original,row.height);
    if(negative.some((sample,j)=>resolved.samples[j]!==sample)||resolved.samples.some((sample,j)=>j&&sample.cm<=resolved.samples[j-1].cm))fail('resolved profile changed negative samples or monotonicity');
  }
  return true;
}
