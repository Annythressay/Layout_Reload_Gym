import {inputPolicyRange} from './input-policy.js';
import {deriveSimulation,deriveSceneState,actualDifference} from './simulation-values.js';
import {fields,createState,calculateBMI,configureCalibrationFields} from './state.js';
import {calibratedFields,loadCalibration} from './normalization.js';
import {validateDraft,displayCm,displayNumber,displayedRange,isCalibrated} from './measurement-constraints.js';

const root=document.querySelector('.body-visualizer');
const $=selector=>root.querySelector(selector);
const $$=selector=>[...root.querySelectorAll(selector)];
let state=createState(),scene=null,loading=false,pageInactive=false;
let uxProfiles=null;
let drafts={current:{},goal:{}},pendingHeight=null;
export function inspectVisualizer({includeGeometry=false}={}){return {state:structuredClone(state),drafts:structuredClone(drafts),pendingHeight:structuredClone(pendingHeight),simulation:{current:deriveSimulation(state.currentBody,uxProfiles),goal:deriveSimulation(state.goalBody,uxProfiles)},inputs:Object.fromEntries($$('[data-number]').map(el=>[el.dataset.number,{raw:el.value,invalid:el.getAttribute('aria-invalid')==='true'}])),viewer:scene?.inspect()||null,...(includeGeometry?{geometry:scene?.inspectGeometry()||null}:{})};}
const goals=[
  ['Giảm mỡ','Kết hợp tập sức mạnh, vận động tim mạch và vận động linh hoạt.'],
  ['Tăng cơ','Ưu tiên tập sức mạnh, kỹ thuật động tác và thời gian phục hồi.'],
  ['Cải thiện vóc dáng','Kết hợp sức mạnh toàn thân, kiểm soát động tác và vận động linh hoạt.'],
  ['Tăng sức mạnh','Ưu tiên các động tác sức mạnh nền tảng, tăng mức độ dần theo khả năng.'],
  ['Tăng sức bền','Kết hợp vận động tim mạch, bài tập toàn thân và phục hồi.'],
  ['Cải thiện thể lực','Luân phiên sức mạnh, vận động tim mạch và vận động linh hoạt.'],
  ['Tập luyện duy trì sức khỏe','Bắt đầu với vận động yêu thích và xây dựng lịch tập đều đặn.']
];
const headings=['SỐ ĐO HIỆN TẠI','MỤC TIÊU CỦA BẠN','SO SÁNH VÓC DÁNG','MỤC TIÊU TẬP LUYỆN'];
const descriptions=['Bắt đầu với số đo thực tế của bạn.','Điều chỉnh số đo theo mục tiêu của bạn.','Xem điểm bắt đầu và mục tiêu trong cùng một góc nhìn.','Chọn điều quan trọng nhất với bạn lúc này.'];
const editedBody=()=>state.step===1?state.goalBody:state.currentBody;
const draftBucket=()=>state.step===1?drafts.goal:drafts.current;
const policyRange=inputPolicyRange;
const validate=(key,raw,badInput=false)=>validateDraft(key,raw,{height:editedBody().height,profiles:uxProfiles,fallback:{min:fields[key][1],max:fields[key][2]},allowEmpty:isCalibrated(key),badInput});
const typedValue=(key,value)=>value==null?'':String(value);
const summaryValue=(key,value)=>value==null?'—':fields[key][3]==='cm'?displayNumber(value):String(value);
const fieldError=(key,result)=>{
  if(result.status==='unsupported')return `Nhập từ ${fields[key][1]} đến ${fields[key][2]} ${fields[key][3]}.`;
  return 'Nhập một số đo hợp lệ.';
};
// Product protocols are distinct from calibration measurement planes.
const measurementGuidance={
  height:"Đứng thẳng, bỏ giày dép và nhìn về phía trước. Giữ gót chân chạm đất, lưng tựa nhẹ vào tường.\n\nĐặt một vật phẳng ngang đỉnh đầu, đánh dấu rồi đo từ sàn đến dấu đó. Tránh tính thêm tóc hoặc phụ kiện.\n\nChiều cao điều chỉnh tỷ lệ mô hình và được dùng để tính BMI tham khảo.",
  weight:"Đặt cân trên nền phẳng, cứng. Đứng yên ở giữa cân, bỏ giày và các vật nặng trong túi.\n\nĐể dễ theo dõi, hãy cân vào cùng thời điểm trong ngày và với trang phục tương tự.\n\nCân nặng dùng để tính BMI tham khảo; thay đổi số này không làm thay đổi mô hình 3D.",
  chest:"Đo quanh phần nở nhất của ngực, thở tự nhiên.",
  waist:"Đo quanh phần eo tự nhiên hoặc phần nhỏ nhất, không hóp bụng.",
  hip:"Đo quanh phần nở nhất của hông và mông.",
  inseam:"Đo từ đáy quần theo mặt trong chân xuống mắt cá.",
  shoulder:"Đo ngang từ điểm ngoài vai trái đến điểm ngoài vai phải.",
  arm:"Đo quanh phần lớn nhất của bắp tay khi thả lỏng.",
  thigh:"Đo quanh phần lớn nhất của đùi.",
  calf:"Đo quanh phần lớn nhất của bắp chân."
};
// All icons use the same 24px line language. The short red/neutral measurement
// strokes identify the region while the icon itself remains decorative to AT.
const measurementIcons={
  height:'<circle class="bv-icon-body" cx="15" cy="4" r="2"/><path class="bv-icon-body" d="M12 8h6l1 6h-3v7h-2v-7h-3l1-6Z"/><path d="M5 3v18M3 3h4M3 21h4"/>',
  weight:'<path d="M5 8h14l2 12H3L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  chest:'<path class="bv-icon-body" d="M9 3h6l1 3 4 2-2 5-2-1 .5 5 1 4h-11l1-4 .5-5-2 1-2-5 4-2 1-3Z"/><path class="bv-icon-measure" d="M7 10h10"/>',
  waist:'<path class="bv-icon-body" d="M9 3h6l1 3 4 2-2 5-2-1 .5 5 1 4h-11l1-4 .5-5-2 1-2-5 4-2 1-3Z"/><path class="bv-icon-measure" d="M8 15h8"/>',
  hip:'<path class="bv-icon-body" d="M9 3h6l1 3 4 2-2 5-2-1 .5 5 1 4h-11l1-4 .5-5-2 1-2-5 4-2 1-3Z"/><path class="bv-icon-measure" d="M7 19h10"/>',
  inseam:'<path class="bv-icon-body" d="M7 3h10l1 5-2 13h-3l-1-10-1 10H8L6 8l1-5Z"/><path class="bv-icon-measure" d="M12 10v11"/>',
  shoulder:'<path class="bv-icon-body" d="M9 3h6l1 3 4 2-2 5-2-1 .5 5 1 4h-11l1-4 .5-5-2 1-2-5 4-2 1-3Z"/><path class="bv-icon-measure" d="M5 7h14"/>',
  arm:'<path class="bv-icon-body" d="m8 3 5 2 2 7 5 6-3 3-6-7-2-6-4-1 3-4Z"/><path class="bv-icon-measure" d="m9 10 6-2"/>',
  thigh:'<path class="bv-icon-body" d="M7 3h10l1 5-2 13h-3l-1-10-1 10H8L6 8l1-5Z"/><path class="bv-icon-measure" d="M7 10h4"/>',
  calf:'<path class="bv-icon-body" d="M7 3h10l1 5-2 13h-3l-1-10-1 10H8L6 8l1-5Z"/><path class="bv-icon-measure" d="M8 17h3"/>'
};
function updateBmiPresentation(bmi){
  const status=$('[data-bmi-status]'),range=$('[data-bmi-range]'),marker=$('[data-bmi-marker]');
  const value=bmi===null?NaN:Number(bmi);
  if(!Number.isFinite(value)){
    status.textContent='Chưa có dữ liệu';
    range.setAttribute('aria-label','Thang BMI tham khảo. Cần chiều cao và cân nặng hợp lệ để hiển thị vị trí.');
    marker.hidden=true;
    return;
  }
  status.textContent=value<18.5?'Thiếu cân':value<25?'Bình thường':value<30?'Thừa cân':'Béo phì';
  // The display scale is 15–40. Only the marker is clamped; BMI stays exact.
  marker.style.left=`${Math.max(2,Math.min(98,(value-15)/25*100))}%`;
  marker.hidden=false;
  range.setAttribute('aria-label',`Thang BMI tham khảo: ${bmi}, ${status.textContent}. Mốc: dưới 18,5 thiếu cân; 18,5 đến 24,9 bình thường; 25 đến 29,9 thừa cân; từ 30 béo phì.`);
}
function fieldMarkup(key){
  const [originalLabel,,,unit]=fields[key],label=originalLabel;
  const value=editedBody()[key],range=policyRange(key),valid=Number.isFinite(value),calibrated=isCalibrated(key),normalized=calibrated||key==='height';
  const draft=draftBucket()[key],raw=draft===undefined?typedValue(key,value):draft;
  const numberRange=normalized?displayedRange(range):range;
  const description=`bv-unit-${key} bv-error-${key} bv-empty-${key} bv-${key}-help bv-simulation-${key}${calibrated?` bv-near-${key}`:''}${key==='height'?' bv-height-transaction':''}`;
  const sliderMin=range.min,sliderMax=range.max;
  const sliderValueNow=valid?value:(sliderMin+sliderMax)/2;
  return `<div class="bv-field" data-field="${key}" data-unset="${!valid}"><div class="bv-field__top"><div class="bv-field-label"><svg class="bv-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${measurementIcons[key]}</svg><label for="bv-${key}">${label}</label><details class="bv-measure-help"><summary aria-label="Cách đo ${label.toLowerCase()}"></summary><p id="bv-${key}-help">${measurementGuidance[key]}</p></details></div><div><input id="bv-${key}" data-number="${key}" type="number" inputmode="decimal" min="${numberRange.min}" max="${numberRange.max}" step="any" value="${raw}" aria-describedby="${description}" ><span id="bv-unit-${key}">${unit}</span></div></div><input type="range" data-range="${key}" min="${sliderMin}" max="${sliderMax}" step="0.1" value="${sliderValueNow}" aria-label="${label}" aria-describedby="${description}" aria-valuemin="${range.min}" aria-valuemax="${range.max}" ${valid?`aria-valuenow="${value}" aria-valuetext="${displayCm(value)} ${unit}"`:'aria-valuetext="Chưa nhập số đo"'} ><small id="bv-empty-${key}" class="bv-field-help" ${valid?'hidden':''}>Chưa nhập số đo; mô hình giữ mức trung tính cho vùng này.</small>${calibrated?`<small id="bv-near-${key}" class="bv-field-help bv-near" role="status" hidden>Gần giới hạn mô phỏng.</small>`:''}<small id="bv-simulation-${key}" class="bv-field-help bv-simulation-status"></small><small id="bv-error-${key}" class="bv-error" role="status"></small>${calibrated?`<button type="button" class="bv-limit-action" data-use-limit="${key}" hidden></button>`:''}${key==='height'?'<div id="bv-height-transaction" class="bv-height-transaction" data-height-transaction role="status" hidden><strong>KIỂM TRA CHIỀU CAO MỚI</strong><p data-height-message></p><button type="button" data-apply-height></button><button type="button" data-cancel-height>Hủy thay đổi chiều cao</button></div>':''}</div>`;
}
function updateFieldFeedback(){
  $$('[data-field]').forEach(field=>{
    const key=field.dataset.field,input=field.querySelector('[data-number]'),slider=field.querySelector('[data-range]');
    const committed=editedBody()[key],range=policyRange(key),draft=draftBucket()[key];
    const result=draft===undefined?null:validate(key,draft,input.validity.badInput);
    const pending=key==='height'&&pendingHeight&&state.step===0;
    const invalid=Boolean(result&&!result.valid);
    if(draft===undefined&&document.activeElement!==input)input.value=typedValue(key,committed);
    const numberRange=isCalibrated(key)||key==='height'?displayedRange(range):range;
    input.min=numberRange.min;input.max=numberRange.max;
    if(uxProfiles){input.disabled=false;slider.disabled=false;}
    input.setAttribute('aria-invalid',String(invalid));
    field.querySelector('.bv-error').textContent=invalid?fieldError(key,result):'';
    const action=field.querySelector('[data-use-limit]');
    if(action){action.hidden=!(result?.status==='unsupported');if(!action.hidden)action.textContent=`Dùng giới hạn ${displayCm(result.nearest)} cm`;}
    const sim=deriveSimulation(editedBody(),uxProfiles).fields[key],info=field.querySelector('.bv-simulation-status');
    const outside=['BELOW_SIMULATION_RANGE','ABOVE_SIMULATION_RANGE'].includes(sim.simulationStatus);
    info.hidden=['NOT_APPLICABLE','UNSET'].includes(sim.simulationStatus);
    info.dataset.limited=String(outside);
    info.textContent=info.hidden?'':outside?`ⓘ Giới hạn mô phỏng — 3D hiện hỗ trợ ${sim.simulationStatus==='ABOVE_SIMULATION_RANGE'?'tối đa':'tối thiểu'} ${displayCm(sim.simulationValue)} cm${key==='height'?'':' ở chiều cao này'}. Số đo ${displayCm(committed)} cm của bạn vẫn được giữ nguyên trong phiên.`:sim.simulationStatus==='SIMULATION_UNAVAILABLE'?'Phạm vi mô phỏng 3D hiện chưa khả dụng.':`Phạm vi mô phỏng 3D: ${displayCm(sim.simulationMin)}–${displayCm(sim.simulationMax)} cm.`;
    const valueValid=Number.isFinite(committed),empty=committed==null&&draft===undefined;
    field.dataset.unset=String(committed==null);field.dataset.empty=String(empty);
    field.dataset.endpoint=String(isCalibrated(key)&&valueValid&&(committed===range.min||committed===range.max));
    const note=field.querySelector('#bv-empty-'+key);note.hidden=!empty;
    if(isCalibrated(key))field.querySelector('.bv-near').hidden=true;
    slider.min=range.min;slider.max=range.max;slider.step=.1;slider.value=valueValid?committed:(range.min+range.max)/2;
    slider.setAttribute('aria-valuemin',range.min);slider.setAttribute('aria-valuemax',range.max);
    if(valueValid){slider.setAttribute('aria-valuenow',committed);slider.setAttribute('aria-valuetext',`${displayCm(committed)} ${fields[key][3]}`);}
    else{slider.removeAttribute('aria-valuenow');slider.setAttribute('aria-valuetext','Chưa nhập số đo');}
  });
  const transaction=$('[data-height-transaction]');
  if(transaction){transaction.hidden=!pendingHeight;if(pendingHeight){transaction.querySelector('[data-height-message]').textContent=`Chiều cao ${displayCm(pendingHeight.value)} cm khiến ${pendingHeight.affected.length} số đo nằm ngoài phạm vi mô phỏng: ${pendingHeight.affected.map(key=>fields[key][0]).join(', ')}.`;transaction.querySelector('[data-apply-height]').textContent=`Áp dụng chiều cao · giữ nguyên số đo`;}}
}
function renderFields(){
  const goal=state.step===1;
  const primary=$('[data-measurements]'),secondary=$('[data-measurements-secondary]');
  if(goal){
    primary.innerHTML=`<div class="bv-goal-note">MỤC TIÊU CỦA BẠN <span>Khởi tạo từ số đo hiện tại lúc tạo mục tiêu. Chỉnh số đo hiện tại sau đó không tự thay đổi mục tiêu.</span></div><div class="bv-group-heading"><strong>SỐ ĐO MỤC TIÊU</strong><span>Điều chỉnh những thay đổi bạn muốn hướng tới.</span></div>${['weight','chest','waist','hip'].map(fieldMarkup).join('')}`;
    secondary.innerHTML=`<details class="bv-advanced"><summary>Số đo chi tiết</summary>${['thigh','calf'].map(fieldMarkup).join('')}</details>`;
  }else{
    primary.innerHTML=`<div class="bv-group-heading"><strong>SỐ ĐO CHÍNH</strong><span>Bắt đầu với 5 thông tin này.</span></div>${['height','weight','chest','waist','hip'].map(fieldMarkup).join('')}`;
    secondary.innerHTML=`<details class="bv-reference"><summary>Thông tin bổ trợ</summary>${fieldMarkup('inseam')}</details><details class="bv-advanced"><summary>Số đo chi tiết</summary>${['shoulder','arm','thigh','calf'].map(fieldMarkup).join('')}</details><details class="bv-model-type"><summary>Mẫu mô phỏng</summary><fieldset class="bv-gender"><legend class="sr-only">Kiểu mô hình</legend><p id="bv-gender-help" class="bv-field-help">Lựa chọn này chưa thay đổi hình ảnh 3D trong phiên bản hiện tại.</p>${[['female','Nữ'],['male','Nam'],['neutral','Trung lập']].map(([value,label])=>`<label><input type="radio" name="bv-gender" aria-describedby="bv-gender-help" value="${value}" ${state.currentBody.gender===value?'checked':''}><span>${label}</span></label>`).join('')}</fieldset></details>`;
  }
}
function updateSummary({updateGeometry=true}={}){
  const m=state.mode==='goal'?state.goalBody:state.currentBody;
  updateFieldFeedback();
  // Drafts never replace committed Height/Weight, including pending Height.
  const bmi=calculateBMI(m.height,m.weight);
  $('[data-bmi]').textContent=bmi??'—';
  $('[data-bmi-label]').textContent=state.mode==='goal'?'BMI mục tiêu · tham khảo':'BMI hiện tại · tham khảo';
  $('[data-bmi-unavailable]').hidden=bmi!==null;
  $('[data-bmi]').setAttribute('aria-label',bmi===null?'BMI chưa khả dụng':'BMI '+bmi);
  updateBmiPresentation(bmi);
  $('[data-model-label]').textContent=state.mode==='compare'?'HIỆN TẠI / MỤC TIÊU':state.mode==='goal'?'MỤC TIÊU':'HIỆN TẠI';
  for(const selector of ['.bv-split','.bv-divider','.bv-compare-labels'])$(selector).hidden=state.mode!=='compare';
  $$('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  if(state.goalBody)$('[data-differences]').innerHTML=['weight','chest','waist','hip','thigh','calf'].map(key=>`<div class="bv-difference"><span>${fields[key][0]}</span><span>${summaryValue(key,state.currentBody[key])} <span aria-hidden="true">→</span><span class="sr-only">sang mục tiêu</span> <strong>${summaryValue(key,state.goalBody[key])} ${fields[key][3]}</strong> <span>(${actualDifference(state.currentBody,state.goalBody,key)==null?'—':(actualDifference(state.currentBody,state.goalBody,key)>0?'+':'')+actualDifference(state.currentBody,state.goalBody,key).toFixed(1)})</span></span></div>`).join('');
  if(state.goalBody&&[state.currentBody,state.goalBody].some(body=>Object.values(deriveSimulation(body,uxProfiles).fields).some(f=>['ABOVE_SIMULATION_RANGE','BELOW_SIMULATION_RANGE'].includes(f.simulationStatus))))$('[data-differences]').insertAdjacentHTML('beforeend','<p class="bv-field-help">Một phần chênh lệch vượt phạm vi mà mô hình 3D hiện có thể thể hiện.</p>');
  if(updateGeometry)scene?.setState(deriveSceneState(state,uxProfiles));
}
function renderStep(focus=false){
  modelAccess?.reset();
  $('[data-step-label]').textContent=`0${state.step+1} / ${['HIỆN TẠI','MỤC TIÊU','SO SÁNH','LỘ TRÌNH'][state.step]}`;
  $('#bv-panel-title').textContent=headings[state.step];$('[data-description]').textContent=descriptions[state.step];
  $('[data-measurements]').hidden=state.step>1;$('[data-measurements-secondary]').hidden=state.step>1;$('[data-sample-notice]').hidden=state.step!==0;$('[data-simulation-info]').hidden=state.step>1;$('.bv-bmi').hidden=state.step===3;
  $('[data-comparison]').hidden=state.step!==2;$('[data-fitness]').hidden=state.step!==3;
  $('[data-next]').hidden=state.step===3;$('[data-next]').textContent=['TIẾP TỤC ĐẶT MỤC TIÊU →','SO SÁNH VÓC DÁNG →','CHỌN MỤC TIÊU TẬP LUYỆN →'][state.step]||'';
  $$('[data-step]').forEach(button=>{button.disabled=Number(button.dataset.step)>1&&!state.goalBody;button.removeAttribute('aria-current');if(Number(button.dataset.step)===state.step)button.setAttribute('aria-current','step');});
  if(state.step<2)renderFields();
  updateSummary();if(focus){
    const heading=$('#bv-panel-title');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
}
function goTo(step){
  if(pendingHeight){$('[data-form-error]').textContent='Áp dụng hoặc hủy thay đổi chiều cao trước khi tiếp tục.';$('[data-apply-height]').focus();return;}
  const invalid=$('[data-number][aria-invalid="true"]');
  if(invalid){$('[data-form-error]').textContent='Kiểm tra số đo được đánh dấu trước khi tiếp tục.';invalid.focus();return;}
  if(step>0&&!state.goalBody)state.goalBody={...state.currentBody};
  state.step=step;state.mode=step===0?'current':step===1?'goal':'compare';renderStep(true);
}
root.addEventListener('focusin',updateFieldFeedback);
root.addEventListener('focusout',()=>queueMicrotask(updateFieldFeedback));
const fieldFor=key=>$(`[data-field="${key}"]`);
function affectedAtHeight(height,body){
  const preview=deriveSimulation({...body,height},uxProfiles);
  return Object.keys(calibratedFields).filter(key=>['BELOW_SIMULATION_RANGE','ABOVE_SIMULATION_RANGE'].includes(preview.fields[key].simulationStatus));
}
function commit(key,value){
  const stateKey=state.step===1?'goalBody':'currentBody';
  state[stateKey]={...state[stateKey],[key]:value};
  delete draftBucket()[key];
  if(pendingHeight&&state.step===0&&key!=='height'){
    pendingHeight.affected=affectedAtHeight(pendingHeight.value,state.currentBody);
  }
  updateSummary({updateGeometry:key!=='weight'});
}
root.addEventListener('input',event=>{
  const input=event.target,key=input.dataset.number||input.dataset.range;
  if(!key)return;
  if(input.dataset.range){
    const committed=Number(input.value);
    if(key==='height'){
      const affected=affectedAtHeight(committed,state.currentBody);
      if(affected.length){drafts.current.height=typedValue(key,committed);fieldFor(key).querySelector('[data-number]').value=typedValue(key,committed);pendingHeight={value:committed,affected};updateSummary({updateGeometry:false});return;}
    }
    if(key==='height')pendingHeight=null;
    commit(key,committed);fieldFor(key).querySelector('[data-number]').value=typedValue(key,committed);return;
  }
  draftBucket()[key]=input.value;
  const result=validate(key,input.value,input.validity.badInput);
  if(!result.valid){if(key==='height')pendingHeight=null;updateSummary({updateGeometry:false});return;}
  const committed=result.value;
  if(key==='height'){
    if(committed!==state.currentBody.height){
      const affected=affectedAtHeight(committed,state.currentBody);
      if(affected.length){pendingHeight={value:committed,affected};updateSummary({updateGeometry:false});return;}
    }
    pendingHeight=null;
  }
  commit(key,committed);$('[data-form-error]').textContent='';
});
root.addEventListener('click',event=>{
  const limit=event.target.closest('[data-use-limit]');
  if(limit){const key=limit.dataset.useLimit,result=validate(key,draftBucket()[key]);if(result.status==='unsupported'){commit(key,result.nearest);fieldFor(key).querySelector('[data-number]').value=typedValue(key,result.nearest);}return;}
  if(event.target.closest('[data-apply-height]')&&pendingHeight){
    const height=pendingHeight.value,next={...state.currentBody,height};
    state.currentBody=next;pendingHeight=null;delete drafts.current.height;
    updateSummary();return;
  }
  if(event.target.closest('[data-cancel-height]')){pendingHeight=null;delete drafts.current.height;fieldFor('height').querySelector('[data-number]').value=typedValue('height',state.currentBody.height);updateSummary({updateGeometry:false});}
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
dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){state=createState();drafts={current:{},goal:{}};pendingHeight=null;$('.bv-recommendation').hidden=true;$('.bv-conversion').hidden=true;$$('[name="bv-goal"]').forEach(el=>el.checked=false);$('[data-form-error]').textContent='';$('#bv-split').value=50;$('.bv-divider').style.left='50%';scene?.setSplit(50);renderStep(true);}});
function fallback(message){$('.bv-loading').hidden=false;$('[data-load-message]').textContent=message;$('[data-retry]').hidden=false;root.dataset.viewer='fallback';}
async function loadScene(){
  if(loading)return;loading=true;scene?.dispose();scene=null;
  $('[data-retry]').hidden=true;$('[data-load-message]').textContent='Đang chuẩn bị mô hình…';
  try{const profiles=await loadCalibration();uxProfiles=profiles;configureCalibrationFields(profiles);updateFieldFeedback();const {createScene}=await import('./scene.js');const loaded=await createScene($('.bv-stage'),fallback,()=>$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false')));if(pageInactive){loaded.dispose();return;}scene=loaded;scene.setState(deriveSceneState(state,uxProfiles));scene.setSplit(Number($('#bv-split').value));$('.bv-loading').hidden=true;root.dataset.viewer='ready';updateFieldFeedback();$('[data-view="front"]').setAttribute('aria-pressed','true');}
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
