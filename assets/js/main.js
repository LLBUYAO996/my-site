/* ============================================================
   罗洛逻 · 个人作品集  |  交互脚本
   ------------------------------------------------------------
   原生 JS，无任何依赖。各功能模块相互独立，可单独删改：
     1. 移动端导航开合
     2. 滚动进度条 + 导航栏样式
     3. 滚动出现动画（.reveal → .is-visible）
     4. 导航高亮当前区块
     5. 邮箱一键复制
     6. 联系表单校验（前端演示）
     7. 页脚年份
   ============================================================ */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------- 1. 移动端导航 ---------- */
  var navToggle = $('#navToggle');
  var navMenu = $('#navMenu');

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开菜单');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
    });

    // 点击链接后收起
    $$('.nav__link, .nav__cta').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // 点击菜单外部收起
    document.addEventListener('click', function (e) {
      if (!navMenu.classList.contains('is-open')) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      closeMenu();
    });

    // 按 Esc 收起
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // 回到桌面尺寸时重置状态
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- 2. 滚动进度 + 导航栏阴影 ---------- */
  var nav = $('#nav');
  var progressBar = $('#progressBar');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle('is-scrolled', y > 8);

    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  /* ---------- 3. 滚动出现动画 ---------- */
  var revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // 只播一次
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    // 老浏览器兜底：直接显示
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* ---------- 4. 导航高亮当前区块 ---------- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav__link');

  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spyObserver.observe(section); });
  }

  /* ---------- 5. 邮箱一键复制 ---------- */
  var copyBtn = $('#copyMail');
  var copyHint = $('#copyHint');

  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', function () {
      var mail = copyBtn.dataset.mail || '';
      if (!mail) return;

      navigator.clipboard.writeText(mail).then(function () {
        copyBtn.classList.add('is-copied');
        if (copyHint) copyHint.textContent = '已复制 ✓';
        window.setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          if (copyHint) copyHint.textContent = '点击复制';
        }, 1800);
      }).catch(function () {
        if (copyHint) copyHint.textContent = '复制失败，请手动选中';
      });
    });
  }

  /* ---------- 6. 联系表单 ----------
     目前是纯前端演示：不发送、不存储，只做必填校验 + 提示。
     若之后要真正收到消息，推荐两种做法：
       a) 用 Formspree / Getform 等表单服务，把 form 的 action 指向服务地址；
       b) 自建后端接口，把下面这段替换成 fetch('/api/contact', {...})。
  ------------------------------------------- */
  var form = $('#contactForm');
  var note = $('#formNote');

  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var field = function (n) { return form.querySelector('[name="' + n + '"]'); };
      var nameEl = field('name');
      var emailEl = field('email');
      var msgEl = field('message');
      if (!nameEl || !emailEl || !msgEl) return;

      var name = nameEl.value.trim();
      var email = emailEl.value.trim();
      var message = msgEl.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      note.classList.remove('is-error');

      if (!name || !emailOk || !message) {
        note.classList.add('is-error');
        note.textContent = !name
          ? '请先告诉我怎么称呼你 ~'
          : !emailOk
            ? '邮箱格式好像不太对，再检查一下？'
            : '还想听你说点什么，留言别空着呀。';
        return;
      }

      // 演示成功状态（真实场景在这里发请求）
      note.textContent = '收到啦！这是一份静态示例，请直接发邮件给我 ✉';
      form.reset();
    });
  }

  /* ---------- 7. 页脚年份 ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
