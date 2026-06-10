/* ===========================================================
   Deep Forest — Shared JavaScript (vanilla, no dependencies)
   - Mobile nav toggle
   - EN / 中文 language switch with localStorage persistence
   - Scroll reveal (IntersectionObserver)
   - Sticky header shadow on scroll
   - Current year injection
   - Contact form validation + fake submit
   =========================================================== */
(function () {
  "use strict";

  /* ---------------- Current year ---------------- */
  function setYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------- Mobile navigation ---------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".primary-nav");
    var backdrop = document.querySelector(".nav-backdrop");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });

    // close when a nav link is clicked (mobile)
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });

    // close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // reset state if resized to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setOpen(false);
    });
  }

  /* ---------------- Language switch ---------------- */
  var LANG_KEY = "df-lang";

  // Swap an element's own text while preserving any child elements
  // (e.g. button arrows, the hero accent span, the form "*" markers).
  function swapText(el, val) {
    if (val === null || val === undefined) return;

    // Collect direct child text nodes (ignore whitespace-only ones).
    var textNodes = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && node.nodeValue.trim() !== "") textNodes.push(node);
    }

    if (textNodes.length === 0) {
      // No element children at all → safe to set textContent directly.
      if (el.children.length === 0) {
        el.textContent = val;
        return;
      }
      // Has children but no own text yet → insert translated text first.
      el.insertBefore(document.createTextNode(val + " "), el.firstChild);
      return;
    }

    // Replace the first meaningful text node, drop any others.
    textNodes[0].nodeValue = el.children.length ? val + " " : val;
    for (var j = 1; j < textNodes.length; j++) textNodes[j].nodeValue = "";
  }

  function applyLang(lang) {
    var isZh = lang === "zh";
    document.documentElement.setAttribute("lang", isZh ? "zh-Hans" : "en");

    // Swap text content for all bilingual nodes (preserving child elements)
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      swapText(el, val);
    });

    // Swap placeholders
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-ph") : el.getAttribute("data-en-ph");
      if (val !== null && val !== undefined) el.setAttribute("placeholder", val);
    });

    // Swap option labels inside selects
    document.querySelectorAll("option[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null && val !== undefined) el.textContent = val;
    });

    // Swap aria-labels
    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-aria") : el.getAttribute("data-en-aria");
      if (val !== null && val !== undefined) el.setAttribute("aria-label", val);
    });

    // Update toggle pressed state
    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });

    // store current lang on body for other helpers
    document.body.setAttribute("data-current-lang", lang);
  }

  function initLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = stored === "zh" || stored === "en" ? stored : "en"; // default English
    applyLang(lang);

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chosen = btn.getAttribute("data-lang");
        applyLang(chosen);
        try { localStorage.setItem(LANG_KEY, chosen); } catch (e) {}
      });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Sticky header shadow ---------------- */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Contact form validation ---------------- */
  function initContactForm() {
    var form = document.getElementById("inquiry-form");
    if (!form) return;
    var success = document.getElementById("form-success");

    var messages = {
      required: { en: "This field is required.", zh: "此项为必填项。" },
      email:    { en: "Please enter a valid email address.", zh: "请输入有效的电子邮箱地址。" },
      select:   { en: "Please choose an inquiry type.", zh: "请选择咨询类型。" }
    };

    function curLang() { return document.body.getAttribute("data-current-lang") === "zh" ? "zh" : "en"; }

    function setError(field, key) {
      field.classList.add("invalid");
      var msg = field.querySelector(".error-msg");
      if (msg) msg.textContent = messages[key][curLang()];
      var input = field.querySelector("input, select, textarea");
      if (input) input.setAttribute("aria-invalid", "true");
    }
    function clearError(field) {
      field.classList.remove("invalid");
      var input = field.querySelector("input, select, textarea");
      if (input) input.removeAttribute("aria-invalid");
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateField(input) {
      var field = input.closest(".field");
      if (!field) return true;
      var val = (input.value || "").trim();

      if (input.hasAttribute("required") && !val) {
        setError(field, input.tagName === "SELECT" ? "select" : "required");
        return false;
      }
      if (input.type === "email" && val && !emailRe.test(val)) {
        setError(field, "email");
        return false;
      }
      clearError(field);
      return true;
    }

    // live validation after first blur
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstInvalid = null;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        var valid = validateField(input);
        if (!valid && !firstInvalid) firstInvalid = input;
        ok = ok && valid;
      });

      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Fake submit success
      form.hidden = true;
      if (success) {
        success.classList.add("show");
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    setYear();
    initNav();
    initLang();
    initReveal();
    initHeaderScroll();
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
