
const STORE_KEY  = 'work-memo-v2-items';
const CATS_KEY   = 'work-memo-v2-cats';
const THEME_KEY  = 'work-memo-v2-theme';

const DEFAULT_CATS = [
  { name: '工作', icon: '🎯', color: '#3b82f6', pinned: false },
  { name: '生活', icon: '🌈', color: '#10b981', pinned: false },
  { name: '其他', icon: '💡', color: '#8b5cf6', pinned: false }
];
/* 旧版默认分类（首次升级时自动迁移为新预设） */
const LEGACY_CATS = ['公司制度', '报告编制', '客户要求', '其他'];

/* 从输入中提取分类图标（emoji），并拆出纯名称 */
function splitCatInput(raw) {
  const m = String(raw).match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u);
  const icon = m ? m[0] : '📁';
  const name = String(raw).replace(icon, '').trim();
  return { name: name || '未命名', icon };
}

/* ========== 应用标题（可编辑，超 6 字循环滚动，导出同步名称） ========== */
const TITLE_KEY = 'work-memo-v2-title';
const appTitleBox    = document.getElementById('appTitleBox');
const appTitleText   = document.getElementById('appTitleText');
const appTitleText2  = document.getElementById('appTitleText2');
const appTitleTrack  = document.getElementById('appTitleTrack');
let appTitle = '牛马笔记';

function setAppTitle(name) {
  appTitle = (name || '').trim() || '牛马笔记';
  appTitleText.textContent = appTitle;
  appTitleText2.textContent = appTitle;
  document.title = appTitle;
  const over = [...appTitle].length > 6;
  appTitleBox.classList.toggle('rolling', over);
  if (over && appTitleText.scrollWidth > 0) {
    appTitleTrack.style.setProperty('--mq-dur', Math.max(5, Math.round(appTitleText.scrollWidth / 26)) + 's');
  }
  try { localStorage.setItem(TITLE_KEY, appTitle); } catch (e) {}
}

function commitTitle() {
  setAppTitle(appTitleText.textContent);
  if (appTitleBox.classList.contains('editing')) {
    appTitleBox.classList.remove('editing');
    playSound('save');
  }
  if (document.activeElement === appTitleText) appTitleText.blur();
}

appTitleBox.addEventListener('click', e => {
  if (appTitleBox.classList.contains('editing')) {
    // 已进入编辑：再次单击 → 光标放到点击处（滚动动画下浏览器默认定位不稳，手动修复）
    const hit = e.target && (e.target === appTitleText || e.target.closest('#appTitleText'));
    if (hit) {
      const sel = window.getSelection();
      let r = null;
      if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!r) { r = document.createRange(); r.selectNodeContents(appTitleText); r.collapse(false); }
      sel.removeAllRanges();
      sel.addRange(r);
    }
    return;
  }
  e.stopPropagation();
  appTitleBox.classList.add('editing');
  appTitleText.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(appTitleText);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});
appTitleText.addEventListener('blur', commitTitle);
appTitleText.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
  else if (e.key === 'Escape') {
    appTitleText.textContent = appTitle;
    commitTitle();
  }
});

(function initTitle() {
  let t = '';
  try { t = localStorage.getItem(TITLE_KEY) || ''; } catch (e) {}
  setAppTitle(t);
})();

const PALETTE = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4',
  '#f43f5e','#84cc16','#6366f1','#14b8a6','#f97316','#a855f7',
  '#0ea5e9','#eab308','#ef4444','#22c55e'
];

const ICON = {
  all: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7.4" height="7.4" rx="1.8"/>
    <rect x="13.6" y="3" width="7.4" height="7.4" rx="1.8"/>
    <rect x="3" y="13.6" width="7.4" height="7.4" rx="1.8"/>
    <rect x="13.6" y="13.6" width="7.4" height="7.4" rx="1.8"/>
  </svg>`,
  scan: `<span class="scan">
    <svg class="scan-ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="40 28" stroke-linecap="round"/></svg>
    <svg class="scan-lens" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.4"/><path d="M20.2 20.2 16 16"/></svg>
  </span>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
  </svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2.4"/>
    <path d="M5 15H4.2A2.2 2.2 0 0 1 2 12.8V4.2A2.2 2.2 0 0 1 4.2 2h8.6A2.2 2.2 0 0 1 15 4.2V5"/>
  </svg>`,
  locate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3.2"/>
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6"/>
  </svg>`,
  expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
    <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
    <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <path d="m7 10 5 5 5-5"/>
    <path d="M12 15V3"/>
  </svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2.5"/>
    <circle cx="8.5" cy="8.5" r="1.6"/>
    <path d="m21 15-5-5L5 21"/>
  </svg>`
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
const escapeReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function highlight(text, terms, markClass) {
  const html = escapeHtml(text);
  if (!terms || !terms.length) return html;
  const pattern = terms.slice().sort((a, b) => b.length - a.length).map(escapeReg).join('|');
  if (!pattern) return html;
  const cls = markClass ? ` class="${markClass}"` : '';
  try {
    return html.replace(new RegExp('(' + pattern + ')', 'gi'), `<mark${cls}>$1</mark>`);
  } catch (e) { return html; }
}

function makeSnippet(content, terms, maxLen) {
  maxLen = maxLen || 140;
  if (!content) return '';
  if (!terms || !terms.length) {
    return content.length > maxLen ? content.slice(0, maxLen) + '…' : content;
  }
  const lower = content.toLowerCase();
  let pos = -1;
  for (const t of terms) {
    const idx = lower.indexOf(t);
    if (idx >= 0 && (pos === -1 || idx < pos)) pos = idx;
  }
  if (pos === -1) {
    return content.length > maxLen ? content.slice(0, maxLen) + '…' : content;
  }
  const start = Math.max(0, pos - 42);
  const end   = Math.min(content.length, start + maxLen);
  let s = content.slice(start, end);
  if (start > 0) s = '…' + s;
  if (end < content.length) s = s + '…';
  return s;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  const p = n => String(n).padStart(2, '0');
  const y = d.getFullYear() === now.getFullYear() ? '' : d.getFullYear() + '-';
  return `${y}${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

// 卡片居中悬浮提示（绿色底白字，短停留；挂在卡片内部，随卡片一起滚动不错位）
let cardToastTimer = null;
function cardToast(msg, card) {
  card.querySelectorAll('.card-toast').forEach(el => el.remove());
  const el = document.createElement('div');
  el.className = 'card-toast';
  el.textContent = msg;
  card.appendChild(el);
  el.classList.add('show');
  clearTimeout(cardToastTimer);
  cardToastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 240);
  }, 900);
}

/* ========== 音效（Web Audio 合成，无外部文件） ========== */
const SOUNDS = {
  click:  { f0: 620,  f1: 860,  dur: .06, type: 'triangle', vol: .07 },
  open:   { f0: 430,  f1: 560,  dur: .09, type: 'sine',     vol: .07 },
  close:  { f0: 520,  f1: 340,  dur: .08, type: 'sine',     vol: .06 },
  save:   { f0: 520,  f1: 780,  dur: .16, type: 'sine',     vol: .07 },
  del:    { f0: 240,  f1: 150,  dur: .20, type: 'sawtooth', vol: .05 },
  warn:   { f0: 400,  f1: 260,  dur: .14, type: 'triangle', vol: .07 },
  pin:    { f0: 880,  f1: 1320, dur: .09, type: 'sine',     vol: .06 },
  star:   { f0: 1050, f1: 1560, dur: .12, type: 'sine',     vol: .07 },
  copy:   { f0: 950,  dur: .07, type: 'sine',     vol: .06 },
  theme:  { f0: 500,  f1: 780,  dur: .13, type: 'triangle', vol: .06 },
  swap:   { f0: 620,  f1: 920,  dur: .10, type: 'triangle', vol: .07 },
  recat:  { f0: 700,  f1: 1000, dur: .11, type: 'sine',     vol: .07 },
  pick:   { f0: 760,  f1: 980,  dur: .07, type: 'triangle', vol: .06 },
  move:   { f0: 500,  f1: 700,  dur: .12, type: 'sine',     vol: .07 }
};
function playSound(type) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = playSound.ctx || (playSound.ctx = new AC());
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const s = SOUNDS[type] || SOUNDS.click;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = s.type || 'sine';
    osc.frequency.setValueAtTime(s.f0, t);
    if (s.f1) osc.frequency.exponentialRampToValueAtTime(s.f1, t + s.dur);
    gain.gain.setValueAtTime(s.vol || 0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + s.dur + 0.02);
  } catch (e) { /* 音效失败不影响功能 */ }
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* 降级 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

/* ========== Markdown 渲染（卡片展示 / 弹窗预览） ========== */
function inlineMd(s) {
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}
function isTableSep(line) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}
// 转义后把字面 <br> 还原为真实换行（markdown 内容里可直接写 <br> 换行）
function escMd(s) {
  return escapeHtml(s).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}
function mdToHtml(src) {
  src = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }
    const fence = line.match(/^```([\w+-]*)\s*$/);
    if (fence) {
      i++;
      const buf = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      html += '<pre><code>' + escapeHtml(buf.join('\n')) + '</code></pre>';
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lv = h[1].length;
      html += '<h' + lv + '>' + inlineMd(escMd(h[2])) + '</h' + lv + '>';
      i++;
      continue;
    }
    if (/^(\s*([-*_])\s*){3,}$/.test(line)) { html += '<hr>'; i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      html += '<blockquote>' + buf.map(l => inlineMd(escMd(l))).join('<br>') + '</blockquote>';
      continue;
    }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      html += '<ul>';
      while (i < lines.length) {
        const m = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (!m) break;
        html += '<li>' + inlineMd(escMd(m[1])) + '</li>';
        i++;
      }
      html += '</ul>';
      continue;
    }
    /* 有序列表：支持列表项之间夹段落（loose list），序号按源数字保真续排，
       避免每个列表项被拆成独立 <ol> 导致全部从 1 重新编号（1、1、1） */
    const olRe = /^\s*(\d+)[.、]\s+(.*)$/;
    const ol = line.match(olRe);
    if (ol) {
      const parts = [];
      let inList = false;
      while (i < lines.length) {
        const m = lines[i].match(olRe);
        if (m) { parts.push({ list: true, num: parseInt(m[1], 10), text: m[2] }); inList = true; i++; continue; }
        const t = lines[i].trim();
        if (!t) { i++; continue; }
        if (/^\s*[-*+]\s+/.test(lines[i])) break;
        if (/^(#{1,6})\s/.test(lines[i]) || /^```/.test(lines[i]) || /^(\s*([-*_])\s*){3,}$/.test(lines[i]) || /^\s*\|/.test(lines[i])) break;
        if (!inList) break;
        const buf = [];
        while (i < lines.length) {
          const tt = lines[i].trim();
          if (!tt || olRe.test(lines[i]) || /^\s*[-*+]\s+/.test(lines[i]) || /^(#{1,6})\s/.test(lines[i]) || /^```/.test(lines[i]) || /^\s*\|/.test(lines[i]) || /^(\s*([-*_])\s*){3,}$/.test(lines[i])) break;
          buf.push(lines[i]); i++;
        }
        parts.push({ list: false, text: buf.join('\n') });
      }
      let open = false;
      for (const p of parts) {
        if (p.list) {
          if (!open) {
            const st = p.num > 1 ? p.num : 1;
            html += '<ol' + (st !== 1 ? ' start="' + st + '"' : '') + '>';
            open = true;
          }
          html += '<li>' + inlineMd(escMd(p.text)) + '</li>';
        } else {
          if (open) { html += '</ol>'; open = false; }
          html += '<p>' + p.text.split('\n').map(l => inlineMd(escMd(l))).join('<br>') + '</p>';
        }
      }
      if (open) html += '</ol>';
      continue;
    }
    /* GFM 表格：表头行 + 分隔行 */
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const headerCells = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!/^\|/.test(t) || isTableSep(lines[i])) break;
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      const cell = c => inlineMd(escMd(c));
      html += '<div class="md-table-wrap"><table><thead><tr>' +
        headerCells.map(c => '<th>' + cell(c) + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => '<td>' + cell(c) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>';
      continue;
    }
    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^(#{1,6})\s/.test(lines[i]) || /^```/.test(lines[i]) || /^>\s?/.test(lines[i]) ||
          /^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+[.、]\s+/.test(lines[i]) ||
          /^(\s*([-*_])\s*){3,}$/.test(lines[i]) || /^\s*\|/.test(lines[i])) break;
      buf.push(lines[i]);
      i++;
    }
    html += '<p>' + buf.map(l => inlineMd(escMd(l))).join('<br>') + '</p>';
  }
  return html;
}

/* Markdown → 纯文本（去除格式符号，用于标题 / 摘要摘取） */
function mdToPlainText(src) {
  if (src == null) return '';
  return String(src).replace(/\r\n?/g, '\n').split('\n').map(line => {
    let t = line.trim();
    t = t.replace(/^```[\w+-]*\s*$/, '');            // 代码围栏行
    t = t.replace(/^#{1,6}\s+/, '');                 // 标题标记
    t = t.replace(/^\s*([-*+])\s+/, '');             // 无序列表
    t = t.replace(/^\s*\d+[.、]\s+/, '');            // 有序列表
    t = t.replace(/^>\s?/, '');                      // 引用
    t = t.replace(/<br\s*\/?>/gi, ' ');              // 字面 <br> → 空格
    if (/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(t)) return ''; // 表格分隔行
    t = t.replace(/^\|/, '').replace(/\|/g, ' ');    // 表格行分隔符
    t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');  // 图片 → 描述文字
    t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');   // 链接 → 链接文字
    t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
    t = t.replace(/___([^_]+)___/g, '$1');
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
    t = t.replace(/__([^_]+)__/g, '$1');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1$2');
    t = t.replace(/(^|[^_])_([^_]+)_/g, '$1$2');
    t = t.replace(/~~([^~]+)~~/g, '$1');
    t = t.replace(/`([^`]+)`/g, '$1');               // 行内代码
    return t.trim();
  }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/* ========== HTML → Markdown（粘贴网页 / 富文本自动转换） ========== */
function htmlToMd(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.body;
    function inlineOf(node) {
      let s = '';
      node.childNodes.forEach(c => s += walk(c));
      return s;
    }
    function walk(node) {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      const text = () => (node.textContent || '');
      if (tag === 'br') return '\n';
      if (tag === 'hr') return '\n---\n';
      if (tag === 'strong' || tag === 'b') return '**' + inlineOf(node) + '**';
      if (tag === 'em' || tag === 'i') return '*' + inlineOf(node) + '*';
      if (tag === 'del' || tag === 's') return '~~' + inlineOf(node) + '~~';
      if (tag === 'code') return '`' + text() + '`';
      if (tag === 'a') {
        const href = node.getAttribute('href');
        return href ? '[' + text() + '](' + href + ')' : text();
      }
      if (tag === 'img') {
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt') || '';
        return src ? '![' + alt + '](' + src + ')' : '';
      }
      if (tag === 'pre') return '\n```\n' + text().replace(/\n$/, '') + '\n```\n';
      if (tag === 'blockquote') return '\n> ' + text().trim().split('\n').join('\n> ') + '\n';
      if (tag === 'ul' || tag === 'ol') {
        const items = [];
        node.querySelectorAll(':scope > li').forEach((li, idx) => {
          items.push((tag === 'ol' ? (idx + 1) + '. ' : '- ') + inlineOf(li).trim().replace(/\n/g, ' '));
        });
        return '\n' + items.join('\n') + '\n';
      }
      if (/^h[1-6]$/.test(tag)) {
        return '\n' + '#'.repeat(+tag[1]) + ' ' + text().trim() + '\n';
      }
      if (tag === 'table') {
        const rows = [];
        node.querySelectorAll('tr').forEach(tr => {
          rows.push(Array.from(tr.children).map(td => td.textContent.trim()).join(' | '));
        });
        return '\n' + rows.join('\n') + '\n';
      }
      if (tag === 'p' || tag === 'div' || tag === 'li' || tag === 'section' || tag === 'article' || tag === 'td' || tag === 'th') {
        return '\n' + inlineOf(node).trim() + '\n';
      }
      let s = '';
      node.childNodes.forEach(c => s += walk(c));
      return s;
    }
    let out = '';
    root.childNodes.forEach(c => out += walk(c));
    return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  } catch (e) { return ''; }
}
function insertAtCursor(el, text) {
  const start = el.selectionStart == null ? el.value.length : el.selectionStart;
  const end   = el.selectionEnd == null ? el.value.length : el.selectionEnd;
  el.value = el.value.slice(0, start) + text + el.value.slice(end);
  const pos = start + text.length;
  el.selectionStart = el.selectionEnd = pos;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

let items = [];
let categories = [];
let state = { category: 'all', query: '' };

function loadCats() {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) {
        const cats = d.map(c => ({ pinned: false, ...c }));
        // 旧版默认分类 → 自动迁移为新预设（工作/生活/其他）
        const names = cats.map(c => c.name).sort().join('|');
        if (names === LEGACY_CATS.slice().sort().join('|')) {
          const none = DEFAULT_CATS.map(c => ({ ...c }));
          try { localStorage.setItem(CATS_KEY, JSON.stringify(none)); } catch (e) {}
          return none;
        }
        // 默认分类图标升级（💼/🌱/📁 → 🎯/🌈/💡）
        const ICON_UPGRADE = { '工作': ['💼', '🎯'], '生活': ['🌱', '🌈'], '其他': ['📁', '💡'] };
        let changed = false;
        cats.forEach(c => {
          const up = ICON_UPGRADE[c.name];
          if (up && (c.icon === up[0] || !c.icon)) { c.icon = up[1]; changed = true; }
        });
        if (changed) {
          try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); } catch (e) {}
        }
        return cats;
      }
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_CATS.map(c => ({ ...c }));
}
function saveCats() {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(categories)); } catch (e) { /* ignore */ }
}

function seedItems() {
  return [];   // 初始不预设任何笔记，全新空白
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) {
        const arr = d.map(x => ({ pinned: false, ...x }));
        // 旧版四分类迁移：卡片里的旧分类名同步映射到新分类（否则计数/清空/归类全部错位）
        const LEGACY_MAP = { '公司制度': '工作', '报告编制': '工作', '客户要求': '工作', '其他': '其他' };
        let migrated = false;
        arr.forEach(x => {
          if (x.category && LEGACY_MAP[x.category] && !categories.some(c => c.name === x.category)) {
            x.category = LEGACY_MAP[x.category];
            migrated = true;
          }
        });
        if (migrated) { try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {} }
        // 序号迁移：缺失 mOrder 的卡片按创建时间先后补齐（修改内容不影响序号）
        if (arr.some(x => x.mOrder == null)) {
          let mx = arr.reduce((m, x) => Math.max(m, x.mOrder == null ? 0 : x.mOrder), 0);
          arr.filter(x => x.mOrder == null)
             .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
             .forEach(x => { x.mOrder = ++mx; });
        }
        return arr;
      }
    }
  } catch (e) { /* ignore */ }
  return seedItems();
}
function saveItems() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); return true; } catch (e) { return false; }
}

