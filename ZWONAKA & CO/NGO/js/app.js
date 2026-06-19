/* NGO interactive functionality (Part 2 + Part 4/5 + SEO helpers) */

(function () {
  'use strict';

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function showMessage(container, message, kind) {
    if (!container) return;
    container.innerHTML = '';
    const el = document.createElement('div');
    el.className = `form-message form-message--${kind}`;
    el.textContent = message;
    container.appendChild(el);
  }

  // ---------- Accordion ----------
  function initAccordion() {
    const accordions = $all('[data-accordion]', document);
    accordions.forEach((acc) => {
      const items = $all('[data-accordion-item]', acc);
      items.forEach((item) => {
        const header = item.querySelector('[data-accordion-header]');
        const panel = item.querySelector('[data-accordion-panel]');
        if (!header || !panel) return;

        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        panel.hidden = true;

        const toggle = () => {
          const isOpen = header.getAttribute('aria-expanded') === 'true';
          // Optional: allow multiple open; by default we only close siblings.
          items.forEach((other) => {
            const h2 = other.querySelector('[data-accordion-header]');
            const p2 = other.querySelector('[data-accordion-panel]');
            if (!h2 || !p2 || h2 === header) return;
            h2.setAttribute('aria-expanded', 'false');
            p2.hidden = true;
          });

          header.setAttribute('aria-expanded', String(!isOpen));
          panel.hidden = isOpen;
        };

        header.addEventListener('click', toggle);
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
      });
    });
  }

  // ---------- Tabs ----------
  function initTabs() {
    const tabGroups = $all('[data-tabs]', document);
    tabGroups.forEach((group) => {
      const tabList = group.querySelector('[data-tab-list]');
      const tabs = $all('[data-tab]', group);

      if (!tabList || tabs.length === 0) return;

      const panels = $all('[data-tab-panel]', group);

      function activate(tabEl) {
        const targetId = tabEl.getAttribute('data-tab');
        tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tabEl)));
        panels.forEach((p) => {
          const show = p.getAttribute('data-tab-panel') === targetId;
          p.hidden = !show;
        });
      }

      tabs.forEach((tab) => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');
        const targetId = tab.getAttribute('data-tab');
        tab.setAttribute('aria-controls', targetId);
        tab.addEventListener('click', () => activate(tab));
      });

      // Default activate first visible
      const initial = tabs.find((t) => t.getAttribute('data-active') === 'true') || tabs[0];
      if (initial) activate(initial);
    });
  }

  // ---------- Modal (used for gallery lightbox + general popups) ----------
  function initModal() {
    const modal = $('#modal');
    const overlay = $('#modalOverlay');
    if (!modal || !overlay) return;

    const closeBtn = $('#modalClose');

    function openModal({ title, html }) {
      const titleEl = $('#modalTitle');
      const bodyEl = $('#modalBody');
      if (titleEl) titleEl.textContent = title || '';
      if (bodyEl) bodyEl.innerHTML = html || '';

      modal.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.classList.add('modal-open');

      // Focus close for accessibility
      closeBtn && closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.classList.remove('modal-open');
    }

    overlay.addEventListener('click', closeModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Expose small API
    window.NGO = window.NGO || {};
    window.NGO.modal = { openModal, closeModal };
  }

  function initGalleryLightbox() {
    const gallery = document.querySelector('[data-gallery]');
    if (!gallery) return;

    const thumbs = $all('[data-lightbox-item]', gallery);
    thumbs.forEach((t) => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        const img = t.querySelector('img');
        const fullSrc = t.getAttribute('data-full');
        const caption = t.getAttribute('data-caption') || img?.getAttribute('alt') || '';
        const src = fullSrc || img?.getAttribute('src');

        const html = `
          <figure class="lightbox-figure">
            <img class="lightbox-image" src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" />
            ${caption ? `<figcaption class="lightbox-caption">${escapeHtml(caption)}</figcaption>` : ''}
          </figure>
        `;

        window.NGO?.modal?.openModal({ title: 'Gallery', html });
      });
    });
  }

  // ---------- Dynamic search/filter ----------
  function initContentSearch() {
    const root = document.querySelector('[data-content-search]');
    if (!root) return;

    const input = root.querySelector('[data-search-input]');
    const resultsWrap = root.querySelector('[data-search-results]');
    const filterBtns = $all('[data-filter-btn]', root);

    // Dataset comes from JSON in a script tag
    const dataScript = root.querySelector('script[type="application/json"]');
    if (!dataScript) return;

    let dataset = [];
    try {
      dataset = JSON.parse(dataScript.textContent || '[]');
    } catch (e) {
      dataset = [];
    }

    let activeFilter = 'all';

    function render(items) {
      if (!resultsWrap) return;
      if (!items.length) {
        resultsWrap.innerHTML = `<div class="empty-state">No results found.</div>`;
        return;
      }

      resultsWrap.innerHTML = items
        .map(
          (it) => `
        <article class="result-card" data-anim>
          <h3 class="result-title">${escapeHtml(it.title)}</h3>
          <p class="result-meta">${escapeHtml(it.category)}</p>
          <p class="result-desc">${escapeHtml(it.description)}</p>
          ${it.tags?.length ? `<div class="result-tags">${it.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </article>
      `
        )
        .join('');
    }

    function apply() {
      const q = (input?.value || '').trim().toLowerCase();

      const filtered = dataset.filter((it) => {
        const categoryOk = activeFilter === 'all' ? true : String(it.category).toLowerCase() === String(activeFilter).toLowerCase();
        const text = `${it.title} ${it.description} ${(it.tags || []).join(' ')}`.toLowerCase();
        const searchOk = !q ? true : text.includes(q);
        return categoryOk && searchOk;
      });

      render(filtered);
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter-btn') || 'all';
        filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        apply();
      });
    });

    input && input.addEventListener('input', () => apply());

    // initial
    filterBtns.forEach((b) => b.classList.toggle('is-active', (b.getAttribute('data-filter-btn') || 'all') === 'all'));
    apply();
  }

  // ---------- Form validation helpers ----------
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function normalizePhone(phone) {
    return String(phone).replaceAll(/[^0-9+]/g, '');
  }

  function isValidPhone(phone) {
    const p = normalizePhone(phone);
    // Accepts SA-like formats and general +country digits with 7-15 digits
    const digits = p.replaceAll(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  function validateText(value, { min = 2, max = 80 } = {}) {
    const v = String(value || '').trim();
    if (!v) return { ok: false, message: 'This field is required.' };
    if (v.length < min) return { ok: false, message: `Please enter at least ${min} characters.` };
    if (v.length > max) return { ok: false, message: `Please enter no more than ${max} characters.` };
    return { ok: true };
  }

  function wireForm(formId, config) {
    const form = document.getElementById(formId);
    if (!form) return;

    const msgWrap = form.querySelector('[data-form-message]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // immediate field feedback
      const errors = [];
      const setError = (inputEl, message) => {
        const fieldWrap = inputEl.closest('.field');
        fieldWrap && fieldWrap.classList.add('has-error');
        let errEl = fieldWrap ? fieldWrap.querySelector('.field-error') : null;
        if (!errEl && fieldWrap) {
          errEl = document.createElement('div');
          errEl.className = 'field-error';
          fieldWrap.appendChild(errEl);
        }
        if (errEl) errEl.textContent = message;
        errors.push(message);
      };

      const clearErrors = () => {
        $all('.has-error', form).forEach((w) => w.classList.remove('has-error'));
        $all('.field-error', form).forEach((el) => (el.textContent = ''));
        if (msgWrap) msgWrap.innerHTML = '';
      };

      clearErrors();

      const getVal = (name) => {
        const el = form.querySelector(`[name="${name}"]`) || form.querySelector(`#${name}`);
        return el ? el.value : '';
      };

      // Required: name/email/phone/subject/message (Contact)
      const nameRes = validateText(getVal(config.nameField), { min: 2, max: 60 });
      if (!nameRes.ok) setError(form.querySelector(`[name="${config.nameField}"]`) || form.querySelector(`#${config.nameField}`), nameRes.message);

      const emailVal = getVal(config.emailField);
      if (!emailVal.trim()) {
        setError(form.querySelector(`[name="${config.emailField}"]`) || form.querySelector(`#${config.emailField}`), 'Email is required.');
      } else if (!isValidEmail(emailVal)) {
        setError(form.querySelector(`[name="${config.emailField}"]`) || form.querySelector(`#${config.emailField}`), 'Enter a valid email address (e.g. name@example.com).');
      }

      const phoneVal = getVal(config.phoneField);
      if (!phoneVal.trim()) {
        setError(form.querySelector(`[name="${config.phoneField}"]`) || form.querySelector(`#${config.phoneField}`), 'Phone number is required.');
      } else if (!isValidPhone(phoneVal)) {
        setError(form.querySelector(`[name="${config.phoneField}"]`) || form.querySelector(`#${config.phoneField}`), 'Enter a valid phone number (7–15 digits).');
      }

      const subjectVal = config.subjectField ? getVal(config.subjectField) : '';
      if (config.subjectField) {
        const s = validateText(subjectVal, { min: 3, max: 80 });
        if (!s.ok) setError(form.querySelector(`[name="${config.subjectField}"]`) || form.querySelector(`#${config.subjectField}`), s.message);
      }

      const msgVal = getVal(config.messageField);
      const msg = String(msgVal || '').trim();
      if (!msg) {
        setError(form.querySelector(`[name="${config.messageField}"]`) || form.querySelector(`#${config.messageField}`), 'Message is required.');
      } else if (msg.length < config.messageMin) {
        setError(form.querySelector(`[name="${config.messageField}"]`) || form.querySelector(`#${config.messageField}`), `Message must be at least ${config.messageMin} characters.`);
      } else if (msg.length > config.messageMax) {
        setError(form.querySelector(`[name="${config.messageField}"]`) || form.querySelector(`#${config.messageField}`), `Message must be no more than ${config.messageMax} characters.`);
      }

      // If errors exist, show friendly response
      if (errors.length) {
        showMessage(msgWrap, 'Please fix the highlighted fields and try again.', 'error');
        return;
      }

      // Processing response
      const compiled = {
        name: getVal(config.nameField),
        email: emailVal,
        phone: phoneVal,
        subject: config.subjectField ? subjectVal : '',
        message: msgVal,
      };

      const responseText = config.responseTemplate(compiled);
      showMessage(msgWrap, responseText, 'success');

      // Mailto (guaranteed without external services)
      const to = config.to;
      const subject = config.subjectLine ? config.subjectLine(compiled) : `Message from ${compiled.name}`;
      const body = `Name: ${compiled.name}\nEmail: ${compiled.email}\nPhone: ${compiled.phone}\n\nSubject: ${compiled.subject}\n\nMessage:\n${compiled.message}`;

      // Open mail client after user sees response
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      // Delay slightly to ensure message is visible
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 400);

      // Optional: reset
      // form.reset();
    });
  }

  // Enquiry form: includes extra controls (dropdown, checkboxes/radio)
  function wireEnquiryForm(formId, config) {
    const form = document.getElementById(formId);
    if (!form) return;

    const msgWrap = form.querySelector('[data-form-message]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = [];

      const clearErrors = () => {
        $all('.has-error', form).forEach((w) => w.classList.remove('has-error'));
        $all('.field-error', form).forEach((el) => (el.textContent = ''));
        if (msgWrap) msgWrap.innerHTML = '';
      };

      const setError = (inputEl, message) => {
        const fieldWrap = inputEl.closest('.field');
        fieldWrap && fieldWrap.classList.add('has-error');
        let errEl = fieldWrap ? fieldWrap.querySelector('.field-error') : null;
        if (!errEl && fieldWrap) {
          errEl = document.createElement('div');
          errEl.className = 'field-error';
          fieldWrap.appendChild(errEl);
        }
        if (errEl) errEl.textContent = message;
        errors.push(message);
      };

      clearErrors();

      const pick = (sel) => form.querySelector(sel);
      const val = (sel) => {
        const el = pick(sel);
        if (!el) return '';
        if (el.type === 'checkbox') return el.checked ? el.value : '';
        if (el.type === 'radio') {
          const checked = form.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
          return checked ? checked.value : '';
        }
        return el.value;
      };

      const nameEl = pick(config.nameSel);
      const emailEl = pick(config.emailSel);
      const phoneEl = pick(config.phoneSel);
      const dropdownEl = pick(config.dropdownSel);
      const typeRadios = $all(config.radioSels, form);
      const checkboxEls = $all(config.checkboxSels, form);
      const notesEl = pick(config.notesSel);

      // Required text
      const nameRes = validateText(nameEl?.value, { min: 2, max: 60 });
      if (!nameRes.ok) setError(nameEl, nameRes.message);

      const emailVal = String(emailEl?.value || '').trim();
      if (!emailVal) setError(emailEl, 'Email is required.');
      else if (!isValidEmail(emailVal)) setError(emailEl, 'Enter a valid email address.');

      const phoneVal = String(phoneEl?.value || '').trim();
      if (!phoneVal) setError(phoneEl, 'Phone number is required.');
      else if (!isValidPhone(phoneVal)) setError(phoneEl, 'Enter a valid phone number (7–15 digits).');

      const dropdownVal = String(dropdownEl?.value || '');
      if (!dropdownVal || dropdownVal === config.dropdownPlaceholder) setError(dropdownEl, 'Please select an option.');

      // Radio required
      const radioGroupName = config.radioGroupName;
      const radioChecked = form.querySelector(`input[type="radio"][name="${radioGroupName}"]:checked`);
      if (!radioChecked) {
        // set error on first radio
        const firstRadio = form.querySelector(`input[type="radio"][name="${radioGroupName}"]`);
        if (firstRadio) setError(firstRadio, 'Please choose an enquiry type.');
      }

      // At least one checkbox
      const anyChecked = checkboxEls.some((c) => c.checked);
      if (!anyChecked) {
        const first = checkboxEls[0];
        if (first) setError(first, 'Please select at least one option.');
      }

      const notes = String(notesEl?.value || '').trim();
      if (!notes) setError(notesEl, 'Notes are required.');
      else if (notes.length < config.notesMin) setError(notesEl, `Notes must be at least ${config.notesMin} characters.`);
      else if (notes.length > config.notesMax) setError(notesEl, `Notes must be no more than ${config.notesMax} characters.`);

      if (errors.length) {
        showMessage(msgWrap, 'Please correct the form and try again.', 'error');
        return;
      }

      const radioValue = val(`input[type="radio"][name="${config.radioGroupName}"]`);
      const checkedBoxes = checkboxEls.filter((c) => c.checked).map((c) => c.value);

      const compiled = {
        name: nameEl.value.trim(),
        email: emailVal,
        phone: phoneVal,
        topic: dropdownVal,
        enquiryType: radioValue,
        interests: checkedBoxes,
        notes,
      };

      const responseText = config.responseTemplate(compiled);
      showMessage(msgWrap, responseText, 'success');

      // Mailto
      const to = config.to;
      const subject = config.subjectLine(compiled);
      const body = `Enquiry received\n\nName: ${compiled.name}\nEmail: ${compiled.email}\nPhone: ${compiled.phone}\n\nTopic: ${compiled.topic}\nEnquiry Type: ${compiled.enquiryType}\nInterests: ${compiled.interests.join(', ')}\n\nNotes:\n${compiled.notes}`;

      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 400);

      // Optional: do not reset to keep values visible
      // form.reset();
    });
  }

  // ---------- Scroll animations (IntersectionObserver) ----------
  function initScrollAnimations() {
    const animNodes = $all('[data-anim="scroll"], [data-anim="enter"], [data-anim]');
    if (!animNodes.length) return;

    // Avoid overriding existing behavior on browsers without IntersectionObserver.
    if (typeof IntersectionObserver === 'undefined') {
      animNodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      animNodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    animNodes.forEach((el, idx) => {
      // Stagger via CSS variable
      el.style.setProperty('--anim-delay', `${Math.min(idx * 50, 500)}ms`);
      observer.observe(el);
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    initAccordion();
    initTabs();
    initModal();
    initGalleryLightbox();
    initContentSearch();
    initScrollAnimations();


    // Contact form wiring
    wireForm('contactForm', {
      to: 'ZWONAKA&CO@gmail.com',
      nameField: 'name',
      emailField: 'email',
      phoneField: 'phone',
      subjectField: 'subject',
      messageField: 'message',
      messageMin: 10,
      messageMax: 1000,
      subjectLine: (c) => `Contact: ${c.subject || 'General enquiry'} (from ${c.name})`,
      responseTemplate: (c) => `Thanks, ${c.name}! Your message has been validated and prepared to send. We will respond soon.`,
    });

    // Enquiry form wiring
    wireEnquiryForm('enquiryForm', {
      to: 'ZWONAKA&CO@gmail.com',
      nameSel: '#enqName',
      emailSel: '#enqEmail',
      phoneSel: '#enqPhone',
      dropdownSel: '#enqTopic',
      dropdownPlaceholder: 'none',
      radioGroupName: 'enquiryType',
      radioSels: 'input[name="enquiryType"]',
      checkboxSels: 'input[name="enqInterests"]',
      notesSel: '#enqNotes',
      notesMin: 12,
      notesMax: 600,
      subjectLine: (c) => `Enquiry: ${c.topic} (${c.enquiryType}) - ${c.name}`,
      responseTemplate: (c) => {
        const costHint = c.topic.toLowerCase().includes('support') ? 'we will share an estimated cost after reviewing your request.' : 'we will provide an estimated cost after we understand your needs.';
        return `Thanks, ${c.name}! Your enquiry is processed (${c.topic}). Based on your details, ${costHint}`;
      },
    });
  });
})();

