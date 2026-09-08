/* Navigation and header */
const header = document.querySelector('.header');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
if (header && menu && navigation) {
function closeMenu(){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
menu.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!header.contains(e.target))closeMenu();});
window.addEventListener('resize',()=>{if(window.innerWidth>991)closeMenu();});
const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>35);
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
}

/* Homepage news: native scrolling keeps touch swipe available without a carousel dependency. */
document.querySelectorAll('[data-news-carousel]').forEach(carousel=>{
const viewport=carousel.querySelector('[data-news-viewport]');
const cards=[...carousel.querySelectorAll('.news-card')];
const previous=carousel.querySelector('[data-news-prev]');
const next=carousel.querySelector('[data-news-next]');
const dots=carousel.querySelector('[data-news-dots]');
if(!viewport||!cards.length||!previous||!next||!dots)return;
let currentPage=0;
let pageCount=1;
let scrollTimer;

function cardsPerView(){return Math.max(1,Number.parseInt(getComputedStyle(carousel).getPropertyValue('--news-cards-per-view'),10)||1);}
function pageTarget(page){const maxScroll=Math.max(0,viewport.scrollWidth-viewport.clientWidth);return Math.min(page*viewport.clientWidth,maxScroll);}
function updateControls(){
  previous.disabled=currentPage===0;
  next.disabled=currentPage===pageCount-1;
  [...dots.children].forEach((dot,index)=>dot.setAttribute('aria-current',String(index===currentPage)));
}
function goToPage(page,behavior='smooth'){
  currentPage=Math.max(0,Math.min(page,pageCount-1));
  viewport.scrollTo({left:pageTarget(currentPage),behavior});
  updateControls();
}
function buildDots(){
  pageCount=Math.max(1,Math.ceil(cards.length/cardsPerView()));
  currentPage=Math.min(currentPage,pageCount-1);
  dots.innerHTML='';
  for(let index=0;index<pageCount;index+=1){
    const dot=document.createElement('button');
    dot.type='button';
    dot.setAttribute('aria-label',`Xem nhóm bài viết ${index+1}`);
    dot.addEventListener('click',()=>goToPage(index));
    dots.append(dot);
  }
  goToPage(currentPage,'auto');
}
function syncPageFromScroll(){
  const maxScroll=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  currentPage=maxScroll?Math.round((viewport.scrollLeft/maxScroll)*(pageCount-1)):0;
  updateControls();
}

previous.addEventListener('click',()=>goToPage(currentPage-1));
next.addEventListener('click',()=>goToPage(currentPage+1));
viewport.addEventListener('scroll',()=>{window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(syncPageFromScroll,80);},{passive:true});
viewport.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();goToPage(currentPage-1);}if(event.key==='ArrowRight'){event.preventDefault();goToPage(currentPage+1);}});
window.addEventListener('resize',()=>{window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(buildDots,100);});
buildDots();
});

/* RELOAD Promotional Popup */
(()=>{
const promo=document.querySelector('[data-reload-promo]');
if(!promo)return;
const modal=promo.querySelector('.reload-promo__modal');
const closeButton=promo.querySelector('[data-reload-promo-close]');
const form=promo.querySelector('[data-reload-promo-form]');
const success=promo.querySelector('[data-reload-promo-success]');
const storageKey='reloadPromoClosed';
const safeStorage={get(key){try{return window.sessionStorage.getItem(key);}catch{return null;}},set(key,value){try{window.sessionStorage.setItem(key,value);}catch{}}};
let lastFocused=null;
let isOpen=false;

function submitReloadPromoLead(lead){
  // TODO: connect this payload to the approved CRM, REST API, Google Sheet or Zalo workflow.
  return lead;
}

function setFieldError(name,message){
  const field=form.elements[name];
  const error=document.querySelector(`#reload-promo-${name === 'fullName' ? 'full-name' : name}-error`);
  if(!field||!error)return;
  error.textContent=message;
  error.hidden=!message;
  if(message)field.setAttribute('aria-invalid','true');
  else field.removeAttribute('aria-invalid');
}

function validateForm(){
  const values={branch:form.elements.branch.value.trim(),fullName:form.elements.fullName.value.trim(),phone:form.elements.phone.value.trim(),email:form.elements.email.value.trim()};
  let firstInvalid=null;
  if(!values.branch){setFieldError('branch','Vui lòng chọn chi nhánh.');firstInvalid=firstInvalid||form.elements.branch;}else setFieldError('branch','');
  if(!values.fullName){setFieldError('fullName','Vui lòng nhập họ và tên.');firstInvalid=firstInvalid||form.elements.fullName;}else setFieldError('fullName','');
  const phoneDigits=values.phone.replace(/\D/g,'');
  if(!values.phone){setFieldError('phone','Vui lòng nhập số điện thoại.');firstInvalid=firstInvalid||form.elements.phone;}else if(phoneDigits.length<9||phoneDigits.length>11){setFieldError('phone','Vui lòng nhập số điện thoại hợp lệ.');firstInvalid=firstInvalid||form.elements.phone;}else setFieldError('phone','');
  if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)){setFieldError('email','Email không hợp lệ.');firstInvalid=firstInvalid||form.elements.email;}else setFieldError('email','');
  return {valid:!firstInvalid,values,firstInvalid};
}