/* 下一个序号（新建/移入分类时分配） */
function nextOrder() {
  let mx = 0;
  for (const x of items) if (x.mOrder != null && x.mOrder > mx) mx = x.mOrder;
  return mx + 1;
}

/* 某卡片在当前视图下的显示序号 */
function seqOf(id) {
  const l = items.slice()
    .filter(it => inCatView(it, state.category))
    .sort(sortItems);
  const k = l.findIndex(x => x.id === id);
  return k >= 0 ? k + 1 : 0;
}

/* ========== 无限撤回 / 恢复（Ctrl+Z / Ctrl+Y） ========== */
const MAX_HISTORY = 2000;
let undoStack = [];
let redoStack = [];
function pushHistory() {
  undoStack.push({
    items: JSON.parse(JSON.stringify(items)),
    categories: JSON.parse(JSON.stringify(categories)),
    stickies: JSON.parse(JSON.stringify(stickies))
  });
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
}
function applySnapshot(snap) {
  items = snap.items;
  categories = snap.categories;
  stickies = snap.stickies || [];
  if (pickCat && !categories.some(c => c.name === pickCat)) pickCat = '';
  if (state.category !== 'all' && !categories.some(c => c.name === state.category)) state.category = 'all';
  saveItems(); saveCats(); saveStickies(); render();
}
function undo() {
  if (!undoStack.length) { showToast('没有可撤回的操作'); return; }
  redoStack.push({
    items: JSON.parse(JSON.stringify(items)),
    categories: JSON.parse(JSON.stringify(categories)),
    stickies: JSON.parse(JSON.stringify(stickies))
  });
  applySnapshot(undoStack.pop());
  showToast('已撤回上一步操作');
}
function redo() {
  if (!redoStack.length) { showToast('没有可恢复的操作'); return; }
  undoStack.push({
    items: JSON.parse(JSON.stringify(items)),
    categories: JSON.parse(JSON.stringify(categories)),
    stickies: JSON.parse(JSON.stringify(stickies))
  });
  applySnapshot(redoStack.pop());
  showToast('已恢复操作');
}

/* 「未分类」视图标记：卡片 category 为空字符串表示未分类 */
const NONE = '__none__';
const inCatView = (it, view) =>
  view === 'all' ? true : (view === NONE ? !it.category : it.category === view);

function catColor(name) {
  if (!name || name === NONE) return '#6b7280';
  const c = categories.find(c => c.name === name);
  return c ? c.color : '#8b5cf6';
}
function nextColor() {
  const used = new Set(categories.map(c => c.color));
  for (const c of PALETTE) if (!used.has(c)) return c;
  return PALETTE[categories.length % PALETTE.length];
}
function sortedCats() {
  return [...categories].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    const ao = a.mOrder == null ? Infinity : a.mOrder;
    const bo = b.mOrder == null ? Infinity : b.mOrder;
    if (ao !== bo) return ao - bo;
    return 0;
  });
}
function ensureCategory() {
  if (!categories.length) {
    categories.push({ name: '默认', color: '#8b5cf6', pinned: false });
    saveCats();
  }
}

const searchTerms = q => q.trim().toLowerCase().split(/\s+/).filter(Boolean);

function matchItem(it, terms) {
  if (!terms.length) return true;
  const hay = [it.title, it.content, it.category, (it.tags || []).join(' ')]
    .join(' ').toLowerCase();
  return terms.every(t => hay.includes(t));
}
function matchSticky(st, terms) {
  if (!terms.length) return true;
  return terms.every(t => (st.text || '').toLowerCase().includes(t));
}
function sortItems(a, b) {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
  const ao = a.mOrder == null ? Infinity : a.mOrder;
  const bo = b.mOrder == null ? Infinity : b.mOrder;
  if (ao !== bo) return ao - bo;
  return (b.updatedAt || 0) - (a.updatedAt || 0);
}

const listEl    = document.getElementById('list');
const filtersEl = document.getElementById('filters');
const statEl    = document.getElementById('statLine');

const searchPanel = document.getElementById('searchPanel');
const spCount     = document.getElementById('spCount');
const spBody      = document.getElementById('spBody');
const spClose     = document.getElementById('spClose');

/* 全局「收起」悬浮按钮 + 分类快捷菜单 */
const collapseFab = document.getElementById('collapseFab');
const recatMenu   = document.getElementById('recatMenu');
let recatId   = null;

function render() {
  expandedStack.length = 0;
  collapseFab.hidden = true;
  recatMenu.hidden = true;
  recatId = null;
  closeTagPanel();
  renderFilters();
  renderList();
  renderStats();
  renderSearchPanel();
  fillCardImgs();
}

function renderStats() {
  const terms = searchTerms(state.query);
  if (terms.length) {
    statEl.textContent = `共 ${items.length} 条记录`;
    return;
  }
  const shown = items.filter(it => inCatView(it, state.category)).length;
  statEl.textContent = state.category !== 'all'
    ? `筛选 ${shown} / 共 ${items.length} 条`
    : `共 ${items.length} 条记录`;
}

function renderFilters() {
  const noneCount = items.filter(i => !i.category).length;
  let html = `
    <button class="cat-item ${state.category === 'all' ? 'active' : ''}"
            data-cat="all" style="--c:#1f2430">
      <span class="cat-icon">${ICON.all}</span>
      <span class="cat-name">全部</span>
      <span class="cat-count">${items.length}</span>
    </button>`;

  sortedCats().forEach(c => {
    const count = items.filter(i => i.category === c.name).length;
    const long = [...c.name].length > 6;
    const nameHtml = long
      ? `<span class="cat-name mq"><span class="mq-track" style="--mq-dur:${Math.max(6, Math.round([...c.name].length * 0.75))}s"><span class="mq-text">${escapeHtml(c.name)}</span><span class="mq-text" aria-hidden="true">${escapeHtml(c.name)}</span></span></span>`
      : `<span class="cat-name">${escapeHtml(c.name)}</span>`;
    html += `
      <button class="cat-item ${state.category === c.name ? 'active' : ''} ${c.pinned ? 'is-pinned' : ''}"
              data-cat="${escapeHtml(c.name)}" style="--c:${c.color}" title="${c.pinned ? '已置顶分类，长按拖拽可换位' : '长按拖拽可互换位置'}">
        <span class="cat-icon">${c.icon || '📁'}</span>
        ${nameHtml}
        ${c.pinned ? `<span class="cat-pin">${ICON.pin}</span>` : ''}
        <span class="cat-count">${count}</span>
      </button>`;
  });

  // 「未分类」固定显示在列表末尾
  html += `
    <button class="cat-item ${state.category === NONE ? 'active' : ''}"
            data-cat="${NONE}" style="--c:#6b7280" title="未分类的卡片（在「全部」下粘贴的内容）">
      <span class="cat-icon">🏷️</span>
      <span class="cat-name">未分类</span>
      <span class="cat-count">${noneCount}</span>
    </button>`;

  filtersEl.innerHTML = html;
}

/* ========== 卡片图片：编辑窗口 / 图片图标 / 拖拽 / 粘贴添加 ========== */
// 图片数据存入 IndexedDB（空间远大于 localStorage），localStorage 仅存图片元数据
const IMG_DB = 'niuma-note-imgs';
const IMG_STORE = 'imgs';
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let imgDb = null;
const imgDbReady = new Promise((res, rej) => {
  try {
    const rq = indexedDB.open(IMG_DB, 1);
    rq.onupgradeneeded = () => { rq.result.createObjectStore(IMG_STORE); };
    rq.onsuccess = () => { imgDb = rq.result; res(); };
    rq.onerror = () => rej(rq.error);
  } catch (e) { rej(e); }
});
function imgDbPut(id, dataUrl) {
  return imgDbReady.then(() => new Promise((res, rej) => {
    const tx = imgDb.transaction(IMG_STORE, 'readwrite');
    tx.objectStore(IMG_STORE).put(dataUrl, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }));
}
function imgDbGet(id) {
  return imgDbReady.then(() => new Promise((res, rej) => {
    const tx = imgDb.transaction(IMG_STORE, 'readonly');
    const rq = tx.objectStore(IMG_STORE).get(id);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  }));
}
function imgDbDel(id) {
  return imgDbReady.then(() => new Promise((res, rej) => {
    const tx = imgDb.transaction(IMG_STORE, 'readwrite');
    tx.objectStore(IMG_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }));
}
// 清理「真正孤儿」图片：删除图片时保留 IndexedDB 数据（Ctrl+Z 可恢复），
// 仅当某图片 id 既不在当前笔记、也不在任何撤回/恢复快照中时，才从 IndexedDB 清除
async function clearOrphanImgs() {
  try {
    await imgDbReady;
    const keep = new Set();
    const collect = list => list.forEach(it => (it.images || []).forEach(g => g.id && keep.add(g.id)));
    collect(items);
    undoStack.forEach(s => collect(s.items || []));
    redoStack.forEach(s => collect(s.items || []));
    const tx = imgDb.transaction(IMG_STORE, 'readonly');
    const rq = tx.objectStore(IMG_STORE).getAllKeys();
    const keys = await new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
    const stale = keys.filter(k => !keep.has(k));
    if (!stale.length) return;
    const wtx = imgDb.transaction(IMG_STORE, 'readwrite');
    stale.forEach(k => wtx.objectStore(IMG_STORE).delete(k));
    await new Promise((res, rej) => { wtx.oncomplete = res; wtx.onerror = () => rej(wtx.error); });
  } catch (e) { /* 清理失败不影响主流程 */ }
}
// 渲染后异步填充图片（IndexedDB 取回 dataURL）
function fillCardImgs(attempt) {
  attempt = attempt || 0;
  document.querySelectorAll('.card-imgs img[data-imgid]').forEach(async im => {
    if (im.dataset.loaded) return;
    try {
      const d = await imgDbGet(im.dataset.imgid);
      if (d && im.isConnected) { im.src = d; im.dataset.loaded = '1'; }
      else if (attempt < 3) setTimeout(() => fillCardImgs(attempt + 1), 250);
    } catch (e) { /* 忽略 */ }
  });
}
// 旧数据迁移：localStorage 中带 dataUrl 的图片搬入 IndexedDB
async function migrateImgs() {
  let dirty = false;
  for (const it of items) {
    if (!it.images) continue;
    for (const g of it.images) {
      if (g.dataUrl && String(g.dataUrl).startsWith('data:')) {
        try { await imgDbPut(g.id, g.dataUrl); } catch (e) {}
        delete g.dataUrl;
        dirty = true;
      }
    }
  }
  if (dirty) { saveItems(); render(); }
  fillCardImgs();
}

function cardImgsHtml(it) {
  const imgs = (it.images || []).filter(Boolean);
  if (!imgs.length) return '';
  return `
    <div class="card-imgs">
      ${imgs.map(img => `
        <div class="ci-item" data-img="${img.id}">
          <img src="${PLACEHOLDER}" data-imgid="${img.id}" alt="卡片图片" loading="lazy">
          <button type="button" class="ci-del" data-img="${img.id}" title="删除图片">×</button>
        </div>`).join('')}
    </div>`;
}

// 图片压缩为 dataURL（常见格式统一压到最长边 1280、JPEG 0.82；SVG 原样保存）
function compressImage(file) {
  return new Promise(resolve => {
    if (!file || !/^image\//.test(file.type)) return resolve(null);
    if (file.type === 'image/svg+xml') {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX = 1280;
        const sc = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * sc));
        const h = Math.max(1, Math.round(img.naturalHeight * sc));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      } catch (e) { resolve(null); }
      finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function addImagesToCard(id, files) {
  const it = items.find(i => i.id === id);
  if (!it || !files || !files.length) return 0;
  if (!it.images) it.images = [];
  const before = it.images.length;
  let added = 0, failed = 0;
  const saved = [];
  for (const f of files) {
    if (!f || !/^image\//.test(f.type)) { failed++; continue; }
    const dataUrl = await compressImage(f);
    if (!dataUrl) { failed++; continue; }
    const gid = uid();
    try {
      await imgDbPut(gid, dataUrl);   // 图片存入 IndexedDB
      it.images.push({ id: gid, name: f.name || '' });
      saved.push(gid);
      added++;
    } catch (e) { failed++; }
  }
  if (!added) { showToast(failed ? '图片保存失败（可能存储空间不足）' : '没有可添加的图片'); return 0; }
  it.updatedAt = Date.now();
  if (!saveItems()) {
    it.images.splice(before);                    // localStorage 超限 → 回滚
    saved.forEach(gid => imgDbDel(gid).catch(() => {}));
    showToast('本地存储空间不足，图片未保存');
    return 0;
  }
  render();
  fillCardImgs();
  playSound('save');
  showToast(`已添加 ${added} 张图片${failed ? `，${failed} 张失败` : ''}`);
  if (editingId === id) renderEditImgs();
  return added;
}

// —— 文件选择 ——
const imgFileInput = document.getElementById('imgFileInput');
let imgTargetCardId = null;
let pendingImgs = [];   // 新建弹窗中暂存的图片，保存后随笔记写入

// —— 添加图片弹窗（选择本地 / Ctrl+V 粘贴） ——
const imgAddModal = document.getElementById('imgAddModal');
function openImgAddModal(id) {
  imgTargetCardId = id;
  imgAddModal.hidden = false;
  playSound('click');
}
function closeImgAddModal() {
  imgAddModal.hidden = true;
  imgTargetCardId = null;
}
document.getElementById('imgAddZone').addEventListener('click', () => {
  if (!imgTargetCardId) return;
  playSound('click');
  imgFileInput.click();
});
document.getElementById('imgAddCancel').addEventListener('click', closeImgAddModal);
imgAddModal.addEventListener('click', e => { if (e.target === imgAddModal) closeImgAddModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !imgAddModal.hidden) closeImgAddModal(); });

imgFileInput.addEventListener('change', () => {
  const files = [...(imgFileInput.files || [])];
  imgFileInput.value = '';
  if (!files.length) return;
  if (imgTargetCardId) {
    const id = imgTargetCardId;
    closeImgAddModal();
    addImagesToCard(id, files);
    return;
  }
  if (!modal.hidden && !editingId) { addPendingImages(files); return; }
  showToast('请先点击卡片上的图片图标或进入编辑窗口');
});

// 新建弹窗中：图片暂存，保存后随笔记一起写入
async function addPendingImages(files) {
  let added = 0, failed = 0;
  for (const f of files) {
    if (!f || !/^image\//.test(f.type)) { failed++; continue; }
    const dataUrl = await compressImage(f);
    if (!dataUrl) { failed++; continue; }
    pendingImgs.push({ id: uid(), dataUrl, name: f.name || '' });
    added++;
  }
  if (!added) { showToast(failed ? '暂不支持该图片格式' : '没有可添加的图片'); return; }
  renderEditImgs();
  playSound('save');
  showToast(`已添加 ${added} 张图片${failed ? `，${failed} 张失败` : ''}（保存后随笔记保存）`);
}

// —— 点击“图片”图标 → 打开添加图片弹窗（选择本地 / Ctrl+V 粘贴） ——
listEl.addEventListener('click', e => {
  const addBtn = e.target.closest('[data-act="img"]');
  if (addBtn) {
    e.stopPropagation();
    const card = addBtn.closest('.card');
    if (card) openImgAddModal(card.dataset.id);
    return;
  }
  // 删除单张图片
  const delBtn = e.target.closest('.ci-del');
  if (delBtn) {
    e.stopPropagation();
    const card = delBtn.closest('.card');
    const it = card && items.find(i => i.id === card.dataset.id);
    if (!it || !it.images) return;
    const imgId = delBtn.dataset.img;
    pushHistory();
    it.images = it.images.filter(g => g.id !== imgId);
    it.updatedAt = Date.now();
    saveItems(); render();
    clearOrphanImgs();   // 保留 IDB 数据以便 Ctrl+Z 恢复，仅清真正孤儿
    playSound('del');
    showToast('已删除图片，可按 Ctrl+Z 撤回');
    return;
  }
  // 图片预览（单击图片）
  const itemEl = e.target.closest('.ci-item');
  if (itemEl) {
    if (imgJustDragged) { imgJustDragged = false; return; }
    e.stopPropagation();
    const card = itemEl.closest('.card');
    const it = card && items.find(i => i.id === card.dataset.id);
    const imgs = (it && it.images) || [];
    openLightboxAt(imgs, imgs.findIndex(g => g.id === itemEl.dataset.img));
    return;
  }
});

// —— 图片区滚动条：悬停显示，移开后 2 秒消失 ——
listEl.addEventListener('mouseover', e => {
  const box = e.target.closest('.card-imgs');
  if (!box) return;
  clearTimeout(box._imgHoverT);
  box.classList.add('img-hover');
});
listEl.addEventListener('mouseout', e => {
  const box = e.target.closest('.card-imgs');
  if (!box) return;
  const to = e.relatedTarget;
  if (to && box.contains(to)) return;   // 仍在图片区内
  clearTimeout(box._imgHoverT);
  box._imgHoverT = setTimeout(() => box.classList.remove('img-hover'), 2000);
});
// —— 图片区滚轮横向滑动：鼠标悬停图片上方时接管滚轮；图片可滚动时才拦截，避免与页面滚动重叠 ——
listEl.addEventListener('wheel', e => {
  const box = e.target.closest('.card-imgs');
  if (!box || box.scrollWidth <= box.clientWidth + 2) return;
  e.preventDefault();
  box.scrollLeft += (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
  box.classList.add('img-hover');
  clearTimeout(box._imgHoverT);
  box._imgHoverT = setTimeout(() => box.classList.remove('img-hover'), 2000);
}, { passive: false });

// —— 图片缩略图：长按拖拽 → 同卡互换 / 拖到其他卡片（松开选移动/复制） ——
let imgDrag = null;
let imgJustDragged = false;
function clearImgSwapHints() {
  listEl.querySelectorAll('.card.drag-img').forEach(c => c.classList.remove('drag-img'));
  listEl.querySelectorAll('.ci-item.swap').forEach(i => i.classList.remove('swap'));
}
listEl.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  if (e.target.closest('.ci-del')) return;
  const item = e.target.closest('.ci-item');
  if (!item) return;
  const card = item.closest('.card');
  const it = card && items.find(i => i.id === card.dataset.id);
  const g = it && (it.images || []).find(x => x.id === item.dataset.img);
  if (!it || !g) return;
  e.preventDefault();
  const startX = e.clientX, startY = e.clientY, pid = e.pointerId;
  let timer = setTimeout(() => {
    timer = null;
    const rect = item.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'img-ghost';
    ghost.style.width = Math.max(72, rect.width) + 'px';
    ghost.style.height = Math.max(54, rect.height) + 'px';
    const domImg = item.querySelector('img');
    const src = (domImg && domImg.src && !domImg.src.startsWith('data:image/gif')) ? domImg.src : (g.dataUrl || PLACEHOLDER);
    ghost.style.backgroundImage = `url(${src})`;
    ghost.style.left = (e.clientX - rect.width / 2) + 'px';
    ghost.style.top  = (e.clientY - rect.height / 2) + 'px';
    document.body.appendChild(ghost);
    imgDrag = { pid, it, g, ghost, dx: rect.width / 2, dy: rect.height / 2, over: null, overImg: null };
    playSound('grab');
  }, 280);
  const move = ev => {
    if (timer) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) { clearTimeout(timer); timer = null; }
      return;
    }
    if (!imgDrag || ev.pointerId !== pid) return;
    imgDrag.ghost.style.left = (ev.clientX - imgDrag.dx) + 'px';
    imgDrag.ghost.style.top  = (ev.clientY - imgDrag.dy) + 'px';
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const tcard = el && el.closest('.card');
    const timg  = el && el.closest('.ci-item');
    const tid = tcard && tcard.dataset.id;
    // 同一卡片内的另一张图片 → 互换意图（高亮目标，松手直接互换）
    if (timg && tid === it.id && timg.dataset.img !== g.id) {
      if (imgDrag.overImg !== timg.dataset.img || imgDrag.over) {
        clearImgSwapHints();
        timg.classList.add('swap');
        imgDrag.over = null;
        imgDrag.overImg = timg.dataset.img;
      }
      return;
    }
    // 其他卡片 → 移入意图
    if (tid && tid !== it.id) {
      if (imgDrag.over !== tid) {
        clearImgSwapHints();
        tcard.classList.add('drag-img');
        imgDrag.over = tid;
        imgDrag.overImg = null;
      }
    } else if (imgDrag.over || imgDrag.overImg) {
      clearImgSwapHints();
      imgDrag.over = null;
      imgDrag.overImg = null;
    }
  };
  const up = ev => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    if (timer) { clearTimeout(timer); timer = null; return; }   // 未进入拖拽 = 单击，交给 click 预览
    if (!imgDrag) return;
    imgJustDragged = true;
    imgDrag.ghost.remove();
    clearImgSwapHints();
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const tcard = el && el.closest('.card');
    const targetIt = tcard ? items.find(i => i.id === tcard.dataset.id) : null;
    const swapId = imgDrag.overImg;
    imgDrag = null;
    // 同卡图片互换：直接松手互换，不弹气泡
    if (swapId) {
      const from = it.images.findIndex(z => z.id === g.id);
      const to   = it.images.findIndex(z => z.id === swapId);
      if (from > -1 && to > -1 && from !== to) {
        pushHistory();
        const tmp = it.images[from];
        it.images[from] = it.images[to];
        it.images[to] = tmp;
        it.updatedAt = Date.now();
        saveItems(); render();
        fillCardImgs();
        playSound('save');
        showToast('已互换图片位置，可按 Ctrl+Z 撤回');
      }
      return;
    }
    if (targetIt && targetIt !== it) showImgDropMenu(ev.clientX, ev.clientY, it, g, targetIt);
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
});

// —— 拖拽松开后的选择气泡：移动 / 复制 ——
function showImgDropMenu(x, y, srcIt, g, dstIt) {
  closeImgMenu();
  const m = document.createElement('div');
  m.className = 'img-drop-menu';
  m.innerHTML =
    `<div class="idm-tip">移动 / 复制图片到「${escapeHtml(dstIt.category || '未分类')}」卡片？</div>` +
    `<button type="button" class="idm-btn mv">移动</button>` +
    `<button type="button" class="idm-btn cp">复制</button>` +
    `<button type="button" class="idm-btn x">取消</button>`;
  m.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.appendChild(m);
  m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 12)) + 'px';
  m.style.top  = Math.max(8, Math.min(y + 14, innerHeight - m.offsetHeight - 12)) + 'px';
  m.querySelector('.mv').addEventListener('click', () => {
    pushHistory();
    srcIt.images = srcIt.images.filter(z => z.id !== g.id);
    if (!dstIt.images) dstIt.images = [];
    dstIt.images.push(g);
    srcIt.updatedAt = dstIt.updatedAt = Date.now();
    saveItems(); render();
    playSound('save');
    showToast('已移动图片到该卡片');
    closeImgMenu();
  });
  m.querySelector('.cp').addEventListener('click', async () => {
    pushHistory();
    const nid = uid();
    try {
      const d = g.dataUrl || await imgDbGet(g.id);
      if (d) await imgDbPut(nid, d);          // 复制一份存入 IndexedDB
    } catch (e) { /* 复制失败则放弃该副本 */ }
    if (!dstIt.images) dstIt.images = [];
    dstIt.images.push({ id: nid, name: g.name || '' });
    dstIt.updatedAt = Date.now();
    saveItems(); render();
    fillCardImgs();
    playSound('save');
    showToast('已复制图片到该卡片');
    closeImgMenu();
  });
  m.querySelector('.x').addEventListener('click', closeImgMenu);
  setTimeout(() => document.addEventListener('pointerdown', closeImgMenu, { once: true }), 0);
}
function closeImgMenu() {
  document.querySelectorAll('.img-drop-menu').forEach(el => el.remove());
}

