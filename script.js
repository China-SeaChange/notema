
  /* —— 滚动显现（blur 淡入）—— */
  const io = new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* —— 主题切换 —— */
  const applyTheme = dark => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.querySelectorAll('.theme-switch__label').forEach(l => l.textContent = dark ? '浅色' : '深色');
    try { localStorage.setItem('nm-intro-theme', dark ? 'dark' : 'light'); } catch (e) {}
  };
  let dark = false;
  try { dark = (localStorage.getItem('nm-intro-theme') || '') === 'dark'; } catch (e) {}
  applyTheme(dark);
  document.querySelectorAll('.theme-switch').forEach(b => b.addEventListener('click', () =>
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark')));

  /* —— 移动端菜单 —— */
  const nav = document.getElementById('siteNav');
  document.getElementById('menuBtn').addEventListener('click', () => nav.classList.toggle('site-nav--open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('site-nav--open')));

  /* —— 品牌点击回顶部 —— */
  document.getElementById('brandHome').addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* —— Hero / Proof 鼠标视差（参考站同款交互） —— */
  const hero = document.getElementById('hero');
  const proof = document.querySelector('.proof-strip');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    hero.style.setProperty('--hero-pointer-x', (px * 100) + '%');
    hero.style.setProperty('--hero-pointer-y', (py * 100) + '%');
    hero.style.setProperty('--hero-tilt-x', ((py - .5) * -9).toFixed(2) + 'deg');
    hero.style.setProperty('--hero-tilt-y', ((px - .5) * 9).toFixed(2) + 'deg');
    hero.style.setProperty('--hero-shift-x', ((px - .5) * -22).toFixed(1) + 'px');
    hero.style.setProperty('--hero-shift-y', ((py - .5) * -18).toFixed(1) + 'px');
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-tilt-x', '0deg');
    hero.style.setProperty('--hero-tilt-y', '0deg');
    hero.style.setProperty('--hero-shift-x', '0px');
    hero.style.setProperty('--hero-shift-y', '0px');
  });
  proof.addEventListener('pointermove', e => {
    const r = proof.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    proof.style.setProperty('--proof-pointer-x', (px * 100) + '%');
    proof.style.setProperty('--proof-pointer-y', (py * 100) + '%');
    proof.style.setProperty('--proof-tilt-x', ((py - .5) * -7).toFixed(2) + 'deg');
    proof.style.setProperty('--proof-tilt-y', ((px - .5) * 7).toFixed(2) + 'deg');
    proof.style.setProperty('--proof-shift-x', ((px - .5) * 26).toFixed(1) + 'px');
    proof.style.setProperty('--proof-shift-y', ((py - .5) * 22).toFixed(1) + 'px');
  });
//（注：内容由AI生成）
