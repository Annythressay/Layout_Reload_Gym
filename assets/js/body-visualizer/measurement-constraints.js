import {HEIGHT_MIN_CM,HEIGHT_MAX_CM,mapHeight,baselinesAtHeight,baseHeightBaselines} from './height-calibration.js';
import {calibratedFields,measurementCmToMorphWeight} from './normalization.js';

export const heightLimits=Object.freeze({min:HEIGHT_MIN_CM,max:HEIGHT_MAX_CM});
export const isCalibrated=key=>Object.hasOwn(calibratedFields,key);
export const displayCm=value=>Number(value.toFixed(1)).toFixed(1).replace('.',',');
export const displayNumber=value=>Number(value).toFixed(1);
export const nearest=(value,{min,max})=>Math.max(min,Math.min(max,value));
export const displayedRange=range=>({min:Number(displayNumber(range.min)),max:Number(displayNumber(range.max))});

// Only the two displayed endpoint representations alias their exact model
// endpoints. This is not a general tolerance around the calibration range.
export function canonicalEndpoint(value,range){
  const displayed=displayedRange(range);
  if(value===displayed.min)return range.min;
  if(value===displayed.max)return range.max;
  return null;
}

export function normalizeMeasurement(value,range){
  const displayed=Number(displayNumber(value));
  return canonicalEndpoint(displayed,range)??displayed;
}

export function supportedRange(key,height,profiles){
  if(key==='height')return heightLimits;
  if(!isCalibrated(key)||!profiles?.[key])return null;
  const profile=profiles[key],region=calibratedFields[key];
  const shift=baselinesAtHeight(mapHeight(height).influence)[region]-baseHeightBaselines[region];
  return {min:profile.min+shift,neutral:profile.base+shift,max:profile.max+shift};
}

export function validateDraft(key,raw,{height,profiles,fallback,allowEmpty=false,badInput=false}={}){
  if(badInput)return {status:'malformed',valid:false};
  const text=String(raw??'').trim();
  if(!text)return allowEmpty?{status:'empty',valid:true,value:null}:{status:'empty-required',valid:false};
  const value=Number(text);
  if(!Number.isFinite(value))return {status:'malformed',valid:false};
  const range=supportedRange(key,height,profiles)||fallback;
  if(!range)return {status:'unavailable',valid:false};
  if(key==='height'||isCalibrated(key)){
    const endpoint=canonicalEndpoint(value,range);
    if(endpoint!==null)return {status:'valid',valid:true,value:endpoint,range,canonicalized:true};
  }
  if(value<range.min||value>range.max)return {status:'unsupported',valid:false,value,range,nearest:nearest(value,range)};
  return {status:'valid',valid:true,value,range};
}

export function technicalStatus(key,value,height,profiles){
  if(!isCalibrated(key)||value==null||!profiles?.[key])return {near:false,influence:0};
  const region=calibratedFields[key];
  const equivalent=baseHeightBaselines[region]+value-baselinesAtHeight(mapHeight(height).influence)[region];
  const influence=measurementCmToMorphWeight(equivalent,profiles[key]).signedWeight;
  return {near:Math.abs(influence)>=0.75-1e-10,influence};
}

// A normalized integer slider reaches exact calibrated endpoints independently of
// their decimal positions. Typed values may be more precise than the slider grid.
export const SLIDER_STEPS=1000000;
export const sliderPosition=(value,range)=>Math.round((value-range.min)/(range.max-range.min)*SLIDER_STEPS);
export const sliderValue=(position,range)=>{
  const n=Number(position);
  if(n<=0)return range.min;
  if(n>=SLIDER_STEPS)return range.max;
  return range.min+(range.max-range.min)*n/SLIDER_STEPS;
};
