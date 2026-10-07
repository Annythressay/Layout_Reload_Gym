export function mountMorphDebug(root,inspect){
  const panel=document.createElement('details');panel.open=true;panel.dataset.morphDebug='';
  const summary=document.createElement('summary');summary.textContent='QA — cm → morph mapping';
  const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:16px;max-height:500px;overflow:auto';panel.append(summary,output);root.append(panel);
  const update=()=>{if(!panel.open||document.hidden)return;const {state,inputs,viewer}=inspect();
    output.textContent=JSON.stringify({mode:state.mode,inputs,sources:['qa/body-measurement-calibration/measurements.json','qa/hip-measurement-calibration/measurements.json','assets/js/body-visualizer/height-baselines.js'],height:{current:viewer?.mappingDebug.currentHeight,goal:viewer?.mappingDebug.goalHeight,appliedInfluence:viewer?.appliedHeight},current:viewer?.mappingDebug.current,goal:viewer?.mappingDebug.goal,applied:viewer?.applied,animating:viewer?.animating,note:'Applied = actual mesh influences now; during compare this is the last (goal) scissor pass. Current/goal entries show each pass target.'},null,2);
  };update();const timer=setInterval(update,500);window.addEventListener('pagehide',()=>{clearInterval(timer);panel.remove();},{once:true});
}
