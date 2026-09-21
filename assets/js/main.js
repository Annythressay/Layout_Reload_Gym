/* Navigation and header */
const header = document.querySelector('.header');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
if (header && menu && navigation) {
function closeMenu(){navigation.classList.remove('open');document.body.classList.remove('nav-open');menu.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Mở menu điều hướng');}
menu.addEventListener('click',()=>{const open=navigation.classList.toggle('open');document.body.classList.toggle('nav-open',open);menu.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Đóng menu điều hướng':'Mở menu điều hướng');});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!header.contains(e.target))closeMenu();});
window.matchMedia('(max-width: 991.98px)').addEventListener('change',()=>closeMenu());
document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!navigation.classList.contains('open')||document.querySelector('dialog[open]'))return;
  const targets=[...header.querySelectorAll('a,button')].filter(e=>e.getClientRects().length);
  const first=targets[0],last=targets[targets.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
header.querySelector('.search-toggle')?.addEventListener('click',closeMenu);
const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>35);
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
}

/* Homepage news: native scrolling keeps touch swipe available without a carousel dependency. */
document.querySelectorAll('[data-news-carousel]').forEach(carousel=>{
const viewport=carousel.querySelector('[data-news-viewport]');
const track=carousel.querySelector('[data-news-track]');
const cards=[...carousel.querySelectorAll('.news-card')];
const filters=[...carousel.querySelectorAll('[data-filter]')];
const empty=carousel.querySelector('[data-news-empty]');
const previous=carousel.querySelector('[data-news-prev]');
const next=carousel.querySelector('[data-news-next]');
const dots=carousel.querySelector('[data-news-dots]');
if(!viewport||!track||!cards.length||!previous||!next||!dots)return;
cards.sort((a,b)=>{
  const dateA=a.querySelector('time[datetime]')?.getAttribute('datetime')||'';
  const dateB=b.querySelector('time[datetime]')?.getAttribute('datetime')||'';
  return dateB.localeCompare(dateA);
});
track.replaceChildren(...cards);
let activeFilter='all';
let filteredCards=cards;
let currentPage=0;
let pageCount=1;
let scrollTimer;
const imageGalleries=[...carousel.querySelectorAll('[data-news-image-gallery]')].map(gallery=>{
  const slides=[...gallery.querySelectorAll('.news-card__image-slide')];
  const imagePrevious=gallery.querySelector('[data-news-image-prev]');
  const imageNext=gallery.querySelector('[data-news-image-next]');
  const counter=gallery.querySelector('[data-news-image-counter]');
  if(!slides.length)return null;
  let currentImageIndex=0;

  function showImage(index){
    currentImageIndex=(index+slides.length)%slides.length;
    slides.forEach((slide,slideIndex)=>{
      const isActive=slideIndex===currentImageIndex;
      slide.classList.toggle('is-active',isActive);
      slide.setAttribute('aria-hidden',String(!isActive));
    });
    gallery.dataset.currentImage=String(currentImageIndex);
    if(counter)counter.textContent=`${currentImageIndex+1} / ${slides.length}`;
  }

  if(slides.length<2){
    if(imagePrevious)imagePrevious.hidden=true;
    if(imageNext)imageNext.hidden=true;
    if(counter)counter.hidden=true;
  }else{
    [[imagePrevious,-1],[imageNext,1]].forEach(([button,direction])=>{
      if(!button)return;
      button.addEventListener('pointerdown',event=>event.stopPropagation());
      button.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        showImage(currentImageIndex+direction);
      });
    });
  }
  showImage(0);
  return {reset(){showImage(0);}};
}).filter(Boolean);

function cardsPerView(){return Math.max(1,Number.parseInt(getComputedStyle(carousel).getPropertyValue('--news-cards-per-view'),10)||1);}
function pageTarget(page){
  const maxScroll=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  if(!filteredCards.length)return 0;
  const firstCard=filteredCards[Math.min(page*cardsPerView(),filteredCards.length-1)];
  return Math.min(firstCard.offsetLeft-track.offsetLeft,maxScroll);
}
function updateControls(){
  previous.disabled=pageCount<=1||currentPage===0;
  next.disabled=pageCount<=1||currentPage===pageCount-1;
  [...dots.children].forEach((dot,index)=>dot.setAttribute('aria-current',String(index===currentPage)));
}
function goToPage(page,behavior='smooth'){
  currentPage=pageCount?Math.max(0,Math.min(page,pageCount-1)):0;
  viewport.scrollTo({left:pageTarget(currentPage),behavior});
  updateControls();
}
function renderTrack(){
  track.replaceChildren(...filteredCards);
  const perView=cardsPerView();
  filteredCards.forEach((card,index)=>card.classList.toggle('is-page-start',index%perView===0));
  const remainder=filteredCards.length%perView;
  const emptySlots=filteredCards.length>perView&&remainder?perView-remainder:0;
  if(emptySlots){
    const cardWidth=filteredCards[0].getBoundingClientRect().width;
    const gap=Number.parseFloat(getComputedStyle(track).columnGap)||0;
    const spacer=document.createElement('span');
    spacer.className='news-section__spacer';
    spacer.setAttribute('aria-hidden','true');
    spacer.style.setProperty('--news-spacer-width',`${Math.max(0,emptySlots*(cardWidth+gap)-gap)}px`);
    track.append(spacer);
  }
}
function buildDots(){
  renderTrack();
  pageCount=filteredCards.length?Math.ceil(filteredCards.length/cardsPerView()):0;
  currentPage=pageCount?Math.min(currentPage,pageCount-1):0;
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
function applyFilter(filter){
  activeFilter=filter;
  currentPage=0;
  imageGalleries.forEach(gallery=>gallery.reset());
  filteredCards=activeFilter==='all'?cards:cards.filter(card=>card.dataset.category===activeFilter);
  viewport.hidden=filteredCards.length===0;
  if(empty)empty.hidden=filteredCards.length!==0;
  filters.forEach(button=>{
    const isActive=button.dataset.filter===activeFilter;
    button.classList.toggle('is-active',isActive);
    button.setAttribute('aria-pressed',String(isActive));
  });
  buildDots();
}
function syncPageFromScroll(){
  let closestPage=0;
  let closestDistance=Infinity;
  for(let index=0;index<pageCount;index+=1){
    const distance=Math.abs(viewport.scrollLeft-pageTarget(index));
    if(distance<closestDistance){closestPage=index;closestDistance=distance;}
  }
  currentPage=closestPage;
  updateControls();
}

previous.addEventListener('click',()=>goToPage(currentPage-1));
next.addEventListener('click',()=>goToPage(currentPage+1));
filters.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.filter)));
viewport.addEventListener('scroll',()=>{window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(syncPageFromScroll,80);},{passive:true});
viewport.addEventListener('keydown',event=>{if(event.target.closest('[data-news-image-gallery]'))return;if(event.key==='ArrowLeft'){event.preventDefault();goToPage(currentPage-1);}if(event.key==='ArrowRight'){event.preventDefault();goToPage(currentPage+1);}});
window.addEventListener('resize',()=>{window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(buildDots,100);});
applyFilter(activeFilter);
});

