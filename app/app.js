/* ============================================================
   Gradely — Demo app (client-side router + views)
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initials = (n) => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const icon = (id, cls = '') => `<svg class="ico ${cls}"><use href="#i-${id}"/></svg>`;
  const mean = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  const animateBars = (root) => setTimeout(() => (root || document).querySelectorAll('[data-h]').forEach(b => b.style.height = b.dataset.h + '%'), 60);
  const animateSig = (root) => setTimeout(() => (root || document).querySelectorAll('[data-w]').forEach(b => b.style.width = b.dataset.w + '%'), 60);

  /* ---------- state ---------- */
  const S = { role: null, instructorCohort: 'c07', studentId: 's1' };

  /* ---------- theme ---------- */
  function initTheme() {
    const t = localStorage.getItem('gradely-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gradely-theme', next);
    render();
  }

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg, ic = 'check') {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = icon(ic) + esc(msg);
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- roles / nav ---------- */
  const ROLES = {
    admin: { label: 'Administrator', who: 'Admin · Gradely', av: 'AD', nav: [
      ['overview', 'Overview', 'grid'], ['cohorts', 'Cohorts', 'layers'], ['students', 'Students', 'users'],
      ['sessions', 'Sessions', 'video'], ['companies', 'Companies', 'building'], ['settings', 'Settings', 'settings'],
    ] },
    instructor: { label: 'Instructor', who: 'Reena Nair · Instructor', av: 'RN', nav: [
      ['dashboard', 'Dashboard', 'presentation'], ['grading', 'Grading', 'clipcheck'], ['sessions', 'Sessions', 'video'],
    ] },
    student: { label: 'Student', who: 'Aisha Khan · Batch 07', av: 'AK', nav: [
      ['overview', 'My Progress', 'grad'], ['quiz', 'Practice Quiz', 'help'], ['sessions', 'My Sessions', 'video'],
    ] },
    placement: { label: 'Placement Team', who: 'Vikram K. · Placements', av: 'VK', nav: [
      ['candidates', 'Candidates', 'handshake'], ['eligibility', 'Eligibility Engine', 'target'],
    ] },
  };

  /* ---------- router ---------- */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [role, page, param] = h.split('/');
    return { role, page: page || null, param: param || null };
  }
  function go(role, page, param) { location.hash = '#/' + role + (page ? '/' + page : '') + (param ? '/' + param : ''); }

  window.addEventListener('hashchange', render);

  /* ============================================================
     RENDER
     ============================================================ */
  function render() {
    const r = parse();
    const app = $('#app');
    if (!r.role || !ROLES[r.role]) { app.innerHTML = loginView(); wireLogin(); return; }
    S.role = r.role;
    const def = ROLES[r.role].nav[0][0];
    const page = r.page || def;
    app.innerHTML = shell(r.role, page);
    wireShell(r.role);
    renderPage(r.role, page, r.param);
  }

  function shell(role, page) {
    const R = ROLES[role];
    const nav = R.nav.map(([id, label, ic]) => {
      let badge = '';
      if (role === 'instructor' && id === 'grading') badge = `<span class="badge-n">${DB.grading().length}</span>`;
      return `<div class="nav-item ${id === page ? 'active' : ''}" data-nav="${id}">${icon(ic)} <span>${label}</span>${badge}</div>`;
    }).join('');
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return `
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="sb-logo"><span class="dot">G</span> Gradely</div>
        <div class="sb-role">${R.label} portal</div>
        <nav>${nav}</nav>
        <div class="sb-foot">
          <div class="nav-item" data-switch="1">${icon('users')} <span>Switch role</span></div>
          <div class="sb-user"><div class="av">${R.av}</div><div><b>${R.who.split(' · ')[0]}</b><span>${R.who.split(' · ')[1] || ''}</span></div></div>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <button class="icon-btn menu-btn" data-menu="1" aria-label="Menu">${icon('menu')}</button>
          <div id="pagehead"><h1>…</h1></div>
          <div class="spacer"></div>
          <div class="search"><span>${icon('search')}</span><input id="globalSearch" placeholder="Search students…"></div>
          <button class="icon-btn" data-theme-toggle="1" aria-label="Theme">${icon(dark ? 'moon' : 'sun')}</button>
        </div>
        <div class="content" id="content"></div>
      </div>
    </div>`;
  }

  function head(title, sub) { $('#pagehead').innerHTML = `<h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`; }

  function wireShell(role) {
    $('#sidebar').querySelectorAll('[data-nav]').forEach(n => n.onclick = () => { go(role, n.dataset.nav); $('#sidebar').classList.remove('open'); });
    $('[data-switch]') && ($('[data-switch]').onclick = () => { location.hash = ''; render(); });
    $('[data-theme-toggle]').onclick = toggleTheme;
    $('[data-menu]').onclick = () => $('#sidebar').classList.toggle('open');
    const gs = $('#globalSearch');
    gs.onkeydown = (e) => { if (e.key === 'Enter' && gs.value.trim()) { go(role === 'placement' ? 'placement' : role === 'instructor' ? 'instructor' : 'admin', role === 'placement' ? 'candidates' : role === 'instructor' ? 'dashboard' : 'students'); setTimeout(() => { const s = $('#stuSearch'); if (s) { s.value = gs.value; s.dispatchEvent(new Event('input')); } }, 40); } };
  }

  /* ============================================================
     LOGIN
     ============================================================ */
  function loginView() {
    const opts = [
      ['admin', 'Administrator', 'Full platform control', 'settings'],
      ['instructor', 'Instructor', 'Cohorts & grading', 'presentation'],
      ['student', 'Student', 'Learning & progress', 'grad'],
      ['placement', 'Placement Team', 'Job-ready pipeline', 'handshake'],
    ];
    return `
    <div class="login-wrap">
      <div class="login-mesh"></div>
      <div class="login-card fade">
        <div class="login-logo"><span class="dot">G</span> Gradely</div>
        <div class="between" style="margin-bottom:18px"><p class="muted" style="margin:6px 0 0;font-size:.9rem">Sign in to the demo workspace</p><span class="demo-pill">${icon('sparkle')} Demo mode</span></div>
        <div class="role-grid" id="roleGrid">
          ${opts.map((o, i) => `<button class="role-opt ${i === 0 ? 'sel' : ''}" data-role="${o[0]}"><div class="ri">${icon(o[3])}</div><b>${o[1]}</b><span>${o[2]}</span></button>`).join('')}
        </div>
        <div class="field"><label>Work email</label><input id="loginEmail" value="demo@gradely.app" autocomplete="off"></div>
        <button class="btn btn-primary" id="loginBtn" style="width:100%;justify-content:center">Enter workspace ${icon('arrow')}</button>
        <p class="faint" style="text-align:center;font-size:.76rem;margin:16px 0 0">No real data leaves your browser. Everything here is simulated.</p>
      </div>
    </div>`;
  }
  function wireLogin() {
    let role = 'admin';
    $('#roleGrid').querySelectorAll('[data-role]').forEach(b => b.onclick = () => {
      $('#roleGrid').querySelectorAll('[data-role]').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); role = b.dataset.role;
    });
    $('#loginBtn').onclick = () => go(role, ROLES[role].nav[0][0]);
    $('#loginEmail').onkeydown = (e) => { if (e.key === 'Enter') $('#loginBtn').click(); };
  }

  /* ============================================================
     PAGE DISPATCH
     ============================================================ */
  function renderPage(role, page, param) {
    const key = role + ':' + page;
    const fn = PAGES[key] || PAGES[role + ':' + ROLES[role].nav[0][0]];
    fn(param);
  }

  const readinessDonut = (pct, label = 'ready') => `<div class="donut" style="--p:${pct}"><div class="num"><b>${pct}</b><span>${label}</span></div></div>`;
  const scoreCell = (v) => `<div class="score-cell"><span class="mini-bar"><span style="width:${v}%"></span></span><b>${v}</b></div>`;
  const statusPill = (st) => { const m = { ready: ['ready', 'Job-ready'], ontrack: ['ontrack', 'On track'], risk: ['risk', 'At risk'] }; const [c, t] = m[st]; return `<span class="pill ${c}"><span class="status-dot" style="background:currentColor"></span>${t}</span>`; };
  const avatar = (n) => `<div class="av">${initials(n)}</div>`;

  const PAGES = {
    /* ---------------- ADMIN ---------------- */
    'admin:overview': () => {
      head('Overview', 'Everything across your programs at a glance');
      const st = DB.students(); const co = DB.cohorts(); const se = DB.sessions();
      const avg = mean(st.map(s => s.readiness));
      const ready = st.filter(s => s.status === 'ready').length;
      const risk = st.filter(s => s.status === 'risk').length;
      const processed = se.filter(s => s.status === 'processed').length;
      const byCohort = co.map(c => ({ c, v: mean(DB.students(c.id).map(s => s.readiness)) }));
      const dist = { ready, ontrack: st.filter(s => s.status === 'ontrack').length, risk };
      const atRisk = st.filter(s => s.status === 'risk').sort((a, b) => a.readiness - b.readiness);
      $('#content').innerHTML = `
      <div class="kpis fade">
        ${kpi('users', 'Total students', st.length, `Across ${co.length} cohorts`, 'flat')}
        ${kpi('target', 'Avg Job Readiness', avg, '▲ 4 vs last week', 'up')}
        ${kpi('handshake', 'Job-ready', `${ready}<span class="faint" style="font-size:1rem">/${st.length}</span>`, `${Math.round(ready / st.length * 100)}% of learners`, 'up')}
        ${kpi('video', 'Sessions processed', processed, '1 processing now', 'flat')}
      </div>
      <div class="grid fade" style="grid-template-columns:1.5fr 1fr;margin-top:16px">
        <div class="card">
          <div class="between"><h3 style="font-size:1rem">Avg Job Readiness by cohort</h3><span class="faint mono" style="font-size:.66rem">0–100</span></div>
          <div class="bars" style="margin-top:16px">
            ${byCohort.map(x => `<div class="bcol"><div class="bar" data-h="${x.v}" style="height:0"></div><small>${x.c.name}</small></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:16px">Readiness distribution</h3>
          <div class="row" style="align-items:center;gap:22px">
            ${readinessDonut(Math.round(ready / st.length * 100), 'job-ready')}
            <div class="legend" style="flex:1">
              <div class="lr"><span class="sw" style="background:var(--good)"></span> Job-ready <b>${dist.ready}</b></div>
              <div class="lr"><span class="sw" style="background:var(--warn)"></span> On track <b>${dist.ontrack}</b></div>
              <div class="lr"><span class="sw" style="background:var(--bad)"></span> At risk <b>${dist.risk}</b></div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid fade" style="grid-template-columns:1.4fr 1fr;margin-top:16px">
        <div class="card" style="padding:0">
          <div class="between" style="padding:18px 20px 6px"><h3 style="font-size:1rem">Recent sessions</h3><button class="btn btn-ghost btn-sm" data-nav2="sessions">View all</button></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Session</th><th>Cohort</th><th>Avg quiz</th><th>Status</th></tr></thead><tbody>
            ${se.slice(0, 5).map(s => { const c = DB.cohort(s.cohortId); return `<tr><td><b style="font-family:Space Grotesk">${esc(s.title)}</b><br><span class="faint" style="font-size:.74rem">${s.date} · ${s.duration}m</span></td><td>${c.name}</td><td>${s.status === 'processed' ? s.avgQuiz + '%' : '—'}</td><td>${s.status === 'processed' ? '<span class="pill ready">Processed</span>' : '<span class="pill ontrack">' + icon('sparkle') + 'Processing</span>'}</td></tr>`; }).join('')}
          </tbody></table></div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:6px">Top at-risk students</h3>
          <p class="faint" style="font-size:.78rem;margin:0 0 14px">Flagged by the readiness engine</p>
          ${atRisk.slice(0, 4).map(s => `<div class="between" data-stu="${s.id}" style="padding:9px 0;border-bottom:1px solid var(--line-2);cursor:pointer">${cell(s)}<span class="pill risk">${s.readiness}</span></div>`).join('') || '<div class="empty">No at-risk students 🎉</div>'}
        </div>
      </div>`;
      animateBars();
      $('#content').querySelectorAll('[data-stu]').forEach(e => e.onclick = () => openStudent(e.dataset.stu));
      $('#content').querySelectorAll('[data-nav2]').forEach(e => e.onclick = () => go('admin', e.dataset.nav2));
    },

    'admin:cohorts': () => {
      head('Cohorts', 'Manage your batches and tracks');
      const co = DB.cohorts();
      $('#content').innerHTML = `
      <div class="between" style="margin-bottom:18px"><p class="muted" style="margin:0">${co.length} active cohorts</p><button class="btn btn-primary" id="newCohort">${icon('plus')} New cohort</button></div>
      <div class="grid fade" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${co.map(c => { const s = DB.students(c.id); const avg = mean(s.map(x => x.readiness)); const ready = s.filter(x => x.status === 'ready').length;
          return `<div class="card hover" data-cohort="${c.id}" style="cursor:pointer">
            <div class="between"><span class="tag" style="background:color-mix(in srgb,${c.color} 14%,transparent);color:${c.color};border-color:transparent">${esc(c.track)}</span><span class="faint mono" style="font-size:.66rem">${c.id.toUpperCase()}</span></div>
            <h3 style="margin:12px 0 3px;font-size:1.25rem">${esc(c.name)}</h3>
            <p class="faint" style="font-size:.78rem;margin:0 0 16px">Started ${c.start}</p>
            <div class="row" style="gap:20px">
              <div><div class="faint mono" style="font-size:.6rem;text-transform:uppercase;letter-spacing:.07em">Students</div><div style="font-family:Space Grotesk;font-size:1.4rem;font-weight:700">${s.length}</div></div>
              <div><div class="faint mono" style="font-size:.6rem;text-transform:uppercase;letter-spacing:.07em">Avg readiness</div><div style="font-family:Space Grotesk;font-size:1.4rem;font-weight:700">${avg}</div></div>
              <div><div class="faint mono" style="font-size:.6rem;text-transform:uppercase;letter-spacing:.07em">Job-ready</div><div style="font-family:Space Grotesk;font-size:1.4rem;font-weight:700;color:var(--good)">${ready}</div></div>
            </div>
          </div>`; }).join('')}
      </div>`;
      $('#newCohort').onclick = openNewCohort;
      $('#content').querySelectorAll('[data-cohort]').forEach(e => e.onclick = () => { S.instructorCohort = e.dataset.cohort; go('admin', 'students', e.dataset.cohort); });
    },

    'admin:students': (param) => {
      head('Students', 'Every learner and their live Job Readiness Score');
      renderStudentTable($('#content'), param, true);
    },

    'admin:sessions': () => {
      head('Sessions', 'Lectures ingested and auto-processed into practice');
      const se = DB.sessions();
      $('#content').innerHTML = `
      <div class="between" style="margin-bottom:18px"><p class="muted" style="margin:0">${se.length} sessions</p><button class="btn btn-primary" id="processBtn">${icon('sparkle')} Process new session</button></div>
      <div class="card fade" style="padding:0"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Session</th><th>Cohort</th><th>Duration</th><th>Artifacts</th><th>Avg quiz</th><th>Status</th></tr></thead>
        <tbody>${se.map(s => { const c = DB.cohort(s.cohortId); const done = s.status === 'processed';
          return `<tr><td><b style="font-family:Space Grotesk">${esc(s.title)}</b><br><span class="faint" style="font-size:.74rem">${s.date}</span></td>
            <td>${c.name}</td><td>${s.duration}m</td>
            <td>${done ? `<span class="tag">${icon('filetext')} Summary</span><span class="tag">${s.quizQs} Q</span><span class="tag">${s.bytes} bytes</span>` : '<span class="faint">—</span>'}</td>
            <td>${done ? s.avgQuiz + '%' : '—'}</td>
            <td>${done ? '<span class="pill ready">Processed</span>' : '<span class="pill ontrack">' + icon('sparkle') + 'Processing</span>'}</td></tr>`; }).join('')}
        </tbody></table></div></div>`;
      $('#processBtn').onclick = openProcess;
    },

    'admin:companies': () => {
      head('Companies', 'Hiring partners and their job-readiness bar');
      const co = DB.companies();
      $('#content').innerHTML = `
      <div class="grid fade" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
        ${co.map(c => { const elig = DB.eligible(c); return `<div class="card hover" data-co="${c.id}" style="cursor:pointer">
          <div class="between"><div class="row" style="align-items:center;gap:12px"><div class="kpi"><div class="ic" style="margin:0">${icon('building')}</div></div><div><h3 style="font-size:1.15rem">${esc(c.name)}</h3><span class="faint" style="font-size:.78rem">${esc(c.role)}</span></div></div></div>
          <div style="margin:16px 0 12px"><span class="tag">Quiz ≥ ${c.minQuiz}%</span><span class="tag">Assign ≥ ${c.minAssign}%</span><span class="tag">Eng ≥ ${c.minEng}</span>${c.mentor ? '<span class="tag">Mentor ✓</span>' : ''}</div>
          <div class="between"><span class="faint" style="font-size:.82rem">Currently clearing the bar</span><span class="pill ready" style="font-size:.8rem">${elig.length} students</span></div>
        </div>`; }).join('')}
      </div>
      <p class="faint fade" style="margin-top:20px;font-size:.82rem">${icon('target')} Open a company to tune its bar in the Eligibility Engine.</p>`;
      $('#content').querySelectorAll('[data-co]').forEach(e => e.onclick = () => go('placement', 'eligibility', e.dataset.co));
    },

    'admin:settings': () => {
      head('Settings', 'Demo workspace configuration');
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      $('#content').innerHTML = `
      <div class="card fade" style="max-width:640px">
        <div class="between" style="padding:6px 0"><div><b style="font-family:Space Grotesk">Dark mode</b><br><span class="faint" style="font-size:.8rem">Toggle the workspace theme</span></div>
          <label class="switch"><input type="checkbox" id="setTheme" ${dark ? 'checked' : ''}><span class="track"></span></label></div>
        <div class="between" style="padding:16px 0;border-top:1px solid var(--line-2)"><div><b style="font-family:Space Grotesk">Reset demo data</b><br><span class="faint" style="font-size:.8rem">Restore all cohorts, students and grading to the original seed</span></div>
          <button class="btn btn-ghost" id="resetBtn">${icon('sparkle')} Reset</button></div>
        <div class="between" style="padding:16px 0;border-top:1px solid var(--line-2)"><div><b style="font-family:Space Grotesk">Marketing site</b><br><span class="faint" style="font-size:.8rem">Back to the public Gradely landing page</span></div>
          <a class="btn btn-ghost" href="../index.html">${icon('arrow')} Open</a></div>
      </div>`;
      $('#setTheme').onchange = toggleTheme;
      $('#resetBtn').onclick = () => { DB.reset(); toast('Demo data reset'); render(); };
    },

    /* ---------------- INSTRUCTOR ---------------- */
    'instructor:dashboard': () => {
      const cohorts = DB.cohorts();
      head('Instructor Dashboard', 'Your cohort, live');
      const cid = S.instructorCohort; const st = DB.students(cid); const c = DB.cohort(cid);
      const avg = mean(st.map(s => s.readiness));
      const atRisk = st.filter(s => s.status === 'risk' || s.status === 'ontrack').sort((a, b) => a.readiness - b.readiness);
      const se = DB.sessions(cid).filter(s => s.status === 'processed');
      $('#content').innerHTML = `
      <div class="between fade" style="margin-bottom:18px">
        <select class="field" id="cohortSel" style="width:auto;padding:9px 14px;font-family:Space Grotesk;font-weight:600">${cohorts.map(x => `<option value="${x.id}" ${x.id === cid ? 'selected' : ''}>${x.name} — ${x.track}</option>`).join('')}</select>
        <button class="btn btn-primary btn-sm" id="processBtn2">${icon('sparkle')} Process session</button>
      </div>
      <div class="kpis fade">
        ${kpi('users', 'Students', st.length, c.track, 'flat')}
        ${kpi('target', 'Avg readiness', avg, '▲ 6 vs last week', 'up')}
        ${kpi('handshake', 'Job-ready', st.filter(s => s.status === 'ready').length + '/' + st.length, 'This cohort', 'up')}
        ${kpi('clipcheck', 'To grade', DB.grading().filter(g => DB.student(g.studentId).cohortId === cid).length, 'Pending your review', 'flat')}
      </div>
      <div class="grid fade" style="grid-template-columns:1.5fr 1fr;margin-top:16px">
        <div class="card"><h3 style="font-size:1rem;margin-bottom:8px">Quiz average by session</h3>
          <div class="bars" style="margin-top:12px">${se.slice().reverse().map((s, i) => `<div class="bcol"><div class="bar" data-h="${s.avgQuiz}" style="height:0"></div><small>S${i + 1}</small></div>`).join('') || '<div class="empty">No sessions yet</div>'}</div>
        </div>
        <div class="card"><h3 style="font-size:1rem;margin-bottom:6px">Needs attention</h3><p class="faint" style="font-size:.78rem;margin:0 0 12px">Lowest readiness first</p>
          ${atRisk.slice(0, 5).map(s => `<div class="between" data-stu="${s.id}" style="padding:8px 0;border-bottom:1px solid var(--line-2);cursor:pointer">${cell(s)}${statusPill(s.status)}</div>`).join('')}
        </div>
      </div>
      <div class="section-title fade"><h3>All students</h3></div>
      <div class="card fade" style="padding:0" id="stTblHost"></div>`;
      renderStudentTable($('#stTblHost'), cid, false, true);
      animateBars();
      $('#cohortSel').onchange = (e) => { S.instructorCohort = e.target.value; render(); };
      $('#processBtn2').onclick = openProcess;
      $('#content').querySelectorAll('[data-stu]').forEach(e => e.onclick = () => openStudent(e.dataset.stu));
    },

    'instructor:grading': () => {
      head('Grading queue', 'AI graded the first pass — you approve or adjust');
      renderGrading();
    },

    'instructor:sessions': () => {
      head('Sessions', 'Your cohort’s processed lectures');
      const se = DB.sessions(S.instructorCohort);
      $('#content').innerHTML = `<div class="grid fade" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${se.map(s => `<div class="card hover"><div class="between"><span class="pill ${s.status === 'processed' ? 'ready' : 'ontrack'}">${s.status === 'processed' ? 'Processed' : 'Processing'}</span><span class="faint" style="font-size:.74rem">${s.date}</span></div>
          <h3 style="margin:12px 0 4px;font-size:1.1rem">${esc(s.title)}</h3><p class="faint" style="font-size:.78rem;margin:0 0 14px">${s.duration} min lecture</p>
          ${s.status === 'processed' ? `<div>${icon('filetext')}<span class="tag" style="margin-left:6px">Summary</span><span class="tag">${s.quizQs} quiz Q</span><span class="tag">${s.bytes} revision bytes</span></div>` : `<p class="faint" style="font-size:.82rem">${icon('sparkle', 'spinner')} Generating artifacts…</p>`}
        </div>`).join('')}</div>`;
    },

    /* ---------------- STUDENT ---------------- */
    'student:overview': () => {
      head('My Progress', 'Your journey to job-ready');
      const s = DB.student(S.studentId); const c = DB.cohort(s.cohortId);
      const all = DB.students().sort((a, b) => b.readiness - a.readiness);
      const rank = all.findIndex(x => x.id === s.id) + 1;
      const sigs = [
        ['Concept mastery', 'quizzes', s.quiz, '30%', s.quiz < 65],
        ['Applied skills', 'assignments', s.assignment, '30%', s.assignment < 60],
        ['Consistency', 'engagement', s.engagement, '20%', s.engagement < 55],
        ['Interview readiness', 'mock practice', s.interview, '20%', s.interview < 60],
      ];
      $('#content').innerHTML = `
      <div class="grid fade" style="grid-template-columns:1fr 1.3fr">
        <div class="card" style="text-align:center">
          <div class="faint mono" style="font-size:.64rem;letter-spacing:.1em;text-transform:uppercase">Your Job Readiness</div>
          <div style="margin:16px auto 10px;width:max-content">${readinessDonut(s.readiness, s.status === 'ready' ? 'job-ready' : s.status === 'ontrack' ? 'on track' : 'keep going')}</div>
          ${statusPill(s.status)}
          <p class="muted" style="font-size:.86rem;margin:14px 0 0">Ranked <b style="font-family:Space Grotesk;color:var(--text)">#${rank}</b> of ${all.length} learners · ${esc(c.name)}</p>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:16px">What makes up your score</h3>
          ${sigs.map(g => `<div class="sig"><div class="sig-top"><span>${g[0]} <span class="faint">· ${g[1]}</span></span><span class="w">${g[2]}% · w ${g[3]}</span></div><div class="sig-bar ${g[4] ? 'low' : ''}"><i data-w="${g[2]}"></i></div></div>`).join('')}
          <div class="card" style="background:var(--surface-2);margin-top:12px;padding:14px 16px"><b style="font-family:Space Grotesk">Next best action</b><p class="muted" style="font-size:.85rem;margin:6px 0 0">${s.reasons[0] ? 'Focus area: ' + esc(s.reasons[0]) + '. Watch this week’s revision bytes and retake the quiz to lift your score.' : 'You’re clearing the bar — keep your consistency up to stay top-tier.'}</p></div>
        </div>
      </div>
      <div class="between fade" style="margin:26px 0 4px"><h3 style="font-size:1.05rem">Switch student <span class="faint" style="font-weight:400;font-size:.8rem">(demo)</span></h3></div>
      <select class="field fade" id="stuPick" style="max-width:320px">${DB.students(s.cohortId).map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select>`;
      animateSig();
      $('#stuPick').onchange = (e) => { S.studentId = e.target.value; render(); };
    },

    'student:quiz': () => { head('Practice Quiz', 'Auto-generated from your last session'); renderQuiz(); },

    'student:sessions': () => {
      head('My Sessions', 'Your lectures, summarised and quizzed');
      const s = DB.student(S.studentId); const se = DB.sessions(s.cohortId).filter(x => x.status === 'processed');
      $('#content').innerHTML = `<div class="grid fade" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${se.map(x => `<div class="card hover"><h3 style="font-size:1.1rem;margin-bottom:6px">${esc(x.title)}</h3><p class="faint" style="font-size:.78rem;margin:0 0 14px">${x.date} · ${x.duration} min</p>
          <div><span class="tag">${icon('filetext')} Summary</span><span class="tag">${icon('help')} ${x.quizQs} Q quiz</span><span class="tag">${icon('clap')} ${x.bytes} bytes</span></div>
          <button class="btn btn-ghost btn-sm" style="margin-top:14px" data-goquiz="1">Take quiz ${icon('arrow')}</button></div>`).join('')}</div>`;
      $('#content').querySelectorAll('[data-goquiz]').forEach(b => b.onclick = () => go('student', 'quiz'));
    },

    /* ---------------- PLACEMENT ---------------- */
    'placement:candidates': () => {
      head('Candidates', 'Job-ready learners across every cohort');
      const all = DB.students().sort((a, b) => b.readiness - a.readiness);
      $('#content').innerHTML = `
      <div class="between fade" style="margin-bottom:16px"><p class="muted" style="margin:0">${all.filter(s => s.status === 'ready').length} job-ready · ${all.length} total</p>
        <div class="row"><select class="field" id="fltStatus" style="width:auto;padding:8px 12px"><option value="all">All statuses</option><option value="ready">Job-ready</option><option value="ontrack">On track</option><option value="risk">At risk</option></select></div></div>
      <div class="card fade" style="padding:0" id="candHost"></div>`;
      const draw = (flt) => {
        const rows = all.filter(s => flt === 'all' || s.status === flt);
        $('#candHost').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Student</th><th>Cohort</th><th>Readiness</th><th>Quiz</th><th>Assign</th><th>Mentor</th><th>Status</th></tr></thead>
          <tbody>${rows.map(s => { const c = DB.cohort(s.cohortId); return `<tr data-stu="${s.id}"><td>${cell(s)}</td><td>${c.name}</td><td>${scoreCell(s.readiness)}</td><td>${s.quiz}%</td><td>${s.assignment}%</td><td>${mentorCell(s.mentor)}</td><td>${statusPill(s.status)}</td></tr>`; }).join('')}</tbody></table></div>`;
        $('#candHost').querySelectorAll('[data-stu]').forEach(e => e.onclick = () => openStudent(e.dataset.stu));
      };
      draw('all');
      $('#fltStatus').onchange = (e) => draw(e.target.value);
    },

    'placement:eligibility': (coId) => {
      head('Eligibility Engine', 'Set a company’s bar — see who clears it, live');
      const companies = DB.companies(); const c = DB.companies().find(x => x.id === coId) || companies[0];
      $('#content').innerHTML = `
      <div class="between fade" style="margin-bottom:16px">
        <select class="field" id="coSel" style="width:auto;padding:9px 14px;font-family:Space Grotesk;font-weight:600">${companies.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${x.name} — ${x.role}</option>`).join('')}</select>
      </div>
      <div class="grid fade" style="grid-template-columns:340px 1fr">
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:18px">${esc(c.name)} — hiring bar</h3>
          <div class="field" style="margin-bottom:22px"><label>Min. quiz average <b style="float:right;color:var(--brand-ink)"><span id="vQ">${c.minQuiz}</span>%</b></label><input type="range" id="rQ" min="0" max="100" value="${c.minQuiz}"></div>
          <div class="field" style="margin-bottom:22px"><label>Min. assignment score <b style="float:right;color:var(--brand-ink)"><span id="vA">${c.minAssign}</span>%</b></label><input type="range" id="rA" min="0" max="100" value="${c.minAssign}"></div>
          <div class="field" style="margin-bottom:22px"><label>Min. engagement <b style="float:right;color:var(--brand-ink)"><span id="vE">${c.minEng}</span></b></label><input type="range" id="rE" min="0" max="100" value="${c.minEng}"></div>
          <div class="between" style="padding:12px 0;border-top:1px solid var(--line-2)"><span style="font-size:.88rem;font-weight:500">Require mentor-approved work</span><label class="switch"><input type="checkbox" id="rM" ${c.mentor ? 'checked' : ''}><span class="track"></span></label></div>
          <div class="card" style="background:var(--surface-2);text-align:center;margin-top:16px"><div style="font-family:Space Grotesk;font-size:2.2rem;font-weight:700;letter-spacing:-.04em"><span id="eligN">0</span> <span class="faint" style="font-size:1rem">/ ${DB.students().length}</span></div><div class="faint" style="font-size:.8rem">students job-ready</div></div>
          <button class="btn btn-ghost btn-sm" id="saveBar" style="width:100%;justify-content:center;margin-top:12px">Save as ${esc(c.name)}’s bar</button>
        </div>
        <div class="card" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Student</th><th>Cohort</th><th>Quiz</th><th>Assign</th><th>Eng</th><th>Mentor</th><th>Result</th></tr></thead><tbody id="eligRows"></tbody></table></div></div>
      </div>`;
      const els = { Q: $('#rQ'), A: $('#rA'), E: $('#rE'), M: $('#rM') };
      const recompute = () => {
        const crit = { minQuiz: +els.Q.value, minAssign: +els.A.value, minEng: +els.E.value, mentor: els.M.checked };
        $('#vQ').textContent = crit.minQuiz; $('#vA').textContent = crit.minAssign; $('#vE').textContent = crit.minEng;
        const all = DB.students(); let n = 0;
        $('#eligRows').innerHTML = all.map(s => {
          const ok = s.quiz >= crit.minQuiz && s.assignment >= crit.minAssign && s.engagement >= crit.minEng && (!crit.mentor || s.mentor);
          if (ok) n++; const co = DB.cohort(s.cohortId);
          return `<tr style="${ok ? 'background:color-mix(in srgb,var(--good) 7%,transparent)' : ''}"><td>${cell(s)}</td><td>${co.name}</td><td>${s.quiz}%</td><td>${s.assignment}%</td><td>${s.engagement}</td><td>${s.mentor ? '✓' : '—'}</td><td><span class="pill ${ok ? 'ready' : 'neutral'}">${ok ? 'Clears bar' : '—'}</span></td></tr>`;
        }).join('');
        $('#eligN').textContent = n;
      };
      Object.values(els).forEach(e => e.oninput = recompute);
      recompute();
      $('#coSel').onchange = (e) => go('placement', 'eligibility', e.target.value);
      $('#saveBar').onclick = () => { DB.setCompanyCriteria(c.id, { minQuiz: +els.Q.value, minAssign: +els.A.value, minEng: +els.E.value, mentor: els.M.checked }); toast(c.name + '’s bar saved'); };
    },
  };

  /* ---------- shared components ---------- */
  function kpi(ic, label, value, delta, dir) {
    return `<div class="card kpi"><div class="top"><div class="ic">${icon(ic)}</div></div><div class="l">${label}</div><div class="v">${value}</div><div class="d ${dir}">${delta}</div></div>`;
  }
  function cell(s) { const c = DB.cohort(s.cohortId); return `<div class="who">${avatar(s.name)}<div><b>${esc(s.name)}</b><span>${c.name} · ${esc(c.track.split(' ')[0])}</span></div></div>`; }
  function mentorCell(m) { return m ? `<span style="color:var(--good)">${icon('check')}</span>` : '<span class="faint">—</span>'; }

  function renderStudentTable(host, cohortId, showCohortFilter, compact) {
    const cohorts = DB.cohorts();
    const draw = (cid, q) => {
      let list = DB.students(cid);
      if (q) list = list.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
      list = list.sort((a, b) => b.readiness - a.readiness);
      const body = list.map(s => `<tr data-stu="${s.id}"><td>${cell(s)}</td><td>${scoreCell(s.readiness)}</td><td>${s.quiz}%</td><td>${s.assignment}%</td><td>${s.engagement}</td><td>${mentorCell(s.mentor)}</td><td>${statusPill(s.status)}</td></tr>`).join('');
      host.querySelector('#stBody').innerHTML = body || '<tr><td colspan="7" class="empty">No students found</td></tr>';
      host.querySelectorAll('[data-stu]').forEach(e => e.onclick = () => openStudent(e.dataset.stu));
    };
    host.innerHTML = `
      ${compact ? '' : `<div class="between" style="margin-bottom:16px">
        <div class="search" style="background:var(--surface)"><span>${icon('search')}</span><input id="stuSearch" placeholder="Search students…"></div>
        ${showCohortFilter ? `<select class="field" id="cohortFlt" style="width:auto;padding:8px 12px"><option value="">All cohorts</option>${cohorts.map(c => `<option value="${c.id}" ${c.id === cohortId ? 'selected' : ''}>${c.name}</option>`).join('')}</select>` : ''}
      </div>`}
      <div class="card ${compact ? '' : 'fade'}" style="padding:0"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Student</th><th>Readiness</th><th>Quiz</th><th>Assign</th><th>Eng</th><th>Mentor</th><th>Status</th></tr></thead>
        <tbody id="stBody"></tbody></table></div></div>`;
    let curCid = compact ? cohortId : (showCohortFilter ? (cohortId || '') : cohortId);
    draw(curCid, '');
    const se = host.querySelector('#stuSearch'); if (se) se.oninput = () => draw(host.querySelector('#cohortFlt') ? host.querySelector('#cohortFlt').value : curCid, se.value);
    const cf = host.querySelector('#cohortFlt'); if (cf) cf.onchange = () => draw(cf.value, se ? se.value : '');
  }

  /* ---------- student drawer ---------- */
  function openStudent(id) {
    const s = DB.student(id); if (!s) return; const c = DB.cohort(s.cohortId);
    const sigs = [
      ['Concept mastery', s.quiz, s.quiz < 65], ['Applied skills', s.assignment, s.assignment < 60],
      ['Consistency', s.engagement, s.engagement < 55], ['Interview readiness', s.interview, s.interview < 60],
    ];
    ensureOverlay();
    const d = $('#drawer');
    d.innerHTML = `
      <div class="drawer-head"><div class="who">${avatar(s.name)}<div><b style="font-size:1.05rem">${esc(s.name)}</b><span>${c.name} · ${esc(c.track)}</span></div></div>
        <button class="icon-btn" data-close="1">${icon('x')}</button></div>
      <div class="drawer-body">
        <div class="row" style="align-items:center;gap:20px;margin-bottom:20px">${readinessDonut(s.readiness, 'readiness')}
          <div>${statusPill(s.status)}<p class="muted" style="font-size:.85rem;margin:10px 0 0">${s.status === 'ready' ? 'Clears the bar for most partners.' : s.status === 'ontrack' ? 'Close — one or two signals to lift.' : 'Needs support across several signals.'}</p></div></div>
        <h4 style="font-size:.9rem;margin-bottom:12px">Score breakdown</h4>
        ${sigs.map(g => `<div class="sig"><div class="sig-top"><span>${g[0]}</span><span class="w">${g[1]}%</span></div><div class="sig-bar ${g[2] ? 'low' : ''}"><i data-w="${g[1]}"></i></div></div>`).join('')}
        ${s.reasons.length ? `<h4 style="font-size:.9rem;margin:20px 0 10px">Flags</h4>${s.reasons.map(r => `<div class="pstep" style="border-color:color-mix(in srgb,var(--warn) 30%,var(--line))"><div class="pi" style="background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)">${icon('sparkle')}</div>${esc(r)}</div>`).join('')}` : `<div class="card" style="background:color-mix(in srgb,var(--good) 8%,transparent);border-color:transparent;margin-top:18px">${icon('check')} <b style="font-family:Space Grotesk">On track across all signals</b></div>`}
      </div>`;
    d.classList.add('show'); showOverlay(); animateSig(d);
    d.querySelector('[data-close]').onclick = closeOverlay;
  }

  /* ---------- new cohort modal ---------- */
  function openNewCohort() {
    ensureOverlay(); const m = $('#modal');
    m.innerHTML = `<div class="modal-body"><div class="between" style="margin-bottom:18px"><h3 style="font-size:1.2rem">New cohort</h3><button class="icon-btn" data-close="1">${icon('x')}</button></div>
      <div class="field"><label>Cohort name</label><input id="ncName" placeholder="e.g. Batch 10"></div>
      <div class="field"><label>Track</label><select id="ncTrack"><option>Full-Stack Development</option><option>Digital Marketing</option><option>Data Analytics</option><option>UI/UX Design</option><option>Cloud & DevOps</option></select></div>
      <button class="btn btn-primary" id="ncSave" style="width:100%;justify-content:center">Create cohort</button></div>`;
    m.classList.add('show'); showOverlay();
    m.querySelector('[data-close]').onclick = closeOverlay;
    m.querySelector('#ncSave').onclick = () => {
      const name = $('#ncName').value.trim() || 'Batch ' + (DB.cohorts().length + 1);
      DB.addCohort(name, $('#ncTrack').value); closeOverlay(); toast('Cohort “' + name + '” created'); render();
    };
  }

  /* ---------- process session modal (pipeline) ---------- */
  function openProcess() {
    ensureOverlay(); const m = $('#modal');
    const cohorts = DB.cohorts();
    m.innerHTML = `<div class="modal-body"><div class="between" style="margin-bottom:18px"><h3 style="font-size:1.2rem">Process a session</h3><button class="icon-btn" data-close="1">${icon('x')}</button></div>
      <div class="field"><label>Session title</label><input id="psTitle" placeholder="e.g. Async JS & Promises"></div>
      <div class="field"><label>Cohort</label><select id="psCohort">${cohorts.map(c => `<option value="${c.id}" ${c.id === S.instructorCohort ? 'selected' : ''}>${c.name} — ${c.track}</option>`).join('')}</select></div>
      <div id="psPipe"></div>
      <button class="btn btn-primary" id="psRun" style="width:100%;justify-content:center;margin-top:6px">${icon('sparkle')} Ingest & auto-generate</button></div>`;
    m.classList.add('show'); showOverlay();
    m.querySelector('[data-close]').onclick = closeOverlay;
    m.querySelector('#psRun').onclick = runPipeline;
  }
  function runPipeline() {
    const title = $('#psTitle').value.trim() || 'Untitled session';
    const cohortId = $('#psCohort').value;
    const steps = ['Ingesting recording', 'Transcribing audio', 'Generating tiered summary', 'Building the quiz', 'Creating applied assignment', 'Clipping revision bytes', 'Updating Job Readiness'];
    const icons = ['video', 'filetext', 'filetext', 'help', 'clipcheck', 'clap', 'target'];
    $('#psRun').style.display = 'none'; $('#psTitle').disabled = $('#psCohort').disabled = true;
    const host = $('#psPipe');
    host.innerHTML = `<div class="pipeline">${steps.map((s, i) => `<div class="pstep" id="ps${i}"><div class="pi">${icon(icons[i])}</div>${s}</div>`).join('')}</div>`;
    let i = 0;
    const tick = () => {
      if (i > 0) { const p = $('#ps' + (i - 1)); p.classList.remove('run'); p.classList.add('done'); p.querySelector('.pi').innerHTML = icon('check'); }
      if (i >= steps.length) { DB.addSession(cohortId, title); closeOverlay(); toast('Session processed — artifacts generated'); render(); return; }
      $('#ps' + i).classList.add('run'); i++; setTimeout(tick, 620);
    };
    tick();
  }

  /* ---------- grading ---------- */
  function renderGrading() {
    const q = DB.grading();
    if (!q.length) { $('#content').innerHTML = `<div class="card fade"><div class="empty">${icon('check')}<div style="margin-top:8px">All caught up — nothing to grade.</div></div></div>`; return; }
    $('#content').innerHTML = `<div class="grid fade" style="gap:14px">${q.map(g => {
      const s = g.student; const se = DB.sessions().find(x => x.id === g.sessionId) || {};
      return `<div class="card" data-g="${g.id}"><div class="between"><div class="who">${avatar(s.name)}<div><b>${esc(s.name)}</b><span>${esc(se.title || '')}</span></div></div><span class="faint" style="font-size:.76rem">Submitted ${g.submitted}</span></div>
        <p class="muted" style="margin:14px 0 10px;font-size:.9rem"><b style="font-family:Space Grotesk;color:var(--text)">Task:</b> ${esc(g.task)}</p>
        <div class="between" style="background:var(--surface-2);border:1px solid var(--line-2);border-radius:var(--r-sm);padding:12px 14px">
          <div><span class="faint mono" style="font-size:.62rem;text-transform:uppercase;letter-spacing:.07em">AI rubric first-pass</span><div style="font-family:Space Grotesk;font-size:1.4rem;font-weight:700">${g.ai}<span class="faint" style="font-size:.9rem">/100</span></div></div>
          <div class="row" style="align-items:center;gap:10px">
            <span class="faint" style="font-size:.82rem">Your score</span>
            <input type="number" min="0" max="100" value="${g.ai}" class="field" style="width:80px;padding:8px" id="gv-${g.id}">
            <button class="btn btn-primary btn-sm" data-approve="${g.id}">${icon('check')} Approve</button>
          </div>
        </div></div>`;
    }).join('')}</div>`;
    $('#content').querySelectorAll('[data-approve]').forEach(b => b.onclick = () => {
      const id = b.dataset.approve; const v = Math.max(0, Math.min(100, +$('#gv-' + id).value || 0));
      DB.gradeAssignment(id, v); toast('Graded — student’s readiness updated'); render();
    });
  }

  /* ---------- student quiz ---------- */
  const QUIZ = [
    { q: 'In React, when should you reach for useReducer over useState?', opts: ['When state is a single boolean', 'When next state depends on complex, multi-field logic', 'Only in class components', 'Never — useState always suffices'], correct: 1, why: 'useReducer shines when state transitions are complex or interdependent — it centralises the logic in one reducer.' },
    { q: 'What does a REST API returning 401 usually mean?', opts: ['Server error', 'Resource not found', 'Authentication is missing or invalid', 'Rate limit exceeded'], correct: 2, why: '401 Unauthorized means the request lacks valid authentication credentials.' },
    { q: 'A JWT should NOT store:', opts: ['A user id', 'An expiry (exp) claim', 'A plaintext password', 'An issued-at (iat) claim'], correct: 2, why: 'JWTs are base64-encoded, not encrypted — never put secrets like passwords in the payload.' },
  ];
  function renderQuiz() {
    let qi = 0, score = 0;
    $('#content').innerHTML = `<div class="card fade" style="max-width:720px"><div style="height:6px;background:var(--bg-tint);border-radius:99px;overflow:hidden;margin-bottom:20px"><div id="qbar" style="height:100%;background:var(--grad);width:0;transition:.5s"></div></div><div id="qhost"></div></div>`;
    const bar = $('#qbar'), host = $('#qhost');
    const draw = () => {
      if (qi >= QUIZ.length) {
        const pct = Math.round(score / QUIZ.length * 100); bar.style.width = '100%';
        host.innerHTML = `<div style="text-align:center;padding:16px 0"><div style="width:60px;height:60px;border-radius:16px;margin:0 auto;display:grid;place-items:center;background:${pct >= 67 ? 'color-mix(in srgb,var(--good) 15%,transparent)' : 'var(--bg-tint)'};color:${pct >= 67 ? 'var(--good)' : 'var(--brand-ink)'}">${icon(pct >= 67 ? 'check' : 'filetext', '')}</div>
          <h3 style="margin:14px 0 4px">You scored ${score}/${QUIZ.length} · ${pct}%</h3><p class="muted" style="font-size:.9rem">This feeds straight into your concept-mastery signal and Job Readiness Score.</p>
          <button class="btn btn-ghost btn-sm" id="qretry" style="margin-top:8px">${icon('sparkle')} Retry</button></div>`;
        host.querySelector('#qretry').onclick = () => { qi = 0; score = 0; draw(); };
        host.querySelectorAll('.ico').forEach(i => i.style.width = i.style.height = '30px');
        return;
      }
      const it = QUIZ[qi]; bar.style.width = (qi / QUIZ.length * 100) + '%';
      host.innerHTML = `<div style="font-family:Space Grotesk;font-weight:600;font-size:1.1rem;margin-bottom:16px">Q${qi + 1}. ${it.q}</div>
        <div id="opts">${it.opts.map((o, k) => `<div class="pstep" data-k="${k}" style="cursor:pointer;margin-bottom:10px"><div class="pi" style="background:var(--bg-tint)">${'ABCD'[k]}</div>${esc(o)}</div>`).join('')}</div><div id="qfb"></div>`;
      let answered = false;
      host.querySelectorAll('[data-k]').forEach(opt => opt.onclick = () => {
        if (answered) return; answered = true; const k = +opt.dataset.k;
        host.querySelectorAll('[data-k]').forEach(o => { const kk = +o.dataset.k;
          if (kk === it.correct) { o.style.borderColor = 'var(--good)'; o.querySelector('.pi').style.background = 'var(--good)'; o.querySelector('.pi').style.color = '#fff'; }
          else if (kk === k) { o.style.borderColor = 'var(--bad)'; o.querySelector('.pi').style.background = 'var(--bad)'; o.querySelector('.pi').style.color = '#fff'; } });
        if (k === it.correct) score++;
        $('#qfb').innerHTML = `<div class="card" style="background:var(--surface-2);margin-top:6px"><b style="font-family:Space Grotesk;color:${k === it.correct ? 'var(--good)' : 'var(--bad)'}">${k === it.correct ? '✓ Correct.' : '✗ Not quite.'}</b> <span class="muted">${it.why}</span><div style="margin-top:12px"><button class="btn btn-primary btn-sm" id="qnext">${qi === QUIZ.length - 1 ? 'See results' : 'Next question'} ${icon('arrow')}</button></div></div>`;
        $('#qnext').onclick = () => { qi++; draw(); };
      });
    };
    draw();
  }

  /* ---------- overlay plumbing ---------- */
  function ensureOverlay() {
    if ($('#overlay')) return;
    const o = document.createElement('div'); o.id = 'overlay'; o.className = 'overlay';
    const d = document.createElement('div'); d.id = 'drawer'; d.className = 'drawer';
    const m = document.createElement('div'); m.id = 'modal'; m.className = 'modal';
    document.body.append(o, d, m); o.onclick = closeOverlay;
  }
  function showOverlay() { $('#overlay').classList.add('show'); }
  function closeOverlay() {
    ['#overlay', '#drawer', '#modal'].forEach(s => { const e = $(s); if (e) e.classList.remove('show'); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

  /* ---------- boot ---------- */
  initTheme();
  render();
})();
