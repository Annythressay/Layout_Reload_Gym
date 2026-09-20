import * as THREE from '../../vendor/three/three.module.min.js';

// A continuous elliptical torso and tapered limbs; all meshes are reused.
export function createBody(material) {
  const group = new THREE.Group();
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const parts = {};
  for (const name of ['head','neck','leftShoulder','rightShoulder','leftElbow','rightElbow','leftKnee','rightKnee','leftArm','rightArm','leftForearm','rightForearm','leftHand','rightHand','leftThigh','rightThigh','leftCalf','rightCalf','leftFoot','rightFoot']) {
    parts[name] = new THREE.Mesh(sphere, material); group.add(parts[name]);
  }
  const rings = 40, segments = 40;
  const positions = new Float32Array((rings + 1) * (segments + 1) * 3), indices = [];
  for(let r=0;r<rings;r++) for(let s=0;s<segments;s++) {
    const a=r*(segments+1)+s,b=a+segments+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3)); geometry.setIndex(indices);
  const torso = new THREE.Mesh(geometry,material); group.add(torso);
  const ellipsoid = (name,x,y,z,sx,sy,sz,angle=0) => {
    const mesh=parts[name]; mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.z=angle;
  };
  function update(m) {
    const h=m.height, leg=m.leg, shoulderY=h*.805, pelvisY=leg+.075;
    const hip=Math.max(m.hip,m.thigh*1.55), chest=m.chest, shoulder=Math.max(m.shoulder,chest*.96);
    // Smoothstep interpolation preserves the circumference sections without overshoot.
    const profile=[[0,.015,.015],[.13,hip*.83,hip*.72],[.27,hip,hip*m.depth],[.48,m.waist,m.waist*m.depth],[.74,chest,chest*m.depth],[.90,shoulder, chest*.60],[1,.055,.055]];
    for(let r=0;r<=rings;r++) {
      const t=r/rings; let i=0;while(i<profile.length-2 && t>profile[i+1][0])i++;
      const a=profile[i],b=profile[i+1];const v=(t-a[0])/(b[0]-a[0]),f=v*v*(3-2*v);
      const rx=a[1]+(b[1]-a[1])*f,rz=a[2]+(b[2]-a[2])*f;
      for(let s=0;s<=segments;s++) {const angle=s/segments*Math.PI*2,k=(r*(segments+1)+s)*3;positions[k]=Math.cos(angle)*rx;positions[k+1]=pelvisY-.1+t*(shoulderY-pelvisY+.13);positions[k+2]=Math.sin(angle)*rz;}
    }
    geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    ellipsoid('head',0,h*.928,0,h*.055,h*.072,h*.059);
    ellipsoid('neck',0,h*.842,0,.051,h*.055,.049);
    for(const [side,sign] of [['left',-1],['right',1]]) {
      const armX=shoulder+m.arm*.65, armLength=h*.18, forearmLength=h*.16;
      ellipsoid(side+'Shoulder',sign*(armX-.012),shoulderY-.035,0,m.arm*1.08,m.arm*1.15,m.arm*.95);
      ellipsoid(side+'Elbow',sign*(armX+armLength*.09),shoulderY-armLength*.92,0,m.arm*.63,m.arm*.82,m.arm*.63);
      ellipsoid(side+'Arm',sign*armX,shoulderY-armLength*.43,0,m.arm,armLength*.57,m.arm*.91,sign*.13);
      ellipsoid(side+'Forearm',sign*(armX+armLength*.11),shoulderY-armLength-forearmLength*.38,0,m.arm*.73,forearmLength*.57,m.arm*.70,sign*.05);
      ellipsoid(side+'Hand',sign*(armX+armLength*.14),shoulderY-armLength-forearmLength*.91,.009,m.arm*.55,h*.047,m.arm*.38);
      const legX=Math.max(hip*.5,m.thigh*.83);
      ellipsoid(side+'Knee',sign*legX,leg*.52+.035,0,m.thigh*.59,m.thigh*.78,m.thigh*.62);
      ellipsoid(side+'Thigh',sign*legX,leg*.77+.055,0,m.thigh,leg*.29,m.thigh*.96,sign*-.015);
      ellipsoid(side+'Calf',sign*legX,leg*.285+.04,0,m.thigh*.66,leg*.29,m.thigh*.70);
      ellipsoid(side+'Foot',sign*legX,.048,.052,m.thigh*.58,.047,h*.072);
    }
  }
  return {group,update,dispose(){sphere.dispose();geometry.dispose();}};
}