/* Floating contact menu */
(()=>{
const contact=document.querySelector('[data-floating-contact]');
if(!contact)return;
const toggle=contact.querySelector('[data-floating-contact-toggle]');
const menu=contact.querySelector('[data-floating-contact-menu]');
const items=[...contact.querySelectorAll('.floating-contact__item')];
if(!toggle||!menu)return;
function setOpen(open){
  contact.classList.toggle('is-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Đóng menu liên hệ':'Mở menu liên hệ');
  menu.setAttribute('aria-hidden',String(!open));
  items.forEach(item=>item.setAttribute('tabindex',open?'0':'-1'));
}
toggle.addEventListener('click',()=>{
  const open=!contact.classList.contains('is-open');
  setOpen(open);
  if(open)items[0]?.focus();
});
document.addEventListener('click',event=>{if(contact.classList.contains('is-open')&&!contact.contains(event.target))setOpen(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&contact.classList.contains('is-open')){setOpen(false);toggle.focus();}});
setOpen(false);
})();

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
if(!document.body.classList.contains('page-body-visualizer'))window.setTimeout(openPromo,300);
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
[['07:00','Yoga buổi sáng','Studio A'],['08:00','HIIT','Studio B'],['17:30','Boxing cơ bản','Khu Boxing'],['18:30','Sức mạnh & Thể lực','Studio A'],['19:30','Zumba','Studio B']],
[['07:00','Vận động linh hoạt','Studio A'],['09:00','Sức mạnh cơ bản','Khu Gym'],['17:00','Kỹ thuật Boxing','Khu Boxing'],['18:00','Pilates','Studio A'],['19:00','Nhảy thể hình','Studio B']],
[['07:00','Yoga buổi sáng','Studio A'],['08:30','Cơ trung tâm & Thăng bằng','Studio B'],['17:30','Boxing cơ bản','Khu Boxing'],['18:30','HIIT','Studio B'],['19:30','Zumba','Studio A']],
[['06:30','Giãn cơ buổi sáng','Studio A'],['08:00','Sức mạnh chức năng','Khu Gym'],['17:30','Thể lực Boxing','Khu Boxing'],['18:30','Pilates','Studio A'],['19:30','Nhảy thể hình','Studio B']],
[['07:00','Yoga buổi sáng','Studio A'],['08:00','HIIT','Studio B'],['17:30','Boxing cơ bản','Khu Boxing'],['18:30','Sức mạnh toàn thân','Khu Gym'],['19:30','Zumba','Studio B']],
[['08:00','Yoga cuối tuần','Studio A'],['09:00','Sức mạnh nhóm','Khu Gym'],['10:00','Boxing nhập môn','Khu Boxing'],['16:00','Vận động linh hoạt','Studio A'],['17:00','Zumba','Studio B']],
[['08:30','Yoga phục hồi','Studio A'],['09:30','Cơ trung tâm & Thăng bằng','Studio B'],['10:30','Boxing cho người mới','Khu Boxing'],['16:00','Giãn cơ & Phục hồi','Studio A']]
];
const days=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const tabs=[...document.querySelectorAll('[data-day]')];
function renderDay(day){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===day));tab.tabIndex=i===day?0:-1;});const list=document.querySelector('#class-list');list.setAttribute('aria-labelledby',`day-${day}`);list.innerHTML=schedules[day].map(([time,name,room])=>`<div class="class-row"><time>${time}</time><span>${name}</span><span class="room">${room}</span><button class="book-button" data-inquiry="${name} · ${days[day]} ${time}" aria-label="Đặt lớp ${name} vào ${days[day]} lúc ${time}">ĐẶT LỚP</button></div>`).join('');}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>renderDay(i));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%7;if(e.key==='ArrowLeft')next=(i+6)%7;if(e.key==='Home')next=0;if(e.key==='End')next=6;if(next!==undefined){e.preventDefault();renderDay(next);tabs[next].focus();}});});renderDay(0);
}
/* Testimonials are sample content; replace with approved member stories. */
if (document.querySelector('#testimonial-list') && document.querySelector('#testimonial-prev') && document.querySelector('#testimonial-next')) {
const members=[{name:'Linh Nguyen',image:'linh-nguyen',review:'“RELOAD cho tôi không gian và sự tự tin để trở thành phiên bản mạnh mẽ hơn của chính mình.”'},{name:'Minh Tran',image:'minh-tran',review:'“Các huấn luyện viên luôn tiếp thêm động lực. Mỗi buổi tập đều là một bước tiến mới.”'},{name:'Ha Vy',image:'ha-vy',review:'“Từ tập luyện đến phục hồi, tôi đã tìm thấy một thói quen mà mình thực sự mong chờ mỗi ngày.”'},{name:'Duc Pham',image:'duc-pham',review:'“Thiết bị hiện đại, cộng đồng thân thiện và sự hỗ trợ tận tâm đã tạo nên khác biệt.”'}];
let memberIndex=0;
function renderMembers(){document.querySelector('#testimonial-list').innerHTML=Array.from({length:3},(_,i)=>members[(memberIndex+i)%members.length]).map(m=>`<article class="testimonial-card"><img src="assets/images/members/${m.image}.jpg" alt="Chân dung hội viên minh họa" loading="lazy"><div class="testimonial-content"><h3><i class="fa-solid fa-user" aria-hidden="true"></i> ${m.name}</h3><p>${m.review}</p><div class="stars" aria-label="5 trên 5 sao">${'<i class="fa-solid fa-star" aria-hidden="true"></i>'.repeat(5)}</div></div></article>`).join('');}
document.querySelector('#testimonial-prev').addEventListener('click',()=>{memberIndex=(memberIndex+members.length-1)%members.length;renderMembers();});
document.querySelector('#testimonial-next').addEventListener('click',()=>{memberIndex=(memberIndex+1)%members.length;renderMembers();});renderMembers();
}
/* Preview-safe actions: no booking or subscription is claimed without a backend. */
const infoDialog=document.querySelector('#info-dialog');
function showInfo(title,message){if (!infoDialog) return;document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-message').textContent=message;infoDialog.showModal();}
document.addEventListener('click',e=>{const inquiry=e.target.closest('[data-inquiry]');const info=e.target.closest('[data-info]');const video=e.target.closest('[data-video]');if(inquiry)showInfo(inquiry.dataset.inquiry,'Tính năng đặt lịch sẽ mở khi website RELOAD chính thức ra mắt. Đây là bản xem trước; chưa có lịch hẹn hoặc khoản thanh toán nào được thực hiện.');if(info)showInfo('Kết nối với RELOAD',info.dataset.info);if(video)showInfo(video.dataset.video,'Video RELOAD sẽ sớm ra mắt. Hình xem trước này đã sẵn sàng để thay bằng video chính thức hoặc nội dung TikTok được duyệt.');});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
document.querySelector('.dialog-done')?.addEventListener('click',()=>infoDialog.close());
document.querySelector('#newsletter-form')?.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#newsletter-status').textContent='Tính năng đăng ký nhận bản tin sẽ sớm ra mắt. Email của bạn chưa được gửi hoặc lưu trữ.';});
/* Shared local page search: relative URLs work on static hosts and file previews. */
const searchDialog=document.querySelector('#search-dialog');
const searchInput=document.querySelector('#site-search');
const searchEntries=[['Body Visualizer · Mô phỏng vóc dáng','body-visualizer.html'],['Giới thiệu RELOAD','about.html'],['Chi nhánh RELOAD WOMEN & RELOAD GYM','locations.html'],['Cơ sở vật chất & Thiết bị','facilities.html'],['Dịch vụ phòng gym','services.html'],['Lịch lớp & Boxing','class-schedule.html'],['Huấn luyện cá nhân','services.html#personal-training'],['Chăm sóc sức khỏe & Châm cứu','services.html#wellness'],['Bảng giá gói tập','membership.html'],['Kết quả hội viên','about.html#results'],['Tin tức RELOAD','blog.html'],['Chi nhánh','locations.html'],['Liên hệ & Đăng ký tập thử','locations.html#contact']];
if (searchDialog && searchInput && document.querySelector('#search-results') && document.querySelector('.search-toggle')) {
function search(){const query=searchInput.value.trim().toLowerCase();const matches=searchEntries.filter(([label])=>label.toLowerCase().includes(query));document.querySelector('#search-results').innerHTML=matches.length?matches.map(([label,id])=>`<a href="${id}">${label} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>`).join(''):'<p>Không tìm thấy nội dung phù hợp. Hãy thử “gym” hoặc “gói tập”.</p>';}
document.querySelector('.search-toggle').addEventListener('click',()=>{searchDialog.showModal();search();searchInput.focus();});searchInput.addEventListener('input',search);document.querySelector('#search-results').addEventListener('click',e=>{if(e.target.closest('a'))searchDialog.close();});

}

/* Change this one URL to update both the hero preview and the lightbox. */
const RELOAD_VIDEO_URL = "https://video.xx.fbcdn.net/o1/v/t2/f2/m366/AQNW8bJaGtwzDML_elazSGW4vyfogVncrD4Shujx3cZA0qOAcQQTDhjEAvExb0T0Dl516s16oCHJubQ_NbcD22XbGBP41V4zpCRFbMt6KMkfvg.mp4?_nc_cat=107&_nc_oc=AdoIOKmWFE76dcq0YS6kXgfuMQWwSRnImxiybSDEL8lO-fPEVKIfsFJxeToF6uJ-vMc&_nc_sid=5e9851&_nc_ht=scontent.fsgn5-7.fna.fbcdn.net&_nc_ohc=3mLdrTmyOiYQ7kNvwFXy4gd&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5GQUNFQk9PSy4uQzMuNzIwLmRhc2hfaDI2NC1iYXNpYy1nZW4yXzcyMHAiLCJ4cHZfYXNzZXRfaWQiOjMxODk4MDU1OTQ1NjM4NDksImFzc2V0X2FnZV9kYXlzIjoyMCwidmlfdXNlY2FzZV9pZCI6MTIzNzMsImR1cmF0aW9uX3MiOjY1LCJ1cmxnZW5fc291cmNlIjoid3d3In0%3D&ccb=17-1&vs=bcdb5ae24fc52748&_nc_vs=HBksFQIYRWZiX2VwaGVtZXJhbC8xQzQ3RjYxNDg4NEZENzE2NEY0RjAzRjIxMDA1OEQ5OF9tdF8xX3ZpZGVvX2Rhc2hpbml0Lm1wNBUAAsgBEgAVAhhAZmJfcGVybWFuZW50LzgzNDAzMkY2NzZCODA5Nzk1NUU1MTFFRjJEODVDRjlGX2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACaS1O7Vj8eqCxUCKAJDMywXQFBzMzMzMzMYGWRhc2hfaDI2NC1iYXNpYy1nZW4yXzcyMHARAHUCZarBAQA&_nc_gid=VoB8WK-9uq2ddZb-IBbh5w&_nc_map=urlgen_bucketless&_nc_zt=28&_nc_eui2=AeEJlmxH0DB7YKTvnhTUwMsBHx8fJC3W-SQfHx8kLdb5JPhpAvHr8j0C6yz65_N3zDyaCSH6m2LcO7CsdW2owLed&_nc_ss=7b2a8&oh=00_AQLIt3ZwcWEA8e4tFjJVl9KKRPG96lVuPcHcNlnbcrmj3w&oe=6AA6E721&bitrate=2517856&tag=dash_h264-basic-gen2_720p";
(() => {
  const card = document.querySelector('.video-preview, .about-hero__video');
  if (!card) return;
  const trigger = card.matches('.about-hero__video') ? card : card.querySelector('.video-preview__trigger');
  const modal = document.querySelector(`#${trigger?.getAttribute('aria-controls') || 'reload-video-modal'}`);
  if (!trigger || !modal) return;
  const preview = card.querySelector('video');
  const player = modal.querySelector('video');
  const error = modal.querySelector('.video-modal__error');
  let previousOverflow = '';
  if (preview) {
    preview.muted = true;
    preview.src = RELOAD_VIDEO_URL;
  }
  // Metadata-only preview keeps motion and bandwidth modest; playback starts on request.
  trigger.addEventListener('click', () => {
    if (modal.open) return;
    previousOverflow = document.body.style.overflow;
    preview?.pause();
    modal.showModal();
    document.body.style.overflow = 'hidden';
    error.hidden = true;
    if (!player.src) player.src = RELOAD_VIDEO_URL;
    player.play().catch(() => { if (player.error) error.hidden = false; });
  });
  player.addEventListener('error', () => { error.hidden = false; });
  modal.querySelector('.video-modal__close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.addEventListener('close', () => {
    player.pause();
    document.body.style.overflow = previousOverflow;
    trigger.focus({ preventScroll: true });
  });
})();

/* Facilities page location image gallery */
document.querySelectorAll('[data-facility-gallery]').forEach(gallery => {
  const slides = [...gallery.querySelectorAll('.facility-location__slide')];
  const prevBtn = gallery.querySelector('.facility-location__arrow--prev');
  const nextBtn = gallery.querySelector('.facility-location__arrow--next');
  const counter = gallery.querySelector('.facility-location__counter');

  if (!slides.length) return;

  let currentIndex = 0;

  function updateSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      const isActive = idx === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    if (counter) {
      const currentFormatted = String(currentIndex + 1).padStart(2, '0');
      const totalFormatted = String(slides.length).padStart(2, '0');
      counter.textContent = `${currentFormatted} / ${totalFormatted}`;
    }
  }

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    if (counter) counter.hidden = true;
  } else {
    prevBtn?.addEventListener('click', () => updateSlide(currentIndex - 1));
    nextBtn?.addEventListener('click', () => updateSlide(currentIndex + 1));
  }

  updateSlide(0);
});
