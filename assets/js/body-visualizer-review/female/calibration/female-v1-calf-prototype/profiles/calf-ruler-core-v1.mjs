/* Canonical Female Protocol B: matched Python scalar arithmetic and numeric key order. */
function scalarLength(x,y,z){return Math.sqrt(((x*x)+(y*y))+(z*z));}
function scalarDot(x,y,z,a,b,c){return ((x*a)+(y*b))+(z*c);}
function scalarCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function normalize(a){const length=scalarLength(a[0],a[1],a[2]);return length>0&&Number.isFinite(length)?[a[0]/length,a[1]/length,a[2]/length]:null;}
function coordinate(c,i){return typeof c[0]==='number'?[c[i*3],c[i*3+1],c[i*3+2]]:c[i];}
function triangle(t,i){return typeof t[0]==='number'?[t[i*3],t[i*3+1],t[i*3+2]]:t[i];}
function compareKey(a,b){const x=a.split(',').map(Number),y=b.split(',').map(Number);return (x[0]-y[0])||(x[1]-y[1])||(x[2]-y[2]);}
function cohortCenter(c,cohort){let x=0.0,y=0.0,z=0.0;for(let j=0;j<cohort.exportVertexIds.length;j++){const p=coordinate(c,cohort.exportVertexIds[j]),w=cohort.weights[j];x=x+p[0]*w;y=y+p[1]*w;z=z+p[2]*w;}return [x,y,z];}
function insideOrigin(points){let inside=false;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]>0)!==(b[1]>0)&&0<((b[0]-a[0])*(-a[1])/(b[1]-a[1]))+a[0])inside=!inside;}return inside;}
function section(c,triangles,point,normal,side){
  const vertexCount=typeof c[0]==='number'?c.length/3:c.length,triangleCount=typeof triangles[0]==='number'?triangles.length/3:triangles.length;
  const distance=new Float64Array(vertexCount);
  for(let i=0;i<vertexCount;i++){const p=coordinate(c,i);distance[i]=(((p[0]-point[0])*normal[0])+((p[1]-point[1])*normal[1]))+((p[2]-point[2])*normal[2]);}
  const nodes=new Map(),adj=new Map();let degenerate=0;
  function link(a,b){if(!adj.has(a))adj.set(a,new Set());adj.get(a).add(b);}
  for(let index=0;index<triangleCount;index++){
    const tri=triangle(triangles,index),d0=distance[tri[0]],d1=distance[tri[1]],d2=distance[tri[2]];
    if(!(Math.min(Math.min(d0,d1),d2)<=0&&Math.max(Math.max(d0,d1),d2)>=0))continue;
    const keys=[];
    for(let position=0;position<3;position++){
      const i=tri[position],j=tri[(position+1)%3],di=distance[i],dj=distance[j];
      if(di===0){const key=`0,${i},-1`;nodes.set(key,Array.from(coordinate(c,i)));keys.push(key);}
      if(di*dj<0){const u=di/(di-dj),key=`1,${Math.min(i,j)},${Math.max(i,j)}`,a=coordinate(c,i),b=coordinate(c,j);nodes.set(key,[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]);keys.push(key);}
    }
    const unique=Array.from(new Set(keys));if(unique.length===2){link(unique[0],unique[1]);link(unique[1],unique[0]);}else if(unique.length>2)degenerate++;
  }
  const basis=normalize(scalarCross(normal,[0.0,1.0,0.0]));if(basis===null)return {valid:false,perimeterCm:null,reason:'Degenerate orthogonal projection basis'};
  const second=scalarCross(normal,basis),unused=new Set(adj.keys()),components=[],eligible=[];
  while(unused.size){
    const start=Array.from(unused).sort(compareKey)[0],stack=[start],component=new Set();
    while(stack.length){const node=stack.pop();if(component.has(node))continue;component.add(node);for(const neighbor of adj.get(node))if(!component.has(neighbor))stack.push(neighbor);}
    for(const node of component)unused.delete(node);
    let closed=Array.from(component).every(node=>adj.get(node).size===2);const order=[];
    if(closed){let current=start,previous=null;const seen=new Set();while(!seen.has(current)){seen.add(current);order.push(current);const choices=Array.from(adj.get(current)).sort(compareKey),next=choices[0]!==previous?choices[0]:choices[1];previous=current;current=next;}closed=current===start&&order.length===component.size;}
    const points=(closed?order:Array.from(component).sort(compareKey)).map(node=>nodes.get(node)),projected=[];let sameSide=true;
    for(const p of points){if(p[0]*side<=0)sameSide=false;const dx=p[0]-point[0],dy=p[1]-point[1],dz=p[2]-point[2];projected.push([scalarDot(dx,dy,dz,...basis),scalarDot(dx,dy,dz,...second)]);}
    const encloses=closed&&insideOrigin(projected);let perimeter=null;
    if(closed){let length=0.0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];length=length+scalarLength(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}perimeter=length*100.0;}
    const row={closed,degreeTwo:Array.from(component).every(node=>adj.get(node).size===2),sameSide,enclosesAxis:encloses,nodes:points.length,perimeterCm:perimeter};if(closed&&sameSide&&encloses)eligible.push(components.length);components.push(row);
  }
  const chosen=eligible.length===1?eligible[0]:null,valid=chosen!==null&&degenerate===0;
  return {valid,perimeterCm:chosen!==null?components[chosen].perimeterCm:null,planePointMeters:point,planeNormal:normal,componentCount:components.length,eligibleLegLoops:eligible.length,selectedComponent:chosen,degenerateIntersections:degenerate,components};
}
function measureField(coordinates,triangles,field,profile){
  const legs=[];for(const [label,side] of [['left',1],['right',-1]]){const definition=profile.fields[field].legs[label],point=cohortCenter(coordinates,definition.fixed),proximal=cohortCenter(coordinates,definition.proximalAxis),distal=cohortCenter(coordinates,definition.distalAxis),normal=normalize([proximal[0]-distal[0],proximal[1]-distal[1],proximal[2]-distal[2]]);legs.push(normal===null?{valid:false,perimeterCm:null,reason:'Degenerate local leg axis'}:section(coordinates,triangles,point,normal,side));}
  const valid=legs.every(leg=>leg.valid),left=legs[0].perimeterCm,right=legs[1].perimeterCm;
  return {valid,perimeterCm:valid?(left+right)*0.5:null,leftCm:left,rightCm:right,bilateralDifferenceCm:valid?Math.abs(left-right):null,legs,rulerId:profile.fields[field].rulerId};
}

export function measureFemaleCalf(coordinates,triangles,profile){return measureField(coordinates,triangles,'calf',profile);}
export {scalarLength,scalarDot,cohortCenter,section};
