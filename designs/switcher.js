/* ============================================================
   DESIGN SWITCHER
   全デザイン共通の切り替えUI。
   <script src="designs/switcher.js" data-current="os" data-position="hidden"></script>
   data-position: bottom-right | bottom-left | hidden（hidden の場合は window.DesignSwitcher.open() で開く）
============================================================ */
(function () {
  'use strict';
  const script = document.currentScript;
  const current = (script && script.dataset.current) || 'pop';
  const position = (script && script.dataset.position) || 'bottom-right';
  const dir = new URL('.', script ? script.src : location.href);   // .../designs/
  const root = new URL('..', dir);                                  // サイトルート

  const DESIGNS = [
    { id: 'os',     name: 'HiroOS',    jp: 'デフォルト',       desc: 'ブラウザの中で動くデスクトップOS。',           href: new URL('index.html', root).href, dot: '#7c6cff' },
    { id: 'pop',    name: 'Pop Clay',  jp: 'ポップ',           desc: 'オレンジのクレイモーフィズム。オリジナル版。', href: new URL('pop.html', dir).href,     dot: '#F05A00' },
    { id: 'matrix', name: 'Matrix',    jp: 'プログラマー',     desc: 'デジタルレインと対話型ターミナル。',             href: new URL('matrix.html', dir).href, dot: '#00ff41' },
    { id: 'noir',   name: 'Noir',      jp: 'シック',           desc: 'モノトーンで仕立てたミニマルなダーク。',     href: new URL('noir.html', dir).href,   dot: '#d4d4d8' },
  ];

  const host = document.createElement('div');
  host.id = 'design-switcher';
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .pill {
        position: fixed; z-index: 2900; bottom: 20px; ${position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
        display: ${position === 'hidden' ? 'none' : 'flex'}; align-items: center; gap: 10px;
        padding: 9px 14px 9px 12px; border-radius: 999px;
        font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Inter", "Hiragino Sans", sans-serif; letter-spacing: .08em;
        color: #fff; background: rgba(18,18,20,.72); border: 1px solid rgba(255,255,255,.14);
        -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%);
        box-shadow: 0 8px 30px rgba(0,0,0,.28); cursor: pointer;
        transition: transform .25s cubic-bezier(.2,.8,.2,1), background .25s;
      }
      .pill:hover { transform: translateY(-2px); background: rgba(18,18,20,.88); }
      .pill:focus-visible, .card:focus-visible, .close:focus-visible { outline: 2px solid #8ab4ff; outline-offset: 3px; }
      .dots { display: flex; }
      .dots i { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(18,18,20,.9); margin-left: -3px; }
      .dots i:first-child { margin-left: 0; }

      .backdrop {
        position: fixed; inset: 0; z-index: 3600; display: grid; cursor: default; place-items: center; padding: 16px;
        background: rgba(8,8,10,.55); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
        opacity: 0; pointer-events: none; transition: opacity .3s;
      }
      .backdrop.open { opacity: 1; pointer-events: auto; }
      .sheet {
        width: min(880px, 100%); max-height: calc(100vh - 32px); overflow: auto;
        padding: 28px; border-radius: 22px; color: #f2f2f2;
        background: rgba(22,22,26,.92); border: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 30px 80px rgba(0,0,0,.5);
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Hiragino Sans", "Noto Sans JP", sans-serif;
        transform: translateY(16px) scale(.98); transition: transform .4s cubic-bezier(.2,.8,.2,1);
      }
      .backdrop.open .sheet { transform: none; }
      .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
      .eyebrow { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #8d8d96; margin: 0 0 6px; }
      h2 { margin: 0; font-size: 22px; font-weight: 650; letter-spacing: -.01em; }
      .close { flex: none; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,.12); background: transparent; color: #ccc; font-size: 18px; cursor: pointer; }
      .close:hover { background: rgba(255,255,255,.08); }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      @media (max-width: 760px) { .grid { grid-template-columns: repeat(2, 1fr); } .sheet { padding: 20px; } }
      .card {
        display: block; cursor: pointer; text-decoration: none; color: inherit; border-radius: 14px; overflow: hidden;
        border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03);
        transition: transform .3s cubic-bezier(.2,.8,.2,1), border-color .3s, background .3s;
      }
      .card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.06); }
      .card.current { border-color: rgba(255,255,255,.55); }
      .thumb { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
      .meta { padding: 12px 14px 14px; }
      .name { display: flex; align-items: center; gap: 8px; font-weight: 650; font-size: 14px; }
      .name i { width: 8px; height: 8px; border-radius: 50%; }
      .badge { margin-left: auto; font-size: 10px; font-weight: 600; letter-spacing: .08em; padding: 3px 7px; border-radius: 99px; background: #fff; color: #111; }
      .jp { font-size: 11px; color: #9a9aa3; margin-top: 4px; }
      .desc { font-size: 12px; color: #c4c4cc; margin-top: 8px; line-height: 1.55; }

      /* ── mini previews ── */
      .t-pop { background: radial-gradient(circle at 75% 30%, #ff9a4d, #F05A00 55%, #c04400); }
      .t-pop b { position: absolute; left: 12%; bottom: 18%; font: 900 22px/0.95 Georgia, serif; color: #fff; text-shadow: 0 3px 0 rgba(0,0,0,.18); }
      .t-pop span { position: absolute; width: 26%; aspect-ratio: 1; border-radius: 50%; right: 12%; top: 16%; background: radial-gradient(circle at 35% 30%, #fff6, #ffffff14); box-shadow: inset -6px -8px 14px rgba(0,0,0,.18); }
      .t-matrix { background: #000; }
      .t-matrix span { position: absolute; top: 0; width: 2px; background: linear-gradient(#00ff4100, #00ff41); border-radius: 2px; animation: rain 1.6s linear infinite; }
      .t-matrix b { position: absolute; left: 10%; bottom: 14%; font: 700 12px/1.3 ui-monospace, Menlo, monospace; color: #00ff41; text-shadow: 0 0 8px #00ff41; }
      @keyframes rain { from { transform: translateY(-100%); } to { transform: translateY(260%); } }
      .t-noir { background: #08080a; background-image: linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px); background-size: 14px 14px; }
      .t-noir::before { content: ""; position: absolute; width: 90%; aspect-ratio: 1; left: 5%; top: -55%; border-radius: 50%; filter: blur(18px); opacity: .55; background: conic-gradient(#3b3b46, #cfcfd8, #1b1b22, #9a9aa6, #3b3b46); }
      .t-noir b { position: absolute; left: 0; right: 0; top: 36%; text-align: center; font: 600 17px/1.05 -apple-system, "Inter", sans-serif; letter-spacing: -.04em; color: #fff; }
      .t-noir span { position: absolute; left: 50%; bottom: 16%; width: 34%; height: 11px; margin-left: -17%; border-radius: 99px; background: #fff; }
      .t-os { background: radial-gradient(circle at 20% 20%, #ff8fb1, transparent 45%), radial-gradient(circle at 80% 30%, #7c6cff, transparent 50%), radial-gradient(circle at 50% 90%, #36d1dc, transparent 55%), #1b1740; }
      .t-os span { position: absolute; border-radius: 5px; background: rgba(255,255,255,.72); box-shadow: 0 4px 12px rgba(0,0,0,.25); }
      .t-os span::before { content: ""; position: absolute; left: 4px; top: 4px; width: 14px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #ff5f57 0 4px, transparent 4px 5px, #febc2e 5px 9px, transparent 9px 10px, #28c840 10px); }
      .t-os i { position: absolute; left: 25%; right: 25%; bottom: 6%; height: 10%; border-radius: 5px; background: rgba(255,255,255,.35); }

      .wipe { position: fixed; inset: 0; z-index: 3601; background: #0b0b0d; opacity: 0; pointer-events: none; transition: opacity .35s ease; }
      .wipe.on { opacity: 1; pointer-events: auto; }
      @media (prefers-reduced-motion: reduce) { .t-matrix span { animation: none; } }
    </style>

    <button class="pill" type="button" aria-haspopup="dialog" aria-label="デザインを切り替える">
      <span class="dots">${DESIGNS.map(d => `<i style="background:${d.dot}"></i>`).join('')}</span>
      DESIGN
    </button>

    <div class="backdrop" role="dialog" aria-modal="true" aria-label="デザイン切り替え">
      <div class="sheet">
        <div class="head">
          <div>
            <p class="eyebrow">Choose a design</p>
            <h2>見た目を切り替える</h2>
          </div>
          <button class="close" type="button" aria-label="閉じる">×</button>
        </div>
        <div class="grid">
          ${DESIGNS.map(d => `
            <a class="card ${d.id === current ? 'current' : ''}" href="${d.href}" data-id="${d.id}">
              <div class="thumb t-${d.id}">${thumb(d.id)}</div>
              <div class="meta">
                <div class="name"><i style="background:${d.dot}"></i>${d.name}${d.id === current ? '<span class="badge">NOW</span>' : ''}</div>
                <div class="jp">${d.jp}</div>
                <div class="desc">${d.desc}</div>
              </div>
            </a>`).join('')}
        </div>
      </div>
    </div>
    <div class="wipe"></div>
  `;

  function thumb(id) {
    if (id === 'pop') return '<span></span><b>HIROAKI<br>OKAYASU</b>';
    if (id === 'matrix') return Array.from({ length: 11 }, (_, i) =>
      `<span style="left:${6 + i * 8.6}%;height:${30 + (i * 37) % 45}%;animation-delay:-${(i * 0.37) % 1.6}s;opacity:${0.35 + (i % 3) * 0.25}"></span>`).join('') + '<b>&gt; wake up_</b>';
    if (id === 'noir') return '<b>Building quiet<br>tools.</b><span></span>';
    return '<span style="left:10%;top:14%;width:52%;height:46%"></span><span style="left:40%;top:34%;width:48%;height:40%"></span><i></i>';
  }

  const pill = shadow.querySelector('.pill');
  const backdrop = shadow.querySelector('.backdrop');
  const wipe = shadow.querySelector('.wipe');

  function open() { backdrop.classList.add('open'); shadow.querySelector('.card.current, .card').focus({ preventScroll: true }); }
  function close() { backdrop.classList.remove('open'); }

  pill.addEventListener('click', open);
  shadow.querySelector('.close').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && backdrop.classList.contains('open')) close(); });

  shadow.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (card.dataset.id === current) { e.preventDefault(); close(); return; }
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      go(card.dataset.id);
    });
  });

  function go(id) {
    const d = DESIGNS.find(x => x.id === id);
    if (!d) return false;
    if (d.id === current) return true;
    wipe.classList.add('on');
    setTimeout(() => { location.href = d.href; }, 340);
    return true;
  }

  // bfcache から戻った時にワイプが残らないように
  window.addEventListener('pageshow', () => { wipe.classList.remove('on'); close(); });

  (document.body ? Promise.resolve() : new Promise(r => document.addEventListener('DOMContentLoaded', r)))
    .then(() => document.body.appendChild(host));

  window.DesignSwitcher = { open, close, go, list: DESIGNS.map(d => d.id), current };
})();
