/* ============================================================
   CASE — 「四つの部屋の事件」全デザイン共通の事件簿
   <script src="designs/case.js"></script>（各ページの本体スクリプトより前に読む）
   同一オリジンの localStorage で、4 つのデザインの進捗を共有する。

   window.Case.start()       事件を始める（HiroOS の .sherlock を読んだとき）
   window.Case.find(room)    その部屋で電報の「読み方の規則」を見つけた（新規なら true）。手帳に書き留めた旨のトーストも出す
   window.Case.has(room) / count() / started() / solved() / solve()
============================================================ */
(function () {
  'use strict';
  const KEY = 'hs-case';

  // 奇妙な電報（『グロリア・スコット号』）。三つの部屋の規則で読むと、隠れた一文が現れる：
  //   STOP を数えない → FOGGY（霧）の次の語から → 3 語ごと ＝ CLIENT IS HIRO HIMSELF ANSWER IS VIOLIN
  const TELEGRAM = 'ARRIVED LONDON FOGGY STOP CLIENT WAITING NERVOUS STOP IS STILL SILENT STOP HIRO SENT WORD HIMSELF STOP SEEMS TIRED STOP ANSWER PROMPTLY PLEASE STOP IS MYCROFT AWARE STOP VIOLIN CASE MISSING STOP';
  const ANSWER = 'violin';

  // 電報の読み方の規則（三つ揃うまで、電報はただの旅の報告にしか見えない）
  const ROOMS = {
    matrix: { rule: '三語ごとに読め', name: '緑の雨の部屋', design: 'matrix' },
    pop:    { rule: '霧に着いたら、次の語から読め', name: '粘土の部屋', design: 'pop' },
    noir:   { rule: '止まったものは数えるな', name: '夜の部屋', design: 'noir' },
  };
  const ORDER = ['matrix', 'pop', 'noir'];

  // 規則と一緒に手帳へ残る推理メモ（本編とは関係のない、依頼人の癖）
  const CARDS = {
    matrix: {
      title: 'ラケットの件',
      clue: 'history.log ── playstyle=spin_control / Pure Aero 2022 / RPM Blast 125 @ 50 lbs',
      body: '彼は自分をスピンコントロール型だと信じている。だが、ブラスト 125 を 50 ポンドで張ったピュアアエロを、あのスイングで振り抜けば、ボールは唸りを上げてまっすぐ飛ぶ。フラットの剛速球だよ、ワトソン君。壁にはナダルとシェルトン。そして履歴には、アエロプロドライブの商品ページを何度も開いた跡 ── 未練というやつだ。',
      hint: '緑の雨の部屋。ターミナルで、隠れたファイルを探すといい。壁の赤い文字には気をつけて。',
    },
    pop: {
      title: '空の件',
      clue: 'パスポートに挟まっていた、何枚かの写真',
      body: '入国印は海の向こうばかり。挟まっていた写真を見て、最初は人物写真家かと思った ── が、違う。夕焼け、雲、飛行機雲。これだけ旅をしていながら、人はひとりも写っていない。彼がレンズを向けるのは、いつも頭上だけだ。',
      hint: '粘土の部屋。持ち主の持ち物をよく見ること。いちばん小さなものが、いちばん雄弁だ。',
    },
    noir: {
      title: '散歩道の件',
      clue: '止まった時計の裏の砂利と、ポケットの文庫本、乾いたカップ',
      body: '砂利は京都、疎水沿いの道のものだ。ポケットには同じ京都が舞台の森見登美彦、栞がわりにベルクソンの走り書き。カップの底には深煎りのブラックが乾いている ── 砂糖もミルクも使った形跡がない。考えごとをするとき、彼はあの哲学の道を歩く。',
      hint: '夜の部屋。時計はまだ、正しい時刻を指している。ほかの規則が揃えば、あるいは。',
      hintReady: '夜の部屋。あの時計が、何もしなくなった。',   // 緑の雨と粘土の規則が揃ったあと
    },
  };

  // おまけの推理メモ（規則とは無関係。見つけなくても事件は解ける）
  const BONUS = {
    fm: {
      title: 'テレキャスの件', place: 'HiroOS', clue: 'Hiro FM の再生履歴',
      body: '再生履歴はアジカン、ベボベ、マイヘア。指先のタコと、Momose のテレキャスター。MURO FES のタイムテーブルに赤丸がついている。最前列で拳を上げる種類の人間だ。',
      hint: 'HiroOS。ラジオは、誰が何を聴いてきたかを覚えている。',
    },
    movies: {
      title: '映画棚の件', place: 'Matrix', clue: 'ターミナルの movies/ ディレクトリ',
      body: 'スクール・オブ・ロック、ロード・オブ・ザ・リング、プラダを着た悪魔。ロックで教室を変える話、指輪を捨てに行く旅、場違いな職場で食らいつく話。どれも「場違いな場所で本気を出す人」の物語だ。',
      hint: '緑の雨の部屋。ls -a の中に、夜更かしの痕跡がある。',
    },
    camino: {
      title: '巡礼の件', place: 'Pop', clue: 'パスポートのサンティアゴ・デ・コンポステーラの入国印',
      body: '2016 年 5 月 13 日、彼はカミーノ・デ・サンティアゴを歩き通した。そこで出会った仲間を訪ねて、2019 年 2 月にはフランクフルト、ミラノ、ソウルへ。アウトバーンを時速 200 キロで走り、雪山でスノーモービルを駆り、炭火のカルビに唸った。彼の旅の地図は、一本の巡礼路から枝分かれしているのだよ、ワトソン君。',
      hint: '粘土の部屋。パスポートの入国印をすべて確かめること。一枚だけ、すべての旅の始まりになっている。',
    },
    shelf: {
      title: '本棚の件', place: '221B', clue: '221B の本棚',
      body: '推理小説がぎっしり。はやみねかおるの背表紙がいちばん擦り切れていて、森晶麿の隣にニーチェが刺さっている。……これだけ謎が好きな依頼人なら、この事件を仕組んだのが誰かも、もう分かるだろう？',
      hint: '事件を解いた者だけが、221B の本棚を見られる。',
    },
  };
  const BONUS_ORDER = ['fm', 'movies', 'camino', 'shelf'];

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };

  const Case = {
    ROOMS, ORDER, CARDS, TELEGRAM,
    check: (v) => String(v).trim().toLowerCase() === ANSWER, BONUS, BONUS_ORDER,
    state: read,
    started: () => !!read().started,
    solved: () => !!read().solved,
    has: (room) => !!(read().found || {})[room],
    count: () => ORDER.filter(r => (read().found || {})[r]).length,
    hint(room) { const c = CARDS[room]; return c.hintReady && Case.has('matrix') && Case.has('pop') ? c.hintReady : c.hint; },
    start() { const s = read(); if (!s.started) { s.started = Date.now(); write(s); } },
    find(room) {
      if (!ROOMS[room]) return false;
      const s = read(); s.found = s.found || {};
      if (s.found[room]) return false;
      s.found[room] = Date.now(); write(s);
      toast(room);
      return true;
    },
    hasBonus: (id) => !!(read().bonus || {})[id],
    bonus(id) {
      if (!BONUS[id]) return false;
      const s = read(); s.bonus = s.bonus || {};
      if (s.bonus[id]) return false;
      s.bonus[id] = Date.now(); write(s);
      paper(`<b>📓 ワトソンの手帳に記録した</b>おまけの推理メモ「${BONUS[id].title}」<small>おまけ ${BONUS_ORDER.filter(k => s.bonus[k]).length} / ${BONUS_ORDER.length}</small>`);
      return true;
    },
    solve() { const s = read(); if (!s.solved) { s.solved = Date.now(); write(s); } },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  // 手帳に書き留めたことを知らせる、デザイン共通の小さな紙片
  function toast(room) {
    const r = ROOMS[room], n = Case.count();
    const tail = Case.started()
      ? (n >= ORDER.length ? '規則は揃った。手帳の電報を読み直せ。' : `規則 ${n} / ${ORDER.length}`)
      : 'HiroOS のターミナルに、この規則の意味を知る手紙があるらしい。';
    paper(`<b>📓 ワトソンの手帳に記録した</b>${r.name}で、電報の読み方 <span class="f">「${r.rule}」</span><small>${tail}</small>`);
  }
  function paper(html) {
    const host = document.createElement('div');
    const sh = host.attachShadow({ mode: 'open' });
    sh.innerHTML = `
      <style>
        :host { all: initial; }
        .t { position: fixed; z-index: 4000; left: 50%; bottom: ${document.getElementById('dock') ? 112 : 28}px; width: min(360px, calc(100vw - 32px));
          transform: translate(-50%, 24px) rotate(-1.2deg); opacity: 0; transition: transform .5s cubic-bezier(.34,1.4,.5,1), opacity .4s;
          padding: 14px 18px 14px 20px; border-radius: 3px; color: #2b2419; cursor: pointer;
          font: 14px/1.7 "Klee One", "Hiragino Mincho ProN", "Yu Mincho", serif;
          background: repeating-linear-gradient(#fbf6e6 0 23px, #e8dfc4 23px 24px); box-shadow: 0 12px 32px rgba(0,0,0,.35); }
        .t.on { transform: translate(-50%, 0) rotate(-1.2deg); opacity: 1; }
        b { display: block; font-size: 12px; letter-spacing: .12em; color: #8a5a2b; }
        .f { font-weight: 700; }
        small { display: block; color: #7a6d55; font-size: 12px; }
      </style>
      <div class="t" role="status">${html}</div>`;
    document.body.appendChild(host);
    const t = sh.querySelector('.t');
    const bye = () => { t.classList.remove('on'); setTimeout(() => host.remove(), 500); };
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('on')));
    t.addEventListener('click', bye);
    setTimeout(bye, 7000);
  }

  window.Case = Case;
})();