// —— 图片全屏预览：滚轮缩放 / 拖拽平移 / 复制 / 左右切换 ——
const lightbox   = document.getElementById('imgLightbox');
const lbImg      = document.getElementById('lbImg');
const lbZoom     = document.getElementById('lbZoom');
const lbPrev     = document.getElementById('lbPrev');
const lbNext     = document.getElementById('lbNext');
let lbScale = 1, lbTx = 0, lbTy = 0, lbDragging = null;
let lbList = [], lbIndex = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoom.textContent = Math.round(lbScale * 100) + '%';
}
function resetLb() {
  lbScale = 1; lbTx = 0; lbTy = 0;
  applyLbTransform();
}
function showLb() {
  const cur = lbList[lbIndex];
  if (!cur) return;
  lbImg.src = PLACEHOLDER;
  if (cur.dataUrl) lbImg.src = cur.dataUrl;          // 新建暂存图直接可用
  else imgDbGet(cur.id).then(d => { if (d && lbList[lbIndex] === cur) lbImg.src = d; }).catch(() => {});
  resetLb();
  const multi = lbList.length > 1;
  lbPrev.classList.toggle('hide', !multi);
  lbNext.classList.toggle('hide', !multi);
  lightbox.classList.add('show');
}
function openLightboxAt(list, index) {
  lbList = list || [];
  lbIndex = Math.max(0, Math.min(index || 0, lbList.length - 1));
  showLb();
}
function lbStep(d) {
  if (!lbList.length) return;
  lbIndex = (lbIndex + d + lbList.length) % lbList.length;
  showLb();
}
function closeLightbox() {
  lightbox.classList.remove('show');
  lbList = [];
  resetLb();
}

lightbox.addEventListener('wheel', e => {
  if (!lightbox.classList.contains('show')) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  lbScale = Math.min(8, Math.max(0.2, lbScale * delta));
  applyLbTransform();
}, { passive: false });

lbImg.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  lbDragging = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbImg.classList.add('dragging');
  lbImg.setPointerCapture(e.pointerId);
});
lbImg.addEventListener('pointermove', e => {
  if (!lbDragging) return;
  lbTx = lbDragging.tx + (e.clientX - lbDragging.x);
  lbTy = lbDragging.ty + (e.clientY - lbDragging.y);
  applyLbTransform();
});
lbImg.addEventListener('pointerup', () => {
  lbDragging = null;
  lbImg.classList.remove('dragging');
});
lbImg.addEventListener('dblclick', resetLb);

document.getElementById('lbCopy').addEventListener('click', () => {
  copyImageToClipboard(lbImg.src).then(ok => {
    if (ok) showToast('已复制图片 → 单击目标卡片，按 Ctrl+V 粘贴');
    else showToast('复制失败，请重试');
  });
});
document.getElementById('lbReset').addEventListener('click', resetLb);
lbPrev.addEventListener('click', e => { e.stopPropagation(); lbStep(-1); });
lbNext.addEventListener('click', e => { e.stopPropagation(); lbStep(1); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
});

function copyImageToClipboard(dataUrl) {
  return new Promise(resolve => {
    copiedImageDataUrl = dataUrl;   // 网页内记忆：即使系统剪贴板失败也能粘贴到其他卡片
    try {
      fetch(dataUrl).then(r => r.blob()).then(blob => {
        if (!window.ClipboardItem) { resolve(false); return; }
        navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })])
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }).catch(() => resolve(false));
    } catch (e) { resolve(false); }
  });
}
let copiedImageDataUrl = null;
function dataUrlToFile(dataUrl) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);/) || [, 'image/png'])[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], 'pasted-img.' + (mime.split('/')[1] || 'png'), { type: mime });
}

// —— 编辑弹窗内：添加 / 删除图片 ——
document.addEventListener('click', e => {
  const del = e.target.closest('.edit-img-del');
  if (del) {
    e.stopPropagation();
    const gid = del.dataset.delimg;
    if (editingId) {
      const it = items.find(i => i.id === editingId);
      if (!it || !it.images) return;
      pushHistory();
      it.images = it.images.filter(g => g.id !== gid);
      it.updatedAt = Date.now();
      saveItems(); render();
      clearOrphanImgs();   // 保留 IDB 数据以便 Ctrl+Z 恢复，仅清真正孤儿
    } else {
      pendingImgs = pendingImgs.filter(g => g.id !== gid);
    }
    renderEditImgs();
    playSound('del');
    showToast('已删除图片，可按 Ctrl+Z 撤回');
    return;
  }
  if (e.target.closest('.edit-add')) {
    e.stopPropagation();
    playSound('click');
    if (editingId) imgTargetCardId = editingId;   // 编辑已有卡片：选文件后加入该卡
    imgFileInput.click();
    return;
  }
  // 编辑弹窗内图片预览（支持左右切换）
  const editImg = e.target.closest('.edit-img img');
  if (editImg) {
    e.stopPropagation();
    const list = editingId
      ? ((items.find(i => i.id === editingId) || {}).images || [])
      : pendingImgs;
    openLightboxAt(list, list.findIndex(g => g.id === editImg.dataset.imgid));
  }
});

// —— 编辑弹窗图片区渲染（已有图 + 添加按钮；新建时渲染暂存图） ——
function renderEditImgs() {
  const box = document.getElementById('editImgs');
  if (!box) return;
  const list = editingId
    ? ((items.find(i => i.id === editingId) || {}).images || [])
    : pendingImgs;
  const html = (list.length ? list.map(g => `
        <div class="edit-img">
          <img src="${g.dataUrl ? g.dataUrl : PLACEHOLDER}" data-imgid="${g.id}" alt="图片">
          <button type="button" class="edit-img-del" data-delimg="${g.id}" title="删除图片">×</button>
        </div>`).join('') : '') + `
      <button type="button" class="edit-add" title="选择图片文件（支持多张，jpg/png/gif/webp/svg 等）">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m21 15-5-5L5 21"/>
        </svg>
        添加图片
      </button>`;
  box.innerHTML = html;
  // 已有图（IndexedDB 存储）异步填充
  if (editingId) {
    box.querySelectorAll('img[data-imgid]').forEach(async im => {
      if (im.dataset.loaded || !im.dataset.imgid) return;
      try {
        const d = await imgDbGet(im.dataset.imgid);
        if (d && im.isConnected) { im.src = d; im.dataset.loaded = '1'; }
      } catch (e) {}
    });
  }
}

