import {fields,createState,validateMeasurement,calculateBMI,configureCalibrationFields} from './state.js';
import {calibratedFields,loadCalibration,mapMeasurements} from './normalization.js';
import {mapHeight} from './height-calibration.js';

const root=document.querySelector('.body-visualizer');
const $=selector=>root.querySelector(selector);
const $$=selector=>[...root.querySelectorAll(selector)];
let state=createState(),scene=null,loading=false,pageInactive=false;
let uxProfiles=null;
export function inspectVisualizer({includeGeometry=false}={}){return {state:structuredClone(state),inputs:Object.fromEntries($$('[data-number]').map(el=>[el.dataset.number,{raw:el.value,invalid:el.getAttribute('aria-invalid')==='true'}])),viewer:scene?.inspect()||null,...(includeGeometry?{geometry:scene?.inspectGeometry()||null}:{})};}
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
// Guidance intentionally stops at the region/type supported by the QA landmarks.
// Those landmarks do not establish maximum girth, navel level or clinical endpoints.
const measurementGuidance={
  chest:'Số đo chu vi quanh vùng ngực, tính bằng cm; không phải chiều ngang ngực.',
  waist:'Số đo chu vi quanh vùng eo, tính bằng cm; không phải chiều ngang bụng.',
  hip:'Số đo chu vi quanh vùng hông, tính bằng cm; không phải chiều ngang hông.',
  shoulder:'Khoảng cách ngang giữa hai đầu vai, tính bằng cm. Không đo vòng quanh vai hoặc men theo đường qua cổ.',
  arm:'Số đo chu vi quanh một bắp tay, tính bằng cm; không phải chiều dài tay hoặc tổng hai tay.',
  thigh:'Số đo chu vi quanh một đùi, tính bằng cm; không phải tổng hai đùi.',
  calf:'Số đo chu vi quanh một bắp chân, tính bằng cm; không phải chiều dài chân.'
};
function fieldMarkup(key){
  const [label,min,max,unit]=fields[key],value=editedBody()[key],valid=Number.isFinite(value);
  const helper=key==='weight'?'Cân nặng dùng để tính BMI và so sánh mục tiêu; không trực tiếp thay đổi mô hình 3D.':key==='inseam'?'Chiều dài chân hiện chưa thay đổi mô hình 3D.':'';
  const description=`bv-unit-${key} bv-error-${key} bv-empty-${key}${helper?` bv-${key}-help`:''}${key in calibratedFields?` bv-clamp-${key}`:''}`;
  return `<div class="bv-field" data-field="${key}"><div class="bv-field__top"><div class="bv-field-label"><label for="bv-${key}">${label}</label>${measurementGuidance[key]?`<details class="bv-measure-help"><summary aria-label="Cách đo ${label.toLowerCase()}">?</summary><p>${measurementGuidance[key]}</p></details>`:''}</div><div><input id="bv-${key}" data-number="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${key in calibratedFields||key==='height'?'any':'0.1'}" value="${valid?value:''}" aria-describedby="${description}"><span id="bv-unit-${key}">${unit}</span></div></div><input type="range" data-range="${key}" min="${min}" max="${max}" step="0.1" value="${valid?value:(min+max)/2}" aria-label="${label}" aria-describedby="${description}" aria-valuemin="${min}" aria-valuemax="${max}" ${valid?`aria-valuenow="${value}"`:'aria-valuetext="Chưa nhập số đo"'}><small id="bv-empty-${key}" class="bv-field-help" ${valid?'hidden':''}>Chưa nhập số đo · Kéo thanh trượt hoặc nhập số để chọn.</small>${helper?`<small id="bv-${key}-help" class="bv-field-help">${helper}</small>`:''}${measurementGuidance[key]?`<small id="bv-clamp-${key}" class="bv-field-help bv-clamp" role="status" hidden>Mô hình đã đạt giới hạn hiển thị cho số đo này. Số bạn nhập vẫn được giữ nguyên.</small>`:''}<small id="bv-error-${key}" class="bv-error"></small></div>`;
}
function updateFieldFeedback(){
  const active=document.activeElement?.closest('[data-field]');
  const mapped=uxProfiles&&state.step<2?mapMeasurements(editedBody(),uxProfiles):null;
  $$('[data-field]').forEach(field=>{
    const key=field.dataset.field,input=field.querySelector('[data-number]'),slider=field.querySelector('[data-range]');
    const valid=validateMeasurement(key,input.value)!==null;
    const empty=input.value.trim()===''&&!input.validity.badInput;
    const note=field.querySelector('#bv-empty-'+key);
    note.hidden=valid;
    note.textContent=empty?'Chưa nhập số đo · Kéo thanh trượt hoặc nhập số để chọn.':'Chưa có số đo hợp lệ · Kéo thanh trượt hoặc sửa số đã nhập.';
    field.dataset.empty=String(!valid);
    if(!valid){slider.removeAttribute('aria-valuenow');slider.setAttribute('aria-valuetext',empty?'Chưa nhập số đo':'Số đo không hợp lệ');}
    const clamp=field.querySelector('.bv-clamp');
    if(clamp)clamp.hidden=!(active===field&&valid&&mapped?.debug[key]?.clamped);
  });
}
function renderFields(){
  const goal=state.step===1;
  $('[data-measurements]').innerHTML=goal ? `<div class="bv-goal-note">MỤC TIÊU CỦA BẠN <span>Khởi tạo từ số đo hiện tại lúc tạo mục tiêu. Chỉnh số đo hiện tại sau đó không tự thay đổi mục tiêu.</span></div>${['weight','waist','hip','chest','thigh','calf'].map(fieldMarkup).join('')}` : `<fieldset class="bv-gender"><legend>Kiểu mô hình</legend><p id="bv-gender-help" class="bv-field-help">Hiện chỉ mô phỏng mẫu nam; lựa chọn này chưa thay đổi mô hình 3D.</p>${[['female','Nữ'],['male','Nam'],['neutral','Trung lập']].map(([value,label])=>`<label><input type="radio" name="bv-gender" aria-describedby="bv-gender-help" value="${value}" ${state.currentBody.gender===value?'checked':''}><span>${label}</span></label>`).join('')}</fieldset>${['height','weight','chest','waist','hip','inseam'].map(fieldMarkup).join('')}<details class="bv-advanced"><summary>Thêm số đo chi tiết</summary>${['shoulder','arm','thigh','calf'].map(fieldMarkup).join('')}</details>`;
}
function updateSummary({updateGeometry=true}={}){
  const m=state.mode==='goal'?state.goalBody:state.currentBody;
  // Visible invalid drafts must never borrow BMI from last-known-valid state.
  const invalidDraft=state.step<2&&['height','weight'].some(key=>{
    const input=$('[data-number="'+key+'"]');
    return input&&(input.getAttribute('aria-invalid')==='true'||validateMeasurement(key,input.value)===null);
  });
  const bmi=invalidDraft?null:calculateBMI(m.height,m.weight);
  $('[data-bmi]').textContent=bmi??'—';
  $('[data-bmi-label]').textContent=state.mode==='goal'?'BMI mục tiêu · tham khảo':'BMI hiện tại · tham khảo';
  $('[data-bmi-unavailable]').hidden=bmi!==null;
  updateFieldFeedback();
  $('[data-bmi]').setAttribute('aria-label',bmi===null?'BMI chưa khả dụng':'BMI '+bmi);
  $('[data-height-clamp]').hidden=!mapHeight(m.height).clamped;
  $('[data-model-label]').textContent=state.mode==='compare'?'HIỆN TẠI / MỤC TIÊU':state.mode==='goal'?'MỤC TIÊU':'HIỆN TẠI';
  for(const selector of ['.bv-split','.bv-divider','.bv-compare-labels'])$(selector).hidden=state.mode!=='compare';
  $$('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  if(state.goalBody)$('[data-differences]').innerHTML=['weight','chest','waist','hip','thigh','calf'].map(key=>`<div class="bv-difference"><span>${fields[key][0]}</span><span>${state.currentBody[key]??'—'} <span aria-hidden="true">→</span><span class="sr-only">sang mục tiêu</span> <strong>${state.goalBody[key]??'—'} ${fields[key][3]}</strong></span></div>`).join('');
  if(updateGeometry)scene?.setState(state);
}
function renderStep(focus=false){
  modelAccess?.reset();
  $('[data-step-label]').textContent=`0${state.step+1} / ${['HIỆN TẠI','MỤC TIÊU','SO SÁNH','LỘ TRÌNH'][state.step]}`;
  $('#bv-panel-title').textContent=headings[state.step];$('[data-description]').textContent=descriptions[state.step];
  $('[data-measurements]').hidden=state.step>1;$('.bv-bmi').hidden=state.step===3;
  $('[data-comparison]').hidden=state.step!==2;$('[data-fitness]').hidden=state.step!==3;
  $('[data-next]').hidden=state.step===3;$('[data-next]').textContent=['ĐẶT MỤC TIÊU →','SO SÁNH VÓC DÁNG →','CHỌN MỤC TIÊU TẬP LUYỆN →'][state.step]||'';
  $$('[data-step]').forEach(button=>{button.disabled=Number(button.dataset.step)>1&&!state.goalBody;button.removeAttribute('aria-current');if(Number(button.dataset.step)===state.step)button.setAttribute('aria-current','step');});
  if(state.step<2)renderFields();
  updateSummary();if(focus){
    const heading=$('#bv-panel-title');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
}
function goTo(step){
  const invalid=$('[data-number][aria-invalid="true"]');
  if(invalid){$('[data-form-error]').textContent='Kiểm tra số đo được đánh dấu trước khi tiếp tục.';invalid.focus();return;}
  if(step>0&&!state.goalBody)state.goalBody={...state.currentBody};
  state.step=step;state.mode=step===0?'current':step===1?'goal':'compare';renderStep(true);
}
root.addEventListener('focusin',updateFieldFeedback);
root.addEventListener('focusout',()=>queueMicrotask(updateFieldFeedback));
root.addEventListener('input',event=>{
  const input=event.target,key=input.dataset.number||input.dataset.range;
  if(!key)return;
  const value=validateMeasurement(key,input.value),field=input.closest('[data-field]');
  if(value===null){const optionalEmpty=key in calibratedFields&&input.value.trim()===''&&!input.validity.badInput;input.setAttribute('aria-invalid',String(!optionalEmpty));field.querySelector('.bv-error').textContent=optionalEmpty?'':`Nhập từ ${fields[key][1]} đến ${fields[key][2]} ${fields[key][3]}.`;
    if(key in calibratedFields||key==='height'){const stateKey=state.step===1?'goalBody':'currentBody';state[stateKey]={...state[stateKey],[key]:null};const slider=field.querySelector('[data-range]');slider.removeAttribute('aria-valuenow');slider.setAttribute('aria-valuetext',optionalEmpty?'Chưa nhập số đo':'Số đo không hợp lệ');updateSummary();}else if(key==='weight')updateSummary({updateGeometry:false});updateFieldFeedback();return;}
  field.querySelector('.bv-error').textContent='';$('[data-form-error]').textContent='';
  field.querySelectorAll('input').forEach(el=>{el.removeAttribute('aria-invalid');if(el!==input)el.value=value;if(el.type==='range'){el.setAttribute('aria-valuenow',el.value);el.removeAttribute('aria-valuetext');}});
  const stateKey=state.step===1?'goalBody':'currentBody';state[stateKey]={...state[stateKey],[key]:value};updateSummary({updateGeometry:key!=='weight'});
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
dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){state=createState();state.currentBody.height=null;for(const key of Object.keys(calibratedFields))state.currentBody[key]=null;scene?.resetProductionMorphs();$('.bv-recommendation').hidden=true;$('.bv-conversion').hidden=true;$$('[name="bv-goal"]').forEach(el=>el.checked=false);$('[data-form-error]').textContent='';$('#bv-split').value=50;$('.bv-divider').style.left='50%';scene?.setSplit(50);renderStep(true);}});
function fallback(message){$('.bv-loading').hidden=false;$('[data-load-message]').textContent=message;$('[data-retry]').hidden=false;root.dataset.viewer='fallback';}
async function loadScene(){
  if(loading)return;loading=true;scene?.dispose();scene=null;
  $('[data-retry]').hidden=true;$('[data-load-message]').textContent='Đang chuẩn bị mô hình…';
  try{const profiles=await loadCalibration();uxProfiles=profiles;configureCalibrationFields(profiles);for(const [key] of Object.entries(profiles)){const field=$(`[data-field="${key}"]`);field?.querySelectorAll('input').forEach(input=>{input.min=fields[key][1];input.max=fields[key][2];if(input.type==='range'){input.setAttribute('aria-valuemin',input.min);input.setAttribute('aria-valuemax',input.max);}});}const {createScene}=await import('./scene.js');const loaded=await createScene($('.bv-stage'),fallback,()=>$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false')));if(pageInactive){loaded.dispose();return;}scene=loaded;scene.setState(state);scene.setSplit(Number($('#bv-split').value));$('.bv-loading').hidden=true;root.dataset.viewer='ready';updateFieldFeedback();$('[data-view="front"]').setAttribute('aria-pressed','true');}
  catch{fallback('Trình duyệt của bạn hiện không hỗ trợ chế độ mô phỏng 3D hoặc không thể tải mô hình. Bạn vẫn có thể nhập số đo, so sánh và chọn mục tiêu.');}
  finally{loading=false;}
}
$('[data-retry]').addEventListener('click',loadScene);
window.addEventListener('pagehide',()=>{pageInactive=true;scene?.dispose();scene=null;});
window.addEventListener('pageshow',event=>{pageInactive=false;if(event.persisted&&!loading)loadScene();});
const modelAccess=createModelAccess();
renderStep();loadScene();

// Page-local navigation only. The viewer host, scene and data are never changed.
function createModelAccess(){
  const small=matchMedia('(max-width: 991.98px)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const quick=$('[data-model-quick]'),back=$('[data-model-return]'),panel=$('.bv-panel'),stage=$('.bv-stage'),viewer=$('.bv-viewer');
  const header=document.querySelector('.header'),vv=window.visualViewport;
  const inline=document.createElement('button');inline.type='button';inline.className='bv-model-action bv-model-inline';inline.hidden=true;inline.dataset.modelInline='';
  let anchor=null,lastField=null,lastControl=null,keyboardNavigation=false,away=false,inForm=false,editing=false,headerHeight=65;
  let baseline=vv?.height||innerHeight,resizeTimer=0,focusTimer=0,operation=0,stageObserver,formObserver,fieldObserver,fieldBlocked=false;
  const context=()=>state.step===0?'HIỆN TẠI':'MỤC TIÊU';
  const eligible=()=>small.matches&&state.step<2;
  const editable=()=>document.activeElement?.matches('input[type="number"],textarea,[contenteditable="true"]');
  const competing=()=>!!document.querySelector('dialog[open],.floating-contact.is-open,.navigation.open,[data-reload-promo]:not([hidden])')||document.body.classList.contains('nav-open')||document.body.classList.contains('modal-open');
  const validAnchor=()=>anchor&&anchor.step===state.step&&$(`[data-field="${anchor.key}"]`);
  function hide(button){if(!button.hidden&&document.activeElement===button){const target=lastField?.isConnected?lastField:$('#bv-panel-title');target.tabIndex=-1;target.focus({preventScroll:true});}button.hidden=true;}
  function update(){
    const allowed=eligible()&&!competing();
    const label=`Xem mô hình · ${context()}`;
    if(quick.textContent!==label)quick.textContent=label;
    if(inline.textContent!==label)inline.textContent=label;
    const show=allowed&&away&&inForm&&!anchor;
    if(show&&!editing&&!fieldBlocked)quick.hidden=false;else hide(quick);
    if(show&&editing&&lastField?.isConnected){if(inline.parentElement!==lastField)lastField.append(inline);inline.hidden=false;}else hide(inline);
    if(allowed&&validAnchor()){back.textContent=`Quay lại số đo · ${fields[anchor.key][0]}`;back.setAttribute('aria-label',`${back.textContent} · ${context()}`);back.hidden=false;}else hide(back);
  }
  function observeField(field){
    fieldObserver?.disconnect();fieldBlocked=false;
    if(!field)return;
    // A focused field crossing the utility band takes priority over the utility.
    fieldObserver=new IntersectionObserver(entries=>{fieldBlocked=entries[0].isIntersecting;update();},{rootMargin:`-${headerHeight}px 0px -${Math.max(0,innerHeight-headerHeight-52)}px 0px`,threshold:0});
    fieldObserver.observe(field);
  }
  function observers(){
    headerHeight=header?.getBoundingClientRect().height||65;root.style.setProperty('--bv-header-height',`${headerHeight}px`);
    const slot=$('.bv-quick-slot').getBoundingClientRect();root.style.setProperty('--bv-utility-left',`${slot.left}px`);root.style.setProperty('--bv-utility-width',`${slot.width}px`);
    stageObserver?.disconnect();formObserver?.disconnect();
    stageObserver=new IntersectionObserver(entries=>{const bottom=entries[0].boundingClientRect.bottom;if(bottom<=headerHeight-6)away=true;else if(bottom>=headerHeight+6)away=false;update();},{rootMargin:`-${headerHeight-6}px 0px 0px 0px`,threshold:[0,.04]});
    formObserver=new IntersectionObserver(entries=>{inForm=entries[0].isIntersecting;update();},{rootMargin:`-${headerHeight+52}px 0px 0px 0px`,threshold:0});
    // Wait for the whole viewer (including camera buttons) to clear the header.
    stageObserver.observe(viewer);formObserver.observe(panel);observeField(lastField);update();
  }
  function viewportChanged(){
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
      const height=vv?.height||innerHeight;
      if(!editable()&&!editing)baseline=Math.max(baseline,height);
      editing=!!editable()&&(baseline-height>100||matchMedia('(pointer: coarse)').matches);
      observers();
    },100);
  }
  function focusChanged(event){
    const field=event.target.closest?.('[data-field]');
    if(field){lastField=field;if(event.target.matches('input'))lastControl=event.target.type;observeField(field);}
    // Touch number entry is treated conservatively even before the OS resizes.
    editing=!!editable()&&(baseline-(vv?.height||innerHeight)>100||matchMedia('(pointer: coarse)').matches);
    update();
  }
  function saveAnchor(){
    const rendered=$$('[data-field]').filter(e=>e.getClientRects().length&&!e.closest('.bv-advanced:not([open])'));
    const visible=rendered.filter(e=>e.getBoundingClientRect().bottom>headerHeight+52&&e.getBoundingClientRect().top<(vv?.height||innerHeight));
    const field=visible.includes(lastField)?lastField:visible[0]||rendered.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-headerHeight)-Math.abs(b.getBoundingClientRect().top-headerHeight))[0];if(!field)return null;
    return {step:state.step,key:field.dataset.field,control:field===lastField?lastControl:null,advanced:!!$('.bv-advanced')?.open,helpers:$$('.bv-measure-help').map(e=>({key:e.closest('[data-field]').dataset.field,open:e.open})),offset:field.getBoundingClientRect().top,keyboard:keyboardNavigation};
  }
  async function settleViewport(){
    // Bounded quiet-period wait; no render loop and no focus/scroll per resize.
    let previous='',stable=0;
    for(let i=0;i<12&&stable<3;i++){await new Promise(resolve=>setTimeout(resolve,50));const next=`${vv?.height||innerHeight}/${vv?.offsetTop||0}`;stable=next===previous?stable+1:0;previous=next;}
  }
  async function view(){
    if(!eligible()||competing())return;
    const saved=saveAnchor();if(!saved)return;
    const token=++operation;anchor=saved;
    if(editable())document.activeElement.blur();editing=false;
    stage.focus({preventScroll:true});update();await settleViewport();
    if(token!==operation||!validAnchor()||!eligible()||competing())return;
    window.scrollTo({top:scrollY+viewer.getBoundingClientRect().top-headerHeight-8,behavior:motion.matches?'instant':'smooth'});
  }
  async function returnToField(){
    const field=validAnchor();if(!field)return;
    const saved=anchor,token=++operation;
    const advanced=$('.bv-advanced');if(advanced&&(saved.advanced||advanced.contains(field)))advanced.open=true;
    for(const helper of saved.helpers){const disclosure=$(`[data-field="${helper.key}"] .bv-measure-help`);if(disclosure)disclosure.open=helper.open;}
    await settleViewport();if(token!==operation||state.step!==saved.step||!eligible()||competing())return;
    anchor=null;lastField=field;field.tabIndex=-1;
    const control=saved.keyboard&&saved.control?field.querySelector(`input[type="${saved.control}"]`):null;
    (control||field).focus({preventScroll:true});
    const height=vv?.height||innerHeight,offset=Math.max(headerHeight+56,Math.min(saved.offset,height-Math.min(field.offsetHeight,200)-24));
    window.scrollTo({top:scrollY+field.getBoundingClientRect().top-offset,behavior:motion.matches?'instant':'smooth'});update();
  }
  quick.addEventListener('click',view);inline.addEventListener('click',view);back.addEventListener('click',returnToField);
  // Keep the inline action alive until click even when its source input blurs.
  [quick,inline,back].forEach(button=>button.addEventListener('pointerdown',event=>event.preventDefault()));
  document.addEventListener('pointerdown',()=>{keyboardNavigation=false;},true);
  document.addEventListener('keydown',event=>{if(['Tab','Enter',' '].includes(event.key))keyboardNavigation=true;},true);
  root.addEventListener('focusin',focusChanged);
  root.addEventListener('focusout',()=>{clearTimeout(focusTimer);focusTimer=setTimeout(()=>{editing=!!editable()&&(baseline-(vv?.height||innerHeight)>100||matchMedia('(pointer: coarse)').matches);update();},0);});
  const suppression=new MutationObserver(update);
  [document.body,document.querySelector('.floating-contact'),...document.querySelectorAll('dialog,[data-reload-promo]')].filter(Boolean).forEach(e=>suppression.observe(e,{attributes:true,attributeFilter:['class','open','hidden']}));
  window.addEventListener('resize',viewportChanged);vv?.addEventListener('resize',viewportChanged);
  small.addEventListener('change',()=>{baseline=vv?.height||innerHeight;reset();});
  function reset(){operation++;anchor=null;if(document.activeElement===inline)$('#bv-panel-title').focus({preventScroll:true});lastField=null;lastControl=null;fieldBlocked=false;editing=false;fieldObserver?.disconnect();inline.remove();root.classList.toggle('bv-model-access',eligible());observers();}
  return {reset};
}
// Explicit local QA mode only; normal visitors do not load or see the panel.
if(new URLSearchParams(location.search).has('morph-debug'))import('./debug.js').then(({mountMorphDebug})=>mountMorphDebug(root,inspectVisualizer));
