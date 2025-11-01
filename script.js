/* ==========================================================
   Study Quest Tracker — Apple Edition (All Features)
   - XP + Level, Streaks, Heatmap, Backup/Restore
   - Achievements, Next Best Chapter, Focus Mode + Timer
   - Subtle animated gradient background (Sonoma style)
   ========================================================== */

/* ------------------ Syllabus Data ------------------ */
function loadData() {
  return JSON.parse(localStorage.getItem("trackerData") || "[]");
}
const subjects = [
  {
    name: "English",
    children: [
      {
        name: "English – First Flight",
        chapters: [
          "A Letter to God","Nelson Mandela: Long Walk to Freedom",
          "Two Stories about Flying","From the Diary of Anne Frank",
          "Glimpses of India","Mijbil the Otter","Madam Rides the Bus",
          "The Sermon at Benares","The Proposal (Play)",
          "Dust of Snow","Fire and Ice","A Tiger in the Zoo",
          "How to Tell Wild Animals","The Ball Poem","Amanda!","The Trees",
          "Fog","The Tale of Custard the Dragon","For Anne Gregory"
        ]
      },
      {
        name: "English – Footprints Without Feet",
        chapters: [
          "A Triumph of Surgery","The Thief’s Story","The Midnight Visitor",
          "A Question of Trust","Footprints Without Feet",
          "The Making of a Scientist","The Necklace","Bholi",
          "The Book That Saved the Earth"
        ]
      }
    ]
  },
  {
    name: "Hindi (Course B)",
    chapters: [
      "मीरा के पद","आत्मत्राण","हरिहर काका","बड़े भाई साहब",
      "अब कहाँ दूसरे के दुख से दुखी होने वाले","बालगोबिन भगत",
      "सानेट – सहृदयता","उत्साह और अभिनवता"
    ]
  },
  {
    name: "Mathematics",
    chapters: [
      "Real Numbers","Polynomials","Pair of Linear Equations in Two Variables",
      "Quadratic Equations","Arithmetic Progressions","Triangles",
      "Coordinate Geometry","Introduction to Trigonometry",
      "Applications of Trigonometry","Circles","Constructions",
      "Areas Related to Circles","Surface Areas and Volumes",
      "Statistics","Probability"
    ]
  },
  {
    name: "Science",
    children: [
      { name: "Physics", chapters: ["Light – Reflection and Refraction","The Human Eye and the Colourful World","Electricity","Magnetic Effects of Electric Current"] },
      { name: "Chemistry", chapters: ["Chemical Reactions and Equations","Acids, Bases and Salts","Metals and Non-Metals","Carbon and Its Compounds"] },
      { name: "Biology", chapters: ["Life Processes","Control and Coordination","How Do Organisms Reproduce","Heredity and Evolution","Our Environment","Management of Natural Resources"] }
    ]
  },
  {
    name: "Social Science",
    children: [
      { name: "History", chapters: ["The Rise of Nationalism in Europe","Nationalism in India","The Making of a Global World","The Age of Industrialization","Print Culture and the Modern World"] },
      { name: "Geography", chapters: ["Resources and Development","Forest and Wildlife Resources","Water Resources","Agriculture","Minerals and Energy Resources","Manufacturing Industries","Lifelines of National Economy"] },
      { name: "Political Science", chapters: ["Power Sharing","Federalism","Gender, Religion and Caste","Political Parties","Outcomes of Democracy"] },
      { name: "Economics", chapters: ["Development","Sectors of the Indian Economy","Money and Credit","Globalisation and the Indian Economy","Consumer Rights (Project Work)"] }
    ]
  },
  {
    name: "Information Technology",
    chapters: [
      "Digital Documentation (Advanced)","Electronic Spreadsheet (Advanced)",
      "Database Management System","Web Applications and Security"
    ]
  }
];

const quotes = [
  "Discipline outlasts motivation.",
  "Small steps make big climbs.",
  "Focus on progress, not perfection.",
  "One chapter a day keeps failure away.",
  "Consistency beats intensity.",
  "Dreams don't work unless you do.",
  "Every checkbox is a step closer."
];

/* ------------------ State ------------------ */
let tracker = loadData();
let streakData = JSON.parse(localStorage.getItem("streakData") || '{"streak":0,"lastAction":""}');
let totalXP = parseInt(localStorage.getItem('totalXP') || '0');
let level = Math.floor(totalXP / 100) + 1;

const today = new Date().toISOString().slice(0,10);

