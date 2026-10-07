// QA-only independent ruler. Deliberately uses a fresh graph and winding implementation.
export function oracle(c,triangles,left,right){
 const compare=(a,b)=>{const x=a.split(':').slice(1).map(Number),y=b.split(':').slice(1).map(Number);if(a[0]!==b[0])return a[0]==='v'?-1:1;return x[0]-y[0]||(x[1]??0)-(y[1]??0);};
 const f=Math.fround,centroid=ids=>[0,1,2].map(k=>f(ids.reduce((s,i)=>f(s+f(c[i][k])),0)/ids.length)),l=centroid(left),r=centroid(right),z=f(l[2]+r[2])/2;
 const d=c.map(p=>p[2]-z),nodes=new Map(),links=new Map();let ambiguous=0,segments=0;
 const add=(a,b)=>{if(!links.has(a))links.set(a,new Set());if(!links.has(b))links.set(b,new Set());if(!links.get(a).has(b)){links.get(a).add(b);links.get(b).add(a);segments++;}};
 for(const t of triangles){
  if(Math.min(...t.map(i=>d[i]))>0||Math.max(...t.map(i=>d[i]))<0)continue;
  const ends=new Set();
  for(let k=0;k<3;k++){
   let u=t[k],v=t[(k+1)%3];if(d[u]===0){let key='v:'+u;ends.add(key);nodes.set(key,c[u]);}
   if(d[u]*d[v]<0){[u,v]=[u,v].sort((a,b)=>a-b);const key='e:'+u+':'+v,q=c[u].map((x,j)=>x+(c[v][j]-x)*(-d[u]/(d[v]-d[u])));q[2]=z;ends.add(key);nodes.set(key,q);}
  }
  if(ends.size===2)add(...[...ends].sort(compare));else if(ends.size>2)ambiguous++;
 }
 const remaining=new Set(links.keys()),components=[];
 while(remaining.size){
  const root=[...remaining].sort(compare)[0],todo=[root],group=new Set();
  while(todo.length){const v=todo.pop();if(!group.has(v)){group.add(v);todo.push(...[...links.get(v)].filter(x=>!group.has(x)));}}
  for(const v of group)remaining.delete(v);
  const degree2=[...group].every(v=>links.get(v).size===2),order=[];let closed=false;
  if(degree2){let prev=null,cur=root;const visited=new Set();while(!visited.has(cur)){visited.add(cur);order.push(cur);const next=[...links.get(cur)].sort(compare).find(x=>x!==prev);prev=cur;cur=next;}closed=cur===root&&order.length===group.size;}
  const points=(closed?order:[...group]).map(k=>nodes.get(k));let winding=0,perimeter=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=a[0]*b[1]-b[0]*a[1];if(a[1]<=0&&b[1]>0&&cross>0)winding++;else if(b[1]<=0&&a[1]>0&&cross<0)winding--;const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];perimeter+=Math.sqrt((dx*dx+dy*dy)+dz*dz);}
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),torso=closed&&winding!==0&&Math.min(...xs)<0&&Math.max(...xs)>0&&Math.min(...ys)<0&&Math.max(...ys)>0;
  components.push({closed,degree2,torso,winding,perimeterCm:perimeter*100,nodes:group.size});
 }
 const candidates=components.filter(c=>c.torso);
 return {valid:candidates.length===1&&ambiguous===0&&components.every(c=>c.closed&&c.degree2),perimeterCm:candidates.length===1?candidates[0].perimeterCm:null,planeZMeters:z,components,componentCount:components.length,segments};
}

