// Product acceptance only: neither clinical nor model calibration limits.
export const productBands=Object.freeze(Object.fromEntries(Object.entries({height:[145,205],weight:[35,200],chest:[70,140],waist:[55,150],hip:[75,145],shoulder:[32,48],arm:[18,50],thigh:[40,75],calf:[25,50],inseam:[50,110]}).map(([key,[min,max]])=>[key,Object.freeze({min,max})])));
export const inputPolicyRange=key=>productBands[key]??null;
