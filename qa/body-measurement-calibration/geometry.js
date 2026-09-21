import * as THREE from '../../assets/vendor/three/three.module.min.js';
export const levels=[-1,-.75,-.5,-.25,0,.25,.5,.75,1];
export const controls={waist:'waist',bust:'chest',shoulder:'shoulder',upperarm:'arm',thigh:'thigh',calf:'calf'};
export function vertices(mesh){mesh.updateWorldMatrix(true,false);const v=new THREE.Vector3();return Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>mesh.getVertexPosition(i,v).clone().applyMatrix4(mesh.matrixWorld));}
export function mean(points){return points.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/points.length);}
// Jacobi eigensolver for the symmetric covariance matrix: smallest eigenvector
// is the least-squares plane normal. No anatomical pixel/screen coordinates.
function planeNormal(points,center){
 const a=Array.from({length:3},()=>[0,0,0]),v=[[1,0,0],[0,1,0],[0,0,1]];
 for(const p of points){const d=p.clone().sub(center).toArray();for(let i=0;i<3;i++)for(let j=0;j<3;j++)a[i][j]+=d[i]*d[j];}
 for(let iteration=0;iteration<40;iteration++){let p=0,q=1;for(const [i,j] of [[0,2],[1,2]])if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}if(Math.abs(a[p][q])<1e-15)break;
  const angle=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle),app=a[p][p],aqq=a[q][q],apq=a[p][q];
  for(let k=0;k<3;k++)if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
  a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;a[p][q]=a[q][p]=0;
  for(let k=0;k<3;k++){const x=v[k][p],y=v[k][q];v[k][p]=c*x-s*y;v[k][q]=s*x+c*y;}
 }
 const i=[0,1,2].sort((i,j)=>a[i][i]-a[j][j])[0],n=new THREE.Vector3(v[0][i],v[1][i],v[2][i]).normalize();if(n.y<0)n.negate();return n;
}
export function locate(base,mapping){const out={};for(const [name,anchors] of Object.entries(mapping)){
 const ids=anchors.map(a=>a.index),points=ids.map(i=>base[i]),center=mean(points);
 if(name==='shoulder'){out[name]={indices:ids,baselineLandmarks:points.map(p=>p.toArray()),method:'Horizontal X distance between mapped MakeHuman shoulder endpoint 8274 and its mirrored counterpart'};continue;}
 const normal=['waist','bust'].includes(name)?new THREE.Vector3(0,1,0):planeNormal(points,center);
 out[name]={indices:ids,center:center.toArray(),normal:normal.toArray(),anchorPlaneRmsM:Math.sqrt(points.reduce((sum,p)=>sum+normal.dot(p.clone().sub(center))**2,0)/points.length),method:['waist','bust'].includes(name)?'Horizontal plane at mean Y of mapped MakeHuman ruler ring':'Least-squares plane fitted to mapped MakeHuman ruler ring',fixedAtBaseline:true};
 }return out;}
