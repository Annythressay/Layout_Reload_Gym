import * as THREE from '../../vendor/three/three.module.min.js';
import {OrbitControls} from '../../vendor/three/OrbitControls.js';
import {loadBody} from './glb-model.js';
import {loadCalibration,mapMeasurements} from './normalization.js';
import {morphPairs} from './morph-controller.js';

export async function createScene(host, onFailure, onCameraChange) {
  const canvas=document.createElement('canvas');
  // Probe before constructing the renderer, so unsupported browsers do not log a Three error.
  const context=canvas.getContext('webgl2',{antialias:true,alpha:true});
  if(!context) throw new Error('WebGL unavailable');
  const profiles=await loadCalibration();
  const body=await loadBody();
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true});}
  catch(error){body.dispose();throw error;}
  renderer.setClearColor(0x111111,0); host.prepend(canvas);
  canvas.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.1,30);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.minDistance=2.25;controls.maxDistance=5.5;
  controls.minPolarAngle=Math.PI*.28;controls.maxPolarAngle=Math.PI*.65;
  const bounds=new THREE.Box3().setFromObject(body.group,true),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  controls.target.copy(center); controls.enableDamping=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
  for(const [x,y,z,intensity] of [[-3,5,4,3],[3,2,2,1],[-1,3,-4,2]]) {const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(x,y,z);scene.add(light);}
  scene.add(body.group);
  let mode='current',split=.5,frame=0,disposed=false,lost=false,visible=true,animation=null,displayed=null,currentWeights=null,goalWeights=null,renderCount=0,mappingDebug={};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function requestRender(){if(!frame&&!disposed&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;if(disposed||lost||document.hidden||!visible)return;
    if(animation){const t=Math.min(1,(now-animation.start)/400),ease=t*t*(3-2*t);displayed={};for(const key in animation.to)displayed[key]=animation.from[key]+(animation.to[key]-animation.from[key])*ease;if(t===1)animation=null;}
    const w=host.clientWidth,h=host.clientHeight;
    renderer.setScissorTest(false);renderer.clear();
    if(mode==='compare'){
      renderer.setScissorTest(true);renderer.setScissor(0,0,w*split,h);body.controller.apply(currentWeights);renderer.render(scene,camera);
      renderer.setScissor(w*split,0,w*(1-split),h);body.controller.apply(goalWeights);renderer.render(scene,camera);renderer.setScissorTest(false);
    }else{body.controller.apply(displayed);renderer.render(scene,camera);}
    renderCount++;
    if(animation)requestRender();
  }
  function setState(state){
    mode=state.mode;
    const current=mapMeasurements(state.currentBody,profiles),goal=mapMeasurements(state.goalBody||state.currentBody,profiles);
    currentWeights=current.weights;goalWeights=goal.weights;mappingDebug={current:current.debug,goal:goal.debug};
    // Invalid/empty regions are neutral immediately, including during transitions.
    const selected=mode==='goal'?goal.debug:current.debug;
    if(displayed)for(const [key,info] of Object.entries(selected))if(!info.valid){displayed[key]=0;body.controller.setBidirectionalMorph(key,0);}
    const target=mode==='goal'?goalWeights:currentWeights;
    if(displayed&&!reduced.matches&&mode!=='compare'&&Object.keys(target).some(key=>target[key]!==displayed[key]))animation={from:{...displayed},to:target,start:performance.now()};
    else{displayed=target;animation=null;body.controller.apply(target);}
    requestRender();
  }
  function view(value){const angle=value==='side'?Math.PI/2:value==='back'?Math.PI:0;const distance=Math.max(size.y,size.x/Math.max(camera.aspect,.3))/(2*Math.tan(Math.PI/10))*1.18;camera.position.copy(center).add(new THREE.Vector3(Math.sin(angle)*distance,0,Math.cos(angle)*distance));controls.target.copy(center);controls.update();requestRender();}
  const cameraChanged=()=>{requestRender();onCameraChange?.();};controls.addEventListener('change',cameraChanged);
  function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();requestRender();}
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender();else {cancelAnimationFrame(frame);frame=0;}});intersection.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else requestRender();};document.addEventListener('visibilitychange',visibility);
  const contextLost=event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;onFailure('Phiên mô phỏng 3D bị gián đoạn. Bạn vẫn có thể chỉnh số đo hoặc thử tải lại mô hình.');};canvas.addEventListener('webglcontextlost',contextLost);
  function keyboard(event){
    const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);
    if(event.key==='ArrowLeft')s.theta-=.15;else if(event.key==='ArrowRight')s.theta+=.15;else if(event.key==='ArrowUp')s.phi-=.1;else if(event.key==='ArrowDown')s.phi+=.1;else if(['+','='].includes(event.key))s.radius-=.2;else if(event.key==='-')s.radius+=.2;else return;
    event.preventDefault();s.radius=THREE.MathUtils.clamp(s.radius,controls.minDistance,controls.maxDistance);s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();requestRender();
  }
  host.addEventListener('keydown',keyboard);view('front');resize();
  return {setState,view,
    // Explicit QA snapshot, read-only; never called by normal rendering/input.
    inspectGeometry(){const result=[];body.group.updateMatrixWorld(true);body.group.traverse(mesh=>{if(!mesh.isMesh)return;const v=new THREE.Vector3(),vertices=[];for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);vertices.push(v.toArray());}result.push({id:mesh.uuid,geometryId:mesh.geometry.uuid,vertices,index:Array.from(mesh.geometry.index.array)});});return result;},
    resetProductionMorphs(){animation=null;displayed=Object.fromEntries(Object.keys(currentWeights||{}).map(key=>[key,0]));currentWeights={...displayed};goalWeights={...displayed};body.controller.resetProductionMorphs();requestRender();},
    inspect(){const meshes=body.controller.inspect();const applied={};for(const [key,prefix] of Object.entries(morphPairs)){applied[key]=Object.fromEntries(['incr','decr'].map(direction=>{const name=prefix+'-'+direction;return [name,meshes[0].influences[meshes[0].dictionary[name]]];}));}return {threeRevision:THREE.REVISION,modelId:body.group.uuid,geometryIds:body.group.children.filter(o=>o.isMesh).map(o=>o.geometry.uuid),rendererCanvasCount:host.querySelectorAll('canvas').length,meshes,currentWeights:{...currentWeights},goalWeights:{...goalWeights},mappingDebug:structuredClone(mappingDebug),applied,mode,renderCount,pendingFrame:!!frame,animating:!!animation,camera:camera.position.toArray(),target:controls.target.toArray(),memory:{...renderer.info.memory},size:{width:canvas.clientWidth,height:canvas.clientHeight},disposed};},
    setSplit(value){split=THREE.MathUtils.clamp(value/100,0,1);requestRender();},
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;animation=null;observer.disconnect();intersection.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);host.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',contextLost);body.dispose();renderer.dispose();canvas.remove();}};
}
