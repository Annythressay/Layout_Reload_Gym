import {fields,createState,validateMeasurement,calculateBMI} from './state.js';

const root=document.querySelector('.body-visualizer');
const $=selector=>root.querySelector(selector);
const $$=selector=>[...root.querySelectorAll(selector)];
let state=createState(),scene=null,loading=false;
const goals=[
  ['Giảm mỡ','Kết hợp tập sức mạnh, vận động tim mạch và vận động linh hoạt.'],
  ['Tăng cơ','Ưu tiên tập sức mạnh, kỹ thuật động tác và thời gian phục hồi.'],
  ['Cải thiện vóc dáng','Kết hợp sức mạnh toàn thân, kiểm soát động tác và vận động linh hoạt.'],
  ['Tăng sức mạnh','Ưu tiên các động tác sức mạnh nền tảng, tăng mức độ dần theo khả năng.'],
  ['Tăng sức bền','Kết hợp vận động tim mạch, bài tập toàn thân và phục hồi.'],
  ['Cải thiện thể lực','Luân phiên sức mạnh, vận động tim mạch và vận động linh hoạt.'],
  ['Tập luyện duy trì sức khỏe','Bắt đầu với vận động yêu thích và xây dựng lịch tập đều đặn.']
];
const headings=['VÓC DÁNG HIỆN TẠI','VÓC DÁNG MỤC TIÊU','SO SÁNH VÓC DÁNG','MỤC TIÊU TẬP LUYỆN'];
const descriptions=['Nhập một vài thông tin cơ bản để tạo mô phỏng gần với số đo của bạn.','Bạn muốn hướng tới vóc dáng như thế nào? Điều chỉnh những số đo bạn quan tâm.','Cùng một góc nhìn. Hai điểm trên hành trình của bạn.','Điều gì quan trọng nhất với bạn lúc này?'];
const editedBody=()=>state.step===1?state.goalBody:state.currentBody;
function fieldMarkup(key){const [label,min,max,unit]=fields[key],value=editedBody()[key];return `<div class="bv-field" data-field="${key}"><div class="bv-field__top"><label for="bv-${key}">${label}</label><div><input id="bv-${key}" data-number="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="0.1" value="${value}" aria-describedby="bv-error-${key}"><span>${unit}</span></div></div><input type="range" data-range="${key}" min="${min}" max="${max}" step="0.1" value="${value}" aria-label="${label}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}"><small id="bv-error-${key}" class="bv-error"></small></div>`;}
function renderFields(){
  const goal=state.step===1;
  $('[data-measurements]').innerHTML=goal ? `<div class="bv-goal-note">MỤC TIÊU CỦA BẠN <span>Khởi tạo từ số đo hiện tại</span></div>${['weight','waist','hip','chest','thigh'].map(fieldMarkup).join('')}` : `<fieldset class="bv-gender"><legend>Kiểu mô hình</legend>${[['female','Nữ'],['male','Nam'],['neutral','Trung lập']].map(([value,label])=>`<label><input type="radio" name="bv-gender" value="${value}" ${state.currentBody.gender===value?'checked':''}><span>${label}</span></label>`).join('')}</fieldset>${['height','weight','chest','waist','hip','inseam'].map(fieldMarkup).join('')}<details class="bv-advanced"><summary>Thêm số đo chi tiết</summary>${['shoulder','arm','thigh'].map(fieldMarkup).join('')}</details>`;
}
function updateSummary(){
  const m=state.mode==='goal'?state.goalBody:state.currentBody;
  $('[data-bmi]').textContent=calculateBMI(m.height,m.weight);
  $('[data-model-label]').textContent=state.mode==='compare'?'HIỆN TẠI / MỤC TIÊU':state.mode==='goal'?'MỤC TIÊU':'HIỆN TẠI';
  for(const selector of ['.bv-split','.bv-divider','.bv-compare-labels'])$(selector).hidden=state.mode!=='compare';
  $$('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  if(state.goalBody)$('[data-differences]').innerHTML=['weight','chest','waist','hip','thigh'].map(key=>`<div class="bv-difference"><span>${fields[key][0]}</span><span>${state.currentBody[key]} <span aria-hidden="true">→</span><span class="sr-only">sang mục tiêu</span> <strong>${state.goalBody[key]} ${fields[key][3]}</strong></span></div>`).join('');
  scene?.setState(state);
}
function renderStep(focus=false){
  $('[data-step-label]').textContent=`0${state.step+1} / ${['HIỆN TẠI','MỤC TIÊU','SO SÁNH','LỘ TRÌNH'][state.step]}`;
  $('#bv-panel-title').textContent=headings[state.step];$('[data-description]').textContent=descriptions[state.step];
  $('[data-measurements]').hidden=state.step>1;$('.bv-bmi').hidden=state.step===3;
  $('[data-comparison]').hidden=state.step!==2;$('[data-fitness]').hidden=state.step!==3;
  $('[data-next]').hidden=state.step===3;$('[data-next]').textContent=['ĐẶT MỤC TIÊU →','SO SÁNH VÓC DÁNG →','CHỌN MỤC TIÊU TẬP LUYỆN →'][state.step]||'';
  $$('[data-step]').forEach(button=>{button.disabled=Number(button.dataset.step)>1&&!state.goalBody;button.removeAttribute('aria-current');if(Number(button.dataset.step)===state.step)button.setAttribute('aria-current','step');});
  if(state.step<2)renderFields();
  updateSummary();if(focus)$('#bv-panel-title').focus({preventScroll:true});
}
function goTo(step){
  const invalid=$('[data-number][aria-invalid="true"]');
  if(invalid){$('[data-form-error]').textContent='Kiểm tra số đo được đánh dấu trước khi tiếp tục.';invalid.focus();return;}
  if(step>0&&!state.goalBody)state.goalBody={...state.currentBody};
  state.step=step;state.mode=step===0?'current':step===1?'goal':'compare';renderStep(true);
}
root.addEventListener('input',event=>{
  const input=event.target,key=input.dataset.number||input.dataset.range;
  if(!key)return;
  const value=validateMeasurement(key,input.value),field=input.closest('[data-field]');
  if(value===null){input.setAttribute('aria-invalid','true');field.querySelector('.bv-error').textContent=`Nhập từ ${fields[key][1]} đến ${fields[key][2]} ${fields[key][3]}.`;return;}
  field.querySelector('.bv-error').textContent='';$('[data-form-error]').textContent='';
  field.querySelectorAll('input').forEach(el=>{el.removeAttribute('aria-invalid');if(el!==input)el.value=value;if(el.type==='range')el.setAttribute('aria-valuenow',value);});
  const stateKey=state.step===1?'goalBody':'currentBody';state[stateKey]={...state[stateKey],[key]:value};updateSummary();
});
root.addEventListener('change',event=>{if(event.target.name==='bv-gender'){state.currentBody={...state.currentBody,gender:event.target.value};updateSummary();}});
$$('[data-step]').forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.step))));
$('[data-next]').addEventListener('click',()=>goTo(state.step+1));
$$('[data-mode]').forEach(button=>button.addEventListener('click',()=>{state.mode=button.dataset.mode;updateSummary();}));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{scene?.view(button.dataset.view);$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===(button.dataset.view==='reset'?'front':button.dataset.view))));}));
$('#bv-split').addEventListener('input',event=>{const value=Number(event.target.value);scene?.setSplit(value);$('.bv-divider').style.left=`${value}%`;event.target.setAttribute('aria-valuenow',value);});
$('.bv-goals').insertAdjacentHTML('beforeend',goals.map(([title],i)=>`<label><input type="radio" name="bv-goal" value="${i}"><span>${title}</span></label>`).join(''));
$('.bv-goals').addEventListener('change',event=>{state.selectedGoal=Number(event.target.value);$('[data-goal-title]').textContent=goals[state.selectedGoal][0];$('[data-recommendation]').textContent=goals[state.selectedGoal][1];$('.bv-recommendation').hidden=false;$('.bv-conversion').hidden=false;});
const contact=document.querySelector('.floating-contact__item[href^="https://zalo.me/"]');
if(contact){$('[data-contact]').href=contact.href;$('[data-contact]').target='_blank';$('[data-contact]').rel='noopener noreferrer';}
const dialog=$('.bv-reset-dialog');$('[data-reset]').addEventListener('click',()=>dialog.showModal());
dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){state=createState();$('.bv-recommendation').hidden=true;$('.bv-conversion').hidden=true;$$('[name="bv-goal"]').forEach(el=>el.checked=false);$('[data-form-error]').textContent='';$('#bv-split').value=50;$('.bv-divider').style.left='50%';scene?.setSplit(50);scene?.view('front');$('[data-view="front"]').setAttribute('aria-pressed','true');renderStep(true);}});
function fallback(message){$('.bv-loading').hidden=false;$('[data-load-message]').textContent=message;$('[data-retry]').hidden=false;root.dataset.viewer='fallback';}
async function loadScene(){
  if(loading)return;loading=true;scene?.dispose();scene=null;
  $('[data-retry]').hidden=true;$('[data-load-message]').textContent='Đang chuẩn bị mô hình…';
  try{const {createScene}=await import('./scene.js');scene=createScene($('.bv-stage'),fallback,()=>$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false')));scene.setState(state);scene.setSplit(Number($('#bv-split').value));$('.bv-loading').hidden=true;root.dataset.viewer='ready';$('[data-view="front"]').setAttribute('aria-pressed','true');}
  catch{fallback('Trình duyệt của bạn hiện không hỗ trợ chế độ mô phỏng 3D hoặc không thể tải mô hình. Bạn vẫn có thể nhập số đo, so sánh và chọn mục tiêu.');}
  finally{loading=false;}
}
$('[data-retry]').addEventListener('click',loadScene);
window.addEventListener('pagehide',()=>{scene?.dispose();scene=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)loadScene();});
renderStep();loadScene();
