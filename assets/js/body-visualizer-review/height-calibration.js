import {heightBaselineSamples} from './height-baselines.js';
export const HEIGHT_TARGET='$md-$ma-$yn-$av$mu-$av$wg-max$hg';
export const HEIGHT_BASE_CM=172.91078380973204;
export const HEIGHT_SLOPE_CM_PER_INFLUENCE=72.31000617612153;
export const HEIGHT_MIN_INFLUENCE=-0.30;
export const HEIGHT_MAX_INFLUENCE=0.30;
export const HEIGHT_MIN_CM=151.21778195689558;
export const HEIGHT_MAX_CM=194.6037856625685;
export const clampHeightInfluence=value=>Math.max(HEIGHT_MIN_INFLUENCE,Math.min(HEIGHT_MAX_INFLUENCE,Number.isFinite(value)?value:0));
export const heightInfluenceToCm=value=>HEIGHT_BASE_CM+HEIGHT_SLOPE_CM_PER_INFLUENCE*clampHeightInfluence(value);
export function mapHeight(input){
  const empty=input==null||(typeof input==='string'&&input.trim()==='');
  const requested=!empty&&['number','string'].includes(typeof input)?Number(input):NaN;
  const valid=Number.isFinite(requested)&&requested>0;
  const clampedCm=valid?Math.max(HEIGHT_MIN_CM,Math.min(HEIGHT_MAX_CM,requested)):HEIGHT_BASE_CM;
  return {target:HEIGHT_TARGET,valid,requestedCm:valid?requested:null,clampedCm,influence:clampHeightInfluence((clampedCm-HEIGHT_BASE_CM)/HEIGHT_SLOPE_CM_PER_INFLUENCE),clamped:valid&&clampedCm!==requested};
}
export function baselinesAtHeight(influence){
  const h=clampHeightInfluence(influence),samples=heightBaselineSamples;
  const exact=samples.find(s=>Math.abs(s.heightInfluence-h)<1e-12);
  if(exact)return {...exact.baselines};
  const high=samples.findIndex(s=>s.heightInfluence>h),a=samples[high-1],b=samples[high],t=(h-a.heightInfluence)/(b.heightInfluence-a.heightInfluence);
  return Object.fromEntries(Object.keys(a.baselines).map(key=>[key,a.baselines[key]+t*(b.baselines[key]-a.baselines[key])]));
}
export const baseHeightBaselines=Object.freeze(baselinesAtHeight(0));