// Intersect every actual triangle, weld seam duplicates, require closed degree-2
// contours. No convex hull, no bounding-box circumference, no gap closure.
export function intersect(points,indices,center,normal,tolerance=1e-6){
 const nodes=[],adj=[],buckets=new Map(),edges=new Set();let coplanar=0,degenerate=0;
 function node(point){const c=point.toArray().map(v=>Math.floor(v/tolerance));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const list=buckets.get([c[0]+x,c[1]+y,c[2]+z].join(','))||[];for(const i of list)if(nodes[i].distanceTo(point)<=tolerance)return i;}
  const i=nodes.length;nodes.push(point);adj.push(new Set());const key=c.join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i);return i;}
 const distances=points.map(p=>normal.dot(p.clone().sub(center)));
 for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3),d=ids.map(id=>distances[id]);if(d.every(v=>v>1e-10)||d.every(v=>v< -1e-10))continue;if(d.every(v=>Math.abs(v)<=1e-10)){coplanar++;continue;}
  const hits=[];const add=p=>{if(!hits.some(q=>q.distanceToSquared(p)<1e-20))hits.push(p);};
  for(let k=0;k<3;k++){const l=(k+1)%3;if(Math.abs(d[k])<=1e-10)add(points[ids[k]].clone());if(d[k]*d[l]<0&&Math.abs(d[k])>1e-10&&Math.abs(d[l])>1e-10)add(points[ids[k]].clone().lerp(points[ids[l]],d[k]/(d[k]-d[l])));}
  if(hits.length!==2){if(hits.length>2)degenerate++;continue;}const a=node(hits[0]),b=node(hits[1]);if(a===b)continue;const key=[Math.min(a,b),Math.max(a,b)].join(',');if(edges.has(key))continue;edges.add(key);adj[a].add(b);adj[b].add(a);
 }
 const visited=new Set(),loops=[],invalid=[];
 for(let start=0;start<nodes.length;start++){if(visited.has(start))continue;const component=[],queue=[start];visited.add(start);while(queue.length){const i=queue.pop();component.push(i);for(const j of adj[i])if(!visited.has(j)){visited.add(j);queue.push(j);}}
  if(component.some(i=>adj[i].size!==2)){invalid.push({nodes:component.length,degrees:component.filter(i=>adj[i].size!==2).map(i=>adj[i].size)});continue;}
  const loop=[];let previous=-1,current=start;do{loop.push(nodes[current]);const next=[...adj[current]].find(n=>n!==previous);previous=current;current=next;}while(current!==start&&loop.length<=component.length);
  if(current!==start){invalid.push({nodes:component.length,error:'not closed'});continue;}
  const perimeter=loop.reduce((sum,p,i)=>sum+p.distanceTo(loop[(i+1)%loop.length]),0);loops.push({points:loop,center:mean(loop),perimeter});
 }
 return {loops,invalid,coplanar,degenerate};
}
export function measure(name,points,index,location,{offset=0,normal=null,tolerance=1e-6}={}){
 if(name==='shoulder'){const [a,b]=location.indices.map(i=>points[i]);return {cm:Math.abs(a.x-b.x)*100,points:[a,b],landmarks:[a.toArray(),b.toArray()],closed:true,valid:true};}
 const n=normal||new THREE.Vector3(...location.normal),c=new THREE.Vector3(...location.center).addScaledVector(n,offset),result=intersect(points,index,c,n,tolerance);
 result.loops.sort((a,b)=>a.center.distanceToSquared(c)-b.center.distanceToSquared(c));const loop=result.loops[0];
 // Must be the same anatomical region, not a remote valid contour masking failure.
 const valid=!!loop&&loop.center.distanceTo(c)<.08&&!result.invalid.length&&!result.coplanar&&!result.degenerate;
 return {cm:valid?loop.perimeter*100:null,points:loop?.points||[],center:c.toArray(),normal:n.toArray(),closed:!!loop,valid,contourCount:result.loops.length,selectedCenter:loop?.center.toArray(),selectedPointCount:loop?.points.length,invalid:result.invalid,coplanar:result.coplanar,degenerate:result.degenerate};
}
export function analyze(rows){
 const values=rows.map(r=>r.cm),base=values[4],failures=[];for(let i=1;i<values.length;i++)if(!(values[i]>values[i-1]+1e-6))failures.push({from:levels[i-1],to:levels[i],previous:values[i-1],next:values[i]});
 function fit(ids){const x=ids.map(i=>levels[i]),y=ids.map(i=>values[i]),mx=x.reduce((a,b)=>a+b)/x.length,my=y.reduce((a,b)=>a+b)/y.length,slope=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/x.reduce((s,v)=>s+(v-mx)**2,0),intercept=my-slope*mx,res=y.map((v,i)=>v-(intercept+slope*x[i])),sse=res.reduce((s,v)=>s+v*v,0),sst=y.reduce((s,v)=>s+(v-my)**2,0);return {slope,intercept,r2:sst?1-sse/sst:null,maxResidualCm:Math.max(...res.map(Math.abs)),rmseCm:Math.sqrt(sse/y.length)};}
 const decr=fit([0,1,2,3,4]),incr=fit([4,5,6,7,8]),overall=fit([0,1,2,3,4,5,6,7,8]);
 return {baseCm:base,minCm:Math.min(...values),maxCm:Math.max(...values),deltaDecreaseCm:base-values[0],deltaIncreaseCm:values[8]-base,monotonic:failures.length===0,failures,linearity:{decrease:decr,increase:incr,overall},geometryValid:rows.every(r=>r.valid),verdict:failures.length===0&&rows.every(r=>r.valid)?'PASS (geometry protocol; anatomical validation required)':'FAIL'};
}