/* ------------------ Utils ------------------ */
function slug(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
function ensureTrackerFor(id, len){
  if (!tracker[id]) tracker[id] = { done: Array(len).fill(false) };
  if (tracker[id].done.length !== len) {
    const old = tracker[id].done.slice(0, len);
    tracker[id].done = [...old, ...Array(Math.max(0, len-old.length)).fill(false)];
  }
}
function countDone(arr){ return arr.filter(Boolean).length; }
function setDailyQuote(){
  const el = document.getElementById('dailyQuote');
  if (!el) return;
  const d = new Date();
  const idx = (d.getFullYear()*372 + (d.getMonth()+1)*31 + d.getDate()) % quotes.length;
  el.textContent = quotes[idx];
}
function showToast(text){
  const t = document.createElement('div');
  t.textContent = text;
  Object.assign(t.style, {
    position:'fixed',left:'50%',bottom:'28px',transform:'translateX(-50%)',
    background:'linear-gradient(90deg, rgba(138,180,248,.18), rgba(203,166,247,.18))',
    color:'#fff',padding:'10px 16px',borderRadius:'16px',
    border:'1px solid rgba(255,255,255,.18)',boxShadow:'0 10px 30px rgba(0,0,0,.35)',
    backdropFilter:'blur(12px)',zIndex:48,opacity:'0',transition:'opacity .25s, transform .25s'
  });
  document.body.appendChild(t);
  requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(-4px)'; });
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; }, 1800);
  setTimeout(()=> t.remove(), 2200);
}

/* ------------------ Confetti + Sound ------------------ */
let confetti;
window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [], running = false, raf;
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();
  function spawn(n=160){
    for(let i=0;i<n;i++){
      particles.push({
        x: Math.random()*W, y: -20 - Math.random()*60,
        vx: (Math.random()-0.5)*0.8, vy: 1+Math.random()*1.8,
        s: 4+Math.random()*4, a: 1,
        c: `hsl(${200+Math.random()*60} 90% 70%)`, r: Math.random()*Math.PI
      });
    }
  }
  function tick(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      p.vy += 0.01; p.x += p.vx; p.y += p.vy; p.r += 0.03; p.a *= 0.996;
      ctx.save(); ctx.globalAlpha = Math.max(0,p.a);
      ctx.translate(p.x,p.y); ctx.rotate(p.r);
      ctx.fillStyle=p.c; ctx.fillRect(-p.s*0.6,-p.s*0.6,p.s,p.s*0.6);
      ctx.restore();
    });
    particles = particles.filter(p=>p.a>0.02 && p.y<H+40);
    if(particles.length===0){ running=false; cancelAnimationFrame(raf); return; }
    raf=requestAnimationFrame(tick);
  }
  function burst(){ spawn(160); if(!running){ running=true; tick(); } }
  confetti = { burst };
});
function playSuccessSound(){ const a = new Audio("success.mp3"); a.volume=0.8; a.play().catch(()=>{}); }

/* ------------------ Streaks ------------------ */
function todayKey(){ return new Date().toISOString().slice(0,10); }
function yesterdayKey(){ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }
function updateStreakLabel(){
  const lbl=document.getElementById("streakLabel");
  if (!lbl) return;
  lbl.textContent=`🔥 STREAK: ${streakData.streak} day${streakData.streak===1?'':'s'}`;
  if (streakData.streak>=5) lbl.classList.add('hot'); else lbl.classList.remove('hot');
  lbl.title = streakData.streak ? `${streakData.streak} day streak — keep it going!` : 'Start your streak today!';
}
function bumpStreakIfNeeded(){
  const t=todayKey(), y=yesterdayKey();
  if (streakData.lastAction === t) return;
  if (streakData.lastAction === y) streakData.streak += 1; else streakData.streak = 1;
  streakData.lastAction = t;
  localStorage.setItem('streakData', JSON.stringify(streakData));
  updateStreakLabel();
}

/* ------------------ XP ------------------ */
function gainXP(amount=10){
  totalXP += amount;
  if (totalXP < 0) totalXP = 0;
  localStorage.setItem('totalXP', totalXP);
  level = Math.floor(totalXP / 100) + 1;
  refreshXPDisplay();
  if (totalXP % 100 === 0) { confetti?.burst(); playSuccessSound(); showToast(`🏅 Level Up! Level ${level}`); }
}
function refreshXPDisplay(){
  const xpNum = document.getElementById('xpNum');
  const levelNum = document.getElementById('levelNum');
  const xpFill = document.getElementById('xpFill');
  if (xpNum) xpNum.textContent = totalXP;
  if (levelNum) levelNum.textContent = level;
  if (xpFill) xpFill.style.width = `${(totalXP % 100)}%`;
}

