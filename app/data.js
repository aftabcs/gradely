/* ============================================================
   Gradely — Demo data store (fully simulated, client-side)
   Persists to localStorage so edits survive during a demo.
   "Reset demo" in Settings clears it back to seed.
   ============================================================ */
(function (global) {
  const LS_KEY = 'gradely-demo-db-v1';

  /* ---- readiness model ---- */
  // Weighted: concept mastery 30, applied skills 30, consistency 20, interview 20
  function readiness(s) {
    return Math.round(0.3 * s.quiz + 0.3 * s.assignment + 0.2 * s.engagement + 0.2 * s.interview);
  }
  function statusOf(r) {
    if (r >= 75) return 'ready';
    if (r >= 60) return 'ontrack';
    return 'risk';
  }
  function riskReasons(s) {
    const out = [];
    if (s.quiz < 65) out.push('Quiz scores below bar');
    if (s.assignment < 60) out.push('Assignments weak / missing');
    if (s.engagement < 55) out.push('Low engagement');
    if (s.interview < 60) out.push('Interview prep behind');
    if (!s.mentor) out.push('No mentor-approved work yet');
    return out;
  }

  /* ---- seed ---- */
  function seed() {
    const cohorts = [
      { id: 'c07', name: 'Batch 07', track: 'Full-Stack Development', start: '2026-06-02', color: '#5b53f0' },
      { id: 'c05', name: 'Batch 05', track: 'Digital Marketing', start: '2026-05-05', color: '#12a8bd' },
      { id: 'c09', name: 'Batch 09', track: 'Data Analytics', start: '2026-07-14', color: '#ff6a4d' },
    ];

    const raw = [
      // Batch 07 — Full-Stack
      ['Aisha Khan', 'c07', 88, 79, 74, 85, true],
      ['Rohan Mehta', 'c07', 85, 88, 80, 78, true],
      ['Meera Sharma', 'c07', 74, 70, 62, 66, false],
      ['Karan Patel', 'c07', 88, 84, 81, 80, true],
      ['Dev Anand', 'c07', 66, 58, 48, 55, false],
      ['Nisha Rao', 'c07', 90, 92, 88, 86, true],
      ['Rahul Verma', 'c07', 58, 45, 34, 40, false],
      ['Tara Joshi', 'c07', 79, 82, 60, 72, false],
      // Batch 05 — Digital Marketing
      ['Priya Nair', 'c05', 86, 84, 82, 80, true],
      ['Arjun Reddy', 'c05', 72, 68, 60, 64, false],
      ['Sana Sheikh', 'c05', 90, 88, 85, 88, true],
      ['Vikram Singh', 'c05', 60, 52, 44, 50, false],
      ['Ananya Das', 'c05', 78, 80, 70, 74, true],
      ['Farhan Ali', 'c05', 68, 62, 55, 58, false],
      // Batch 09 — Data Analytics
      ['Kabir Malhotra', 'c09', 88, 90, 84, 86, true],
      ['Ishita Gupta', 'c09', 82, 78, 76, 80, true],
      ['Neha Kulkarni', 'c09', 70, 66, 58, 62, false],
      ['Aditya Bose', 'c09', 64, 55, 50, 52, false],
      ['Riya Kapoor', 'c09', 91, 89, 90, 88, true],
      ['Zoya Khan', 'c09', 76, 72, 68, 70, true],
      ['Manav Shah', 'c09', 58, 48, 40, 45, false],
    ];
    const students = raw.map((r, i) => ({
      id: 's' + (i + 1),
      name: r[0], cohortId: r[1],
      quiz: r[2], assignment: r[3], engagement: r[4], interview: r[5], mentor: r[6],
    }));

    const sessions = [
      { id: 'se1', cohortId: 'c07', title: 'React State & Hooks Deep-Dive', date: '2026-08-24', duration: 82, status: 'processed', quizQs: 8, bytes: 5, avgQuiz: 82 },
      { id: 'se2', cohortId: 'c07', title: 'Designing REST APIs', date: '2026-08-21', duration: 76, status: 'processed', quizQs: 7, bytes: 4, avgQuiz: 78 },
      { id: 'se3', cohortId: 'c07', title: 'Auth, Sessions & JWT', date: '2026-08-19', duration: 69, status: 'processed', quizQs: 6, bytes: 4, avgQuiz: 74 },
      { id: 'se4', cohortId: 'c05', title: 'Performance Marketing & ROAS', date: '2026-08-23', duration: 74, status: 'processed', quizQs: 8, bytes: 5, avgQuiz: 80 },
      { id: 'se5', cohortId: 'c05', title: 'Landing Pages that Convert', date: '2026-08-20', duration: 65, status: 'processed', quizQs: 6, bytes: 3, avgQuiz: 76 },
      { id: 'se6', cohortId: 'c09', title: 'SQL Joins & Window Functions', date: '2026-08-22', duration: 88, status: 'processed', quizQs: 9, bytes: 6, avgQuiz: 79 },
      { id: 'se7', cohortId: 'c09', title: 'Dashboards with Pivot Tables', date: '2026-08-18', duration: 71, status: 'processing', quizQs: 0, bytes: 0, avgQuiz: 0 },
    ];

    const companies = [
      { id: 'co1', name: 'Acme Corp', role: 'Frontend Engineer', minQuiz: 80, minAssign: 75, minEng: 70, mentor: true },
      { id: 'co2', name: 'TechNova', role: 'Full-Stack Developer', minQuiz: 70, minAssign: 65, minEng: 50, mentor: false },
      { id: 'co3', name: 'FinEdge', role: 'Data Analyst', minQuiz: 85, minAssign: 80, minEng: 80, mentor: true },
    ];

    // Grading queue — pending assignments for instructor
    const grading = [
      { id: 'g1', studentId: 's3', sessionId: 'se1', task: 'Build a todo app with useReducer', submitted: '2026-08-25', ai: 72 },
      { id: 'g2', studentId: 's5', sessionId: 'se2', task: 'Design a REST API for a blog', submitted: '2026-08-25', ai: 61 },
      { id: 'g3', studentId: 's7', sessionId: 'se3', task: 'Implement JWT refresh flow', submitted: '2026-08-24', ai: 48 },
      { id: 'g4', studentId: 's8', sessionId: 'se1', task: 'Build a todo app with useReducer', submitted: '2026-08-26', ai: 80 },
    ];

    return { cohorts, students, sessions, companies, grading, seededAt: '2026-08-26' };
  }

  /* ---- persistence ---- */
  function load() {
    try {
      const s = global.localStorage.getItem(LS_KEY);
      if (s) return JSON.parse(s);
    } catch (e) { /* ignore */ }
    return seed();
  }
  function save() {
    try { global.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function reset() {
    try { global.localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
    state = seed();
    save();
    return state;
  }

  let state = load();

  /* ---- query helpers (always recompute derived fields) ---- */
  function decorate(s) {
    const r = readiness(s);
    return Object.assign({}, s, { readiness: r, status: statusOf(r), reasons: riskReasons(s) });
  }
  const API = {
    raw: () => state,
    save, reset,
    cohorts: () => state.cohorts.slice(),
    cohort: (id) => state.cohorts.find(c => c.id === id),
    students: (cohortId) => state.students.filter(s => !cohortId || s.cohortId === cohortId).map(decorate),
    student: (id) => { const s = state.students.find(x => x.id === id); return s ? decorate(s) : null; },
    sessions: (cohortId) => state.sessions.filter(s => !cohortId || s.cohortId === cohortId).slice(),
    companies: () => state.companies.slice(),
    grading: () => state.grading.map(g => Object.assign({}, g, { student: decorate(state.students.find(s => s.id === g.studentId)) })),
    readiness, statusOf,

    // Eligibility: who clears a company's bar
    eligible: (company, cohortId) =>
      API.students(cohortId).filter(s =>
        s.quiz >= company.minQuiz && s.assignment >= company.minAssign &&
        s.engagement >= company.minEng && (!company.mentor || s.mentor)),

    // ---- mutations ----
    addCohort: (name, track) => {
      const id = 'c' + Math.floor(state.cohorts.length * 7 + 11);
      state.cohorts.push({ id, name, track, start: '2026-08-26', color: '#7a5cf5' });
      save(); return id;
    },
    addSession: (cohortId, title) => {
      const id = 'se' + (state.sessions.length + 1);
      state.sessions.unshift({ id, cohortId, title, date: '2026-08-26', duration: 60 + Math.round(state.sessions.length * 3), status: 'processed', quizQs: 6 + (state.sessions.length % 4), bytes: 3 + (state.sessions.length % 3), avgQuiz: 74 + (state.sessions.length % 9) });
      save(); return id;
    },
    gradeAssignment: (gradingId, score) => {
      const g = state.grading.find(x => x.id === gradingId);
      if (!g) return;
      const st = state.students.find(s => s.id === g.studentId);
      if (st) { st.assignment = score; st.mentor = true; }
      state.grading = state.grading.filter(x => x.id !== gradingId);
      save();
    },
    setCompanyCriteria: (id, patch) => {
      const c = state.companies.find(x => x.id === id);
      if (c) Object.assign(c, patch);
      save();
    },
  };

  global.DB = API;
})(window);
