// Keep one visible scrollbar while retaining native wheel, touch and keyboard scrolling.
(() => {
  const scroller = document.querySelector('.qua-trinh-des-scroll');
  const track = document.querySelector('.about-story__scrollbar');
  if (!scroller || !track) return;
  let thumbHeight = 0;
  const update = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    track.hidden = max <= 1;
    thumbHeight = Math.max(32, track.clientHeight * scroller.clientHeight / scroller.scrollHeight);
    track.style.setProperty('--thumb-height', `${thumbHeight}px`);
    track.style.setProperty('--thumb-top', `${max > 0 ? (track.clientHeight - thumbHeight) * scroller.scrollTop / max : 0}px`);
  };
  let dragOffset = null;
  const move = (event) => {
    if (dragOffset === null) return;
    const distance = track.clientHeight - thumbHeight;
    if (distance <= 0) return;
    scroller.scrollTop = (event.clientY - track.getBoundingClientRect().top - dragOffset) / distance * (scroller.scrollHeight - scroller.clientHeight);
  };
  track.addEventListener('pointerdown', (event) => {
    dragOffset = event.target === track.firstElementChild ? event.clientY - track.firstElementChild.getBoundingClientRect().top : thumbHeight / 2;
    track.setPointerCapture(event.pointerId);
    move(event);
  });
  track.addEventListener('pointermove', move);
  track.addEventListener('lostpointercapture', () => { dragOffset = null; });
  scroller.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(scroller);
  document.fonts.ready.then(update);
  update();
})();

