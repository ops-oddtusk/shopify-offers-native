/**
 * Offers & Bundles Engine
 * Shared JavaScript for all storefront blocks.
 * Handles: popup logic, countdown timers, gamification,
 * frequency capping, customer targeting, and cart interactions.
 */

(function () {
  "use strict";

  window.OffersEngine = window.OffersEngine || {};

  // ─── Cookie / Storage Helpers ──────────────────────────

  const OE = window.OffersEngine;

  OE.setCookie = function (name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  };

  OE.getCookie = function (name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  };

  // ─── Frequency Capping ────────────────────────────────

  OE.shouldShow = function (offerId, frequency) {
    const key = `oe_seen_${offerId}`;

    switch (frequency) {
      case "ONCE_EVER":
        if (OE.getCookie(key)) return false;
        OE.setCookie(key, "1", 365);
        return true;

      case "ONCE_PER_DAY":
        if (OE.getCookie(key)) return false;
        OE.setCookie(key, "1", 1);
        return true;

      case "ONCE_PER_SESSION":
        if (sessionStorage.getItem(key)) return false;
        sessionStorage.setItem(key, "1");
        return true;

      case "EVERY_VISIT":
      default:
        return true;
    }
  };

  // ─── Countdown Timer ─────────────────────────────────

  OE.startCountdown = function (element, endDateStr) {
    if (!endDateStr || !element) return;

    const endDate = new Date(endDateStr).getTime();

    function update() {
      const now = Date.now();
      const diff = endDate - now;

      if (diff <= 0) {
        element.textContent = "Offer expired!";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      element.innerHTML = `
        <span class="oe-timer__block"><span class="oe-timer__num">${days}</span><span class="oe-timer__label">Days</span></span>
        <span class="oe-timer__sep">:</span>
        <span class="oe-timer__block"><span class="oe-timer__num">${String(hours).padStart(2, "0")}</span><span class="oe-timer__label">Hours</span></span>
        <span class="oe-timer__sep">:</span>
        <span class="oe-timer__block"><span class="oe-timer__num">${String(mins).padStart(2, "0")}</span><span class="oe-timer__label">Min</span></span>
        <span class="oe-timer__sep">:</span>
        <span class="oe-timer__block"><span class="oe-timer__num">${String(secs).padStart(2, "0")}</span><span class="oe-timer__label">Sec</span></span>
      `;
    }

    update();
    setInterval(update, 1000);
  };

  // ─── Popup Manager ───────────────────────────────────

  OE.showPopup = function (popupEl, delaySec) {
    if (!popupEl) return;
    const delay = (delaySec || 0) * 1000;
    setTimeout(() => {
      popupEl.classList.add("oe-popup--visible");
      popupEl.setAttribute("aria-hidden", "false");
    }, delay);
  };

  OE.closePopup = function (popupEl) {
    if (!popupEl) return;
    popupEl.classList.remove("oe-popup--visible");
    popupEl.setAttribute("aria-hidden", "true");
  };

  OE.initPopupClose = function (popupEl) {
    if (!popupEl) return;
    // Close button
    const closeBtn = popupEl.querySelector("[data-oe-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => OE.closePopup(popupEl));
    }
    // Click outside
    popupEl.addEventListener("click", (e) => {
      if (e.target === popupEl) OE.closePopup(popupEl);
    });
    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") OE.closePopup(popupEl);
    });
  };

  // ─── Exit Intent Detection ───────────────────────────

  OE.onExitIntent = function (callback) {
    let triggered = false;
    document.addEventListener("mouseout", (e) => {
      if (triggered) return;
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth) {
        triggered = true;
        callback();
      }
    });
    // Mobile: detect back button / tab switch
    document.addEventListener("visibilitychange", () => {
      if (triggered) return;
      if (document.visibilityState === "hidden") {
        triggered = true;
        callback();
      }
    });
  };

  // ─── Cart Interactions ───────────────────────────────

  // ─── Schedule Check ────────────────────────────────

  OE.isWithinSchedule = function (startsAt, endsAt) {
    var now = Date.now();
    if (startsAt) {
      var start = new Date(startsAt).getTime();
      if (now < start) return false;
    }
    if (endsAt) {
      var end = new Date(endsAt).getTime();
      if (now > end) return false;
    }
    return true;
  };

  // ─── Customer Target Check ───────────────────────

  OE.matchesCustomerTarget = function (target) {
    if (!target || target === "ALL") return true;
    var isReturning = OE.isReturningCustomer();
    if (target === "NEW_ONLY" && isReturning) return false;
    if (target === "RETURNING_ONLY" && !isReturning) return false;
    return true;
  };

  // ─── Combined Visibility Check ───────────────────

  OE.shouldDisplay = function (offerId, frequency, customerTarget, startsAt, endsAt) {
    if (!OE.isWithinSchedule(startsAt, endsAt)) return false;
    if (!OE.matchesCustomerTarget(customerTarget)) return false;
    if (!OE.shouldShow(offerId, frequency)) return false;
    return true;
  };

  // ─── Cart Interactions ───────────────────────────

  OE.getCart = async function () {
    try {
      const res = await fetch("/cart.js");
      return res.json();
    } catch (e) {
      return null;
    }
  };

  OE.addToCart = async function (variantId, quantity = 1) {
    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: variantId, quantity }] }),
      });
      return res.json();
    } catch (e) {
      return null;
    }
  };

  OE.onCartUpdate = function (callback) {
    // Listen for cart drawer / add-to-cart events
    document.addEventListener("cart:updated", callback);

    // Intercept fetch calls to /cart/add.js
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      const result = origFetch.apply(this, args);
      if (typeof args[0] === "string" && args[0].includes("/cart/")) {
        result.then(() => {
          setTimeout(callback, 300);
        });
      }
      return result;
    };
  };

  // ─── Spin Wheel Logic ────────────────────────────────

  OE.spinWheel = function (wheelEl, prizes, callback) {
    if (!wheelEl || !prizes || prizes.length === 0) return;

    // Weighted random pick
    const totalWeight = prizes.reduce((sum, p) => sum + (p.probability || 1), 0);
    let random = Math.random() * totalWeight;
    let winner = prizes[0];

    for (const prize of prizes) {
      random -= prize.probability || 1;
      if (random <= 0) {
        winner = prize;
        break;
      }
    }

    // Spin animation
    const segmentAngle = 360 / prizes.length;
    const winnerIndex = prizes.indexOf(winner);
    const targetAngle = 360 * 5 + (360 - winnerIndex * segmentAngle - segmentAngle / 2);

    wheelEl.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
    wheelEl.style.transform = `rotate(${targetAngle}deg)`;

    setTimeout(() => {
      callback(winner);
    }, 4200);
  };

  // ─── Scratch Card Logic ──────────────────────────────

  OE.initScratchCard = function (canvasEl, revealEl, callback) {
    if (!canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    const width = canvasEl.width;
    const height = canvasEl.height;

    // Fill with scratch surface
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    ctx.fillText("Scratch Here!", width / 2, height / 2 + 6);

    let isScratching = false;
    let scratchedPercent = 0;

    function scratch(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, 2 * Math.PI);
      ctx.fill();
      checkProgress();
    }

    function checkProgress() {
      const imageData = ctx.getImageData(0, 0, width, height);
      let transparent = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparent++;
      }
      scratchedPercent = (transparent / (width * height)) * 100;

      if (scratchedPercent > 50) {
        ctx.clearRect(0, 0, width, height);
        if (revealEl) revealEl.classList.add("oe-scratch__revealed");
        if (callback) callback();
      }
    }

    canvasEl.addEventListener("mousedown", () => (isScratching = true));
    canvasEl.addEventListener("mouseup", () => (isScratching = false));
    canvasEl.addEventListener("mousemove", (e) => {
      if (!isScratching) return;
      const rect = canvasEl.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    });

    // Touch support
    canvasEl.addEventListener("touchstart", (e) => {
      isScratching = true;
      e.preventDefault();
    });
    canvasEl.addEventListener("touchend", () => (isScratching = false));
    canvasEl.addEventListener("touchmove", (e) => {
      if (!isScratching) return;
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
      e.preventDefault();
    });
  };

  // ─── Progress Bar ────────────────────────────────────

  OE.updateProgressBar = function (barEl, textEl, currentValue, goalValue, messageTemplate) {
    if (!barEl) return;

    const percent = Math.min((currentValue / goalValue) * 100, 100);
    barEl.style.width = `${percent}%`;

    if (textEl && messageTemplate) {
      const remaining = Math.max(goalValue - currentValue, 0).toFixed(2);
      textEl.textContent = messageTemplate
        .replace("{{remaining}}", remaining)
        .replace("{{goal}}", goalValue)
        .replace("{{current}}", currentValue.toFixed(2));
    }
  };

  // ─── Customer Detection ──────────────────────────────

  OE.isReturningCustomer = function () {
    return OE.getCookie("oe_visited") === "1";
  };

  OE.markVisited = function () {
    OE.setCookie("oe_visited", "1", 365);
  };

  // Set on first load
  if (!OE.isReturningCustomer()) {
    // First visit — will be marked after this page load
    setTimeout(() => OE.markVisited(), 5000);
  }

  // ─── Recent Purchases Rotator ────────────────────────

  OE.startRecentPurchases = function (containerEl, items, intervalMs) {
    if (!containerEl || !items || items.length === 0) return;

    let index = 0;

    function showNext() {
      const item = items[index % items.length];
      containerEl.innerHTML = `
        <div class="oe-recent__inner">
          ${item.image ? `<img src="${item.image}" alt="" class="oe-recent__img">` : ""}
          <div class="oe-recent__text">
            <strong>${item.name}</strong> from ${item.location}
            <br>bought <em>${item.product}</em>
            <span class="oe-recent__time">${item.time_ago}</span>
          </div>
        </div>
      `;
      containerEl.classList.add("oe-recent--visible");

      setTimeout(() => {
        containerEl.classList.remove("oe-recent--visible");
      }, 4000);

      index++;
    }

    setTimeout(showNext, 3000);
    setInterval(showNext, intervalMs || 8000);
  };
})();
