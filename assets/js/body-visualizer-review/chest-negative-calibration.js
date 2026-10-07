import {mapHeight,baselinesAtHeight,baseHeightBaselines} from './height-calibration.js';

// Mechanically translated approved Chest75 evidence; never refit or scale these values.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const chestNegativeProvenance=freeze({
  "release": "V5 + Waist90 + Calf50 + Chest75",
  "sourceCalibrationSHA256": "E276BD99C4C4F289D575D59FE49CFA22242FD2619AE7E35B3952863F07A9B04A",
  "candidateGlbSHA256": "E94753061ADF3E254E84BFC6B61A1410817A06F7BEBE69FEEE0C027DDDBA6EF3",
  "V21SHA256": "6FCCDA7DB29B684795BC520E0546999AFDB5BAF374BA675BEC7E2CC0D1DCA58E",
  "seedSHA256": "9FB8671926007747070B0D98DBACD06483C88C462C52E37323CDF6F307B73B04",
  "manualSHA256": "9FB8671926007747070B0D98DBACD06483C88C462C52E37323CDF6F307B73B04",
  "phenotypeWeights": [
    0.3267660140991211,
    0.3267660140991211,
    0.3267660140991211,
    0.9901999831199646
  ],
  "accuracyCm": 0.1,
  "productFloor": 70,
  "crossoverHeight": 179.8853049532907,
  "geometryHeightDomain": [
    151.21778195689558,
    194.6037856625685
  ]
});
export const chestNegativeHeightRows=freeze([
  {
    "height": 151.21778195689558,
    "endpoint": 60.32802887311786,
    "cap": 0.6067875176668167,
    "samples": [
      {
        "t": 0,
        "cm": 85.4334782686696
      },
      {
        "t": 0.25,
        "cm": 79.0170994212284
      },
      {
        "t": 0.5,
        "cm": 72.67878287756882
      },
      {
        "t": 0.75,
        "cm": 66.43920785700534
      },
      {
        "t": 1,
        "cm": 60.32802887311786
      }
    ]
  },
  {
    "height": 154.83328226570165,
    "endpoint": 61.541703958211414,
    "cap": 0.6560715991072357,
    "samples": [
      {
        "t": 0,
        "cm": 86.67528841122792
      },
      {
        "t": 0.25,
        "cm": 80.25619316082181
      },
      {
        "t": 0.5,
        "cm": 73.91301365940976
      },
      {
        "t": 0.75,
        "cm": 67.66548733844824
      },
      {
        "t": 1,
        "cm": 61.541703958211414
      }
    ]
  },
  {
    "height": 155,
    "endpoint": 61.59773395671466,
    "cap": 0.6583469957113266,
    "samples": [
      {
        "t": 0,
        "cm": 86.73255454146111
      },
      {
        "t": 0.25,
        "cm": 80.3133461118159
      },
      {
        "t": 0.5,
        "cm": 73.96996021659066
      },
      {
        "t": 0.75,
        "cm": 67.72208290349411
      },
      {
        "t": 1,
        "cm": 61.59773395671466
      }
    ]
  },
  {
    "height": 158.44878257450773,
    "endpoint": 62.75764510054859,
    "cap": 0.7054568533785641,
    "samples": [
      {
        "t": 0,
        "cm": 87.91718215704695
      },
      {
        "t": 0.25,
        "cm": 81.49587246882476
      },
      {
        "t": 0.5,
        "cm": 75.1483212735158
      },
      {
        "t": 0.75,
        "cm": 68.89336987082456
      },
      {
        "t": 1,
        "cm": 62.75764510054859
      }
    ]
  },
  {
    "height": 160,
    "endpoint": 63.27987216463803,
    "cap": 0.726671070791781,
    "samples": [
      {
        "t": 0,
        "cm": 88.45017600666559
      },
      {
        "t": 0.25,
        "cm": 82.02790245766835
      },
      {
        "t": 0.5,
        "cm": 75.67854052967166
      },
      {
        "t": 0.75,
        "cm": 69.42051952438983
      },
      {
        "t": 1,
        "cm": 63.27987216463803
      }
    ]
  },
  {
    "height": 162.0642828833138,
    "endpoint": 63.97529876100474,
    "cap": 0.754925552289933,
    "samples": [
      {
        "t": 0,
        "cm": 89.15945767317994
      },
      {
        "t": 0.25,
        "cm": 82.7360356978593
      },
      {
        "t": 0.5,
        "cm": 76.38432191889378
      },
      {
        "t": 0.75,
        "cm": 70.12231915315215
      },
      {
        "t": 1,
        "cm": 63.97529876100474
      }
    ]
  },
  {
    "height": 165,
    "endpoint": 64.96519106573095,
    "cap": 0.7951537829358131,
    "samples": [
      {
        "t": 0,
        "cm": 90.16845423650882
      },
      {
        "t": 0.25,
        "cm": 83.74336120138916
      },
      {
        "t": 0.5,
        "cm": 77.38841188162074
      },
      {
        "t": 0.75,
        "cm": 71.1209408736674
      },
      {
        "t": 1,
        "cm": 64.96519106573095
      }
    ]
  },
  {
    "height": 165.67978319211988,
    "endpoint": 65.19455084010806,
    "cap": 0.8044765533413738,
    "samples": [
      {
        "t": 0,
        "cm": 90.40209354077255
      },
      {
        "t": 0.25,
        "cm": 83.976654933146
      },
      {
        "t": 0.5,
        "cm": 77.62097405170796
      },
      {
        "t": 0.75,
        "cm": 71.35226822533157
      },
      {
        "t": 1,
        "cm": 65.19455084010806
      }
    ]
  },
  {
    "height": 169.29528350092596,
    "endpoint": 66.41529677075764,
    "cap": 0.8541088670026511,
    "samples": [
      {
        "t": 0,
        "cm": 91.64506997652869
      },
      {
        "t": 0.25,
        "cm": 85.21770440532076
      },
      {
        "t": 0.5,
        "cm": 78.85823935889395
      },
      {
        "t": 0.75,
        "cm": 72.58315545866539
      },
      {
        "t": 1,
        "cm": 66.41529677075764
      }
    ]
  },
  {
    "height": 170,
    "endpoint": 66.65340453794799,
    "cap": 0.8637923612259328,
    "samples": [
      {
        "t": 0,
        "cm": 91.8874079743276
      },
      {
        "t": 0.25,
        "cm": 85.45965203566794
      },
      {
        "t": 0.5,
        "cm": 79.09946970053575
      },
      {
        "t": 0.75,
        "cm": 72.82317860669572
      },
      {
        "t": 1,
        "cm": 66.65340453794799
      }
    ]
  },
  {
    "height": 172.91078380973204,
    "endpoint": 67.63744058693032,
    "cap": 0.9038216446060687,
    "samples": [
      {
        "t": 0,
        "cm": 92.8883686746983
      },
      {
        "t": 0.25,
        "cm": 86.45916028606328
      },
      {
        "t": 0.5,
        "cm": 80.09608245483281
      },
      {
        "t": 0.75,
        "cm": 73.8149240547513
      },
      {
        "t": 1,
        "cm": 67.63744058693032
      }
    ]
  },
  {
    "height": 175,
    "endpoint": 68.3442585876483,
    "cap": 0.9325845595449209,
    "samples": [
      {
        "t": 0,
        "cm": 93.60691493787375
      },
      {
        "t": 0.25,
        "cm": 87.17671189983652
      },
      {
        "t": 0.5,
        "cm": 80.81162033986266
      },
      {
        "t": 0.75,
        "cm": 74.52708240578202
      },
      {
        "t": 1,
        "cm": 68.3442585876483
      }
    ]
  },
  {
    "height": 176.52628411853811,
    "endpoint": 68.86125836896416,
    "cap": 0.9536275409627706,
    "samples": [
      {
        "t": 0,
        "cm": 94.13185139731165
      },
      {
        "t": 0.25,
        "cm": 87.70096333240235
      },
      {
        "t": 0.5,
        "cm": 81.33453610289159
      },
      {
        "t": 0.75,
        "cm": 75.04771651575176
      },
      {
        "t": 1,
        "cm": 68.86125836896416
      }
    ]
  },
  {
    "height": 179.8853049532907,
    "endpoint": 69.99999999991047,
    "cap": 0.9999999997671694,
    "samples": [
      {
        "t": 0,
        "cm": 95.28718120741965
      },
      {
        "t": 0.25,
        "cm": 88.8549381388581
      },
      {
        "t": 0.5,
        "cm": 82.48571538919607
      },
      {
        "t": 0.75,
        "cm": 76.19410096104296
      },
      {
        "t": 1,
        "cm": 69.99999999991047
      }
    ]
  },
  {
    "height": 180,
    "endpoint": 70.03889940310121,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 95.3266303841452
      },
      {
        "t": 0.25,
        "cm": 88.89434661096159
      },
      {
        "t": 0.5,
        "cm": 82.52503026288271
      },
      {
        "t": 0.75,
        "cm": 76.23325550945435
      },
      {
        "t": 1,
        "cm": 70.03889940310121
      }
    ]
  },
  {
    "height": 180.1417844273442,
    "endpoint": 70.08698779474061,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 95.3753969097425
      },
      {
        "t": 0.25,
        "cm": 88.94306331681315
      },
      {
        "t": 0.5,
        "cm": 82.5736314297618
      },
      {
        "t": 0.75,
        "cm": 76.28165878818113
      },
      {
        "t": 1,
        "cm": 70.08698779474061
      }
    ]
  },
  {
    "height": 183.75728473615027,
    "endpoint": 71.31378539754009,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 96.61924758794915
      },
      {
        "t": 0.25,
        "cm": 90.18552127965019
      },
      {
        "t": 0.5,
        "cm": 83.81320393189164
      },
      {
        "t": 0.75,
        "cm": 77.51629619347456
      },
      {
        "t": 1,
        "cm": 71.31378539754009
      }
    ]
  },
  {
    "height": 185,
    "endpoint": 71.73569428474312,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 97.04688197769735
      },
      {
        "t": 0.25,
        "cm": 90.61265671397906
      },
      {
        "t": 0.5,
        "cm": 84.23937388476915
      },
      {
        "t": 0.75,
        "cm": 77.94081786456934
      },
      {
        "t": 1,
        "cm": 71.73569428474312
      }
    ]
  },
  {
    "height": 187.37278504495634,
    "endpoint": 72.54159022018001,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 97.8633879901529
      },
      {
        "t": 0.25,
        "cm": 91.42831893184196
      },
      {
        "t": 0.5,
        "cm": 85.05322863305679
      },
      {
        "t": 0.75,
        "cm": 78.75159099812389
      },
      {
        "t": 1,
        "cm": 72.54159022018001
      }
    ]
  },
  {
    "height": 190,
    "endpoint": 73.43437802103844,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 98.76764669701397
      },
      {
        "t": 0.25,
        "cm": 92.3316051917014
      },
      {
        "t": 0.5,
        "cm": 85.95456693786406
      },
      {
        "t": 0.75,
        "cm": 79.64961425492973
      },
      {
        "t": 1,
        "cm": 73.43437802103844
      }
    ]
  },
  {
    "height": 190.98828535376242,
    "endpoint": 73.77034572033313,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 99.10780372690881
      },
      {
        "t": 0.25,
        "cm": 92.67143923399694
      },
      {
        "t": 0.5,
        "cm": 86.29368227503304
      },
      {
        "t": 0.75,
        "cm": 79.987508105383
      },
      {
        "t": 1,
        "cm": 73.77034572033313
      }
    ]
  },
  {
    "height": 194.6037856625685,
    "endpoint": 74.99999939323315,
    "cap": 1,
    "samples": [
      {
        "t": 0,
        "cm": 100.3524813711902
      },
      {
        "t": 0.25,
        "cm": 93.91486629024449
      },
      {
        "t": 0.5,
        "cm": 87.53454317339278
      },
      {
        "t": 0.75,
        "cm": 81.22401483525266
      },
      {
        "t": 1,
        "cm": 74.99999939323315
      }
    ]
  }
]);
export const chestNegativeCapSegments=freeze([
  {
    "heightLow": 151.21778195689558,
    "heightHigh": 154.83328226570165,
    "sag": 0.00008968588655650615
  },
  {
    "heightLow": 154.83328226570165,
    "heightHigh": 155,
    "sag": 1.2292286217212678e-7
  },
  {
    "heightLow": 155,
    "heightHigh": 158.44878257450773,
    "sag": 0.00004785902557730675
  },
  {
    "heightLow": 158.44878257450773,
    "heightHigh": 160,
    "sag": 0.000009583219964901607
  },
  {
    "heightLow": 160,
    "heightHigh": 162.0642828833138,
    "sag": 0.000016850640455484392
  },
  {
    "heightLow": 162.0642828833138,
    "heightHigh": 165,
    "sag": 0.00003377471189161142
  },
  {
    "heightLow": 165,
    "heightHigh": 165.67978319211988,
    "sag": 0.0000018086167222261428
  },
  {
    "heightLow": 165.67978319211988,
    "heightHigh": 169.29528350092596,
    "sag": 0.00005059323343594869
  },
  {
    "heightLow": 169.29528350092596,
    "heightHigh": 170,
    "sag": 0.0000019188232268889746
  },
  {
    "heightLow": 170,
    "heightHigh": 172.91078380973204,
    "sag": 0.00003244292060991129
  },
  {
    "heightLow": 172.91078380973204,
    "heightHigh": 175,
    "sag": 0.00001661819786290328
  },
  {
    "heightLow": 175,
    "heightHigh": 176.52628411853811,
    "sag": 0.000027965587332447374
  },
  {
    "heightLow": 176.52628411853811,
    "heightHigh": 179.8853049532907,
    "sag": 0.00004572940129001935
  }
]);
const positiveReference=freeze([{"cm":92.8883686746983,"weight":0},{"cm":97.35471648504037,"weight":0.25},{"cm":101.84302683287734,"weight":0.5},{"cm":106.35750828440054,"weight":0.75},{"cm":110.89893667568572,"weight":1}]);