// —— 拖拽图片到卡片 ——
let imgDragCard = null;
listEl.addEventListener('dragenter', e => {
  if (!e.dataTransfer || ![...(e.dataTransfer.types || [])].includes('Files')) return;
  e.preventDefault();
});
listEl.addEventListener('dragover', e => {
  if (!e.dataTransfer || ![...(e.dataTransfer.types || [])].includes('Files')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  const card = e.target.closest('.card');
  if (card !== imgDragCard) {
    listEl.querySelectorAll('.card.drag-img').forEach(c => c.classList.remove('drag-img'));
    imgDragCard = card;
    if (card) card.classList.add('drag-img');
  }
});
listEl.addEventListener('dragleave', e => {
  if (e.target.closest('.card') === imgDragCard && !e.relatedTarget) {
    if (imgDragCard) imgDragCard.classList.remove('drag-img');
    imgDragCard = null;
  }
});
listEl.addEventListener('drop', e => {
  e.preventDefault();
  listEl.querySelectorAll('.card.drag-img').forEach(c => c.classList.remove('drag-img'));
  const card = e.target.closest('.card');
  imgDragCard = null;
  if (!card || !e.dataTransfer) return;
  const files = [...(e.dataTransfer.files || [])].filter(f => /^image\//.test(f.type));
  if (files.length) addImagesToCard(card.dataset.id, files);
});

// 图片预览：点击遮罩空白处关闭（拖拽平移不误关）
document.getElementById('imgLightbox').addEventListener('click', function (e) {
  if (e.target === this) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const lb = document.getElementById('imgLightbox');
    if (!lb.classList.contains('show')) return;
    closeLightbox();
  }
});

function cardHtml(it, seq) {
  const catName = (!it.category || it.category === NONE) ? '未分类' : it.category;
  const c = catColor(it.category);
  const tags = (it.tags || []).filter(Boolean);
  const pinned = !!it.pinned;
  const rating = it.rating || 0;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star${i <= rating ? ' filled' : ''}" data-s="${i}" title="${i} 星">★</span>`;
  }
  return `
  <article class="card ${pinned ? 'pinned' : ''}${selectedIds.has(it.id) ? ' selected' : ''}" data-id="${it.id}">
    <div class="card-head">
      <span class="card-seq" title="序号（按建立/移入先后，互换同步）">${seq}</span>
      <span class="badge" data-act="recat" title="点击更改分类" style="color:${c};background:${c}1a;box-shadow:inset 0 0 0 1px ${c}33">${escapeHtml(catName)}</span>
      <div class="card-actions">
        <button class="icon-btn" data-act="export" title="下载为 Word 文档">${ICON.download}</button>
        <button class="icon-btn" data-act="fullscreen" title="全屏查看内容">${ICON.expand}</button>
        <button class="icon-btn ${pinned ? 'on' : ''}" data-act="pin" title="${pinned ? '取消置顶' : '置顶'}">${ICON.pin}</button>
        <button class="icon-btn" data-act="edit" title="编辑">${ICON.pencil}</button>
        <button class="icon-btn" data-act="img" title="添加图片">${ICON.image}</button>
        <button class="icon-btn" data-act="del" title="删除">${ICON.trash}</button>
      </div>
      <span class="date">${fmtDate(it.updatedAt)}</span>
    </div>
    ${it.title ? `<h2 class="card-title">${escapeHtml(mdToPlainText(it.title))}</h2>` : ''}
    <div class="card-body">${mdToHtml(it.content)}</div>
    ${cardImgsHtml(it)}
    ${tags.length ? `<div class="tags">${tags.map(t => `<span>#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    <div class="card-foot">
      <span class="card-stars" title="点击标注星级（1-5 星）">${stars}</span>
      <button class="more-btn" data-act="toggle" hidden>展开全文</button>
    </div>
  </article>`;
}

/* ========== 空态名人名言（按分类随机、不重复） ========== */
const QUOTES = [
  { q: '好记性不如烂笔头。', a: '中国谚语' },
  { q: '纸上得来终觉浅，绝知此事要躬行。', a: '陆游' },
  { q: '一切理论都是灰色的，而生活之树常青。', a: '歌德' },
  { q: '如果你不能用简单的话解释一件事，你就还没有真正理解它。', a: '理查德·费曼' },
  { q: '写作就是思考的过程。', a: '威廉·津瑟' },
  { q: '优秀的艺术家模仿，伟大的艺术家偷窃。', a: '毕加索' },
  { q: '创新就是旧元素的新组合。', a: '熊彼特' },
  { q: '如果说我看得远，那是因为我站在巨人的肩膀上。', a: '牛顿' },
  { q: '学而不思则罔，思而不学则殆。', a: '孔子' },
  { q: '温故而知新，可以为师矣。', a: '孔子' },
  { q: '不积跬步，无以至千里；不积小流，无以成江海。', a: '荀子' },
  { q: '千里之行，始于足下。', a: '老子' },
  { q: '我听见就忘记，我看见就记住，我做过就理解。', a: '玛丽亚·蒙台梭利' },
  { q: '教是最好的学。', a: '费曼技巧' },
  { q: '知识就是力量。', a: '培根' },
  { q: '凡事预则立，不预则废。', a: '《礼记·中庸》' },
  { q: '工欲善其事，必先利其器。', a: '《论语》' },
  { q: '想都是问题，做才有答案。', a: '佚名' },
  { q: '灵感稍纵即逝，记录让它永恒。', a: '佚名' },
  { q: '没有被记录下来的事情，就等于没有发生。', a: '佚名' },
  { q: '输入不整理等于没输入，记录不回顾等于没记录。', a: '佚名' },
  { q: '把复杂变简单，把简单变深刻。', a: '佚名' },
  { q: '输出的质量，取决于输入的质量。', a: '佚名' },
  { q: '整理资料就是整理思维。', a: '佚名' },
  { q: '模仿是学习的开始，创新是模仿的升华。', a: '佚名' },
  { q: '学习任何东西最快的方式：先抄、再仿、最后超。', a: '佚名' },
  { q: '实践出真知。', a: '谚语' },
  { q: '好记性不如烂笔头，烂笔头不如好笔记。', a: '佚名' },
  { q: '每天进步一点点，坚持带来大改变。', a: '佚名' },
  { q: '种一棵树最好的时间是十年前，其次是现在。', a: '谚语' },
  { q: '机会总是留给有准备的人。', a: '巴斯德' },
  { q: '笔记不是复述，而是把别人的知识变成自己的语言。', a: '佚名' }
];
const _quotePool = new Map();      // 每个分类的轮播池（10 条）
const _quotePoolUsed = new Set();  // 已被其他分类池占用的名言（跨分类避让）
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function quotePoolFor(catKey) {
  if (_quotePool.has(catKey)) return _quotePool.get(catKey);
  const all = QUOTES.slice();
  let pool = [];
  // 优先选未被其他分类池占用的
  const fresh = all.filter((q, i) => !_quotePoolUsed.has(i));
  const rest  = all.filter((q, i) => _quotePoolUsed.has(i));
  const head = shuffle(fresh);
  const tail = shuffle(rest);
  const pick = head.concat(tail).slice(0, 10);
  pool = pick;
  pool.forEach((q, i) => {
    const idx = QUOTES.indexOf(q);
    if (idx >= 0) _quotePoolUsed.add(idx);
  });
  _quotePool.set(catKey, pool);
  return pool;
}

let quoteTimer = null;
let quoteIdx = 0;

/* 空态提示打字机：打字 → 停顿 → 抹除 → 循环 */
const TIP_TEXT = '赶紧去 Ctrl+C，回来 Ctrl+V';
let typeTimer = null;
function startTypewriter() {
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
  const el = document.getElementById('emptyTip');
  if (!el) return;
  el.textContent = '';
  let pos = 0, deleting = false, pauseTick = 0;
  typeTimer = setInterval(() => {
    if (!deleting) {
      pos++;
      el.textContent = TIP_TEXT.slice(0, pos);
      if (pos >= TIP_TEXT.length) { deleting = true; pauseTick = 0; }
    } else {
      pauseTick++;
      if (pauseTick < 20) return;   // 停顿约 2 秒
      pos--;
      el.textContent = TIP_TEXT.slice(0, pos);
      if (pos <= 0) { deleting = false; pos = 0; }
    }
  }, 95);
}

function renderQuoteInto(el, quote) {
  const text = el.querySelector('.eq-text');
  const auth = el.querySelector('.eq-author');
  if (text) text.textContent = quote.q;
  if (auth) {
    auth.textContent = quote.a && quote.a !== '佚名' ? '—— ' + quote.a : '';
  }
}
function startQuoteCarousel(catKey) {
  if (quoteTimer) { clearInterval(quoteTimer); quoteTimer = null; }
  const el = document.getElementById('emptyQuote');
  if (!el) return;
  const pool = quotePoolFor(catKey);
  if (!pool.length) return;
  quoteIdx = 0;
  renderQuoteInto(el, pool[0]);
  quoteTimer = setInterval(() => {
    const eq = document.getElementById('emptyQuote');
    if (!eq) { clearInterval(quoteTimer); quoteTimer = null; return; }
    eq.classList.add('out');
    setTimeout(() => {
      quoteIdx = (quoteIdx + 1) % pool.length;
      renderQuoteInto(eq, pool[quoteIdx]);
      eq.classList.remove('out');
      eq.classList.add('in');
      void eq.offsetWidth;
      eq.classList.remove('in');
    }, 220);
  }, 3400);
}

function renderList() {
  let list = items.slice();
  if (state.category !== 'all') list = list.filter(it => inCatView(it, state.category));
  list.sort(sortItems);

  if (!list.length) {
    listEl.innerHTML = `
      <div class="empty">
        <div class="icon">${ICON.scan}</div>
        <p>当前分类下没有笔记</p>
        <span class="empty-tip" id="emptyTip"></span>
        <div class="empty-quote" id="emptyQuote">
          <div class="eq-inner">
            <svg class="eq-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 7H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2H5a1 1 0 1 0 0 2h1a4 4 0 0 0 4-4V9a2 2 0 0 0-2-2z"/>
              <path d="M20 7h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2h-1a1 1 0 1 0 0 2h1a4 4 0 0 0 4-4V9a2 2 0 0 0-2-2z"/>
            </svg>
            <p class="eq-text"></p>
            <p class="eq-author"></p>
          </div>
        </div>
      </div>`;
    startQuoteCarousel(state.category);
    startTypewriter();
    renderStickies();
    return;
  }

  listEl.innerHTML = list.map((it, i) => cardHtml(it, i + 1)).join('');

  listEl.querySelectorAll('.card').forEach(card => {
    const body = card.querySelector('.card-body');
    const btn  = card.querySelector('.more-btn');
    if (body.scrollHeight > body.clientHeight + 2) {
      body.classList.add('clamped');
      btn.hidden = false;
    }
  });

  renderStickies();
}

function searchResultHtml(it, terms) {
  const c = catColor(it.category);
  const catLabel = (!it.category || it.category === NONE) ? '未分类' : it.category;
  const tags = (it.tags || []).filter(Boolean);
  const fullText = mdToPlainText(it.content || '');   // 摘要/全文去除 Markdown 格式符号
  const snippet  = makeSnippet(fullText, terms, 140);
  const hasMore  = fullText.length > 145;

  return `
  <div class="sp-item ${hasMore ? 'has-more' : ''}" data-id="${it.id}">
    <div class="sp-item-head">
      <span class="sp-badge" style="color:${c};background:${c}1a;box-shadow:inset 0 0 0 1px ${c}33">${escapeHtml(catLabel)}</span>
      <span class="sp-date">${fmtDate(it.updatedAt)}</span>
      <div class="sp-actions">
        <button class="sp-act" data-act="locate" title="定位到卡片">${ICON.locate}</button>
        <button class="sp-act" data-act="copy" title="复制内容">${ICON.copy}</button>
      </div>
    </div>
    ${it.title ? `<div class="sp-item-title">${highlight(mdToPlainText(it.title), terms, 'sp-mark')}</div>` : ''}
    ${snippet ? `<div class="sp-item-snippet">${highlight(snippet, terms, 'sp-mark')}</div>` : ''}
    ${hasMore ? `<div class="sp-item-full" hidden>${highlight(fullText, terms, 'sp-mark')}</div>` : ''}
    ${tags.length ? `<div class="sp-item-tags">${tags.map(t => `<span>#${highlight(t, terms, 'sp-tag-mark')}</span>`).join('')}</div>` : ''}
    ${hasMore ? `<button class="sp-more">展开全文</button>` : ''}
  </div>`;
}

function stickyResultHtml(st, terms) {
  const fullText = st.text || '';
  const snippet  = makeSnippet(fullText, terms, 140);
  const hasMore  = fullText.length > 145;
  return `
  <div class="sp-item sticky-hit ${hasMore ? 'has-more' : ''}" data-type="sticky" data-id="${st.id}">
    <div class="sp-item-head">
      <span class="sp-badge" style="color:#8b5cf6;background:#8b5cf61a;box-shadow:inset 0 0 0 1px #8b5cf633">📌 便签</span>
      <span class="sp-date">${fmtDate(st.createdAt)}</span>
      <div class="sp-actions">
        <button class="sp-act" data-act="locate" title="定位到便签">${ICON.locate}</button>
        <button class="sp-act" data-act="copy" title="复制内容">${ICON.copy}</button>
      </div>
    </div>
    ${snippet ? `<div class="sp-item-snippet">${highlight(snippet, terms, 'sp-mark')}</div>` : ''}
    ${hasMore ? `<div class="sp-item-full" hidden>${highlight(fullText, terms, 'sp-mark')}</div>` : ''}
    ${hasMore ? `<button class="sp-more">展开全文</button>` : ''}
  </div>`;
}

function renderSearchPanel() {
  const q = state.query.trim();
  const terms = searchTerms(q);

  if (!terms.length) {
    searchPanel.hidden = true;
    listEl.classList.remove('dimmed');
    document.getElementById('sideSearch').classList.remove('active');
    return;
  }

  searchPanel.hidden = false;
  listEl.classList.add('dimmed');
  document.getElementById('sideSearch').classList.add('active');

  let results = items.filter(it => matchItem(it, terms));
  if (state.category !== 'all') results = results.filter(it => inCatView(it, state.category));
  results.sort(sortItems);

  let sResults = stickies.filter(st => matchSticky(st, terms));

  spCount.textContent = results.length + sResults.length;

  if (!results.length && !sResults.length) {
    spBody.innerHTML = `
      <div class="sp-empty">
        <div class="ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M20 20l-3.5-3.5"/>
          </svg>
        </div>
        <p>没有找到匹配的记录</p>
        <span>试试更换关键词，或切换左侧分类</span>
      </div>`;
    return;
  }

  const cardHtmls = results.map(it => searchResultHtml(it, terms));
  const stickyHtmls = sResults
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(st => stickyResultHtml(st, terms));
  spBody.innerHTML = cardHtmls.concat(stickyHtmls).join('');
}

spBody.addEventListener('click', e => {
  const item = e.target.closest('.sp-item');
  if (!item) return;
  const id = item.dataset.id;
  const isSticky = item.dataset.type === 'sticky';
  const st = isSticky ? stickies.find(s => s.id === id) : null;
  const it  = isSticky ? null : items.find(i => i.id === id);
  if (isSticky && !st) return;
  if (!isSticky && !it) return;

  const actBtn = e.target.closest('[data-act]');
  if (actBtn) {
    const act = actBtn.dataset.act;
    if (act === 'copy') {
      const text = isSticky ? (st.text || '') : ((it.content || '').trim() || it.title || '');
      if (!text) return;
      copyText(text).then(ok => {
        if (ok) {
          item.classList.remove('copied');
          void item.offsetWidth;
          item.classList.add('copied');
          showToast('✓ 已复制内容到剪贴板');
        } else {
          showToast('复制失败，请手动选择文字');
        }
      });
    } else if (act === 'locate') {
      if (isSticky) locateSticky(id);
      else locateItem(id);
    }
    return;
  }

  if (!item.classList.contains('has-more')) return;
  const snippetEl = item.querySelector('.sp-item-snippet');
  const fullEl    = item.querySelector('.sp-item-full');
  const moreBtn   = item.querySelector('.sp-more');
  const expanded  = item.classList.toggle('expanded');
  if (snippetEl) snippetEl.hidden = expanded;
  if (fullEl)    fullEl.hidden    = !expanded;
  if (moreBtn)   moreBtn.textContent = expanded ? '收起' : '展开全文';
});

/* ========== 展开卡片顺序栈 → 页面下方常驻「收起」按钮（后展开先收起） ========== */
const expandedStack = [];

function syncCollapseFab() {
  collapseFab.hidden = expandedStack.length === 0;
}

function setCardExpanded(card, target) {
  if (!card || !card.isConnected) return;
  const body = card.querySelector('.card-body');
  card.classList.toggle('expanded', target);
  if (body) body.classList.toggle('expanded', target);
  const more = card.querySelector('.more-btn');
  if (more) more.textContent = target ? '收起' : '展开全文';
  const idx = expandedStack.indexOf(card);
  if (target && idx === -1) expandedStack.push(card);
  if (!target && idx !== -1) expandedStack.splice(idx, 1);
  syncCollapseFab();
}

collapseFab.addEventListener('click', () => {
  playSound('click');
  const card = expandedStack[expandedStack.length - 1];
  if (card && card.isConnected) setCardExpanded(card, false);
  else {
    expandedStack.pop();
    syncCollapseFab();
  }
});

/* ========== 拖拽：卡片互换 / 拖到分类归类 / 分类互换 ========== */
let suppressClick = false;

/* ========== 长按拖拽：卡片互换 / 拖到分类归类 / 分类互换 ==========
   按住 320ms 才锁定拖拽，普通单击/滑选不受影响，可自由选中复制文字 */
let dragDoc = null;
let dragCat = null;
let holdTimer = null;
let heldStart = null;
let holdPointerId = null;
let barWasVisible = false;   // 拖拽前多选操作条是否可见（拖拽期间隐藏，结束恢复）

function initDnD() {
  const clearHold = () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    heldStart = null;
  };

  const makeGhost = (el, x, y) => {
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.classList.add('drag-ghost');
    clone.style.left = rect.left + 'px';
    clone.style.top  = rect.top  + 'px';
    clone.style.width = rect.width + 'px';
    document.body.appendChild(clone);
    return { clone, dx: x - rect.left, dy: y - rect.top };
  };

  const cleanupDrag = () => {
    if (dragDoc) {
      dragDoc.clone.remove();
      (dragDoc.subs || []).forEach(s => s.clone.remove());
    }
    if (dragCat) dragCat.clone.remove();
    dragDoc = null;
    dragCat = null;
    document.getElementById('dropTip').hidden = true;
    document.body.classList.remove('drag-active');
    document.querySelectorAll('.card.dragging, .card.drag-over').forEach(c =>
      c.classList.remove('dragging', 'drag-over'));
    document.querySelectorAll('.cat-item.dragging, .cat-item.drag-over').forEach(c =>
      c.classList.remove('dragging', 'drag-over'));
    document.querySelectorAll('.sticky.st-hover').forEach(c => c.classList.remove('st-hover'));
    // 拖拽结束：恢复多选操作条（若拖拽前可见且仍有选中）
    if (barWasVisible) {
      updateMultiBar();
      barWasVisible = false;
    }
  };

  const updateDropTarget = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el ? el.closest('.card') : null;
    const chip = el ? el.closest('.cat-item[data-cat]:not([data-cat="all"])') : null;
    document.querySelectorAll('.card.drag-over').forEach(c => c.classList.remove('drag-over'));
    document.querySelectorAll('.cat-item.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (dragDoc && card && card.dataset.id !== dragDoc.id) card.classList.add('drag-over');
    if (chip && dragCat && chip.dataset.cat !== NONE && chip.dataset.cat !== dragCat.name) chip.classList.add('drag-over');
    if (chip && dragDoc) chip.classList.add('drag-over');
    // 卡片拖拽：悬停卡片 → 互换提示；悬停分类 → 甩进提示；否则浮层保持 80% 不提示
    const tip = document.getElementById('dropTip');
    if (dragDoc) {
      const dropChip = (chip && chip.dataset.cat !== NONE) ? chip : null;
      if (dragDoc.group) {
        // 多选组拖拽：悬停分类 → 整组甩进提示（悬停卡片不互换）
        if (dropChip) {
          dragDoc.clone.style.opacity = '0.2';
          tip.textContent = '你想把 ' + dragDoc.ids.length + ' 条笔记甩进「' + dropChip.dataset.cat + '」吗？';
        } else {
          dragDoc.clone.style.opacity = '';
          tip.hidden = true;
          return;
        }
      } else {
        const swapCard = (card && card.dataset.id !== dragDoc.id) ? card : null;
        if (swapCard) {
          dragDoc.clone.style.opacity = '0.2';
          const seq = seqOf(swapCard.dataset.id);
          tip.textContent = '你想和「笔记' + seq + '」互换位置吗？';
        } else if (dropChip) {
          dragDoc.clone.style.opacity = '0.2';
          tip.textContent = '你想把该文档甩进「' + dropChip.dataset.cat + '」吗？';
        } else {
          dragDoc.clone.style.opacity = '';
          tip.hidden = true;
          return;
        }
      }
      tip.hidden = false;
      let tx = e.clientX, ty = e.clientY - 66;
      const tr = tip.getBoundingClientRect();
      tx = Math.max(tr.width / 2 + 8, Math.min(tx, window.innerWidth - tr.width / 2 - 8));
      if (ty < 8) ty = 8;
      tip.style.left = tx + 'px';
      tip.style.top  = ty + 'px';
    } else {
      tip.hidden = true;
    }
  };

  // —— 卡片：按住 320ms 锁定拖拽 ——
  listEl.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-act]') || e.target.closest('.star') || e.target.closest('.card-imgs')) return;
    const card = e.target.closest('.card');
    if (!card) return;
    holdPointerId = e.pointerId;
    heldStart = { x: e.clientX, y: e.clientY, card };
    holdTimer = setTimeout(() => {
      holdTimer = null;
      barWasVisible = !multiBar.hidden;      // 拖拽期间隐藏多选操作条
      if (barWasVisible) multiBar.hidden = true;
      const g = makeGhost(heldStart.card, heldStart.x, heldStart.y);
      const gid = heldStart.card.dataset.id;
      const group = selectedIds.size > 1 && selectedIds.has(gid);
      dragDoc = { id: gid, group, ids: group ? [...selectedIds] : null, subs: [], ...g };
      if (group) {
        // 其余选中卡片生成跟随幻影（半透明），整组一起拖
        selectedIds.forEach(sid => {
          if (sid === gid) return;
          const sel = listEl.querySelector('.card[data-id="' + sid + '"]');
          if (!sel) return;
          const sg = makeGhost(sel, heldStart.x, heldStart.y);
          sg.clone.style.opacity = '.35';
          sg.clone.style.transform = 'scale(.96)';
          dragDoc.subs.push(sg);
        });
      }
      heldStart.card.classList.add('dragging');
      document.body.classList.add('drag-active');
      playSound('swap');
    }, 450);
  });

  // —— 分类：按住 300ms 锁定拖拽互换（比卡片更跟手） ——
  filtersEl.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const chip = e.target.closest('.cat-item[data-cat]:not([data-cat="all"]):not([data-cat="' + NONE + '"])');
    if (!chip) return;
    holdPointerId = e.pointerId;
    heldStart = { x: e.clientX, y: e.clientY, chip };
    holdTimer = setTimeout(() => {
      holdTimer = null;
      barWasVisible = !multiBar.hidden;      // 分类拖拽同样隐藏多选操作条
      if (barWasVisible) multiBar.hidden = true;
      const g = makeGhost(heldStart.chip, heldStart.x, heldStart.y);
      dragCat = { name: heldStart.chip.dataset.cat, ...g };
      heldStart.chip.classList.add('dragging');
      document.body.classList.add('drag-active');
      playSound('swap');
    }, 300);
  });

  window.addEventListener('pointermove', e => {
    if (e.pointerId !== holdPointerId) return;
    if (dragDoc || dragCat) {
      const d = dragDoc || dragCat;
      d.clone.style.left = (e.clientX - d.dx) + 'px';
      d.clone.style.top  = (e.clientY - d.dy) + 'px';
      if (d.subs) d.subs.forEach(s => {
        s.clone.style.left = (e.clientX - s.dx) + 'px';
        s.clone.style.top  = (e.clientY - s.dy) + 'px';
      });
      updateDropTarget(e);
    } else if (holdTimer && heldStart &&
               Math.hypot(e.clientX - heldStart.x, e.clientY - heldStart.y) > 8) {
      clearHold();   // 快速滑动 → 取消长按，允许选择文字/滚动
      holdPointerId = null;
    }
  }, { passive: true });

  window.addEventListener('pointerup', e => {
    if (e.pointerId !== holdPointerId) return;
    const wasDrag = !!dragDoc || !!dragCat;
    const x = e.clientX, y = e.clientY;
    if (dragDoc) {
      const srcId = dragDoc.id;
      const wasGroup = !!dragDoc.group;
      const gIds = wasGroup ? dragDoc.ids : null;
      const el = document.elementFromPoint(x, y);
      const card = el ? el.closest('.card') : null;
      const chip = el ? el.closest('.cat-item[data-cat]:not([data-cat="all"])') : null;
      cleanupDrag();
      if (wasGroup) {
        if (chip) moveToCategoryBulk(gIds, chip.dataset.cat);
      } else if (card && card.dataset.id !== srcId) {
        commitSwap(srcId, card.dataset.id);
      } else if (chip) {
        moveToCategory(srcId, chip.dataset.cat);
      }
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 120);
    } else if (dragCat) {
      const srcName = dragCat.name;
      const el = document.elementFromPoint(x, y);
      const chip = el ? el.closest('.cat-item[data-cat]:not([data-cat="all"]):not([data-cat="' + NONE + '"])') : null;
      cleanupDrag();
      if (chip && chip.dataset.cat !== srcName) commitCatSwap(srcName, chip.dataset.cat);
    }
    clearHold();
    holdPointerId = null;
    if (wasDrag && !dragDoc && !dragCat) suppressClick = true, setTimeout(() => { suppressClick = false; }, 120);
  }, true);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (dragDoc || dragCat)) {
      cleanupDrag();
      clearHold();
      holdPointerId = null;
    } else if (e.key === 'Escape' && selectedIds.size) {
      clearSelection();
    }
  });
}

