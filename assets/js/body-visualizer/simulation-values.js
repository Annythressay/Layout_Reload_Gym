import {calibratedFields} from './normalization.js';
import {supportedRange,canonicalEndpoint,normalizeMeasurement,nearest} from './measurement-constraints.js';

export function deriveField(actualValue,range){
  if(actualValue==null)return {actualValue:null,simulationValue:null,mappingValue:null,simulationMin:range?.min??null,simulationMax:range?.max??null,simulationStatus:'UNSET'};
  if(!range||!Number.isFinite(actualValue))return {actualValue,simulationValue:null,mappingValue:null,simulationMin:null,simulationMax:null,simulationStatus:'SIMULATION_UNAVAILABLE'};
  const alias=canonicalEndpoint(actualValue,range);
  const simulationStatus=alias!==null?'SUPPORTED':actualValue<range.min?'BELOW_SIMULATION_RANGE':actualValue>range.max?'ABOVE_SIMULATION_RANGE':'SUPPORTED';
  const simulationValue=simulationStatus==='SUPPORTED'?actualValue:nearest(actualValue,range);
  const mappingValue=alias??(simulationStatus==='SUPPORTED'?normalizeMeasurement(simulationValue,range):simulationValue);
  return {actualValue,simulationValue,mappingValue,simulationMin:range.min,simulationMax:range.max,simulationStatus};
}
export function deriveSimulation(actualBody,profiles){
  if(!actualBody)return null;
  const height=deriveField(actualBody.height,supportedRange('height'));
  const simulationHeight=height.mappingValue;
  const fields={height},sceneBody={...actualBody,height:simulationHeight};
  for(const key of Object.keys(calibratedFields)){
    fields[key]=deriveField(actualBody[key],simulationHeight==null?null:supportedRange(key,simulationHeight,profiles));
    sceneBody[key]=fields[key].mappingValue;
  }
  for(const key of ['weight','inseam'])fields[key]={actualValue:actualBody[key],simulationValue:null,simulationMin:null,simulationMax:null,simulationStatus:'NOT_APPLICABLE'};
  return {actualHeight:actualBody.height,simulationHeight,sceneBody,fields};
}
export const deriveSceneState=(state,profiles)=>({...state,currentBody:deriveSimulation(state.currentBody,profiles).sceneBody,goalBody:deriveSimulation(state.goalBody,profiles)?.sceneBody??null});
export const actualDifference=(current,goal,key)=>Number.isFinite(current?.[key])&&Number.isFinite(goal?.[key])?goal[key]-current[key]:null;