// ============================================================
//  About Registration Form – full version
//  Collects data → builds a pre-filled Zalo message → handoff
// ============================================================
(() => {
  const form = document.querySelector('[data-about-register]');
  if (!form) return;

  // Find the Zalo link from floating-contact for the href
  const zaloContact = document.querySelector('.floating-contact__item[href^="https://zalo.me/"]');
  const zaloHref = zaloContact ? zaloContact.href : 'https://zalo.me/0374432221';

  // Key elements
  const fName     = form.querySelector('#arf-name');
  const fPhone    = form.querySelector('#arf-phone');
  const fEmail    = form.querySelector('#arf-email');
  const fBranch   = form.querySelector('#arf-branch');
  const fGender   = form.querySelector('#arf-gender');
  const fAge      = form.querySelector('#arf-age');
  const fLevel    = form.querySelector('#arf-level');
  const fDate     = form.querySelector('#arf-date');
  const fTime     = form.querySelector('#arf-time');
  const fNote     = form.querySelector('#arf-note');
  const fConsent  = form.querySelector('#arf-consent');

  const handoff   = form.querySelector('.about-register__handoff');
  const msgArea   = form.querySelector('#about-message');
  const status    = form.querySelector('[data-about-status]');
  const copyBtn   = form.querySelector('[data-about-copy]');
  const zaloBtn   = form.querySelector('[data-about-zalo]');
  const noteCount = form.querySelector('.arf-note-count');

  // Character counter for textarea
  if (fNote && noteCount) {
    fNote.addEventListener('input', () => {
      noteCount.textContent = `${fNote.value.length} / 500`;
    });
  }

  // Set Zalo link
  if (zaloBtn) zaloBtn.href = zaloHref;

  // ---- Helpers ----
  const showError = (id, msg) => {
    const el = form.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  };
  const clearError = (id) => showError(id, '');

  const getCheckedValues = (name) =>
    [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // ---- Validation ----
  const validate = () => {
    let ok = true;

    // Service (at least one checkbox)
    const services = getCheckedValues('service');
    if (services.length === 0) {
      showError('arf-service-error', 'Vui lòng chọn ít nhất một dịch vụ quan tâm.');
      ok = false;
    } else {
      clearError('arf-service-error');
    }

    // Branch
    if (!fBranch.value) {
      showError('arf-branch-error', 'Vui lòng chọn chi nhánh tập luyện.');
      fBranch.closest('.arf-select-wrap')?.classList.add('is-invalid');
      ok = false;
    } else {
      clearError('arf-branch-error');
      fBranch.closest('.arf-select-wrap')?.classList.remove('is-invalid');
    }

    // Name
    if (!fName.value.trim()) {
      showError('arf-name-error', 'Vui lòng nhập họ và tên.');
      fName.classList.add('is-invalid');
      ok = false;
    } else {
      clearError('arf-name-error');
      fName.classList.remove('is-invalid');
    }

    // Phone
    const digits = fPhone.value.replace(/\D/g, '');
    if (!fPhone.value.trim() || digits.length < 9 || digits.length > 11) {
      showError('arf-phone-error', 'Vui lòng nhập số điện thoại hợp lệ (9–11 chữ số).');
      fPhone.classList.add('is-invalid');
      ok = false;
    } else {
      clearError('arf-phone-error');
      fPhone.classList.remove('is-invalid');
    }

    // Email (optional but must be valid if filled)
    if (fEmail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.value.trim())) {
      showError('arf-email-error', 'Email không hợp lệ.');
      fEmail.classList.add('is-invalid');
      ok = false;
    } else {
      clearError('arf-email-error');
      fEmail.classList.remove('is-invalid');
    }

    // Consent
    if (!fConsent.checked) {
      showError('arf-consent-error', 'Vui lòng đồng ý với chính sách bảo mật để tiếp tục.');
      ok = false;
    } else {
      clearError('arf-consent-error');
    }

    return ok;
  };

  // ---- Build message ----
  const buildMessage = () => {
    const services = getCheckedValues('service');
    const goals    = getCheckedValues('goal');
    const lines = [
      'Xin chào RELOAD, tôi muốn được tư vấn và đăng ký tập luyện.',
      '',
      `Chi nhánh:        ${fBranch.value}`,
      `Dịch vụ:          ${services.length ? services.join(', ') : '–'}`,
      '',
      `Họ và tên:        ${fName.value.trim()}`,
      `Số điện thoại:    ${fPhone.value.trim()}`,
      fEmail.value.trim() ? `Email:            ${fEmail.value.trim()}` : '',
      fGender?.value ? `Giới tính:        ${fGender.value}` : '',
      fAge?.value   ? `Độ tuổi:          ${fAge.value}` : '',
      '',
      `Mục tiêu:         ${goals.length ? goals.join(', ') : '–'}`,
      fLevel?.value ? `Kinh nghiệm:      ${fLevel.value}` : '',
      '',
      fDate?.value ? `Ngày mong muốn:   ${formatDate(fDate.value)}` : '',
      fTime?.value ? `Khung giờ:        ${fTime.value}` : '',
      fNote?.value.trim() ? `\nGhi chú:\n${fNote.value.trim()}` : '',
    ].filter(l => l !== '');
    return lines.join('\n');
  };

  // ---- Submit ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const firstError = form.querySelector('.arf-error:not([hidden])');
      if (firstError) firstError.scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    const msg = buildMessage();
    if (msgArea) msgArea.value = msg;
    if (status) status.textContent = 'Nội dung đã soạn sẵn. Sao chép rồi mở Zalo để gửi cho RELOAD.';
    if (handoff) {
      handoff.hidden = false;
      const scrollArea = form.querySelector('.arf-scroll-area');
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
        }, 50);
      } else {
        handoff.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    }
  });

  // Reset handoff when user edits form again
  form.addEventListener('input', () => {
    if (handoff && !handoff.hidden) {
      handoff.hidden = true;
      if (msgArea) msgArea.value = '';
    }
  });
  form.addEventListener('change', () => {
    if (handoff && !handoff.hidden) {
      handoff.hidden = true;
      if (msgArea) msgArea.value = '';
    }
  });

  // ---- Copy ----
  if (copyBtn && msgArea) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(msgArea.value);
        if (status) status.textContent = 'Đã sao chép! Mở Zalo, dán nội dung và gửi cho RELOAD để hoàn tất đăng ký.';
      } catch {
        msgArea.focus();
        msgArea.select();
        if (status) status.textContent = 'Hãy sao chép nội dung đã chọn, sau đó mở Zalo để gửi cho RELOAD.';
      }
    });
  }
})();

// Custom scrollbar controller for registration form
(() => {
  const scroller = document.querySelector('.arf-scroll-area');
  const track = document.querySelector('.arf-scrollbar');
  if (!scroller || !track) return;
  let thumbHeight = 0;
  const update = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    track.hidden = max <= 1;
    thumbHeight = Math.max(36, track.clientHeight * scroller.clientHeight / scroller.scrollHeight);
    track.style.setProperty('--thumb-height', `${thumbHeight}px`);
    track.style.setProperty('--thumb-top', `${max > 0 ? (track.clientHeight - thumbHeight) * scroller.scrollTop / max : 0}px`);
  };
  let dragOffset = null;
  const move = (event) => {
    if (dragOffset === null) return;
    const distance = track.clientHeight - thumbHeight;
    if (distance <= 0) return;
    scroller.scrollTop = (event.clientY - track.getBoundingClientRect().top - dragOffset) / distance * (scroller.scrollHeight - scroller.clientHeight);
  };
  track.addEventListener('pointerdown', (event) => {
    dragOffset = event.target === track.firstElementChild ? event.clientY - track.firstElementChild.getBoundingClientRect().top : thumbHeight / 2;
    track.setPointerCapture(event.pointerId);
    move(event);
  });
  track.addEventListener('pointermove', move);
  track.addEventListener('lostpointercapture', () => { dragOffset = null; });
  scroller.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(scroller);
  document.fonts.ready.then(update);
  update();
})();