/* ------------------ Heatmap ------------------ */
function getStudyDays(){ return JSON.parse(localStorage.getItem('studyDays') || '[]'); }
function setStudyDayToday(){
  const days = getStudyDays();
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem('studyDays', JSON.stringify(days));
  }
}
function buildHeatmap(daysWindow=30){
  const host = document.getElementById('heatmap');
  if (!host) return;
  host.innerHTML = '';
  const days = getStudyDays();
  const now = new Date();
  for (let i = daysWindow-1; i>=0; i--){
    const d = new Date(now); d.setDate(now.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const cell = document.createElement('div');
    const active = days.includes(key);
    cell.className = 'heat-cell';
    cell.title = key + (active ? ' ✓ studied' : '');
    if (active) cell.classList.add('heat-4');
    host.appendChild(cell);
  }
}

/* ------------------ Animated Background (Pastel) ------------------ */
(function pastelGradientLooper(){
  const style = document.createElement('style');
  style.textContent = `
    body::before{
      content:""; position:fixed; inset:-20%;
      background: conic-gradient(from 0deg at 50% 50%, rgba(139,178,255,0.18), rgba(203,166,247,0.18), rgba(139,178,255,0.18));
      filter: blur(60px); z-index:-1; animation: hueRoll 22s linear infinite;
    }
    @keyframes hueRoll{ from{ filter:hue-rotate(0deg) blur(60px);} to{ filter:hue-rotate(360deg) blur(60px);} }
  `;
  document.head.appendChild(style);
})();

/* ------------------ Milestones ------------------ */
const MILESTONES = [25, 50, 75, 100];
function getHitMilestones(){ try { return new Set(JSON.parse(localStorage.getItem('milestones_hit')||'[]')); } catch { return new Set(); } }
function setHitMilestones(s){ localStorage.setItem('milestones_hit', JSON.stringify(Array.from(s))); }
function maybeFireMilestone(overall){
  const hit = getHitMilestones();
  for (const m of MILESTONES){
    if (overall>=m && !hit.has(m)){
      hit.add(m); setHitMilestones(hit);
      confetti?.burst(); playSuccessSound();
      const msg = m===100 ? "🏆 Quest Complete! 100%" :
                 m===75  ? "🔥 Almost There! 75%" :
                 m===50  ? "⭐ Halfway There! 50%" : "⚡ Good Momentum! 25%";
      showToast(msg);
      maybeUnlockAchievement('model_mastery', "🏆 Model Mastery", "Completed the entire quest");
    }
  }
}

/* ------------------ Rendering ------------------ */
function render(){
  ensureInsightsPanel(); // creates insights, badges, next-focus, focus toggle

  const container = document.getElementById('tracker');
  container.innerHTML = '';

  let totalOverall = 0, doneOverall = 0;

  subjects.forEach((subj, idx) => {
    const node = renderSubject(subj, idx);
    container.appendChild(node.el);
    totalOverall += node.total;
    doneOverall += node.done;
  });

  const pct = totalOverall ? (doneOverall/totalOverall)*100 : 0;
  const bar = document.getElementById('overall-progress');
  const label = document.getElementById('overall-label');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${Math.round(pct)}%`;
  maybeFireMilestone(Math.round(pct));

  updateParentSubjects();
  updateProgress();          // persist + recompute
  refreshXPDisplay();
  buildHeatmap(30);
  updateMotivationalLine();
  renderNextBestCard();
  renderBadgesRow();
}

/* -------- Subject Cards -------- */
function renderSubject(subject, tIndex){
  const hasChildren = Array.isArray(subject.children);
  let total = 0, done = 0;

  if (hasChildren) {
    subject.children.forEach(child => {
      const id = slug(child.name);
      ensureTrackerFor(id, child.chapters.length);
      total += child.chapters.length;
      done  += countDone(tracker[id].done);
    });
  } else {
    const id = slug(subject.name);
    ensureTrackerFor(id, subject.chapters.length);
    total += subject.chapters.length;
    done  += countDone(tracker[id].done);
  }

  const percent = total ? Math.round((done/total)*100) : 0;

  const card = document.createElement('div');
  card.className = 'subject card' + (percent>=100 ? ' completed' : '');
  card.dataset.parentId = slug(subject.name);

  const targetId = `parent-${tIndex}`;
  card.innerHTML = `
    <div class="head" data-target="${targetId}">
      <div class="left">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <strong>${subject.name}</strong>
      </div>
      <div class="mono">${percent}%</div>
    </div>
    <div class="progress" style="margin:.6rem 0 .4rem;">
      <div class="progress-bar" style="width:${percent}%;"></div>
      <div class="progress-label">${percent}%</div>
    </div>
    <div class="chapter-list" id="${targetId}"></div>
  `;

  const head = card.querySelector('.head');
  const list = card.querySelector('.chapter-list');
  head.onclick = (e) => toggleCollapse(card, list, e);

  if (hasChildren) {
    subject.children.forEach(child => list.appendChild(renderChildSubject(child)));
  } else {
    list.appendChild(renderLeafChapters(subject));
  }

  return { el: card, total, done };
}

function toggleCollapse(card, list, event){
  if (event) event.stopPropagation();
  const isOpen = card.classList.contains('open');
  if (!isOpen) {
    card.classList.add('open');
    list.style.maxHeight = list.scrollHeight + 'px';
    list.style.opacity = '1';
    if (focusMode.on) focusMode.setActive(card);
  } else {
    list.style.maxHeight = list.scrollHeight + 'px';
    requestAnimationFrame(()=>{
      list.style.maxHeight = '0px';
      list.style.opacity = '0';
      card.classList.remove('open');
    });
  }
  const parent = card.closest('.chapter-list');
  if (parent) parent.style.maxHeight = '2000px';
}

/* -------- Child + Leaf -------- */
function renderChildSubject(child){
  const id = slug(child.name);
  ensureTrackerFor(id, child.chapters.length);

  const total = child.chapters.length;
  const done = countDone(tracker[id].done);
  const percent = total ? Math.round((done/total)*100) : 0;

  const wrap = document.createElement('div');
  wrap.className = 'subject';
  const childTarget = `${id}-chapters`;

  wrap.innerHTML = `
    <div class="head" data-target="${childTarget}">
      <div class="left">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <strong>${child.name}</strong>
      </div>
      <div class="mono">${percent}%</div>
    </div>
    <div class="progress" style="margin:.6rem 0 .4rem;">
      <div class="progress-bar" style="width:${percent}%;"></div>
      <div class="progress-label">${percent}%</div>
    </div>
    <div class="chapter-list" id="${childTarget}">
      ${child.chapters.map((title,i)=>`
        <div class="chapter">
          <input type="checkbox" id="${id}-${i}" ${tracker[id].done[i]?'checked':''}>
          <label for="${id}-${i}">${title}</label>
        </div>
      `).join('')}
    </div>
  `;

  const head = wrap.querySelector('.head');
  const list = wrap.querySelector('.chapter-list');
  head.onclick = (e) => toggleCollapse(wrap, list, e);

  // checkbox handlers
  wrap.querySelectorAll('input[type="checkbox"]').forEach(box=>{
    box.onchange = () => {
      const [, idx] = box.id.split('-');
      const wasChecked = tracker[id].done[+idx] === true;
      tracker[id].done[+idx] = box.checked;
      localStorage.setItem('trackerData', JSON.stringify(tracker));

      if (box.checked && !wasChecked) {
        bumpStreakIfNeeded();
        setStudyDayToday();
        gainXP(10);
        // Night Owl badge
        const now = new Date();
        if (now.getHours() >= 22) maybeUnlockAchievement('night_owl', '🌙 Night Owl', 'Studied after 10 PM');
      }

      const nowDone = countDone(tracker[id].done);
      if (nowDone === child.chapters.length) {
        confetti?.burst(); playSuccessSound();
        showToast(`✅ Completed: ${child.name}`);
        maybeUnlockAchievement('perfectionist', '🔥 Perfectionist', '100% in a subject');
      }

      updateSubjectProgress(id);
      updateParentSubjects();
      updateProgress();
      refreshXPDisplay();
      buildHeatmap(30);
      updateMotivationalLine();
      renderNextBestCard();
      renderBadgesRow();
      maybeCheckChapterCrusher();
    };
  });

  return wrap;
}

function renderLeafChapters(subject){
  const id = slug(subject.name);
  ensureTrackerFor(id, subject.chapters.length);

  const total = subject.chapters.length;
  const done = countDone(tracker[id].done);
  const percent = total ? Math.round((done/total)*100) : 0;

  const wrap = document.createElement('div');
  wrap.className = 'subject';
  const target = `${id}-chapters`;

  wrap.innerHTML = `
    <div class="head" data-target="${target}">
      <div class="left">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <strong>${subject.name}</strong>
      </div>
      <div class="mono">${percent}%</div>
    </div>
    <div class="progress" style="margin:.6rem 0 .4rem;">
      <div class="progress-bar" style="width:${percent}%;"></div>
      <div class="progress-label">${percent}%</div>
    </div>
    <div class="chapter-list" id="${target}">
      ${subject.chapters.map((title,i)=>`
        <div class="chapter">
          <input type="checkbox" id="${id}-${i}" ${tracker[id].done[i]?'checked':''}>
          <label for="${id}-${i}">${title}</label>
        </div>
      `).join('')}
    </div>
  `;

  const head = wrap.querySelector('.head');
  const list = wrap.querySelector('.chapter-list');
  head.onclick = (e) => toggleCollapse(wrap, list, e);

  wrap.querySelectorAll('input[type="checkbox"]').forEach(box=>{
    box.onchange = () => {
      const [, idx] = box.id.split('-');
      const wasChecked = tracker[id].done[+idx] === true;
      tracker[id].done[+idx] = box.checked;
      localStorage.setItem('trackerData', JSON.stringify(tracker));

      if (box.checked && !wasChecked) {
        bumpStreakIfNeeded();
        setStudyDayToday();
        gainXP(10);
        const now = new Date();
        if (now.getHours() >= 22) maybeUnlockAchievement('night_owl', '🌙 Night Owl', 'Studied after 10 PM');
      }

      if (countDone(tracker[id].done) === subject.chapters.length) {
        confetti?.burst(); playSuccessSound();
        showToast(`✅ Completed: ${subject.name}`);
        maybeUnlockAchievement('perfectionist', '🔥 Perfectionist', '100% in a subject');
      }

      updateSubjectProgress(id);
      updateParentSubjects();
      updateProgress();
      refreshXPDisplay();
      buildHeatmap(30);
      updateMotivationalLine();
      renderNextBestCard();
      renderBadgesRow();
      maybeCheckChapterCrusher();
    };
  });

  return wrap;
}

/* -------- Progress Updaters -------- */
function updateSubjectProgress(id) {
  const wraps = document.querySelectorAll(`[id^="${id}-chapters"]`);
  wraps.forEach(wrap => {
    const parent = wrap.closest('.subject');
    if (!parent) return;
    const inputs = wrap.querySelectorAll('input[type="checkbox"]');
    const total = inputs.length;
    const done  = Array.from(inputs).filter(x => x.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const bar = parent.querySelector('.progress-bar');
    const label = parent.querySelector('.progress-label');
    const mono = parent.querySelector('.mono');
    if (bar) bar.style.width = `${percent}%`;
    if (label) label.textContent = `${percent}%`;
    if (mono) mono.textContent = `${percent}%`;
  });
}
function updateParentSubjects() {
  subjects.forEach(sub => {
    if (sub.children) {
      // --- For grouped subjects like English, Science, Social Science ---
      let totalChapters = 0;
      let doneChapters  = 0;
      sub.children.forEach(child => {
        const id = slug(child.name);
        if (tracker[id]?.done) {
          totalChapters += tracker[id].done.length;
          doneChapters  += tracker[id].done.filter(Boolean).length;
        }
      });
      const percent = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : 0;
      const card = document.querySelector(`[data-parent-id="${slug(sub.name)}"]`);
      if (card) {
        const bar = card.querySelector('.progress-bar');
        const label = card.querySelector('.progress-label');
        const mono = card.querySelector('.mono');
        if (bar) bar.style.width = `${percent}%`;
        if (label) label.textContent = `${percent}%`;
        if (mono) mono.textContent = `${percent}%`;
      }
    } else {
      // --- For flat subjects like Hindi, Math, IT ---
      const id = slug(sub.name);
      if (tracker[id]?.done) {
        const total = tracker[id].done.length;
        const done  = tracker[id].done.filter(Boolean).length;
        const percent = total ? Math.round((done / total) * 100) : 0;
        const card = document.querySelector(`[data-parent-id="${slug(sub.name)}"]`);
        if (card) {
          const bar = card.querySelector('.progress-bar');
          const label = card.querySelector('.progress-label');
          const mono = card.querySelector('.mono');
          if (bar) bar.style.width = `${percent}%`;
          if (label) label.textContent = `${percent}%`;
          if (mono) mono.textContent = `${percent}%`;
        }
      }
    }
  });
}
function updateProgress(){
  let totalOverall = 0, doneOverall = 0;
  subjects.flatMap(s => s.children ? s.children : [s]).forEach(sub=>{
    const id = slug(sub.name);
    if (tracker[id]?.done) {
      totalOverall += tracker[id].done.length;
      doneOverall  += tracker[id].done.filter(Boolean).length;
    }
  });
  const overall = totalOverall ? (doneOverall / totalOverall) * 100 : 0;
  const bar   = document.getElementById('overall-progress');
  const label = document.getElementById('overall-label');
  if (bar)   bar.style.width = `${overall}%`;
  if (label) label.textContent = `${Math.round(overall)}%`;
  localStorage.setItem('trackerData', JSON.stringify(tracker));
}

/* ------------------ Insights Panel (XP + Heatmap + Badges + Next Focus + Focus Mode) ------------------ */
function ensureInsightsPanel(){
  const overall = document.querySelector('.overall.card');
  if (!overall) return;
  if (document.getElementById('insightsPanel')) return;

  const panel = document.createElement('div');
  panel.id = 'insightsPanel';
  panel.className = 'card';
  panel.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;">
      <div style="flex:1;min-width:260px;">
        <div style="font-weight:600;margin-bottom:6px;">🏅 Level <span id="levelNum">1</span> — <span id="xpNum">0</span> XP</div>
        <div style="height:10px;background:var(--secondary);border-radius:999px;overflow:hidden; position:relative;">
          <div id="xpFill" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent),#8ab4f8);transition:width .4s ease;"></div>
        </div>
        <div id="motivationLine" style="margin-top:8px;opacity:.9;font-size:.95rem;"></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="focusToggle" class="secondary">🎯 Focus Mode</button>
        <button id="backupBtn" class="secondary">💾 Backup</button>
        <button id="restoreBtn" class="secondary">📂 Restore</button>
        <input type="file" id="restoreFile" accept="application/json" style="display:none;">
      </div>
    </div>
    <div style="margin-top:12px;">
      <div style="font-weight:600;margin-bottom:8px;">📅 Last 30 days</div>
      <div id="heatmap" class="heatmap"></div>
    </div>
    <div style="margin-top:12px;">
      <div style="font-weight:600;margin-bottom:8px;">🏆 Achievements</div>
      <div id="badgesRow" style="display:flex;gap:10px;flex-wrap:wrap;"></div>
    </div>
    <div style="margin-top:12px;">
      <div id="nextFocusCard"></div>
    </div>
  `;
  // minimal inline styles
  const style = document.createElement('style');
  style.textContent = `
    .heatmap{display:grid;grid-template-columns:repeat(30,1fr);gap:4px}
    .heat-cell{width:16px;height:16px;background:#2a2d3d;border-radius:3px;transition:background .3s}
    .heat-cell.heat-4{background:#8ab4f8}
    #streakLabel.hot{filter:drop-shadow(0 0 8px orange);transform:scale(1.06);transition:.3s}
    .badge{padding:.4rem .6rem;border-radius:12px;background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03));
           border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(10px);}
    .badge.new{animation:pop .35s ease;}
    @keyframes pop{from{transform:scale(.9);opacity:.3}to{transform:scale(1);opacity:1}}
    body.focus-mode .subject:not(.active-focus){opacity:.35; filter:blur(1px)}
    #focusBubble{position:fixed;top:16px;right:16px;background:rgba(0,0,0,.35);color:#fff;padding:.6rem .8rem;border-radius:14px;
      border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(10px);z-index:60;display:none}
  `;
  document.head.appendChild(style);

  overall.insertAdjacentElement('afterend', panel);

  // Wire backup/restore
  const backupBtn = panel.querySelector('#backupBtn');
  const restoreBtn = panel.querySelector('#restoreBtn');
  const restoreFile = panel.querySelector('#restoreFile');

  backupBtn.onclick = () => {
    const data = {
      tracker,
      streakData,
      totalXP,
      milestones: Array.from(getHitMilestones()),
      studyDays: getStudyDays(),
      achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
      focusMinutes: parseInt(localStorage.getItem('focusMinutes') || '0')
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study_progress_backup.json';
    a.click();
  };

  restoreBtn.onclick = () => restoreFile.click();
  restoreFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        tracker = data.tracker || {};
        streakData = data.streakData || {streak:0,lastAction:""};
        totalXP = data.totalXP || 0;
        localStorage.setItem('totalXP', totalXP);
        localStorage.setItem('trackerData', JSON.stringify(tracker));
        localStorage.setItem('streakData', JSON.stringify(streakData));
        localStorage.setItem('milestones_hit', JSON.stringify(data.milestones || []));
        localStorage.setItem('studyDays', JSON.stringify(data.studyDays || []));
        localStorage.setItem('achievements', JSON.stringify(data.achievements || []));
        if (typeof data.focusMinutes === 'number') localStorage.setItem('focusMinutes', String(data.focusMinutes));
        showToast("✅ Progress restored");
        refreshXPDisplay();
        updateStreakLabel();
        render();
      }catch(err){
        showToast("❌ Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  // Focus Mode toggle
  panel.querySelector('#focusToggle').onclick = () => focusMode.toggle();
}

/* ------------------ Motivational Line ------------------ */
function updateMotivationalLine(){
  const el = document.getElementById('motivationLine');
  if (!el) return;
  // goal: keep daily streak growing; suggest minutes until next XP level boundary or simple nudge
  const remToLevel = 100 - (totalXP % 100);
  const streak = streakData.streak || 0;
  let text = `You’re ${remToLevel} XP away from Level ${Math.floor(totalXP/100)+2}.`;
  if (streak === 0) text = "Start your streak today — one checkbox is all it takes.";
  else if (streak < 3) text = `Nice! Day ${streak}. Keep it glowing 🔥`;
  else if (streak < 7) text = `Strong streak: ${streak} days — momentum is your superpower.`;
  else text = `Legend mode: ${streak} days. Don’t break the chain.`;
  el.textContent = text;
}

/* ------------------ Next Best Chapter ------------------ */
function allLeafSubjects(){
  const list = [];
  subjects.forEach(s=>{
    if (s.children) s.children.forEach(c=>list.push({parent:s.name, name:c.name, chapters:c.chapters}));
    else list.push({parent:null, name:s.name, chapters:s.chapters});
  });
  return list;
}
function computeNextBest(){
  const leaves = allLeafSubjects();
  let best = null;
  for (const leaf of leaves){
    const id = slug(leaf.name);
    ensureTrackerFor(id, leaf.chapters.length);
    const total = leaf.chapters.length;
    const done = countDone(tracker[id].done);
    const pct = total ? done/total : 0;
    if (done === total) continue; // skip completed
    if (!best || pct < best.pct || (pct === best.pct && done < best.done)) {
      // find first unchecked chapter
      const idx = tracker[id].done.findIndex(v=>!v);
      best = { ...leaf, id, done, total, pct, nextIndex: idx, nextTitle: leaf.chapters[idx] };
    }
  }
  return best;
}
function renderNextBestCard(){
  const host = document.getElementById('nextFocusCard');
  if (!host) return;
  host.innerHTML = '';
  const best = computeNextBest();
  if (!best) {
    host.innerHTML = `<div class="badge">✨ All done — perfection!</div>`;
    return;
  }
  const pct = Math.round((best.done/best.total)*100);
  const parentLine = best.parent ? `<span style="opacity:.8">${best.parent}</span> → ` : '';
  const card = document.createElement('div');
  card.className = 'card';
  card.style.padding = '12px 14px';
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
      <div>
        <div style="font-weight:600;margin-bottom:4px;">✨ Next Focus</div>
        <div>${parentLine}<strong>${best.name}</strong></div>
        <div style="opacity:.9">→ ${best.nextTitle}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="progress" style="width:160px;height:10px">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <button id="jumpNext" class="secondary">Jump</button>
      </div>
    </div>
  `;
  host.appendChild(card);
  card.querySelector('#jumpNext').onclick = () => jumpToLeaf(best.id);
}
function jumpToLeaf(id){
  // open parent card if any
  document.querySelectorAll(`[data-parent-id]`).forEach(card=>{
    const list = card.querySelector('.chapter-list');
    if (!list) return;
    const hasChild = list.querySelector(`#${id}-chapters`);
    if (hasChild) {
      if (!card.classList.contains('open')) toggleCollapse(card, list);
      // open the child wrapper
      const childWrap = list.querySelector(`#${id}-chapters`)?.closest('.subject');
      if (childWrap) {
        const head = childWrap.querySelector('.head');
        const l2 = childWrap.querySelector('.chapter-list');
        if (head && l2 && !childWrap.classList.contains('open')) toggleCollapse(childWrap, l2);
        // scroll into view
        childWrap.scrollIntoView({ behavior:'smooth', block:'center' });
      }
    }
  });
}

/* ------------------ Achievements ------------------ */
function getAchievements(){ return JSON.parse(localStorage.getItem('achievements') || '[]'); }
function saveAchievements(list){ localStorage.setItem('achievements', JSON.stringify(list)); }
function hasAchievement(key){ return getAchievements().some(a=>a.key===key); }
function addAchievement(key, title, desc){
  if (hasAchievement(key)) return;
  const arr = getAchievements();
  arr.push({ key, title, desc, ts: Date.now() });
  saveAchievements(arr);
  showToast(`🏅 Unlocked: ${title}`);
  renderBadgesRow(true);
}
function maybeUnlockAchievement(key, title, desc){ addAchievement(key, title, desc); }
function maybeCheckChapterCrusher(){
  // 50 chapters completed overall
  let totalDone = 0;
  subjects.flatMap(s => s.children ? s.children : [s]).forEach(sub=>{
    const id = slug(sub.name);
    ensureTrackerFor(id, sub.chapters.length);
    totalDone += countDone(tracker[id].done);
  });
  if (totalDone >= 50) addAchievement('chapter_crusher', '💪 Chapter Crusher', 'Completed 50 chapters');
}
function renderBadgesRow(popNew=false){
  const host = document.getElementById('badgesRow');
  if (!host) return;
  host.innerHTML = '';
  const list = getAchievements();
  if (!list.length) {
    host.innerHTML = `<div class="badge">No badges yet — keep going!</div>`;
    return;
  }
  list.sort((a,b)=>a.ts-b.ts).forEach(a=>{
    const el = document.createElement('div');
    el.className = 'badge' + (popNew ? ' new' : '');
    el.textContent = `${a.title}`;
    el.title = a.desc;
    host.appendChild(el);
  });
  // Consistency Champ (7-day streak)
  if (streakData.streak >= 7) addAchievement('consistency_champ', '🧠 Consistency Champ', '7-day streak');
}

/* ------------------ Focus Mode + Timer Bubble ------------------ */
const focusMode = {
  on: false,
  interval: null,
  startTs: 0,
  bubble: null,
  activeCard: null,
  toggle(){
    this.on = !this.on;
    document.body.classList.toggle('focus-mode', this.on);
    if (this.on){
      this.start();
      showToast("🎯 Focus Mode on");
    } else {
      this.stop();
      showToast("🧊 Focus Mode off");
    }
  },
  setActive(card){
    if (!this.on) return;
    if (this.activeCard) this.activeCard.classList.remove('active-focus');
    this.activeCard = card;
    this.activeCard.classList.add('active-focus');
  },
  ensureBubble(){
    if (this.bubble) return;
    const b = document.createElement('div');
    b.id = 'focusBubble';
    b.textContent = '00:00';
    document.body.appendChild(b);
    this.bubble = b;
  },
  start(){
    this.ensureBubble();
    this.bubble.style.display = 'block';
    this.startTs = Date.now();
    this.interval = setInterval(()=>{
      const secs = Math.floor((Date.now()-this.startTs)/1000);
      const m = String(Math.floor(secs/60)).padStart(2,'0');
      const s = String(secs%60).padStart(2,'0');
      this.bubble.textContent = `⏱ ${m}:${s}`;
    }, 500);
  },
  stop(){
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    if (this.bubble) this.bubble.style.display = 'none';
    const mins = Math.round((Date.now()-this.startTs)/60000);
    if (mins>0){
      const prev = parseInt(localStorage.getItem('focusMinutes')||'0');
      localStorage.setItem('focusMinutes', String(prev + mins));
      if (mins >= 25) addAchievement('deep_focus', '🧘 Deep Focus', '25+ minutes in a session');
    }
  }
};

/* ------------------ Theme & Reset ------------------ */
function applyTheme(name){
  const root=document.documentElement;
  switch(name){
    case "midnight":
      root.style.setProperty("--primary","#0d111f");
      root.style.setProperty("--secondary","#1b2033");
      root.style.setProperty("--card","#242b44");
      root.style.setProperty("--accent","#8ab4f8");
      break;
    case "purple":
      root.style.setProperty("--primary","#1a1325");
      root.style.setProperty("--secondary","#2a1a3d");
      root.style.setProperty("--card","#382a4d");
      root.style.setProperty("--accent","#cba6f7");
      break;
    case "amoled":
      root.style.setProperty("--primary","#000000");
      root.style.setProperty("--secondary","#0f0f0f");
      root.style.setProperty("--card","#1a1a1a");
      root.style.setProperty("--accent","#89b4fa");
      break;
    default:
      root.style.setProperty("--primary","#111321");
      root.style.setProperty("--secondary","#2a2d3d");
      root.style.setProperty("--card","#3a3e52");
      root.style.setProperty("--accent","#8ab4f8");
  }
  localStorage.setItem('theme', name);
}
function resetStreak(){
  streakData = {streak:0,lastAction:""};
  localStorage.setItem('streakData', JSON.stringify(streakData));
  updateStreakLabel();
}
function resetAll(){
  tracker = {};
  localStorage.removeItem('trackerData');
  localStorage.removeItem('milestones_hit');
  localStorage.removeItem('studyDays');
  localStorage.removeItem('achievements');
  totalXP = 0; localStorage.setItem('totalXP','0');
  resetStreak();
  showToast("🧹 Progress reset");
  render();
}

/* ------------------ Init ------------------ */
window.addEventListener('DOMContentLoaded', () => {
  // Theme
  const sel = document.getElementById('themeSelect');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (sel) { sel.value = savedTheme; sel.onchange = () => applyTheme(sel.value); }
  applyTheme(savedTheme);

  // Reset (HTML modal handles confirm)
  const rb = document.getElementById('resetBtn');
  if (rb) rb.onclick = () => {
    const modal = document.getElementById('resetConfirm');
    if (modal) {
      modal.style.display = 'flex';
      modal.animate([{opacity:0},{opacity:1}],{duration:200,fill:'forwards'});
    } else {
      if (confirm("Reset all progress?")) resetAll();
    }
  };

  // Quote, streak, XP
  setDailyQuote();
  updateStreakLabel();
  refreshXPDisplay();

  // Initial render
  render();

  // Expand/Collapse all
  const expandAllBtn = document.getElementById('expandAll');
  const collapseAllBtn = document.getElementById('collapseAll');

  if (expandAllBtn) {
    expandAllBtn.onclick = () => {
      document.querySelectorAll('.subject .chapter-list').forEach(list => {
        const card = list.closest('.subject');
        if (card && list) {
          card.classList.add('open');
          list.style.maxHeight = list.scrollHeight + 'px';
          list.style.opacity = '1';
          if (focusMode.on) focusMode.setActive(card);
        }
      });
    };
  }
  if (collapseAllBtn) {
    collapseAllBtn.onclick = () => {
      document.querySelectorAll('.subject.open .chapter-list').forEach(list => {
        const card = list.closest('.subject');
        if (card && list) {
          list.style.maxHeight = '0px';
          list.style.opacity = '0';
          card.classList.remove('open');
        }
      });
    };
  }
});