function flashSwap(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.remove('swap-flash');
  void el.offsetWidth;
  // 连续闪烁 4 次，更醒目
  let n = 4;
  const tick = () => {
    el.classList.add('swap-flash');
    setTimeout(() => {
      el.classList.remove('swap-flash');
      if (--n > 0) setTimeout(tick, 130);
    }, 620);
  };
  tick();
}

function commitSwap(aId, bId) {
  if (aId === bId) return;
  const rendered = items.slice()
    .filter(it => inCatView(it, state.category))
    .sort(sortItems);
  const ia = rendered.findIndex(x => x.id === aId);
  const ib = rendered.findIndex(x => x.id === bId);
  if (ia < 0 || ib < 0) return;
  rendered.forEach((x, k) => { x.mOrder = k; });
  const t = rendered[ia].mOrder;
  rendered[ia].mOrder = rendered[ib].mOrder;
  rendered[ib].mOrder = t;
  pushHistory();
  saveItems();
  render();
  playSound('swap');
  flashSwap('[data-id="' + aId + '"]');
  flashSwap('[data-id="' + bId + '"]');
}

function moveToCategory(id, catName) {
  const it = items.find(i => i.id === id);
  if (!it) return;
  const target = catName === NONE ? '' : catName;
  if ((target || '未分类') === (it.category || '未分类')) { showToast('已在该分类中'); return; }
  pushHistory();
  it.category = target;
  it.mOrder = nextOrder();   // 移入分类 → 排到该分类末尾（序号按移入先后）
  it.updatedAt = Date.now();
  saveItems(); render();
  playSound('recat');
  showToast('已移动到分类「' + (target || '未分类') + '」');
}

function moveToCategoryBulk(ids, catName) {
  const target = catName === NONE ? '' : catName;
  const targets = ids.map(id => items.find(i => i.id === id)).filter(Boolean);
  if (!targets.length) return;
  if (targets.every(i => (i.category || '未分类') === (target || '未分类'))) { showToast('已在该分类中'); return; }
  pushHistory();
  targets.forEach(i => {
    i.category = target;
    i.mOrder = nextOrder();
    i.updatedAt = Date.now();
  });
  saveItems(); render();
  playSound('recat');
  clearSelection();
  showToast('已移动 ' + targets.length + ' 条笔记到「' + (target || '未分类') + '」');
}

function commitCatSwap(aName, bName) {
  if (aName === bName) return;
  const sorted = sortedCats();
  const ia = sorted.findIndex(c => c.name === aName);
  const ib = sorted.findIndex(c => c.name === bName);
  if (ia < 0 || ib < 0) return;
  sorted.forEach((c, k) => { c.mOrder = k; });
  const t = sorted[ia].mOrder;
  sorted[ia].mOrder = sorted[ib].mOrder;
  sorted[ib].mOrder = t;
  // 置顶状态随位置互换：置顶分类固定排最前，拖拽换位时同步换置顶（否则置顶分类拖不动）
  const tp = sorted[ia].pinned;
  sorted[ia].pinned = sorted[ib].pinned;
  sorted[ib].pinned = tp;
  pushHistory();
  saveCats();
  render();
  playSound('swap');
  flashSwap('[data-cat="' + CSS.escape(aName) + '"]');
  flashSwap('[data-cat="' + CSS.escape(bName) + '"]');
}

/* 原生拖拽：卡片互换 / 拖到左侧分类归类 / 分类互换 */
initDnD();

/* ========== 卡片分类快捷归类 ========== */
function openRecat(id, anchorEl) {
  const it = items.find(i => i.id === id);
  if (!it) return;
  recatId = id;
  const noneOn = !it.category;
  recatMenu.innerHTML =
    '<div class="recat-head">移动到分类</div>' +
    `<button class="recat-item${noneOn ? ' on' : ''}" data-cat="${NONE}">
      <span class="cat-icon">🏷️</span>
      <span class="name">未分类</span>
      <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </button>` +
    sortedCats().map(c => {
      const on = c.name === it.category;
      return `<button class="recat-item${on ? ' on' : ''}" data-cat="${escapeHtml(c.name)}">
        <span class="cat-icon">${c.icon || '📁'}</span>
        <span class="name">${escapeHtml(c.name)}</span>
        <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </button>`;
    }).join('');
  recatMenu.hidden = false;
  const r = anchorEl.getBoundingClientRect();
  const mh = recatMenu.offsetHeight || 240;
  const mw = recatMenu.offsetWidth || 172;
  let top = r.bottom + 8;
  if (top + mh > window.innerHeight - 12) top = Math.max(12, r.top - mh - 8);
  const left = Math.min(Math.max(12, r.left), window.innerWidth - mw - 12);
  recatMenu.style.top = top + 'px';
  recatMenu.style.left = left + 'px';
}

function closeRecat() {
  recatMenu.hidden = true;
  recatId = null;
}

/* ========== 分类标签树状展开面板（再次单击分类触发） ========== */
const tagPanel = document.getElementById('tagPanel');
const tagpBody = document.getElementById('tagpBody');
const tagpSub  = document.getElementById('tagpSub');
const tagpCat  = document.getElementById('tagpCat');
let tagPanelCat = 'all';

function openTagPanel(catKey, anchorEl) {
  tagPanelCat = catKey;
  const list = items.filter(it => inCatView(it, catKey));
  const tagCount = {};
  list.forEach(it => (it.tags || []).forEach(t => { if (t) tagCount[t] = (tagCount[t] || 0) + 1; }));
  const names = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
  tagpCat.textContent = catKey === 'all' ? '全部文档' : (catKey === NONE ? '未分类' : catKey);
  if (!names.length) {
    tagpBody.innerHTML = '<div class="tagp-empty">当前分类没有对笔记做标签化，<br><b>别偷懒，赶紧打标签！</b></div>';
  } else {
    tagpBody.innerHTML = names.map(t =>
      `<button class="tagp-tag" data-tag="${escapeHtml(t)}"><span class="tt">#${escapeHtml(t)}</span><span class="tc">${tagCount[t]}</span></button>`).join('');
  }
  hideTagSub();
  positionTagPanel(anchorEl);
  tagPanel.hidden = false;
  playSound('open');
}
function closeTagPanel() {
  tagPanel.hidden = true;
  hideTagSub();
}
function hideTagSub() { tagpSub.hidden = true; }
function positionTagPanel(anchorEl) {
  const r = anchorEl.getBoundingClientRect();
  const pw = tagPanel.offsetWidth || 258;
  let left = r.right + 12;
  if (left + pw > window.innerWidth - 10) left = Math.max(10, r.left - pw - 12);
  let top = r.top;
  const ph = tagPanel.offsetHeight || 200;
  if (top + ph > window.innerHeight - 10) top = Math.max(10, window.innerHeight - ph - 10);
  tagPanel.style.left = left + 'px';
  tagPanel.style.top  = top + 'px';
}
function showTagSub(tag) {
  const list = items.filter(it => inCatView(it, tagPanelCat) && (it.tags || []).includes(tag));
  const label = tagPanelCat === 'all' ? '全部文档' : (tagPanelCat === NONE ? '未分类' : tagPanelCat);
  tagpSub.innerHTML =
    `<div class="tagp-subhead">#<span class="tg">${escapeHtml(tag)}</span> · ${label}（${list.length}）</div>` +
    (list.length ? list.map((it, i) =>
      `<button class="tagp-card" data-id="${it.id}"><span class="seq">${seqOf(it.id) || i + 1}</span><span class="ct">${escapeHtml(mdToPlainText(it.title) || '未命名笔记')}</span></button>`).join('')
      : '<div class="tagp-empty">该分类下暂无带此标签的笔记</div>');
  const pr = tagPanel.getBoundingClientRect();
  let left = pr.right + 8;
  const sw = 236;
  if (left + sw > window.innerWidth - 10) left = Math.max(10, pr.left - sw - 8);
  tagpSub.style.left = left + 'px';
  tagpSub.style.top  = Math.max(10, pr.top) + 'px';
  tagpSub.hidden = false;
  playSound('click');
}
function jumpToCard(id) {
  closeTagPanel();
  const card = document.querySelector('.card[data-id="' + id + '"]');
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashSwap('[data-id="' + id + '"]');
    playSound('locate');
  }
}
tagpBody.addEventListener('click', e => {
  const b = e.target.closest('.tagp-tag');
  if (!b) return;
  showTagSub(b.dataset.tag);
});
tagpSub.addEventListener('click', e => {
  const b = e.target.closest('.tagp-card');
  if (!b) return;
  jumpToCard(b.dataset.id);
});
document.getElementById('tagpClose').addEventListener('click', closeTagPanel);
document.addEventListener('click', e => {
  if (tagPanel.hidden) return;
  if (tagPanel.contains(e.target) || tagpSub.contains(e.target)) return;
  if (e.target.closest('.cat-item')) return;
  closeTagPanel();
});

recatMenu.addEventListener('click', e => {
  const btn = e.target.closest('.recat-item');
  if (!btn) return;
  const cat = btn.dataset.cat;
  const it = items.find(i => i.id === recatId);
  if (it && cat && (cat === NONE ? it.category : cat !== it.category)) {
    pushHistory();
    it.category = cat === NONE ? '' : cat;
    it.updatedAt = Date.now();
    saveItems(); render();
    playSound('recat');
    showToast('已移动到分类「' + (it.category || '未分类') + '」');
  }
  closeRecat();
});

document.addEventListener('click', e => {
  if (recatMenu.hidden) return;
  if (recatMenu.contains(e.target)) return;
  if (e.target.closest('[data-act="recat"]')) return;
  closeRecat();
});

listEl.addEventListener('dblclick', e => {
  if (e.target.closest('[data-act]') || e.target.closest('.star')) return;
  const card = e.target.closest('.card');
  if (!card) return;
  const it = items.find(i => i.id === card.dataset.id);
  if (it) { playSound('click'); openModal(it); }
});

/* ========== 全局 Ctrl+V：直接粘贴为卡片 ========== */
document.addEventListener('paste', e => {
  // 添加图片弹窗打开时：Ctrl+V 粘贴图片 → 直接加入目标卡片
  const imgModal = document.getElementById('imgAddModal');
  if (imgModal && !imgModal.hidden) {
    e.preventDefault();
    const cd = e.clipboardData;
    if (cd) {
      const imgItems = [...(cd.items || [])].filter(i => i.type && i.type.startsWith('image/'));
      if (imgItems.length && imgTargetCardId) {
        const files = imgItems.map(i => i.getAsFile()).filter(Boolean);
        if (files.length) { addImagesToCard(imgTargetCardId, files); closeImgAddModal(); }
      }
    }
    return;
  }
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
  // 编辑弹窗 / 全屏查看器打开时不拦截，避免误建卡片
  if (!document.getElementById('modal').hidden || !document.getElementById('viewer').hidden) return;
  const cd = e.clipboardData;
  if (!cd) return;
  // 剪贴板含图片 → 添加到最近单击的卡片
  const imgItems = [...(cd.items || [])].filter(i => i.type && i.type.startsWith('image/'));
  if (imgItems.length) {
    const target = items.find(i => i.id === lastClickedCardId);
    if (target) {
      e.preventDefault();
      const files = imgItems.map(i => i.getAsFile()).filter(Boolean);
      addImagesToCard(target.id, files);
      return;
    }
  }
  const plain = cd.getData('text/plain') || '';
  const html  = cd.getData('text/html') || '';
  const text  = (plain && plain.trim()) ? plain : (html ? htmlToMd(html) : '');
  if (!text || !text.trim()) return;
  e.preventDefault();
  quickPasteCard(text);
});

