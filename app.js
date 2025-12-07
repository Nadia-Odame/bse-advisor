/* app.js - All corrected and optimized */

/* ----------------- Constants ----------------- */
const CONFIDENCE_MIN = 20;
const CONFIDENCE_RANGE = 80;
const MAX_CHECKBOXES = 2;
const MATH_THRESHOLD_HIGH = 7;
const MATH_THRESHOLD_LOW = 3;
const TOTAL_QUESTIONS = 8;
const TIE_ORDER = ['ml','fs','ar','llp'];

/* ----------------- Specialisation metadata ----------------- */
const SPECIALS = {
  llp: {
    id: 'llp',
    name: 'Low-Level Programming',
    short: 'Systems, performance & close-to-hardware development.',
    why: 'You like efficiency, control over memory and low-level systems design.',
    steps: [
      'Study C or Rust fundamentals (memory, pointers, ownership).',
      'Build a small embedded or systems project (microcontroller or simple OS module).',
      'Practice performance profiling and debugging tools.'
    ],
    projects: ['Write a simple memory allocator', 'Build a small device driver / firmware demo', 'Port a small C program to Rust'],
    resources: ['The C Programming Language (Kernighan & Ritchie)', 'The Rust Book', 'Operating Systems: Three Easy Pieces']
  },
  ar: {
    id: 'ar',
    name: 'AR / VR',
    short: 'Create immersive 3D and spatial experiences.',
    why: 'You are drawn to spatial design, 3D math, and interactive experiences.',
    steps: [
      'Learn Unity or Unreal basics and 3D math foundations.',
      'Prototype small AR/VR interactions (e.g., mobile AR app).',
      'Study user experience in spatial contexts (HCI for XR).'
    ],
    projects: ['Create a simple VR scene (teleport + interact)', 'Build an AR measurement tool', 'Prototype a 3D UI for a mini-app'],
    resources: ['Unity Learn', 'Intro to 3D Math (online notes)', 'XR HCI papers & tutorials']
  },
  fs: {
    id: 'fs',
    name: 'Full-Stack Web Development',
    short: 'Design and ship user-facing web applications.',
    why: 'You enjoy building products that people use every day and iterating quickly.',
    steps: [
      'Master HTML/CSS/JavaScript and a frontend framework (React).',
      'Build a backend (Node/Express) and a simple REST API.',
      'Deploy full projects and add them to your portfolio.'
    ],
    projects: ['Build a CRUD app with React + Node', 'Deploy a blog or portfolio site', 'Implement authentication & payments on a demo app'],
    resources: ['MDN Web Docs', 'FreeCodeCamp full stack projects', 'React official docs']
  },
  ml: {
    id: 'ml',
    name: 'Machine Learning',
    short: 'Work with data, models, and predictive systems.',
    why: 'You enjoy math, statistics and finding patterns in data.',
    steps: [
      'Learn Python, NumPy and fundamentals of linear algebra and statistics.',
      'Complete small ML projects (regression, classification).',
      'Study model evaluation, deployment basics and ML ethics.'
    ],
    projects: ['Build a classifier on a public dataset', 'Train a small neural network with PyTorch', 'Deploy a model as an API'],
    resources: ['fast.ai course', 'Coursera ML (Andrew Ng)', 'Kaggle beginner tutorials']
  }
};

/* ----------------- Utility functions ----------------- */
function sanitizeInput(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function clearElement(element) {
  element.innerHTML = '';
}

function createListItems(items, container) {
  clearElement(container);
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    container.appendChild(li);
  });
}

/* ----------------- SPA Navigation ----------------- */
const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));

function showSection(id){
  ['landing','quiz','result','contact'].forEach(s=>{
    const el = document.getElementById(s);
    if(!el) return;
    if(s === id){
      el.classList.add('active'); 
      el.setAttribute('aria-hidden','false');
    } else {
      el.classList.remove('active'); 
      el.setAttribute('aria-hidden','true');
    }
  });
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === id));
  window.scrollTo({top:0, behavior:'smooth'});
}

/* Header buttons */
document.getElementById('startQuiz').addEventListener('click', ()=> showSection('quiz'));
document.getElementById('demoBtn').addEventListener('click', ()=> {
  renderResult('fs', { llp:2, ar:3, fs:5, ml:1 });
  showSection('result');
});

/* ----------------- Quiz interactions & validation ----------------- */
const quizForm = document.getElementById('quizForm');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