export function resolveChestNegativeState(simulationHeight){
  const h=mapHeight(simulationHeight).clampedCm,rows=chestNegativeHeightRows;
  const exact=rows.find(row=>row.height===h);let a,b,f;
  if(exact){a=b=exact;f=0;}
  else{const i=rows.findIndex(row=>row.height>h);a=rows[i-1];b=rows[i];f=(h-a.height)/(b.height-a.height);}
  const neutral=baselinesAtHeight(mapHeight(h).influence).bust,endpoint=a.endpoint+f*(b.endpoint-a.endpoint);
  const below=h<=chestNegativeProvenance.crossoverHeight;
  let cap=1;
  if(below){
    if(exact)cap=a.cap;
    else{
      const segment=chestNegativeCapSegments.find(s=>s.heightLow===a.height&&s.heightHigh===b.height);
      if(!segment)throw new Error('Chest negative calibration: missing floor-cap segment at Height '+h);
      cap=a.cap+f*(b.cap-a.cap)-f*(1-f)*segment.sag;
    }
  }
  const min=below?chestNegativeProvenance.productFloor:endpoint;
  const samples=a.samples.map((s,i)=>({t:s.t,cm:i===0?neutral:s.cm+f*(b.samples[i].cm-s.cm)})).filter(s=>s.t<cap);
  samples.push({t:cap,cm:min});
  return {height:h,neutral,endpoint,cap,min,samples};
}