/* ========== 单卡导出 Word 文档（内容 + 图片内嵌） ========== */
// Word 对 <ol>/<ul> 的默认缩进过大（编号与文字之间空隙宽），
// 导出时转为「手动编号段落」，间距干净可控
function wordListManual(htmlStr) {
  try {
    const doc = new DOMParser().parseFromString('<div id="__wl">' + htmlStr + '</div>', 'text/html');
    const root = doc.getElementById('__wl');
    if (!root) return htmlStr;
    root.querySelectorAll('ol').forEach(ol => {
      const wrap = doc.createElement('div');
      let n = parseInt(ol.getAttribute('start') || '1', 10);
      if (!(n > 0)) n = 1;   // 无 start 的独立列表一律从 1 开始，绝不全局续号
      ol.querySelectorAll(':scope > li').forEach(li => {
        const p = doc.createElement('p');
        p.style.cssText = 'margin:1px 0;';
        p.innerHTML = '<span style="margin-right:7px;">' + n + '.</span>' + li.innerHTML;
        wrap.appendChild(p);
        n++;
      });
      ol.replaceWith(wrap);
    });
    root.querySelectorAll('ul').forEach(ul => {
      const wrap = doc.createElement('div');
      ul.querySelectorAll(':scope > li').forEach(li => {
        const p = doc.createElement('p');
        p.style.cssText = 'margin:1px 0;';
        p.innerHTML = '<span style="margin-right:7px;">•</span>' + li.innerHTML;
        wrap.appendChild(p);
      });
      ul.replaceWith(wrap);
    });
    return root.innerHTML;
  } catch (e) { return htmlStr; }
}
async function buildWordHtml(it) {
  const title = mdToPlainText(it.title || '').trim() || '未命名笔记';
  const cat = (!it.category || it.category === NONE) ? '未分类' : it.category;
  let contentHtml = mdToHtml(it.content || '')
    .replace(/<table>/g, '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;">')
    .replace(/<td>/g, '<td style="border:1px solid #999;padding:4px 8px;">')
    .replace(/<th>/g, '<th style="border:1px solid #999;padding:4px 8px;background:#f2f2f2;">');
  contentHtml = wordListManual(contentHtml);
  // 图片：从 IndexedDB 取 dataURL 一并嵌入 Word
  const imgsHtml = [];
  for (const g of (it.images || []).filter(Boolean)) {
    let d = null;
    try { d = await imgDbGet(g.id); } catch (e) {}
    if (!d) continue;
    imgsHtml.push(`<div style="margin:12px 0;text-align:center;"><img src="${d}" alt="${escapeHtml(g.name || '图片')}" style="max-width:100%;"/></div>`);
  }
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
body{font-family:宋体,SimSun,微软雅黑,"Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.7;color:#222;}
h1{font-size:17pt;margin:6px 0 2px;}h2{font-size:14.5pt;}h3{font-size:12.5pt;}h4{font-size:11.5pt;}
p{margin:4px 0;}
pre{background:#f6f6f6;border:1px solid #ddd;padding:8px;font-family:Consolas,monospace;font-size:9.5pt;}
code{font-family:Consolas,monospace;background:#f3f3f3;padding:0 2px;}
blockquote{border-left:3px solid #ccc;margin:6px 0;padding:2px 12px;color:#555;}
ul,ol{margin:4px 0 4px 22px;}
hr{border:none;border-top:1px solid #ccc;margin:10px 0;}
img{max-width:100%;}
a{color:#2a5db0;}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p style="color:#888;font-size:9pt;text-align:left;">分类：${escapeHtml(cat)} · 导出时间：${fmtDate(Date.now())}</p>
<hr>
${contentHtml}
${imgsHtml.join('')}
</body>
</html>`;
  const safe = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || '未命名笔记';
  return { title, safeName: safe, html };
}

async function exportCardToWord(it) {
  if (!it) return;
  playSound('save');
  const w = await buildWordHtml(it);
  const blob = new Blob(['\ufeff' + w.html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${w.safeName}.doc`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('已导出 Word 文档（含图片）');
}

/* ========== 简易 ZIP 打包（STORE 无压缩，支持中文文件名 UTF-8） ========== */
const ZIP_CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function zipCrc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = ZIP_CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function makeZip(entries) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name);
    const data = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data);
    const crc = zipCrc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);          // UTF-8 文件名
    lh.setUint16(8, 0, true);               // STORE
    lh.setUint16(10, 0, true);
    lh.setUint16(12, 0, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true);
    ch.setUint16(14, 0, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, u) => s + u.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);
  return new Blob([...parts, ...central, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
}

function quickPasteCard(text) {  pushHistory();
  const now = Date.now();
  const pt = mdToPlainText(text).trim();
  const title = pt.slice(0, 24) + (pt.length > 24 ? '…' : '');
  // 「全部/未分类」视图下粘贴 → 归入未分类；分类视图下 → 自动归档到该分类
  const cat = (state.category === 'all' || state.category === NONE) ? '' : state.category;
  items.unshift({
    id: uid(), title, content: text.trim(), category: cat,
    tags: [], pinned: false, rating: 0,
    mOrder: nextOrder(),
    createdAt: now, updatedAt: now
  });
  saveItems(); render();
  playSound('save');
  showToast('已粘贴为卡片');
}

function locateItem(id) {
  const it = items.find(i => i.id === id);
  if (!it) return;

  searchInput.value = '';
  state.query = '';
  clearBtn.hidden = true;

  if (state.category !== 'all' && !inCatView(it, state.category)) {
    state.category = 'all';
  }

  render();

  requestAnimationFrame(() => {
    const card = listEl.querySelector('.card[data-id="' + id + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('locate-flash');
    void card.offsetWidth;
    card.classList.add('locate-flash');
    setTimeout(() => card.classList.remove('locate-flash'), 1900);
  });
}

// 从搜索结果定位到便签所在位置（滚动 + 高亮闪烁）
function locateSticky(id) {
  const st = stickies.find(s => s.id === id);
  if (!st) return;

  searchInput.value = '';
  state.query = '';
  clearBtn.hidden = true;

  render();

  requestAnimationFrame(() => {
    const el = listEl.querySelector('.sticky[data-id="' + id + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('locate-flash');
    void el.offsetWidth;
    el.classList.add('locate-flash');
    setTimeout(() => el.classList.remove('locate-flash'), 2600);
  });
}

function closeSearch() {
  searchInput.value = '';
  state.query = '';
  clearBtn.hidden = true;
  render();
}

spClose.addEventListener('click', closeSearch);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !searchPanel.hidden) {
    e.preventDefault();
    closeSearch();
    searchInput.blur();
  }
});

document.addEventListener('mousedown', e => {
  if (searchPanel.hidden) return;
  if (e.target.closest('#searchPanel')) return;
  if (e.target.closest('#sideSearch')) return;
  // 右下角功能按钮 / 收起按钮等操作不关闭搜索面板
  if (e.target.closest('#helpBtn, #themeBtn, #zoomFab, #topBtn, #zoomPanel, #collapseFab')) return;
  closeSearch();
});

let lastCardTap = { id: null, t: 0 };

/* ========== Ctrl+单击 多选：批量删除 / 移动到分类 ========== */
let selectedIds = new Set();
let lastClickedCardId = null;   // 最近单击过的卡片（支持 Delete 键删除）
const multiBar   = document.getElementById('multiBar');
const mbCount    = document.getElementById('mbCount');
const multiModal = document.getElementById('multiModal');
const multiTitle = document.getElementById('multiTitle');
const multiDesc  = document.getElementById('multiDesc');
const multiCatList = document.getElementById('multiCatList');
const multiOk    = document.getElementById('multiOk');
let multiMode = '';      // 'del' | 'move'
let multiTarget = null;  // move 模式下选中的目标分类名（'' = 未分类）

function toggleSelect(id) {
  if (!items.some(i => i.id === id)) return;
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  playSound('pick');
  // 直接切换该卡片 DOM 高亮，避免整页重排打断手速
  const card = listEl.querySelector('.card[data-id="' + id + '"]');
  if (card) card.classList.toggle('selected', selectedIds.has(id));
  updateMultiBar();
}
function clearSelection() {
  selectedIds.clear();
  listEl.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
  updateMultiBar();
}
function updateMultiBar() {
  const n = selectedIds.size;
  multiBar.hidden = n === 0;
  mbCount.textContent = n;
}

function openMultiModal(mode) {
  multiMode = mode;
  multiTarget = null;
  if (mode === 'del') {
    multiTitle.textContent = '删除所选笔记';
    multiDesc.innerHTML = `确定删除选中的 <b>${selectedIds.size}</b> 条笔记吗？<br>删除后可按 <b>Ctrl+Z</b> 撤回。`;
    multiCatList.hidden = true;
    multiOk.textContent = '确认删除';
    multiOk.className = 'btn-danger';
  } else {
    multiTitle.textContent = '移动到分类';
    multiDesc.textContent = '选择目标分类，所选笔记将全部移动过去：';
    multiCatList.hidden = false;
    renderMultiCats();
    multiOk.textContent = '确认移动';
    multiOk.className = 'btn-primary';
  }
  multiModal.hidden = false;
  playSound('open');
}
function renderMultiCats() {
  const opts = categories.map(c => ({
    name: c.name,
    icon: c.icon || '📁',
    color: c.color || '#64748b'
  }));
  opts.push({ name: NONE, icon: '🗂️', color: '#94a3b8' }); // 未分类
  multiCatList.innerHTML = opts.map(c => `
    <button type="button" class="mc-opt" data-cat="${escapeHtml(c.name)}">
      <span class="mc-ico" style="background:${c.color}1f">${escapeHtml(c.icon)}</span>
      <span>${escapeHtml(c.name === NONE ? '未分类' : c.name)}</span>
    </button>`).join('');
}
multiCatList.addEventListener('click', e => {
  const opt = e.target.closest('.mc-opt');
  if (!opt) return;
  multiCatList.querySelectorAll('.mc-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
  multiTarget = opt.dataset.cat;
  playSound('click');
});

document.getElementById('mbMove').addEventListener('click', () => {
  if (!selectedIds.size) return;
  openMultiModal('move');
});
document.getElementById('mbDel').addEventListener('click', () => {
  if (!selectedIds.size) return;
  openMultiModal('del');
});
document.getElementById('mbCancel').addEventListener('click', clearSelection);

document.getElementById('multiCancel').addEventListener('click', () => {
  multiModal.hidden = true;
});
multiModal.addEventListener('click', e => {
  if (e.target === multiModal) multiModal.hidden = true;
});
multiOk.addEventListener('click', () => {
  const ids = [...selectedIds];
  if (!ids.length) { multiModal.hidden = true; return; }
  multiModal.hidden = true;
  if (multiMode === 'del') {
    playSound('del');
    pushHistory();
    items = items.filter(i => !selectedIds.has(i.id));
    saveItems(); render();
    showToast(`已删除 ${ids.length} 条笔记，可按 Ctrl+Z 撤回`);
  } else {
    if (multiTarget == null) { showToast('请先选择目标分类'); return; }
    playSound('move');
    pushHistory();
    items.forEach(i => {
      if (selectedIds.has(i.id)) i.category = multiTarget === NONE ? '' : multiTarget;
    });
    saveItems(); render();
    showToast(`已移动 ${ids.length} 条笔记`);
  }
  clearSelection();
});

listEl.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; return; }
  const card = e.target.closest('.card');
  if (!card) {
    // 单击空白：不触发输入（正在输入时点击空白 = 退出编辑，交由 blur 提交留便签）
    if (e.target.closest('.quick-wrap') || e.target.closest('.sticky')) return;
    if (quickWrap && quickWrap.isConnected) return;
    if (selectedIds.size) clearSelection();
    return;
  }
  const id = card.dataset.id;
  lastClickedCardId = id;
  // 图片本身/删除按钮由专用处理器响应；图片旁的空白区域照常复制卡片
  if (e.target.closest('.ci-item') || e.target.closest('.ci-del')) return;

  const actBtn = e.target.closest('[data-act]');
  // Ctrl/⌘ + 单击卡片（非按钮区）= 多选切换
  if ((e.ctrlKey || e.metaKey) && !actBtn) {
    e.preventDefault();
    toggleSelect(id);
    return;
  }
  // 已有选中时普通单击 = 退出多选
  if (!e.ctrlKey && !e.metaKey && selectedIds.size) clearSelection();
  if (actBtn) {
    const act = actBtn.dataset.act;

    if (act === 'edit') {
      const it = items.find(i => i.id === id);
      if (it) { playSound('click'); openModal(it); }

    } else if (act === 'del') {
      const it = items.find(i => i.id === id);
      if (!it) return;
      playSound('warn');
      openDeleteItem(it);

    } else if (act === 'pin') {
      const it = items.find(i => i.id === id);
      if (!it) return;
      pushHistory();
      it.pinned = !it.pinned;
      saveItems(); render();
      playSound('pin');

    } else if (act === 'toggle' || act === 'collapse') {
      const body = card.querySelector('.card-body');
      setCardExpanded(card, act === 'collapse' ? false : !body.classList.contains('expanded'));
      playSound('click');

    } else if (act === 'fullscreen') {
      playSound('open');
      openViewer(id);

    } else if (act === 'export') {
      const it = items.find(i => i.id === id);
      if (it) exportCardToWord(it);

    } else if (act === 'recat') {
      e.stopPropagation();
      playSound('open');
      openRecat(id, actBtn);
    }
    return;
  }

  const star = e.target.closest('.star');
  if (star) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    const s = parseInt(star.dataset.s, 10);
    pushHistory();
    it.rating = it.rating === s ? 0 : s;
    saveItems(); render();
    playSound('star');
    return;
  }

  // 双击节流：350ms 内第二次点击同一卡片视为双击（打开编辑），不再复制
  const tapNow = Date.now();
  if (lastCardTap.id === id && tapNow - lastCardTap.t < 350) {
    lastCardTap = { id: null, t: 0 };
    return;
  }
  lastCardTap = { id, t: tapNow };

  const sel = window.getSelection();
  if (sel && sel.toString().trim().length > 0) return;

  const it = items.find(i => i.id === id);
  if (!it) return;
  const text = (it.content || '').trim() || it.title || '';
  if (!text) return;

  copyText(text).then(ok => {
    if (ok) {
      card.classList.remove('copied');
      void card.offsetWidth;
      card.classList.add('copied');
      playSound('copy');
      cardToast('✔ 已复制', card);
    } else {
      showToast('复制失败，请手动选择文字');
    }
  });
});

/* ========== 空白自由输入：点击任意空白位置写入，回车转卡片 / 退出留原地便签 ========== */
let quickWrap = null;
let quickText = null;
let quickPop  = null;
let quickXY   = null;                 // 输入框相对 listEl 的坐标 {x, y}
const STICKY_KEY = 'work-memo-v2-stickies';
let stickies  = loadStickies();       // 浮动便签 [{id,x,y,text,createdAt}]

function loadStickies() {
  try { const r = JSON.parse(localStorage.getItem(STICKY_KEY) || '[]'); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
function saveStickies() {
  try { localStorage.setItem(STICKY_KEY, JSON.stringify(stickies)); } catch (e) {}
}

function currentTargetCat() {
  return (state.category === 'all' || state.category === NONE) ? NONE : state.category;
}

function autoGrowQuick() {
  if (!quickText) return;
  quickText.style.height = 'auto';
  quickText.style.height = Math.max(56, quickText.scrollHeight) + 'px';
}

// 若点击位置与卡片矩形相交（预计落点会盖住卡片），顺延到该卡片下方；其余位置（含卡片旁空白）原地添加
function settleQuickPos(x, y) {
  const rect = listEl.getBoundingClientRect();
  const lx = Math.max(4, Math.min(x - rect.left, rect.width - 168));
  let ly = y - rect.top;
  for (const c of listEl.querySelectorAll('.card')) {
    const r = c.getBoundingClientRect();
    if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 4 && y <= r.bottom + 4) {
      ly = r.bottom - rect.top + 14;
      break;
    }
  }
  const w = Math.max(160, Math.min(rect.width - lx - 8, 560));   // 输入宽度跟随点击位置可用空间
  return { x: lx, y: ly, w };
}

function openQuickInput(x, y) {
  if (quickWrap && quickWrap.isConnected) return;       // 正在输入：点击空白 = 退出编辑（交由 blur 提交）
  const p = settleQuickPos(x, y);
  quickWrap = document.createElement('div');
  quickWrap.className = 'quick-wrap';
  quickWrap.style.left = p.x + 'px';
  quickWrap.style.top  = p.y + 'px';
  quickWrap.style.width = p.w + 'px';
  quickWrap.innerHTML = `
    <div class="quick-pop">
      <span class="qp-hint"></span>
      <button type="button" class="qp-btn" data-q="ok">转成卡片</button>
      <button type="button" class="qp-btn qp-del" data-q="del">删除</button>
    </div>
    <textarea class="quick-input" rows="1"></textarea>`;
  listEl.appendChild(quickWrap);
  quickText = quickWrap.querySelector('.quick-input');
  quickPop  = quickWrap.querySelector('.quick-pop');
  quickXY   = p;
  quickText.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitQuick(true); }  // Ctrl+Enter 转卡片
    else if (e.key === 'Escape') { cancelQuick(); }       // 回车默认换行
  });
  quickText.addEventListener('input', autoGrowQuick);
  quickText.addEventListener('blur', () => {
    setTimeout(() => { if (quickWrap && quickWrap.isConnected) commitQuick(false); }, 130);
  });
  quickPop.addEventListener('click', e => {
    const q = e.target.dataset.q;
    if (q === 'ok') commitQuick(true);
    else if (q === 'del') cancelQuick();
  });
  const catName = currentTargetCat() === NONE ? '未分类' : state.category;
  quickPop.querySelector('.qp-hint').textContent = 'Ctrl+Enter 转成「' + catName + '」卡片 · 点空白留在原地';
  quickText.focus();
  autoGrowQuick();
}

// toCard=true：回车/点按钮 → 转成卡片；toCard=false：点击空白退出 → 留在原地成为便签
function commitQuick(toCard) {
  if (!quickWrap || !quickWrap.isConnected) return;
  const v = quickText.value.trim();
  const xy = quickXY || { x: 16, y: 16 };
  const cat = currentTargetCat();
  quickWrap.remove();
  quickWrap = null; quickText = null; quickPop = null; quickXY = null;
  if (!v) return;
  if (toCard) {
    pushHistory();
    const now = Date.now();
    items.push({
      id: uid(), title: '', content: v, category: cat,
      tags: [], pinned: false, rating: 0,
      createdAt: now, updatedAt: now, mOrder: nextOrder()
    });
    saveItems(); render();
    playSound('save');
    showToast('已转成卡片');
  } else {
    pushHistory();
    stickies.push({ id: uid(), x: xy.x, y: xy.y, text: v, createdAt: Date.now() });
    saveStickies(); render();
    playSound('save');
    showToast('已留在原地，可拖拽移动');
  }
}

function cancelQuick() {
  if (!quickWrap || !quickWrap.isConnected) return;
  quickWrap.remove();
  quickWrap = null; quickText = null; quickPop = null; quickXY = null;
  playSound('close');
}

// 双击空白 → 在该位置进入自由输入
listEl.addEventListener('dblclick', e => {
  if (e.target.closest('.card') || e.target.closest('.quick-wrap') || e.target.closest('.sticky')) return;
  if (quickWrap && quickWrap.isConnected) return;
  openQuickInput(e.clientX, e.clientY);
});

// main 容器兜底：列表四周空白双击也在该位置打开自由输入（单击不做任何事，避免误触）
document.querySelector('.main').addEventListener('click', () => {});
document.querySelector('.main').addEventListener('dblclick', e => {
  if (e.target.closest('.card') || e.target.closest('.quick-wrap') || e.target.closest('.sticky')) return;
  if (quickWrap && quickWrap.isConnected) return;
  openQuickInput(e.clientX, e.clientY);
});

/* ---- 浮动便签：渲染 + 拖拽 + 转卡片/删除 ---- */
// 鼠标在便签文字四周 32px 热区内，操作按钮持续显示，便于精准选中
const STICKY_HOVER_PAD = 32;
document.addEventListener('mousemove', e => {
  if (dragDoc || dragCat) return;   // 拖拽进行中：不显示便签悬停气泡，避免重叠
  if (!stickies.length) return;
  const mx = e.clientX, my = e.clientY;
  listEl.querySelectorAll('.sticky').forEach(el => {
    const r = el.getBoundingClientRect();
    const hot = mx >= r.left - STICKY_HOVER_PAD && mx <= r.right + STICKY_HOVER_PAD &&
                my >= r.top - STICKY_HOVER_PAD && my <= r.bottom + STICKY_HOVER_PAD;
    el.classList.toggle('st-hover', hot);
  });
});
function renderStickies() {
  listEl.querySelectorAll('.sticky').forEach(el => el.remove());
  stickies.forEach(st => {
    const el = document.createElement('div');
    el.className = 'sticky';
    el.dataset.id = st.id;
    el.style.left = st.x + 'px';
    el.style.top  = st.y + 'px';
    el.innerHTML = '<span class="st-act"><button type="button" class="st-toc" title="转成卡片">⇥ 转卡片</button><button type="button" class="st-del" title="删除">×</button></span><span class="st-text">' + escapeHtml(st.text) + '</span>';
    el.querySelector('.st-toc').addEventListener('click', e => {
      e.stopPropagation();
      const id = el.dataset.id;
      const s = stickies.find(v => v.id === id); if (!s) return;
      pushHistory();
      const now = Date.now();
      items.push({
        id: uid(), title: '', content: s.text, category: currentTargetCat(),
        tags: [], pinned: false, rating: 0,
        createdAt: now, updatedAt: now, mOrder: nextOrder()
      });
      stickies = stickies.filter(v => v.id !== id);
      saveStickies(); saveItems(); render();
      playSound('save'); showToast('便签已转成卡片');
    });
    el.querySelector('.st-del').addEventListener('click', e => {
      e.stopPropagation();
      const id = el.dataset.id;
      pushHistory();
      stickies = stickies.filter(v => v.id !== id);
      saveStickies(); render();
      playSound('close'); showToast('便签已删除');
    });
    bindStickyDrag(el, st);
    listEl.appendChild(el);
  });
}

// 双击便签内容 → 直接在便签上编辑（保持便签外观原样，回车换行，点别处保存）
function editStickyInline(el, st) {
  const txt = el.querySelector('.st-text');
  const old = st.text;
  if (txt.dataset.editing) return;
  txt.dataset.editing = '1';
  txt.contentEditable = 'true';
  txt.focus();
  const range = document.createRange();
  range.selectNodeContents(txt);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  const done = () => {
    if (txt.dataset.editing !== '1') return;
    txt.dataset.editing = '';
    txt.contentEditable = 'false';
    const v = (txt.innerText || '').trim();
    if (v && v !== old) { pushHistory(); st.text = v; saveStickies(); playSound('save'); }
    else if (!v) { pushHistory(); stickies = stickies.filter(s => s.id !== st.id); saveStickies(); el.remove(); playSound('close'); }
  };
  txt.addEventListener('blur', () => setTimeout(done, 120));
  txt.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); txt.blur(); }
    else if (e.key === 'Escape') { txt.innerText = old; txt.blur(); }
  });
  txt.addEventListener('click', e => e.stopPropagation());
}

function bindStickyDrag(el, st) {
  // 双击便签内容 → 进入就地编辑
  el.addEventListener('dblclick', e => {
    if (e.target.closest('.st-act')) return;
    editStickyInline(el, st);
  });
  let sx = 0, sy = 0, startX = 0, startY = 0, moved = false;
  el.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('.st-act')) return;
    const txt = el.querySelector('.st-text');
    if (txt && txt.dataset.editing) return;   // 编辑中不触发拖拽
    if (e.target.tagName === 'TEXTAREA') return;
    moved = false;
    startX = e.clientX; startY = e.clientY;
    sx = st.x; sy = st.y;                     // 记录初始布局位置
    const onMove = ev => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      moved = true;
      el.classList.add('dragging');
      const sel = document.getSelection(); if (sel) sel.removeAllRanges();
      const rect = listEl.getBoundingClientRect();
      const maxX = Math.max(2, rect.width - el.offsetWidth - 4);   // 便签右缘不超出列表右边界
      st.x = Math.max(2, Math.min(sx + (ev.clientX - startX), maxX));   // 左缘 = 初始位置 + 鼠标位移（抓取点锁定）
      st.y = Math.max(2, sy + (ev.clientY - startY));
      el.style.left = st.x + 'px';
      el.style.top  = st.y + 'px';
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.classList.remove('dragging');
      if (moved) { saveStickies(); playSound('drop'); }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

let lastCatClick = { name: null, t: 0 };
filtersEl.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; return; }
  const chip = e.target.closest('.cat-item');
  if (!chip) return;
  const name = chip.dataset.cat;
  const now = Date.now();
  // 同一分类 400ms 内第二次点击视为双击（触发重命名），不再切换分类
  if (lastCatClick.name === name && now - lastCatClick.t < 400) {
    lastCatClick = { name: null, t: 0 };
    return;
  }
  // 再次单击当前分类（非双击）→ 弹出标签树状面板；首次单击=切换选中不弹
  if (lastCatClick.name === name) {
    lastCatClick = { name, t: now };
    openTagPanel(name, chip);
    return;
  }
  lastCatClick = { name, t: now };
  closeTagPanel();
  if (!viewer.hidden) closeViewer();   // 全屏查看时切换分类 → 先关查看器回到列表
  state.category = name;
  render();
});

