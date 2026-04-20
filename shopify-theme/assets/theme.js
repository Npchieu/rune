/* ============================================================
   SCUFFERS — theme.js
   1. Logo / header color-change on scroll (IntersectionObserver)
   2. Cart drawer (fetch API)
   3. Mobile menu
   4. Quick-add to cart
   5. Scroll-reveal animations
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. COLOR-ZONE SYSTEM ─────────────────────────────────
     Every section with [data-header-color] registers itself.
     IntersectionObserver fires when a section crosses the
     top 20% of the viewport → header adopts that zone's color.
  ─────────────────────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  function applyHeaderColor(color) {
    if (!header) return;
    header.classList.remove('color--light', 'color--dark');
    header.classList.add('color--' + color);
  }

  function initColorZones() {
    if (!header) return;

    // Set initial color from data attribute
    const initial = header.dataset.colorInitial || 'light';
    applyHeaderColor(initial);

    const sections = document.querySelectorAll('[data-header-color]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const color = entry.target.dataset.headerColor;
            if (color) applyHeaderColor(color);
          }
        });
      },
      {
        // Trigger when section crosses top 15% of viewport
        rootMargin: '-15% 0px -75% 0px',
        threshold: 0,
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ── 2. CART DRAWER ───────────────────────────────────────
     Opens a side drawer; fetches /cart.js to render items.
  ─────────────────────────────────────────────────────────── */
  const cartDrawer = document.getElementById('cart-drawer');
  const cartBody   = document.getElementById('cart-drawer-body');
  const cartFooter = document.getElementById('cart-drawer-footer');
  const cartCountEl = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');

  function formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: window.Shopify?.currency?.active || 'EUR',
    }).format(cents / 100);
  }

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    fetchCart();
  }

  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function fetchCart() {
    fetch('/cart.js')
      .then((r) => r.json())
      .then(renderCart)
      .catch(() => {});
  }

  function renderCart(cart) {
    if (!cartBody) return;

    // Update count badge
    const count = cart.item_count;
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    if (count === 0) {
      cartBody.innerHTML = '<div class="cart-drawer__empty"><p>YOUR BAG IS EMPTY</p><a href="/collections/all" class="btn btn--primary">SHOP NOW</a></div>';
      if (cartFooter) cartFooter.style.display = 'none';
      return;
    }

    if (cartSubtotal) cartSubtotal.textContent = formatMoney(cart.total_price);
    if (cartFooter) cartFooter.style.display = 'flex';

    cartBody.innerHTML = cart.items.map((item) => `
      <div class="cart-item" data-line="${item.key}">
        <img src="${item.image}" alt="${item.title}" class="cart-item__img" width="80" height="107" loading="lazy">
        <div class="cart-item__info">
          <span class="cart-item__title">${item.product_title}</span>
          <span class="cart-item__variant">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</span>
          <span class="cart-item__price">${formatMoney(item.final_line_price)}</span>
          <button class="cart-item__remove" data-remove-key="${item.key}">REMOVE</button>
        </div>
      </div>
    `).join('');

    // Remove item listeners
    cartBody.querySelectorAll('[data-remove-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        removeCartItem(btn.dataset.removeKey);
      });
    });
  }

  function addToCart(variantId, quantity = 1) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity }),
    })
      .then((r) => r.json())
      .then(() => { fetchCart(); openCart(); })
      .catch(() => {});
  }

  function removeCartItem(key) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 }),
    })
      .then((r) => r.json())
      .then(renderCart)
      .catch(() => {});
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then((r) => r.json())
      .then((cart) => {
        if (cartCountEl) {
          const count = cart.item_count;
          cartCountEl.textContent = count;
          cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';
        }
      })
      .catch(() => {});
  }

  function initCart() {
    updateCartCount();

    document.getElementById('cart-toggle')?.addEventListener('click', openCart);

    cartDrawer?.querySelector('.cart-drawer__close')?.addEventListener('click', closeCart);
    cartDrawer?.querySelector('.cart-drawer__overlay')?.addEventListener('click', closeCart);

    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      window.location.href = '/checkout';
    });
  }

  /* ── 3. MOBILE MENU ───────────────────────────────────────*/
  const mobileMenu = document.getElementById('mobile-menu');

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initMobileMenu() {
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', openMobileMenu);
    mobileMenu?.querySelector('.mobile-menu__close')?.addEventListener('click', closeMobileMenu);
    mobileMenu?.querySelector('.mobile-menu__overlay')?.addEventListener('click', closeMobileMenu);
  }

  /* ── 4. QUICK ADD ─────────────────────────────────────────*/
  function initQuickAdd() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-card__quick-btn[data-variant-id]');
      if (!btn) return;
      const variantId = btn.dataset.variantId;
      if (!variantId) return;

      btn.textContent = 'ADDING...';
      btn.disabled = true;

      addToCart(variantId, 1).then(() => {
        btn.textContent = 'ADDED ✓';
        setTimeout(() => {
          btn.textContent = 'QUICK ADD';
          btn.disabled = false;
        }, 1800);
      });
    });
  }

  /* ── 5. PRODUCT PAGE — variant switching ─────────────────*/
  function initVariantSwitcher() {
    const form = document.getElementById('product-form');
    if (!form) return;

    const radios = form.querySelectorAll('input[type="radio"]');
    const variantInput = document.getElementById('variant-id');
    const addBtn = document.getElementById('add-to-cart-btn');
    const priceEl = document.getElementById('product-price');

    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        // Update selected style
        radio.closest('.product-form__option-values')
          ?.querySelectorAll('.option-btn')
          .forEach((l) => l.classList.remove('is-selected'));
        radio.closest('.option-btn')?.classList.add('is-selected');

        // Build selected options array
        const selected = {};
        form.querySelectorAll('input[type="radio"]:checked').forEach((r) => {
          selected[r.name] = r.value;
        });

        // Match variant from product JSON if available
        const productJson = document.getElementById('product-json');
        if (!productJson) return;

        try {
          const productData = JSON.parse(productJson.textContent);
          const match = productData.variants.find((v) => {
            return v.options.every((opt, i) => selected['option' + (i + 1)] === opt);
          });

          if (match && variantInput) {
            variantInput.value = match.id;
            if (addBtn) {
              addBtn.disabled = !match.available;
              addBtn.textContent = match.available ? 'ADD TO BAG' : 'SOLD OUT';
            }
            // Update price display
            if (priceEl && match.price) {
              const saleHtml = match.compare_at_price > match.price
                ? `<span class="price price--sale">${formatMoney(match.price)}</span>
                   <span class="price price--compare">${formatMoney(match.compare_at_price)}</span>`
                : `<span class="price">${formatMoney(match.price)}</span>`;
              priceEl.innerHTML = saleHtml;
            }
          }
        } catch (_) {}
      });
    });

    // Handle Add to Bag via AJAX
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const variantId = variantInput?.value;
      const qty = parseInt(document.getElementById('qty-input')?.value || '1');
      if (!variantId) return;

      if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'ADDING...'; }
      addToCart(variantId, qty).then(() => {
        if (addBtn) { addBtn.disabled = false; addBtn.textContent = 'ADDED ✓'; }
        setTimeout(() => { if (addBtn) addBtn.textContent = 'ADD TO BAG'; }, 1800);
      });
    });
  }

  /* ── 6. SCROLL REVEAL ─────────────────────────────────────
     Add data-reveal to any element to fade+slide it in.
  ─────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => obs.observe(el));
  }

  /* ── 7. KEYBOARD / ESCAPE ─────────────────────────────────*/
  function initEscape() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeCart();
      closeMobileMenu();
    });
  }

  /* ── 8. HEADER BACKGROUND on scroll past hero ─────────────
     Adds subtle semi-transparent bg once user scrolls > 80px.
  ─────────────────────────────────────────────────────────── */
  function initHeaderScroll() {
    if (!header) return;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        if (window.scrollY > 80) {
          header.style.backdropFilter = 'blur(12px)';
          header.style.background = header.classList.contains('color--dark')
            ? 'rgba(245,245,240,0.85)'
            : 'rgba(10,10,10,0.85)';
        } else {
          header.style.backdropFilter = '';
          header.style.background = '';
        }
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ── INIT ─────────────────────────────────────────────────*/
  document.addEventListener('DOMContentLoaded', () => {
    initColorZones();
    initCart();
    initMobileMenu();
    initQuickAdd();
    initVariantSwitcher();
    initScrollReveal();
    initEscape();
    initHeaderScroll();
  });

})();