function closePromo(){
  if(!isOpen)return;
  isOpen=false;
  promo.hidden=true;
  document.body.classList.remove('modal-open');
  safeStorage.set(storageKey,'true');
  if(lastFocused&&lastFocused!==document.body&&document.contains(lastFocused))lastFocused.focus({preventScroll:true});
}

function openPromo(){
  if(safeStorage.get(storageKey)==='true')return;
  lastFocused=document.activeElement;
  isOpen=true;
  promo.hidden=false;
  document.body.classList.add('modal-open');
  window.setTimeout(()=>{if(isOpen)closeButton?.focus({preventScroll:true});},0);
}

form?.addEventListener('submit',event=>{
  event.preventDefault();
  const result=validateForm();
  if(!result.valid){result.firstInvalid?.focus({preventScroll:true});return;}
  const lead=submitReloadPromoLead(result.values);
  void lead;
  form.hidden=true;
  success.hidden=false;
  safeStorage.set(storageKey,'true');
  success.querySelector('[data-reload-promo-close]')?.focus({preventScroll:true});
});

form?.addEventListener('input',event=>{if(event.target.name)setFieldError(event.target.name,'');});
form?.addEventListener('change',event=>{if(event.target.name)setFieldError(event.target.name,'');});
promo.addEventListener('click',event=>{if(event.target===promo.querySelector('[data-reload-promo-backdrop]')||event.target.closest?.('[data-reload-promo-close]'))closePromo();});
document.addEventListener('keydown',event=>{
  if(!isOpen)return;
  if(event.key==='Escape'){event.preventDefault();closePromo();return;}
  if(event.key!=='Tab')return;
  const focusable=[...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled])')].filter(element=>!element.hidden&&element.offsetParent!==null);
  if(!focusable.length){event.preventDefault();modal.focus();return;}
  const first=focusable[0];
  const last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

// Development reset: sessionStorage.removeItem('reloadPromoClosed');
window.setTimeout(openPromo,300);
})();
/* BMI calculator: height and weight drive the estimate; remaining fields are optional. */
(()=>{
const form=document.querySelector('[data-bmi-form]');
if(!form)return;
const resultPanel=document.querySelector('[data-bmi-result]');
const resultValue=resultPanel?.querySelector('[data-bmi-value]');
const resultStatus=resultPanel?.querySelector('[data-bmi-status]');
const resultRange=resultPanel?.querySelector('[data-bmi-range]');

function setBmiError(name,message){
  const field=form.elements[name];
  const error=document.querySelector(`#bmi-${name}-error`);
  if(!field||!error)return;
  error.textContent=message;
  error.hidden=!message;
  if(message)field.setAttribute('aria-invalid','true');
  else field.removeAttribute('aria-invalid');
}

function validateBmiField(name,min,max,label){
  const field=form.elements[name];
  const raw=field.value.trim();
  const value=field.valueAsNumber;
  if(!raw||!Number.isFinite(value)){setBmiError(name,`Vui lòng nhập ${label}.`);return null;}
  if(value<min||value>max){setBmiError(name,`${label} phải từ ${min} đến ${max}.`);return null;}
  setBmiError(name,'');
  return value;
}

function classifyBmi(bmi){
  if(bmi<18.5)return {status:'Thiếu cân',range:'Dưới ngưỡng BMI tham khảo 18.5.'};
  if(bmi<25)return {status:'Bình thường',range:'Nằm trong khoảng BMI tham khảo 18.5 – 24.9.'};
  if(bmi<30)return {status:'Thừa cân',range:'Nằm trong khoảng BMI tham khảo 25.0 – 29.9.'};
  return {status:'Béo phì',range:'Từ ngưỡng BMI tham khảo 30.0 trở lên.'};
}

form.addEventListener('submit',event=>{
  event.preventDefault();
  const height=validateBmiField('height',100,250,'chiều cao');
  const weight=validateBmiField('weight',25,300,'cân nặng');
  const firstInvalid=form.querySelector('[aria-invalid=true]');
  if(firstInvalid){resultPanel.hidden=true;firstInvalid.focus();return;}
  const heightMeters=height/100;
  const bmi=weight/(heightMeters*heightMeters);
  const classification=classifyBmi(bmi);
  resultValue.textContent=bmi.toFixed(1);
  resultStatus.textContent=classification.status;
  resultRange.textContent=classification.range;
  resultPanel.hidden=false;
});

form.addEventListener('input',event=>{
  if(event.target.name==='height'||event.target.name==='weight'){
    setBmiError(event.target.name,'');
    resultPanel.hidden=true;
  }
});
})();
/* Edit schedules here. Times and rooms are illustrative until confirmed. */
if (document.querySelector('#class-list') && document.querySelector('[data-day]')) {
const schedules = [
[['07:00','Morning Yoga','Studio A'],['08:00','HIIT','Studio B'],['17:30','Boxing Fundamentals','Boxing Area'],['18:30','Strength & Conditioning','Studio A'],['19:30','Zumba','Studio B']],
[['07:00','Mobility Flow','Studio A'],['09:00','Strength Basics','Gym Floor'],['17:00','Boxing Technique','Boxing Area'],['18:00','Pilates','Studio A'],['19:00','Dance Fitness','Studio B']],
[['07:00','Morning Yoga','Studio A'],['08:30','Core & Balance','Studio B'],['17:30','Boxing Fundamentals','Boxing Area'],['18:30','HIIT','Studio B'],['19:30','Zumba','Studio A']],
[['06:30','Sunrise Stretch','Studio A'],['08:00','Functional Strength','Gym Floor'],['17:30','Boxing Conditioning','Boxing Area'],['18:30','Pilates','Studio A'],['19:30','Dance Fitness','Studio B']],
[['07:00','Morning Yoga','Studio A'],['08:00','HIIT','Studio B'],['17:30','Boxing Fundamentals','Boxing Area'],['18:30','Full Body Strength','Gym Floor'],['19:30','Zumba','Studio B']],
[['08:00','Weekend Yoga','Studio A'],['09:00','Group Strength','Gym Floor'],['10:00','Boxing Basics','Boxing Area'],['16:00','Mobility Flow','Studio A'],['17:00','Zumba','Studio B']],
[['08:30','Recovery Yoga','Studio A'],['09:30','Core & Balance','Studio B'],['10:30','Beginner Boxing','Boxing Area'],['16:00','Stretch & Recover','Studio A']]
];
const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const tabs=[...document.querySelectorAll('[data-day]')];
function renderDay(day){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===day));tab.tabIndex=i===day?0:-1;});const list=document.querySelector('#class-list');list.setAttribute('aria-labelledby',`day-${day}`);list.innerHTML=schedules[day].map(([time,name,room])=>`<div class="class-row"><time>${time}</time><span>${name}</span><span class="room">${room}</span><button class="book-button" data-inquiry="${name} · ${days[day]} ${time}" aria-label="Book ${name} on ${days[day]} at ${time}">Book</button></div>`).join('');}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>renderDay(i));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%7;if(e.key==='ArrowLeft')next=(i+6)%7;if(e.key==='Home')next=0;if(e.key==='End')next=6;if(next!==undefined){e.preventDefault();renderDay(next);tabs[next].focus();}});});renderDay(0);
}
/* Testimonials are sample content; replace with approved member stories. */
if (document.querySelector('#testimonial-list') && document.querySelector('#testimonial-prev') && document.querySelector('#testimonial-next')) {
const members=[{name:'Linh Nguyen',image:'linh-nguyen',review:'“RELOAD gives me the space and confidence to become a stronger version of myself.”'},{name:'Minh Tran',image:'minh-tran',review:'“The coaches keep me motivated. Every session feels like another step forward.”'},{name:'Ha Vy',image:'ha-vy',review:'“From training to recovery, I have found a routine I genuinely look forward to.”'},{name:'Duc Pham',image:'duc-pham',review:'“Great equipment, a welcoming community, and support that makes a difference.”'}];
let memberIndex=0;
function renderMembers(){document.querySelector('#testimonial-list').innerHTML=Array.from({length:3},(_,i)=>members[(memberIndex+i)%members.length]).map(m=>`<article class="testimonial-card"><img src="assets/images/members/${m.image}.jpg" alt="Illustrative member portrait" loading="lazy"><div class="testimonial-content"><h3>◎ &nbsp; ${m.name}</h3><p>${m.review}</p><div class="stars" aria-label="5 out of 5 stars">★★★★★</div></div></article>`).join('');}
document.querySelector('#testimonial-prev').addEventListener('click',()=>{memberIndex=(memberIndex+members.length-1)%members.length;renderMembers();});
document.querySelector('#testimonial-next').addEventListener('click',()=>{memberIndex=(memberIndex+1)%members.length;renderMembers();});renderMembers();
}
/* Preview-safe actions: no booking or subscription is claimed without a backend. */
const infoDialog=document.querySelector('#info-dialog');
function showInfo(title,message){if (!infoDialog) return;document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-message').textContent=message;infoDialog.showModal();}
document.addEventListener('click',e=>{const inquiry=e.target.closest('[data-inquiry]');const info=e.target.closest('[data-info]');const video=e.target.closest('[data-video]');if(inquiry)showInfo(inquiry.dataset.inquiry,'Booking opens when RELOAD launches this website. This is a preview; no reservation or payment has been made.');if(info)showInfo('Stay connected',info.dataset.info);if(video)showInfo(video.dataset.video,'The RELOAD video is coming soon. This preview thumbnail is ready to be replaced with the approved film or TikTok embed.');});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
document.querySelector('.dialog-done')?.addEventListener('click',()=>infoDialog.close());
document.querySelector('#newsletter-form')?.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#newsletter-status').textContent='Newsletter signup is coming soon. Your email has not been submitted or stored.';});
/* Shared local page search: relative URLs work on static hosts and file previews. */
const searchDialog=document.querySelector('#search-dialog');
const searchInput=document.querySelector('#site-search');
const searchEntries=[['About RELOAD','about.html'],['Branches — Women & Main Club','locations.html'],['Facilities & Equipment','facilities.html'],['Gym Services','services.html'],['Class Schedule & Boxing','class-schedule.html'],['Personal Training','services.html#personal-training'],['Wellness & Acupuncture','services.html#wellness'],['Membership Pricing','membership.html'],['Member Results','about.html#results'],['Life at RELOAD — Blog','blog.html'],['Locations','locations.html'],['Contact & Free Trial','locations.html#contact']];
if (searchDialog && searchInput && document.querySelector('#search-results') && document.querySelector('.search-toggle')) {
function search(){const query=searchInput.value.trim().toLowerCase();const matches=searchEntries.filter(([label])=>label.toLowerCase().includes(query));document.querySelector('#search-results').innerHTML=matches.length?matches.map(([label,id])=>`<a href="${id}">${label} →</a>`).join(''):'<p>No matching sections. Try “gym” or “membership”.</p>';}
document.querySelector('.search-toggle').addEventListener('click',()=>{searchDialog.showModal();search();searchInput.focus();});searchInput.addEventListener('input',search);document.querySelector('#search-results').addEventListener('click',e=>{if(e.target.closest('a'))searchDialog.close();});

}