/* ========== 双击分类 → 编辑分类弹窗（名称 + 图标选择） ========== */
const CAT_EMOJIS = [
  '📋','📊','🎯','📁','🚀','💼','📈','📌','⭐','🔥','📚','🛠️','💰','🎓','🏆','🧠',
  '🗂️','📝','⚙️','💡','🛒','🏷️','📅','👥','🏢','🔧','🧾','✏️','📦','🗓️','❤️','🚩',
  '🏗️','🖥️','📱','💻','🤝','📣','🎤','📻','✉️','📨','📞','☎️','⏰','🕐','🌐','🧾',
  '🏦','💳','💵','📈','📉','🪙','🔒','🔑','🗝️','🧑‍💼','👨‍💼','👩‍💼','🧑‍🔧','🧑‍🏫','🧑‍🎓','🧑‍⚕️',
  '🧑‍💻','🖊️','🖋️','✒️','📐','📏','🔍','🔎','🧮','🖩','🗃️','🗄️','🖇️','📎','📌','🧷',
  '🪧','📢','🔔','⏱️','⏳','🧭','🗺️','📍','🧱','🪪','🆔','🅰️','🅱️','🆕','✅','⚠️',
  '❌','➕','➖','❓','❗','💡','💭','🧿','🪄','🎨','🧩','🎲','🏅','🥇','🥈','🥉',
  '🎁','🧧','🌱','🌳','🍀','🌈','☀️','🌙','✨','⚡','🌊','🔥','🧊','🌍','🚢','✈️'
];

const CAT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#14b8a6','#6366f1','#ec4899','#84cc16','#64748b'];

/* —— 构建图标选择网格 —— */
function buildEmojiGrid(containerId, getState, setState) {
  const box = document.getElementById(containerId);
  CAT_EMOJIS.forEach(em => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'emoji-opt';
    b.textContent = em;
    b.dataset.em = em;
    b.title = '选择 ' + em + ' 作为图标';
    b.addEventListener('click', () => {
      setState(em);
      box.querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('on', x === b));
      playSound('click');
    });
    box.appendChild(b);
  });
  return box;
}

/* —— 构建颜色选择（预设色板 + 拾色器） —— */
function buildColorPicker(swatchId, inputId, customId, getColor, setColor) {
  const swBox = document.getElementById(swatchId);
  const input = document.getElementById(inputId);
  const custom = document.getElementById(customId);
  CAT_COLORS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = c;
    b.dataset.color = c;
    b.addEventListener('click', () => {
      setColor(c);
      playSound('click');
    });
    swBox.appendChild(b);
  });
  input.addEventListener('input', () => {
    setColor(input.value);
    playSound('click');
  });
  // 高亮当前选中
  function paint() {
    input.value = getColor();
    custom.style.background = getColor();
    const pre = swBox.querySelector('.swatch[data-color="' + CSS.escape(getColor()) + '"]');
    swBox.querySelectorAll('.swatch').forEach(b => b.classList.remove('on'));
    custom.classList.remove('on');
    if (pre) pre.classList.add('on');
    else custom.classList.add('on');
  }
  return { paint, custom };
}

/* ========== 编辑分类弹窗 ========== */
const editCatModal  = document.getElementById('editCatModal');
const editCatName   = document.getElementById('editCatName');
const editCatOk     = document.getElementById('editCatOk');
const editCatCancel = document.getElementById('editCatCancel');
const editCatClose  = document.getElementById('editCatClose');
let editCatOldName = null;
let editCatIcon    = '📁';
let editCatColor   = '#3b82f6';

buildEmojiGrid('editCatIcons', () => editCatIcon, v => { editCatIcon = v; });
const editColor = buildColorPicker('editCatSwatches', 'editCatColorInput', 'editCatCustom',
  () => editCatColor, v => { editCatColor = v; });

filtersEl.addEventListener('dblclick', e => {
  const chip = e.target.closest('.cat-item');
  if (!chip) return;
  const name = chip.dataset.cat;
  if (name === 'all' || name === NONE) return;
  if (!categories.some(c => c.name === name)) return;
  openEditCat(name);
});

function openEditCat(name) {
  const cat = categories.find(c => c.name === name);
  if (!cat) return;
  editCatOldName = name;
  editCatName.value = cat.name;
  editCatIcon = cat.icon || '📁';
  editCatColor = cat.color || '#3b82f6';
  document.getElementById('editCatIcons').querySelectorAll('.emoji-opt').forEach(x =>
    x.classList.toggle('on', x.dataset.em === editCatIcon));
  editColor.paint();
  editCatModal.hidden = false;
  playSound('open');
  setTimeout(() => editCatName.focus(), 30);
}

function closeEditCat() {
  editCatModal.hidden = true;
  editCatOldName = null;
}

function saveEditCat() {
  const newName = editCatName.value.trim();
  if (!newName) { editCatName.focus(); return; }
  const oldName = editCatOldName;
  if (!oldName) return;
  const cat = categories.find(c => c.name === oldName);
  if (!cat) return;
  if (categories.some(c => c.name !== oldName && c.name === newName)) {
    showToast('已存在同名分类「' + newName + '」');
    editCatName.select();
    return;
  }
  pushHistory();
  cat.name = newName;
  cat.icon = editCatIcon;
  cat.color = editCatColor;
  items.forEach(it => { if (it.category === oldName) it.category = newName; });
  if (state.category === oldName) state.category = newName;
  if (pickCat === oldName) pickCat = newName;
  saveCats(); saveItems();
  closeEditCat();
  render();
  playSound('save');
  showToast('分类已更新');
}

editCatOk.addEventListener('click', saveEditCat);
editCatCancel.addEventListener('click', closeEditCat);
editCatClose.addEventListener('click', closeEditCat);
editCatModal.addEventListener('click', e => {
  if (e.target === editCatModal) closeEditCat();
});
editCatName.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); saveEditCat(); }
  if (e.key === 'Escape') { e.preventDefault(); closeEditCat(); }
});

/* ========== 新建分类弹窗 ========== */
const newCatModal  = document.getElementById('newCatModal');
const newCatName   = document.getElementById('newCatName');
const newCatOk     = document.getElementById('newCatOk');
const newCatCancel = document.getElementById('newCatCancel');
const newCatClose  = document.getElementById('newCatClose');
let newCatIcon  = '📁';
let newCatColor = '#3b82f6';

buildEmojiGrid('newCatIcons', () => newCatIcon, v => { newCatIcon = v; });
const newColor = buildColorPicker('newCatSwatches', 'newCatColorInput', 'newCatCustom',
  () => newCatColor, v => { newCatColor = v; });

function openNewCat() {
  newCatName.value = '';
  newCatIcon = '📁';
  newCatColor = nextColor();
  document.getElementById('newCatIcons').querySelectorAll('.emoji-opt').forEach(x =>
    x.classList.toggle('on', x.dataset.em === newCatIcon));
  newColor.paint();
  newCatModal.hidden = false;
  playSound('open');
  setTimeout(() => newCatName.focus(), 30);
}

function closeNewCat() {
  newCatModal.hidden = true;
  newCatForPicker = false;
}

function saveNewCat() {
  const raw = newCatName.value.trim();
  if (!raw) { newCatName.focus(); return; }
  const { name } = splitCatInput(raw);
  if (!name || categories.some(c => c.name === name)) {
    showToast('该分类已存在');
    newCatName.select();
    return;
  }
  pushHistory();
  categories.push({ name, icon: newCatIcon, color: newCatColor, pinned: false });
  saveCats();
  const forPicker = newCatForPicker; newCatForPicker = false;
  closeNewCat();
  state.category = name;
  if (forPicker) { pickCat = name; renderCatPicker(); }
  render();
  playSound('save');
  showToast('已新增分类');
}

newCatOk.addEventListener('click', saveNewCat);
newCatCancel.addEventListener('click', closeNewCat);
newCatClose.addEventListener('click', closeNewCat);
newCatModal.addEventListener('click', e => {
  if (e.target === newCatModal) closeNewCat();
});
newCatName.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); saveNewCat(); }
  if (e.key === 'Escape') { e.preventDefault(); closeNewCat(); }
});

const ctxMenu = document.getElementById('ctxMenu');
const ctxPin  = document.getElementById('ctxPin');
const ctxDel  = document.getElementById('ctxDel');
let ctxCatName = null;

filtersEl.addEventListener('contextmenu', e => {
  const chip = e.target.closest('.cat-item');
  if (!chip) return;
  const name = chip.dataset.cat;
  if (name === 'all' || name === NONE) return;
  e.preventDefault();

  const cat = categories.find(c => c.name === name);
  if (!cat) return;
  ctxCatName = name;
  ctxPin.textContent = cat.pinned ? '取消置顶' : '置顶分类';

  ctxMenu.hidden = false;
  const rect = ctxMenu.getBoundingClientRect();
  let left = e.clientX, top = e.clientY;
  if (left + rect.width > window.innerWidth - 10) left = window.innerWidth - rect.width - 10;
  if (top + rect.height > window.innerHeight - 10) top = window.innerHeight - rect.height - 10;
  ctxMenu.style.left = Math.max(8, left) + 'px';
  ctxMenu.style.top  = Math.max(8, top) + 'px';
});

document.addEventListener('click', e => {
  if (!ctxMenu.hidden && !e.target.closest('#ctxMenu')) ctxMenu.hidden = true;
});
window.addEventListener('scroll', () => { ctxMenu.hidden = true; }, true);
window.addEventListener('resize', () => { ctxMenu.hidden = true; });

ctxMenu.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  const cat = categories.find(c => c.name === ctxCatName);
  ctxMenu.hidden = true;
  if (!cat) return;

  if (act === 'pin') {
    pushHistory();
    cat.pinned = !cat.pinned;
    saveCats(); render();
    playSound('pin');

  } else if (act === 'clear') {
    openClearCat(cat);

  } else if (act === 'del') {
    if (categories.length <= 1) {
      showToast('至少保留一个分类');
      return;
    }
    openConfirmDelete(cat);
  }
});

const confirmModal    = document.getElementById('confirmModal');
const confirmCatName  = document.getElementById('confirmCatName');
const confirmCatCount = document.getElementById('confirmCatCount');
const confirmCancel   = document.getElementById('confirmCancel');
const confirmOk       = document.getElementById('confirmOk');

function openConfirmDelete(cat) {
  const count = items.filter(i => i.category === cat.name).length;
  confirmCatName.textContent  = cat.name;
  confirmCatCount.textContent = count;
  confirmModal.hidden = false;
}

confirmCancel.addEventListener('click', () => {
  confirmModal.hidden = true;
  ctxCatName = null;
});

/* ========== 清空分类内容（保留分类本身） ========== */
const clearCatModal  = document.getElementById('clearCatModal');
const clearCatName   = document.getElementById('clearCatName');
const clearCatCount  = document.getElementById('clearCatCount');
let clearCatNameRef = null;

function openClearCat(cat) {
  // 自愈：卡片分类可能带隐藏字符（空格/换行等），宽松匹配后同步修正
  const dirty = items.filter(i => i.category && i.category.trim() === cat.name.trim() && i.category !== cat.name);
  if (dirty.length) {
    dirty.forEach(i => { i.category = cat.name; });
    saveItems();
    render();
  }
  const count = items.filter(i => i.category === cat.name).length;
  clearCatNameRef = cat.name;
  clearCatName.textContent  = cat.name;
  clearCatModal.hidden = false;
  playSound('open');
}

document.getElementById('clearCatCancel').addEventListener('click', () => {
  clearCatModal.hidden = true;
  clearCatNameRef = null;
});
clearCatModal.addEventListener('click', e => {
  if (e.target === clearCatModal) { clearCatModal.hidden = true; clearCatNameRef = null; }
});
document.getElementById('clearCatOk').addEventListener('click', () => {
  const name = clearCatNameRef;
  clearCatModal.hidden = true;
  clearCatNameRef = null;
  if (!name) return;
  const before = items.length;
  pushHistory();
  items = items.filter(i => i.category !== name);
  if (state.category === name) state.category = 'all';
  if (pickCat === name) pickCat = '';
  saveItems();
  render();
  playSound('del');
  showToast(`已清空「${name}」分类下的 ${before - items.length} 条笔记（分类保留）`);
});

confirmOk.addEventListener('click', () => {
  const cat = categories.find(c => c.name === ctxCatName);
  confirmModal.hidden = true;
  if (!cat) return;
  playSound('del');

  pushHistory();
  categories = categories.filter(c => c.name !== cat.name);
  items      = items.filter(i => i.category !== cat.name);
  if (state.category === cat.name) state.category = 'all';
  if (pickCat === cat.name) pickCat = '';

  saveCats(); saveItems();
  ctxCatName = null;
  render();
  showToast(`已删除分类「${cat.name}」`);
});

confirmModal.addEventListener('click', e => {
  if (e.target === confirmModal) { confirmModal.hidden = true; ctxCatName = null; }
});

const clearModal    = document.getElementById('clearModal');
const clearItemCnt  = document.getElementById('clearItemCount');
const clearCatCnt   = document.getElementById('clearCatCount');
const clearCancel   = document.getElementById('clearCancel');
const clearOk       = document.getElementById('clearOk');

document.getElementById('clearAllBtn').addEventListener('click', () => {
  clearItemCnt.textContent = items.length;
  clearCatCnt.textContent  = categories.length;
  clearModal.hidden = false;
});

clearCancel.addEventListener('click', () => { clearModal.hidden = true; });

clearOk.addEventListener('click', () => {
  pushHistory();
  items = [];
  categories = [];
  state.category = 'all';
  state.query = '';
  searchInput.value = '';
  clearBtn.hidden = true;
  saveItems(); saveCats();
  clearModal.hidden = true;
  render();
  playSound('del');
  showToast('已清空全部数据');
});

/* ========== 恢复初始模式（主题/缩放/标题/分类复位，不删卡片） ========== */
const resetModal = document.getElementById('resetModal');
document.getElementById('resetBtn').addEventListener('click', () => {
  playSound('click');
  resetModal.hidden = false;
});
document.getElementById('resetCancel').addEventListener('click', () => { resetModal.hidden = true; });
resetModal.addEventListener('click', e => { if (e.target === resetModal) resetModal.hidden = true; });
document.getElementById('resetOk').addEventListener('click', () => {
  resetModal.hidden = true;
  playSound('del');
  // ① 主题 → 浅色
  document.documentElement.classList.remove('dark');
  try { localStorage.setItem(THEME_KEY, 'light'); } catch (e) {}
  // ② 卡片尺寸 → 100%
  applyZoom(100);
  // ③ 标题 → 牛马笔记
  setAppTitle('牛马笔记');
  // ④ 彻底清空全部笔记（卡片数据）
  items = [];
  saveItems();
  // ④b 按勾选决定是否清空浮动便签
  if (document.getElementById('resetClearStickies').checked) {
    stickies = [];
    saveStickies();
  }
  // ⑤ 分类 → 默认三项
  categories = DEFAULT_CATS.map(c => ({ ...c }));
  saveCats();
  // ⑥ 视图/搜索/首次引导复位
  state.category = 'all';
  state.query = '';
  searchInput.value = '';
  clearBtn.hidden = true;
  try { localStorage.removeItem(INTRO_KEY); } catch (e) {}
  render();
  playSound('save');
  showToast('已恢复初始模式（全部笔记已清空）');
});

/* ========== 首次打开引导弹窗（可勾选不再提示） ========== */
const INTRO_KEY  = 'work-memo-v2-intro';
const introModal = document.getElementById('introModal');
const introSkip  = document.getElementById('introSkip');
function closeIntro() {
  introModal.hidden = true;
  if (introSkip.checked) {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
  }
}
document.getElementById('introOk').addEventListener('click', () => {
  closeIntro();
  playSound('click');
});
introModal.addEventListener('click', e => {
  if (e.target === introModal) closeIntro();
});
(function maybeShowIntro() {
  let seen = '';
  try { seen = localStorage.getItem(INTRO_KEY) || ''; } catch (e) {}
  if (seen) return;
  setTimeout(() => { introModal.hidden = false; }, 450);
})();

/* 右下角说明按钮：随时打开开场提示 */
document.getElementById('helpBtn').addEventListener('click', () => {
  playSound('open');
  introModal.hidden = false;
});

clearModal.addEventListener('click', e => {
  if (e.target === clearModal) clearModal.hidden = true;
});

/* ========== 删除卡片确认弹窗 ========== */
const delModal     = document.getElementById('delModal');
const delModalDesc = document.getElementById('delModalDesc');
const delCancel    = document.getElementById('delCancel');
const delOk        = document.getElementById('delOk');
let delItemId = null;

function openDeleteItem(it) {
  delItemId = it.id;
  const title = it.title
    ? mdToPlainText(it.title)
    : (mdToPlainText(it.content || '').slice(0, 24) || '这条记录');
  delModalDesc.innerHTML = `确定删除「<b>${escapeHtml(title)}</b>」吗？<br>删除后可按 <b>Ctrl+Z</b> 撤回。`;
  delModal.hidden = false;
  setTimeout(() => delOk.focus(), 30);
}

delCancel.addEventListener('click', () => { delModal.hidden = true; delItemId = null; });

delOk.addEventListener('click', () => {
  delModal.hidden = true;
  if (!delItemId) return;
  const id = delItemId;
  delItemId = null;
  pushHistory();
  items = items.filter(i => i.id !== id);
  saveItems(); render();
  if (selectedIds.has(id)) { selectedIds.delete(id); updateMultiBar(); }
  playSound('del');
  showToast('已删除，可按 Ctrl+Z 撤回');
});

delModal.addEventListener('click', e => {
  if (e.target === delModal) { delModal.hidden = true; delItemId = null; }
});

const addCatBtn = document.getElementById('addCatBtn');
addCatBtn.addEventListener('click', () => openNewCat());

const searchInput = document.getElementById('searchInput');
const clearBtn    = document.getElementById('clearSearch');

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  clearBtn.hidden = !state.query;
  renderSearchPanel();
  renderStats();
});
clearBtn.addEventListener('click', closeSearch);

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT'
      && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault(); searchInput.focus();
  }
});

const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  playSound('theme');
  const isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (e) {}
  showToast(isDark ? '已切换到深色模式' : '已切换到浅色模式');
});

/* ========== 返回顶部 ========== */
const topBtn = document.getElementById('topBtn');
window.addEventListener('scroll', () => {
  topBtn.hidden = window.scrollY < 260;
}, { passive: true });
topBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ========== 卡片预览尺寸缩放 ========== */
const zoomFab   = document.getElementById('zoomFab');
const zoomPanel = document.getElementById('zoomPanel');
const zoomVal   = document.getElementById('zoomVal');
const zoomOut   = document.getElementById('zoomOut');
const zoomIn    = document.getElementById('zoomIn');
const zoomReset = document.getElementById('zoomReset');
let zoomLevel = 100;

