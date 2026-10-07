export function measureWaist(c,tri,patch){
 const centroid=[0,0,0];for(const i of patch)for(let k=0;k<3;k++)centroid[k]+=c[i*3+k];for(let k=0;k<3;k++)centroid[k]/=patch.length;
 const z=centroid[2],nodes=new Map(),adj=new Map();let degenerate=0;
 const point=i=>[c[i*3],c[i*3+1],c[i*3+2]],connect=(a,b)=>{if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());adj.get(a).add(b);adj.get(b).add(a);};
 for(let t=0;t<tri.length;t+=3){const ids=[tri[t],tri[t+1],tri[t+2]],ds=ids.map(i=>c[i*3+2]-z);if(Math.min(...ds)>0||Math.max(...ds)<0)continue;const keys=[];
  for(let j=0;j<3;j++){const i=ids[j],k=ids[(j+1)%3],di=ds[j],dj=ds[(j+1)%3];if(di===0){const key='v:'+i;keys.push(key);nodes.set(key,point(i));}if(di*dj<0){const key='e:'+Math.min(i,k)+':'+Math.max(i,k),a=point(i),b=point(k),q=di/(di-dj);keys.push(key);nodes.set(key,a.map((v,n)=>v+(b[n]-v)*q));}}
  const uniq=[...new Set(keys)];if(uniq.length===2)connect(...uniq);else if(uniq.length>2)degenerate++;
 }
 const unused=new Set(adj.keys()),loops=[];
 function inside(poly){let yes=false;const [x,y]=centroid;for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 while(unused.size){const compare=(a,b)=>{const aa=a.split(':'),bb=b.split(':');if(aa[0]!==bb[0])return aa[0]<bb[0]?-1:1;for(let j=1;j<Math.max(aa.length,bb.length);j++){const d=Number(aa[j])-Number(bb[j]);if(d)return d;}return 0;},start=[...unused].sort(compare)[0],stack=[start],set=new Set();while(stack.length){const n=stack.pop();if(set.has(n))continue;set.add(n);for(const j of adj.get(n))if(!set.has(j))stack.push(j);}for(const n of set)unused.delete(n);if([...set].some(n=>adj.get(n).size!==2))continue;
  const order=[],visited=new Set();let current=start,prev=null;while(!visited.has(current)){visited.add(current);order.push(current);const options=[...adj.get(current)].sort(compare),next=options[0]!==prev?options[0]:options[1];prev=current;current=next;}if(current!==start||order.length!==set.size)continue;
  const p=order.map(n=>nodes.get(n));if(!inside(p)||Math.min(...p.map(p=>p[0]))>=centroid[0]||Math.max(...p.map(p=>p[0]))<=centroid[0])continue;
  let length=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];length+=Math.sqrt(dx*dx+dy*dy+dz*dz);}loops.push({perimeterCm:length*100,nodes:p.length});
 }
 return {valid:loops.length===1&&degenerate===0,perimeterCm:loops.length===1?loops[0].perimeterCm:null,torsoLoopCount:loops.length,z,degenerate};
}
