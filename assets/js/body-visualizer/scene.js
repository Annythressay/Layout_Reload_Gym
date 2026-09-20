import * as THREE from '../../vendor/three/three.module.min.js';
import {OrbitControls} from '../../vendor/three/OrbitControls.js';
import {createBody} from './model.js';
import {calculateBodyMorph} from './state.js';

export function createScene(host, onFailure, onCameraChange) {
  const canvas=document.createElement('canvas');
  // Probe before constructing the renderer, so unsupported browsers do not log a Three error.
  const context=canvas.getContext('webgl2',{antialias:true,alpha:true});
  if(!context) throw new Error('WebGL unavailable');
  const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true});
  renderer.setClearColor(0x111111,0); host.prepend(canvas);
  canvas.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.1,30);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.minDistance=2.25;controls.maxDistance=5.5;
  controls.minPolarAngle=Math.PI*.28;controls.maxPolarAngle=Math.PI*.65;
  controls.target.set(0,1.02,0); controls.enableDamping=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
  for(const [x,y,z,intensity] of [[-3,5,4,3],[3,2,2,1],[-1,3,-4,2]]) {const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(x,y,z);scene.add(light);}
  const material=new THREE.MeshStandardMaterial({color:0xd5d5d1,roughness:.78,metalness:.03});
  const goalMaterial=material.clone();goalMaterial.color.set(0xbfbfbb);
  const current=createBody(material),goal=createBody(goalMaterial);scene.add(current.group,goal.group);
  let mode='current',split=.5,frame=0,disposed=false,lost=false,visible=true,animation=null,displayed=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function requestRender(){if(!frame&&!disposed&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;if(disposed||lost||document.hidden||!visible)return;
    if(animation){const t=Math.min(1,(now-animation.start)/400),ease=t*t*(3-2*t);displayed={};for(const key in animation.to)displayed[key]=animation.from[key]+(animation.to[key]-animation.from[key])*ease;current.update(displayed);if(t===1)animation=null;}
    const w=host.clientWidth,h=host.clientHeight;
    renderer.setScissorTest(false);renderer.clear();
    if(mode==='compare'){
      renderer.setScissorTest(true);renderer.setScissor(0,0,w*split,h);current.group.visible=true;goal.group.visible=false;renderer.render(scene,camera);
      renderer.setScissor(w*split,0,w*(1-split),h);current.group.visible=false;goal.group.visible=true;renderer.render(scene,camera);renderer.setScissorTest(false);
    }else{current.group.visible=true;goal.group.visible=false;renderer.render(scene,camera);}
    if(animation)requestRender();
  }
  function setState(state){
    mode=state.mode;
    const target=calculateBodyMorph(mode==='goal' ? state.goalBody : state.currentBody);
    goal.update(calculateBodyMorph(state.goalBody||state.currentBody));
    if(displayed&&!reduced.matches&&mode!=='compare')animation={from:{...displayed},to:target,start:performance.now()};
    else{displayed=target;animation=null;current.update(target);}
    requestRender();
  }
  function view(value){const angle=value==='side'?Math.PI/2:value==='back'?Math.PI:0;camera.position.set(Math.sin(angle)*3.5,1.1,Math.cos(angle)*3.5);controls.target.set(0,1.02,0);controls.update();requestRender();}
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
  return {setState,view,setSplit(value){split=value/100;requestRender();},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);host.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',contextLost);current.dispose();goal.dispose();material.dispose();goalMaterial.dispose();renderer.dispose();canvas.remove();}};
}