function applyZoom(z) {
  zoomLevel = Math.min(200, Math.max(60, z));
  const k = zoomLevel / 100;
  const root = document.documentElement;
  root.style.setProperty('--card-w',  Math.round(342 * k) + 'px');
  root.style.setProperty('--card-h',  Math.round(320 * k) + 'px');
  root.style.setProperty('--card-fs', (14.5 * k).toFixed(2) + 'px');
  root.style.setProperty('--card-pad', Math.round(19 * k) + 'px ' + Math.round(20 * k) + 'px ' + Math.round(17 * k) + 'px');
  zoomVal.textContent = zoomLevel + '%';
  try { localStorage.setItem('work-memo-v2-zoom', String(zoomLevel)); } catch (e) {}
}

function initZoom() {
  let z = 100;
  try { z = parseInt(localStorage.getItem('work-memo-v2-zoom') || '100', 10); } catch (e) {}
  if (isNaN(z)) z = 100;
  applyZoom(z);
}

zoomFab.addEventListener('click', e => {
  e.stopPropagation();
  playSound('click');
  zoomPanel.hidden = !zoomPanel.hidden;
  zoomFab.classList.toggle('on', !zoomPanel.hidden);
});
zoomOut.addEventListener('click', () => applyZoom(zoomLevel - 10));
zoomIn.addEventListener('click', () => applyZoom(zoomLevel + 10));
zoomReset.addEventListener('click', () => applyZoom(100));

/* 缩放面板：悬停滚轮直接增减数值 */
zoomPanel.addEventListener('wheel', e => {
  e.preventDefault();
  const step = e.deltaY < 0 ? 10 : -10;
  applyZoom(zoomLevel + step);
}, { passive: false });

/* 缩放数值框：点击进入编辑，Enter/失焦提交，Esc 取消 */
zoomVal.addEventListener('click', e => {
  e.stopPropagation();
  zoomVal.contentEditable = true;
  zoomVal.focus();
  const sel = window.getSelection();
  sel.selectAllChildren(zoomVal);
});
zoomVal.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    zoomVal.blur();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    zoomVal.textContent = zoomLevel + '%';
    zoomVal.blur();
  }
});
zoomVal.addEventListener('blur', () => {
  zoomVal.contentEditable = false;
  const raw = zoomVal.textContent.trim().replace('%', '');
  let z = parseInt(raw, 10);
  if (isNaN(z)) { zoomVal.textContent = zoomLevel + '%'; return; }
  applyZoom(z);
  playSound('click');
});

document.addEventListener('click', e => {
  if (zoomPanel.hidden) return;
  if (zoomPanel.contains(e.target) || e.target.closest('#zoomFab')) return;
  zoomPanel.hidden = true;
  zoomFab.classList.remove('on');
});
initZoom();

const modal     = document.getElementById('modal');
const catPicker = document.getElementById('catPicker');
const fTitle    = document.getElementById('fTitle');
const fContent  = document.getElementById('fContent');
const fTags     = document.getElementById('fTags');
const pinToggle = document.getElementById('pinToggle');

let editingId = null;
let pickCat   = '';
let pickPin   = false;

function renderCatPicker() {
  if (!categories.length) { catPicker.innerHTML = ''; return; }
  const noneOn = pickCat === '' || pickCat === NONE;
  catPicker.innerHTML =
    `<button type="button" class="cat-opt ${noneOn ? 'on' : ''}"
            data-cat="${NONE}" style="--c:#6b7280">🏷️ 未分类</button>` +
    sortedCats().map(c => `
    <button type="button" class="cat-opt ${pickCat === c.name ? 'on' : ''}"
            data-cat="${escapeHtml(c.name)}" style="--c:${c.color}">${c.icon || '📁'} ${escapeHtml(c.name)}</button>`).join('') +
    `<button type="button" class="cat-opt add" data-act="addcat" title="新建分类">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      新增
    </button>`;
}
let newCatForPicker = false;
catPicker.addEventListener('click', e => {
  const b = e.target.closest('.cat-opt');
  if (!b) return;
  if (b.dataset.act === 'addcat') { newCatForPicker = true; openNewCat(); return; }
  pickCat = b.dataset.cat === NONE ? '' : b.dataset.cat;
  renderCatPicker();
});

function setPin(v) {
  pickPin = v;
  pinToggle.classList.toggle('on', pickPin);
}
pinToggle.addEventListener('click', () => setPin(!pickPin));

/* ========== 弹窗：全屏 / Markdown 预览 / 富文本粘贴 ========== */
const modalBox    = document.querySelector('#modal .modal');
const modalExpand = document.getElementById('modalExpand');
const mdEditTab   = document.getElementById('mdEditTab');
const mdPrevTab   = document.getElementById('mdPrevTab');
const mdPreview   = document.getElementById('mdPreview');

modalExpand.addEventListener('click', () => {
  const full = modalBox.classList.toggle('full');
  modal.classList.toggle('full', full);
  modalExpand.classList.toggle('on', full);
  showToast(full ? '已进入全屏编辑（Esc 退出）' : '已退出全屏');
});

function setMdMode(mode) {
  const edit = mode === 'edit';
  mdEditTab.classList.toggle('on', edit);
  mdPrevTab.classList.toggle('on', !edit);
  fContent.hidden = !edit;
  mdPreview.hidden = edit;
  if (!edit) {
    mdPreview.innerHTML = fContent.value.trim() ? mdToHtml(fContent.value) : '<p class="md-empty">暂无内容</p>';
  }
}
mdEditTab.addEventListener('click', () => setMdMode('edit'));
mdPrevTab.addEventListener('click', () => setMdMode('preview'));
fContent.addEventListener('input', () => {
  if (!mdPreview.hidden) {
    mdPreview.innerHTML = fContent.value.trim() ? mdToHtml(fContent.value) : '<p class="md-empty">暂无内容</p>';
  }
});
fContent.addEventListener('paste', e => {
  const cd = e.clipboardData;
  if (!cd) return;
  let html = '';
  try { html = cd.getData('text/html'); } catch (err) {}
  if (!html || !html.trim()) return; // 纯文本粘贴走浏览器原生
  e.preventDefault();
  insertAtCursor(fContent, htmlToMd(html));
});

/* ========== 全屏查看器 ========== */
const viewer      = document.getElementById('viewer');
const viewerBadge = document.getElementById('viewerBadge');
const viewerTitle = document.getElementById('viewerTitle');
const viewerBody  = document.getElementById('viewerBody');
const viewerDate  = document.getElementById('viewerDate');
const viewerTags  = document.getElementById('viewerTags');
const viewerClose = document.getElementById('viewerClose');
const viewerCopy  = document.getElementById('viewerCopy');
let viewerId = null;

function openViewer(id) {
  const it = items.find(i => i.id === id);
  if (!it) return;
  playSound('open');
  viewerId = id;
  const c = catColor(it.category);
  viewerBadge.textContent = (!it.category || it.category === NONE) ? '未分类' : it.category;
  viewerBadge.style.color = c;
  viewerBadge.style.background = c + '1a';
  viewerBadge.style.boxShadow = 'inset 0 0 0 1px ' + c + '33';
  viewerTitle.textContent = mdToPlainText(it.title)
    || (mdToPlainText(it.content).slice(0, 40) + (mdToPlainText(it.content).length > 40 ? '…' : ''))
    || '未命名笔记';
  viewerBody.innerHTML = mdToHtml(it.content);
  viewerDate.textContent = fmtDate(it.updatedAt);
  viewerTags.innerHTML = (it.tags || []).filter(Boolean)
    .map(t => `<span>#${escapeHtml(t)}</span>`).join('');
  viewer.hidden = false;
  document.body.classList.add('viewer-open');
  document.body.style.overflow = 'hidden';
  viewerBody.scrollTop = 0;
}

function closeViewer() {
  viewer.hidden = true;
  viewerId = null;
  document.body.classList.remove('viewer-open');
  document.body.style.overflow = '';
  playSound('close');
}

viewerClose.addEventListener('click', closeViewer);
viewer.addEventListener('click', e => {
  if (e.target === viewer) closeViewer();
});
viewerCopy.addEventListener('click', () => {
  const it = items.find(i => i.id === viewerId);
  if (!it) return;
  const text = (it.content || '').trim() || it.title || '';
  if (!text) return;
  copyText(text).then(ok => {
    if (ok) { playSound('copy'); showToast('✓ 已复制内容到剪贴板'); }
    else showToast('复制失败，请手动选择文字');
  });
});

function openModal(item, prefillContent) {
  ensureCategory();
  imgTargetCardId = null;
  editingId = item ? item.id : null;
  pickCat = item ? item.category
                 : (state.category !== 'all' && state.category !== NONE
                    && categories.some(c => c.name === state.category)
                    ? state.category
                    : (sortedCats()[0] ? sortedCats()[0].name : ''));

  document.getElementById('modalTitle').textContent = item ? '编辑笔记' : '新建笔记';
  fTitle.value   = item ? (item.title || '') : '';
  fContent.value = item ? (item.content || '') : (prefillContent || '');
  fTags.value    = item ? (item.tags || []).join(' ') : '';
  setPin(item ? !!item.pinned : false);

  renderCatPicker();
  setMdMode('edit');
  renderEditImgs();
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  playSound('open');
  setTimeout(() => {
    if (prefillContent) fTitle.focus();
    else (item ? fContent : fTitle).focus();
  }, 40);
}

function closeModal() {
  modal.hidden = true;
  editingId = null;
  pendingImgs = [];
  imgTargetCardId = null;
  document.body.style.overflow = '';
  playSound('close');
}

function saveItem() {
  const title   = fTitle.value.trim();
  const content = fContent.value.trim();
  const tags    = fTags.value.split(/[\s,，、;；]+/).map(s => s.trim()).filter(Boolean);

  if (!title && !content) {
    alert('请至少填写标题或内容');
    (title ? fContent : fTitle).focus();
    return;
  }
  // 未分类（''）同样允许保存；只有完全没有分类时才提示
  if (!pickCat && !categories.length) { alert('请先创建一个分类'); return; }
  const plainText = mdToPlainText(content);
  const finalTitle = title || (plainText.slice(0, 24) + (plainText.length > 24 ? '…' : ''));

  pushHistory();
  if (editingId) {
    const it = items.find(i => i.id === editingId);
    if (it) Object.assign(it, {
      title: finalTitle, content, category: pickCat,
      tags, pinned: pickPin, updatedAt: Date.now()
    });
  } else {
    const now = Date.now();
    const newImgs = pendingImgs.map(g => ({ id: g.id, name: g.name || '' }));
    items.unshift({
      id: uid(), title: finalTitle, content,
      category: pickCat, tags, pinned: pickPin,
      images: newImgs,
      mOrder: nextOrder(),
      createdAt: now, updatedAt: now
    });
    pendingImgs.forEach(g => imgDbPut(g.id, g.dataUrl).catch(() => {}));  // 暂存图入库
    pendingImgs = [];
  }
  saveItems(); closeModal(); render();
  fillCardImgs();
  playSound('save');
}

document.getElementById('addBtn').addEventListener('click', () => openModal(null));
document.getElementById('saveBtn').addEventListener('click', saveItem);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
// 点遮罩关闭：以按下位置为准——鼠标在弹窗内按下后拖出到遮罩松开，不触发关闭（避免全选文字误关）
let modalDownOnBackdrop = false;
modal.addEventListener('pointerdown', e => { modalDownOnBackdrop = (e.target === modal); });
modal.addEventListener('click', e => { if (e.target === modal && modalDownOnBackdrop) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
  if (e.key === 'Escape' && !viewer.hidden) closeViewer();
  if (e.key === 'Escape' && !recatMenu.hidden) closeRecat();
  if (e.key === 'Escape' && !tagPanel.hidden) closeTagPanel();
  if (e.key === 'Escape' && !delModal.hidden) { delModal.hidden = true; delItemId = null; }
  if (e.key === 'Escape' && !editCatModal.hidden) closeEditCat();
  if (e.key === 'Escape' && !newCatModal.hidden) closeNewCat();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !modal.hidden) {
    e.preventDefault(); saveItem();
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 'Z' || e.key === 'Y')) {
    const ae = document.activeElement;
    const tag = ae ? ae.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (ae && ae.isContentEditable)) return; // 输入框内走浏览器原生撤销
    if (!modal.hidden) return;
    if (!viewer.hidden) return;
    e.preventDefault();
    const k = e.key.toLowerCase();
    if (k === 'z') { if (e.shiftKey) redo(); else undo(); }
    else redo();
  }
});

const exportModal = document.getElementById('exportModal');
const exportName  = document.getElementById('exportName');
const exportScopeHint = document.getElementById('exportScopeHint');
function exportScopeItems() {
  return items.filter(it => inCatView(it, state.category));
}
document.getElementById('exportBtn').addEventListener('click', () => {
  const safeTitle = String(appTitle || '牛马笔记').replace(/[\\/:*?"<>|]/g, '_');
  exportName.value = `${safeTitle}_${new Date().toISOString().slice(0, 10)}`;
  const fmt = document.querySelector('input[name="exportFmt"]:checked');
  if (fmt && fmt.value === 'word') exportName.value += '.zip'; else exportName.value += '.json';
  // 范围提示：按当前视图
  const n = exportScopeItems().length;
  if (state.category === 'all') exportScopeHint.textContent = `当前在「全部笔记」，将导出全部 ${n} 条笔记`;
  else {
    const catName = state.category === NONE ? '未分类' : state.category;
    exportScopeHint.textContent = `当前在「${catName}」，将只导出该分类的 ${n} 条笔记`;
  }
  exportModal.hidden = false;
  setTimeout(() => { exportName.focus(); exportName.select(); }, 30);
});
document.querySelectorAll('input[name="exportFmt"]').forEach(r => r.addEventListener('change', () => {
  const isWord = document.querySelector('input[name="exportFmt"]:checked').value === 'word';
  let v = exportName.value.trim();
  if (/\.(json|zip|doc)$/i.test(v)) v = v.replace(/\.(json|zip|doc)$/i, '');
  exportName.value = v + (isWord ? '.zip' : '.json');
}));
async function doExport() {
  const fmt = document.querySelector('input[name="exportFmt"]:checked').value;
  let name = exportName.value.trim();
  if (!name) name = `牛马笔记_${new Date().toISOString().slice(0, 10)}`;
  name = name.replace(/\.(json|zip|doc)$/i, '').replace(/[\\/:*?"<>|]/g, '_');
  const scopeItems = exportScopeItems();
  const okBtn = document.getElementById('exportOk');
  const oldText = okBtn.textContent;
  okBtn.disabled = true;
  try {
    if (fmt === 'json') {
      okBtn.textContent = '正在打包图片…';
      // 收集范围图片（IndexedDB → dataURL）随备份一起导出
      const images = {};
      for (const it of scopeItems) {
        if (!it.images) continue;
        for (const g of it.images) {
          if (images[g.id]) continue;
          try { const d = await imgDbGet(g.id); if (d) images[g.id] = d; } catch (e) {}
        }
      }
      const payload = { items: scopeItems, categories, images, exportedAt: Date.now() };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } else {
      okBtn.textContent = `正在生成 ${scopeItems.length} 个 Word 文档…`;
      const entries = [];
      let i = 0;
      for (const it of scopeItems) {
        const w = await buildWordHtml(it);
        const seq = String(++i).padStart(2, '0');
        entries.push({ name: `${seq}_${w.safeName}.doc`, data: new TextEncoder().encode('\ufeff' + w.html) });
      }
      const blob = makeZip(entries);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.zip';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showToast(`已打包 ${entries.length} 个 Word 文档`);
    }
    playSound('save');
  } finally {
    okBtn.disabled = false; okBtn.textContent = oldText;
  }
}
document.getElementById('exportOk').addEventListener('click', () => {
  exportModal.hidden = true;
  doExport();
});
document.getElementById('exportCancel').addEventListener('click', () => { exportModal.hidden = true; });
exportModal.addEventListener('click', e => { if (e.target === exportModal) exportModal.hidden = true; });
exportName.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); exportModal.hidden = true; doExport(); }
  if (e.key === 'Escape') exportModal.hidden = true;
});

const importFile = document.getElementById('importFile');
document.getElementById('importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      let inItems, inCats;

      if (Array.isArray(data)) {
        inItems = data; inCats = null;
      } else if (data && Array.isArray(data.items)) {
        inItems = data.items; inCats = Array.isArray(data.categories) ? data.categories : null;
      } else {
        throw new Error('bad');
      }

      pushHistory();
      if (inCats) {
        const names = new Set(categories.map(c => c.name));
        inCats.forEach(c => {
          if (c && c.name && !names.has(c.name)) {
            categories.push({ name: c.name, color: c.color || nextColor(), pinned: !!c.pinned });
            names.add(c.name);
          }
        });
        saveCats();
      }

      const map = new Map(items.map(i => [i.id, i]));
      let added = 0, updated = 0;
      inItems.forEach(d => {
        if (!d || typeof d !== 'object') return;
        const id = d.id || uid();
        const cur = map.get(id);
        if (!cur) { map.set(id, { pinned: false, ...d, id }); added++; }
        else if ((d.updatedAt || 0) > (cur.updatedAt || 0)) { map.set(id, { pinned: false, ...d, id }); updated++; }
      });
      items = [...map.values()];

      // 恢复图片（新导出文件：images 字段含 {图片ID: dataURL}）
      let imgCount = 0;
      if (data && data.images && typeof data.images === 'object') {
        for (const [id, url] of Object.entries(data.images)) {
          if (id && typeof url === 'string' && url.startsWith('data:')) {
            try { await imgDbPut(id, url); imgCount++; } catch (e) {}
          }
        }
      }
      saveItems(); render();
      await migrateImgs();   // 兼容旧导出文件（图片内嵌在 items.images[].dataUrl）
      showToast(`导入完成：新增 ${added} 条，更新 ${updated} 条${imgCount ? `，恢复图片 ${imgCount} 张` : ''}`);
    } catch (err) {
      alert('文件格式不正确，请选择本工具导出的 JSON 文件。');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ========== Delete 键快速删除（单击选中卡片 / 多选批量） ========== */
document.addEventListener('keydown', e => {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  const ae = document.activeElement;
  const tag = ae ? ae.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (ae && ae.isContentEditable)) return;
  if (!document.getElementById('modal').hidden || !document.getElementById('viewer').hidden || !document.getElementById('delModal').hidden) return;
  if (selectedIds.size) {
    e.preventDefault();
    playSound('warn');
    openMultiModal('del');
    return;
  }
  if (lastClickedCardId && items.some(i => i.id === lastClickedCardId)) {
    e.preventDefault();
    playSound('warn');
    openDeleteItem(items.find(i => i.id === lastClickedCardId));
  }
});

categories = loadCats();
items = loadItems();
saveCats();
saveItems();
render();
migrateImgs();   // 旧数据（localStorage 内 dataUrl 图片）搬入 IndexedDB 后异步补图
//（注：内容由AI生成）
