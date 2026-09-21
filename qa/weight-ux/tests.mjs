import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMeasurement,calculateBMI} from '../../assets/js/body-visualizer/state.js';
const checks=[];
for(const value of [null,undefined,'',' ','abc',NaN,Infinity,-Infinity,0,-1,34.9,180.1]){
 assert.equal(validateMeasurement('weight',value),null);checks.push({input:String(value),expected:null,pass:true});
}
for(const value of [35,60,65,80,180]){assert.equal(validateMeasurement('weight',value),value);checks.push({input:value,expected:value,pass:true});}
assert.equal(calculateBMI(200,80),'20.0');checks.push({name:'BMI actual 200 cm',pass:true});
assert.equal(calculateBMI(null,80),null);checks.push({name:'BMI missing Height',pass:true});
const report={pass:true,count:checks.length,checks};fs.writeFileSync(new URL('unit-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:true,count:checks.length}));