function updateProgress(){
  let answered = 0;
  
  if(quizForm.q1.value) answered++;
  if(Array.from(quizForm.querySelectorAll('input[name="q2"]')).some(c=>c.checked)) answered++;
  if(quizForm.q3.value !== null) answered++;
  if(quizForm.q4.value) answered++;
  if(quizForm.q5.value) answered++;
  if(quizForm.q6.value) answered++;
  if(quizForm.q7.value) answered++;
  if(quizForm.q8.value.trim()) answered++;
  
  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${answered} / ${TOTAL_QUESTIONS}`;
}

quizForm.addEventListener('input', updateProgress);
updateProgress();

// Q2 checkboxes: limit to 2 selections with better UX
const q2boxes = quizForm.querySelectorAll('input[name="q2"]');
const q2hint = document.getElementById('q2hint');

q2boxes.forEach(box => box.addEventListener('change', (e)=>{
  const checked = Array.from(q2boxes).filter(c=>c.checked);
  if(checked.length > MAX_CHECKBOXES){
    e.target.checked = false;
    q2hint.textContent = '⚠️ Maximum 2 selections allowed';
    q2hint.style.color = 'var(--error)';
    setTimeout(() => {
      q2hint.textContent = 'Select up to 2 options';
      q2hint.style.color = '';
    }, 2000);
  }
}));

// Display range value for q3
const q3range = document.getElementById('q3');
const mathVal = document.getElementById('mathVal');
if(q3range){
  q3range.addEventListener('input', ()=> mathVal.textContent = q3range.value);
}

/* ----------------- Scoring logic ----------------- */
function parseScoreAttr(attr){
  const base = {llp:0,ar:0,fs:0,ml:0};
  if(!attr) return base;
  attr.split(',').forEach(p=>{
    const [k,v] = p.split(':');
    if(k && v && base.hasOwnProperty(k.trim())) base[k.trim()] += Number(v);
  });
  return base;
}

function addScores(a,b){ 
  return { 
    llp: a.llp+b.llp, 
    ar: a.ar+b.ar, 
    fs: a.fs+b.fs, 
    ml: a.ml+b.ml 
  }; 
}

function keywordBias(text){
  const t = (text||'').toLowerCase();
  const bias = {llp:0,ar:0,fs:0,ml:0};
  if(/pointer|malloc|segfault|stack|heap|interrupt/.test(t)) bias.llp += 2;
  if(/shader|mesh|unity|unreal|vr|3d|ar/.test(t)) bias.ar += 2;
  if(/html|css|react|node|api|frontend|backend/.test(t)) bias.fs += 2;
  if(/matrix|regression|neural|tensor|model|data|kaggle/.test(t)) bias.ml += 2;
  return bias;
}

quizForm.addEventListener('submit', function(e){
  e.preventDefault();

  let score = {llp:0,ar:0,fs:0,ml:0};

  // Q1 radio
  const q1 = quizForm.querySelector('input[name="q1"]:checked');
  if(q1) score = addScores(score, parseScoreAttr(q1.dataset.score));

  // Q2 checkboxes
  const q2 = quizForm.querySelectorAll('input[name="q2"]:checked');
  q2.forEach(el => score = addScores(score, parseScoreAttr(el.dataset.score)));

  // Q3 slider
  const q3val = Number(quizForm.q3.value);
  if(q3val >= MATH_THRESHOLD_HIGH) score.ml += 2;
  else if(q3val <= MATH_THRESHOLD_LOW) score.llp += 1;

  // Q4
  const q4 = quizForm.querySelector('input[name="q4"]:checked');
  if(q4) score = addScores(score, parseScoreAttr(q4.dataset.score));

  // Q5 select
  const q5sel = quizForm.q5.options[quizForm.q5.selectedIndex];
  if(q5sel && q5sel.dataset.score) score = addScores(score, parseScoreAttr(q5sel.dataset.score));

  // Q6
  const q6 = quizForm.querySelector('input[name="q6"]:checked');
  if(q6) score = addScores(score, parseScoreAttr(q6.dataset.score));

  // Q7
  const q7 = quizForm.querySelector('input[name="q7"]:checked');
  if(q7) score = addScores(score, parseScoreAttr(q7.dataset.score));

  // Q8 keyword
  const q8txt = quizForm.q8.value.trim();
  score = addScores(score, keywordBias(q8txt));

  // Decide winner with tie-breaker
  let bestKey = 'fs';
  let bestVal = -Infinity;
  Object.keys(score).forEach(k => {
    if(score[k] > bestVal){ 
      bestVal = score[k]; 
      bestKey = k; 
    }
    else if(score[k] === bestVal){
      const curIdx = TIE_ORDER.indexOf(bestKey);
      const candIdx = TIE_ORDER.indexOf(k);
      if(candIdx < curIdx) bestKey = k;
    }
  });

  renderResult(bestKey, score);
  showSection('result');
});

/* ----------------- Render result and extras ----------------- */
function renderResult(key, score){
  const meta = SPECIALS[key];
  
  document.getElementById('resultBadge').textContent = meta.name;
  document.getElementById('resultName').textContent = meta.name;
  document.getElementById('resultWhy').textContent = meta.short + ' — ' + meta.why;
  document.getElementById('whyText').textContent = meta.why;

  createListItems(meta.steps, document.getElementById('nextSteps'));
  createListItems(meta.projects, document.getElementById('miniProjects'));
  createListItems(meta.resources, document.getElementById('resources'));

  // Score breakdown
  const breakdown = Object.entries(score).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(' | ');
  document.getElementById('scoreBreakdown').textContent = breakdown;
  
  // Confidence calculation
  const vals = Object.values(score).slice().sort((a,b)=>b-a);
  const confidence = vals.length > 1 ? Math.round(((vals[0] - vals[1]) / (Math.max(vals[0],1))) * 100) : 80;
  const confMeter = document.getElementById('confMeter');
  confMeter.style.width = Math.max(CONFIDENCE_MIN, Math.min(100, CONFIDENCE_MIN + confidence)) + '%';

  // Generate plan button
  const generatePlan = document.getElementById('generatePlan');
  generatePlan.onclick = () => {
    generatePlan.disabled = true;
    generatePlan.textContent = 'Generating...';
    
    setTimeout(() => {
      const plan = makeThreeMonthPlan(key);
      document.getElementById('planText').textContent = plan;
      
      const dl = document.getElementById('downloadPlan');
      const blob = new Blob([plan], {type: 'text/plain'});
      dl.href = URL.createObjectURL(blob);
      dl.download = `${meta.id}-3month-plan.txt`;
      dl.style.display = 'inline-block';
      
      generatePlan.disabled = false;
      generatePlan.textContent = 'Regenerate Plan';
    }, 300);
  };

  // Copy summary with fallback
  document.getElementById('copyBtn').onclick = async () => {
    const summary = `${meta.name} — ${meta.short}\nWhy: ${meta.why}\nNext steps:\n- ${meta.steps.join('\n- ')}`;
    try {
      await navigator.clipboard.writeText(summary);
      alert('Recommendation copied to clipboard!');
    } catch(err) {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Recommendation copied to clipboard!');
    }
  };

  // GitHub link info
  document.getElementById('githubLink').onclick = (e) => {
    e.preventDefault();
    alert('Add your GitHub repo URL in the Contact form before submission.');
  };
}

/* ----------------- Make 3-month plan generator ----------------- */
function makeThreeMonthPlan(key){
  const meta = SPECIALS[key];
  const lines = [];
  lines.push(`3-Month Learning Plan — ${meta.name}`);
  lines.push('========================================');
  lines.push('');
  lines.push('Month 1 — Foundations');
  lines.push('---------------------');
  meta.steps.slice(0,1).forEach(s => lines.push('• ' + s));
  lines.push('');
  lines.push('Month 2 — Small Projects');
  lines.push('------------------------');
  meta.projects.slice(0,2).forEach(p => lines.push('• ' + p));
  lines.push('');
  lines.push('Month 3 — Portfolio & Reflection');
  lines.push('---------------------------------');
  lines.push('• Complete one capstone project and document it on GitHub.');
  lines.push('• Make a short demo video (<= 3 minutes) and add it to README.');
  lines.push('• Reflect on what you learned and share with peers.');
  lines.push('');
  lines.push('Extra Tips');
  lines.push('----------');
  lines.push('• Set weekly goals and track progress');
  lines.push('• Commit code daily (even small changes)');
  lines.push('• Ask for feedback from mentors and peers often');
  lines.push('• Join online communities related to ' + meta.name);
  lines.push('');
  return lines.join('\n');
}

/* ----------------- Retake & Contact ----------------- */
document.getElementById('retake').addEventListener('click', ()=> {
  quizForm.reset();
  updateProgress();
  showSection('quiz');
  document.getElementById('planText').textContent = '';
  document.getElementById('downloadPlan').style.display = 'none';
});

document.getElementById('toContact').addEventListener('click', ()=> showSection('contact'));

document.getElementById('resetBtn').addEventListener('click', ()=> {
  quizForm.reset();
  updateProgress();
});

// Contact form
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: sanitizeInput(contactForm.name.value),
    email: sanitizeInput(contactForm.email.value),
    github: contactForm.github.value,
    notes: sanitizeInput(contactForm.notes.value)
  };
  
  try {
    new URL(data.github);
    alert(`Contact saved locally!\n\nName: ${data.name}\nEmail: ${data.email}\nGitHub: ${data.github}\n\nThanks for the message.`);
  } catch(err) {
    alert('Please enter a valid URL for your GitHub repo or Pages site (must start with https://).');
  }
});

document.getElementById('contactReset').addEventListener('click', ()=> contactForm.reset());

// Accessibility: Enter to start from landing
document.addEventListener('keydown', (e)=> {
  if(e.key === 'Enter' && document.getElementById('landing').classList.contains('active')){
    const focusedElement = document.activeElement;
    if(focusedElement.tagName !== 'BUTTON') {
      showSection('quiz');
    }
  }
});