export function resolveChestNegativeProfile(original,simulationHeight){
  const state=resolveChestNegativeState(simulationHeight),shift=state.neutral-baseHeightBaselines.bust;
  const samples=[...state.samples.filter(s=>s.t>0).map(s=>({cm:s.cm-shift,weight:-s.t})),...original.samples.filter(s=>s.weight>=0)].sort((a,b)=>a.weight-b.weight);
  return {...original,min:state.min-shift,samples};
}

export function validateChestNegativeCalibration(original){
  const requireValid=(ok,detail)=>{if(!ok)throw new Error('Chest negative calibration: '+detail);};
  const rows=chestNegativeHeightRows,segments=chestNegativeCapSegments,domain=chestNegativeProvenance.geometryHeightDomain;
  requireValid(rows.length===22&&segments.length===13,'expected 22 Height rows and 13 floor-cap segments');
  requireValid(rows[0].height===domain[0]&&rows.at(-1).height===domain[1],'geometry Height domain mismatch');
  requireValid(rows.some(row=>row.height===chestNegativeProvenance.crossoverHeight),'missing exact crossover row');
  for(const [i,row] of rows.entries()){
    requireValid(Number.isFinite(row.height)&&(!i||row.height>rows[i-1].height),'Heights must be finite and ascending');
    requireValid(Number.isFinite(row.endpoint)&&Number.isFinite(row.cap)&&row.cap>0&&row.cap<=1,'invalid endpoint or cap at Height '+row.height);
    requireValid(row.samples.length===5,'expected five samples at Height '+row.height);
    row.samples.forEach((s,j)=>requireValid(s.t===[0,.25,.5,.75,1][j]&&Number.isFinite(s.cm)&&(!j||s.cm<row.samples[j-1].cm),'invalid negative sample at Height '+row.height));
    requireValid(row.endpoint===row.samples[4].cm,'endpoint/sample mismatch at Height '+row.height);
    if(i&&row.height<=chestNegativeProvenance.crossoverHeight){
      const segment=segments[i-1];
      requireValid(segment.heightLow===rows[i-1].height&&segment.heightHigh===row.height&&Number.isFinite(segment.sag)&&segment.sag>=0,'missing or invalid floor-cap interval');
    }
  }
  const positives=original?.samples?.filter(s=>s.weight>=0);
  requireValid(original?.base===positiveReference[0].cm&&original?.max===positiveReference.at(-1).cm&&original?.measurement==='bust','original positive profile reference mismatch');
  requireValid(positives?.length===5&&positives.every((s,i)=>s.cm===positiveReference[i].cm&&s.weight===positiveReference[i].weight),'original positive samples mismatch');
  const heights=[...rows.map(row=>row.height),...rows.slice(1).flatMap((row,i)=>[.25,.5,.75].map(f=>rows[i].height+f*(row.height-rows[i].height)))];
  for(const height of heights){
    const state=resolveChestNegativeState(height),profile=resolveChestNegativeProfile(original,height);
    requireValid([state.height,state.neutral,state.endpoint,state.cap,state.min].every(Number.isFinite)&&state.cap>0&&state.cap<=1,'nonfinite adapter at Height '+height);
    requireValid(profile.samples.every((s,i)=>Number.isFinite(s.cm)&&Number.isFinite(s.weight)&&(!i||(s.cm>profile.samples[i-1].cm&&s.weight>profile.samples[i-1].weight))),'non-monotonic adapter at Height '+height);
    requireValid(profile.base===original.base&&profile.max===original.max&&profile.measurement===original.measurement&&profile.samples.filter(s=>s.weight>=0).every((s,i)=>s===positives[i]),'positive profile changed at Height '+height);
  }
  return true;
}
