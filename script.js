// ================================================
//  MediCheck — script.js
//  Complete logic: navigation, analysis, rendering
// ================================================

// ── App State ──────────────────────────────────
const state = {
  name: '', age: '', gender: '', blood: '',
  conditions: '', allergies: '',
  symptoms: [], severity: 5, duration: ''
};

// ── DOM Ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  animateCounters();
});

// ── Slider Setup ───────────────────────────────
function initSlider() {
  const slider  = document.getElementById('severity');
  const display = document.getElementById('severityVal');
  if (!slider || !display) return;

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value);
    state.severity = val;
    display.textContent = val + ' / 10';
    // Color shift
    if (val <= 3)       display.style.color = '#10b981';
    else if (val <= 6)  display.style.color = '#f59e0b';
    else                display.style.color = '#ef4444';
  });
}

// ── Mobile Menu ────────────────────────────────
function toggleMenu() {
  const nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
}

// ── Navigation ─────────────────────────────────
function goTo(n) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen' + n);
  if (target) target.classList.add('active');

  // Update progress steps
  for (let i = 1; i <= 3; i++) {
    const step  = document.getElementById('pstep' + i);
    const line  = document.getElementById('pline' + (i - 1));
    if (!step) continue;
    step.classList.remove('active', 'done');
    if (i < n)  step.classList.add('done');
    if (i === n) step.classList.add('active');
    if (line) {
      line.classList.remove('done');
      if (i <= n) line.classList.add('done');
    }
  }

  window.scrollTo({ top: document.getElementById('checker')?.offsetTop - 80 || 0, behavior: 'smooth' });
}

// ── Step 1 → Step 2 ────────────────────────────
function nextStep() {
  const name = document.getElementById('name')?.value.trim();
  const age  = document.getElementById('age')?.value.trim();

  if (!name)                    { showToast('⚠️ Please enter your name', 'error'); return; }
  if (!age || age < 1 || age > 120) { showToast('⚠️ Please enter a valid age (1–120)', 'error'); return; }

  state.name       = name;
  state.age        = parseInt(age);
  state.gender     = document.getElementById('gender')?.value     || '';
  state.blood      = document.getElementById('blood')?.value      || '';
  state.conditions = document.getElementById('conditions')?.value || '';
  state.allergies  = document.getElementById('allergies')?.value.trim() || '';

  goTo(2);
}

// ── Toggle Symptom Chip ─────────────────────────
function toggleSymptom(el) {
  el.classList.toggle('selected');
  const symptom = el.dataset.symptom || el.textContent.replace(/^\S+\s/, '').trim();

  if (el.classList.contains('selected')) {
    if (!state.symptoms.includes(symptom)) state.symptoms.push(symptom);
  } else {
    state.symptoms = state.symptoms.filter(s => s !== symptom);
  }
  updateSymptomCount();
}

function updateSymptomCount() {
  const badge = document.getElementById('symptomCount');
  if (!badge) return;
  const n = state.symptoms.length;
  badge.textContent = n === 0 ? '0 selected' : `${n} selected`;
  badge.style.background = n > 0 ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)';
  badge.style.color = n > 0 ? 'var(--accent)' : 'var(--muted)';
}

// ── Duration Selection ─────────────────────────
function selectDuration(el) {
  document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  state.duration = el.textContent.trim();
}

// ── Analyze ────────────────────────────────────
function analyze() {
  // Collect latest symptom selections
  const selected = [...document.querySelectorAll('.symptom-chip.selected')]
    .map(c => c.dataset.symptom || c.textContent.replace(/^\S+\s/, '').trim());

  state.symptoms = selected;
  state.severity = parseInt(document.getElementById('severity')?.value || 5);
  state.duration = document.querySelector('.dur-btn.selected')?.textContent.trim() || '';

  if (selected.length === 0) {
    showToast('⚠️ Please select at least one symptom!', 'error');
    return;
  }
  if (!state.duration) {
    showToast('⚠️ Please select symptom duration', 'error');
    return;
  }

  const result = runDiagnostics(selected, state.severity, state.duration);
  renderResult(result);
  goTo(3);
}

// ── Diagnostics Engine ─────────────────────────
function runDiagnostics(symptoms, severity, duration) {
  const s = symptoms.map(x => x.toLowerCase());
  let conditions = [];
  let riskScore  = 0;

  // ── Rule Set ──
  const rules = [
    {
      test: () => s.includes('fever') && s.includes('cough') && s.includes('body ache'),
      cond: { name: 'Influenza (Flu)', match: 'high' }, score: 3
    },
    {
      test: () => s.includes('fever') && s.includes('runny nose') && s.includes('sore throat'),
      cond: { name: 'Common Cold / Viral Infection', match: 'high' }, score: 2
    },
    {
      test: () => s.includes('chest pain'),
      cond: { name: '⚠️ Possible Cardiac Event (Urgent)', match: 'high' }, score: 6
    },
    {
      test: () => s.includes('shortness of breath') && s.includes('cough'),
      cond: { name: 'Respiratory Infection / Asthma', match: 'high' }, score: 4
    },
    {
      test: () => s.includes('headache') && s.includes('dizziness') && s.includes('nausea'),
      cond: { name: 'Migraine / Hypertension', match: 'med' }, score: 3
    },
    {
      test: () => (s.includes('nausea') || s.includes('vomiting')) && s.includes('diarrhea'),
      cond: { name: 'Gastroenteritis / Food Poisoning', match: 'med' }, score: 2
    },
    {
      test: () => s.includes('fatigue') && s.includes('joint pain') && s.includes('skin rash'),
      cond: { name: 'Dengue / Chikungunya Fever', match: 'high' }, score: 4
    },
    {
      test: () => s.includes('fever') && s.includes('chills') && s.includes('fatigue'),
      cond: { name: 'Malaria / Typhoid Fever', match: 'med' }, score: 3
    },
    {
      test: () => s.includes('fatigue') && s.includes('loss of appetite') && s.includes('nausea'),
      cond: { name: 'Hepatitis / Liver Infection', match: 'med' }, score: 3
    },
    {
      test: () => s.includes('sore throat') && s.includes('fever') && s.includes('headache'),
      cond: { name: 'Strep Throat / Tonsillitis', match: 'med' }, score: 2
    },
    {
      test: () => s.includes('eye irritation') && s.includes('fever'),
      cond: { name: 'Conjunctivitis / Viral Fever', match: 'low' }, score: 1
    },
    {
      test: () => s.includes('skin rash') && s.includes('fever') && s.includes('body ache'),
      cond: { name: 'Chickenpox / Measles', match: 'med' }, score: 3
    },
  ];

  rules.forEach(rule => {
    if (rule.test()) {
      // Avoid exact duplicate conditions
      if (!conditions.find(c => c.name === rule.cond.name)) {
        conditions.push(rule.cond);
        riskScore += rule.score;
      }
    }
  });

  // Fallback
  if (conditions.length === 0) {
    conditions.push({ name: 'General Fatigue / Mild Illness', match: 'low' });
    riskScore = 2;
  }

  // ── Score Modifiers ──
  if (severity >= 8) riskScore += 2;
  if (severity >= 9) riskScore += 1;
  if (duration === '2+ Weeks' || duration === '1+ Month') riskScore += 2;
  else if (duration === '1 Week') riskScore += 1;

  // Pre-existing conditions increase risk
  if (state.conditions && state.conditions !== 'None / Not sure') riskScore += 1;

  riskScore = Math.min(Math.round(riskScore), 10);

  // ── Risk Level ──
  let level, cls, msg;
  if (riskScore <= 3) {
    level = 'LOW';  cls = 'risk-low';
    msg = 'Your symptoms suggest a mild condition. Rest and home care may be sufficient. Monitor for changes.';
  } else if (riskScore <= 6) {
    level = 'MED';  cls = 'risk-medium';
    msg = 'Moderate concern detected. Consider visiting a clinic within 24–48 hours for proper evaluation.';
  } else {
    level = 'HIGH'; cls = 'risk-high';
    msg = 'High risk indicators present. Please seek medical attention as soon as possible — do not delay.';
  }

  const emergency = s.includes('chest pain') || severity >= 9 ||
    (s.includes('shortness of breath') && severity >= 7);

  const recommendations = buildRecommendations(s, severity, duration, riskScore);

  return { riskScore, level, cls, msg, conditions, recommendations, emergency };
}

// ── Recommendations ────────────────────────────
function buildRecommendations(s, severity, duration, riskScore) {
  const recs = [
    'Drink 8–10 glasses of water daily to stay properly hydrated',
    'Get at least 7–8 hours of rest — avoid strenuous activity',
  ];

  if (s.includes('fever'))
    recs.push('If fever exceeds 102°F (39°C), consult a doctor. Paracetamol may help temporarily');
  if (s.includes('cough') || s.includes('sore throat'))
    recs.push('Gargle warm salt water (½ tsp salt) 2–3 times a day to soothe throat');
  if (s.includes('nausea') || s.includes('vomiting') || s.includes('diarrhea'))
    recs.push('Eat light bland foods: rice, toast, bananas. Avoid spicy, oily, or dairy foods');
  if (s.includes('headache'))
    recs.push('Rest in a dark quiet room. Avoid screens. Apply cool compress to forehead');
  if (s.includes('joint pain') || s.includes('body ache'))
    recs.push('Apply warm compress to affected muscles. Gentle stretching may relieve stiffness');
  if (s.includes('skin rash'))
    recs.push('Avoid scratching the rash. Keep skin clean and dry. See a dermatologist if spreading');

  if (riskScore >= 7)
    recs.push('🚨 Visit a hospital or emergency room immediately — do not delay treatment');
  else if (riskScore >= 4)
    recs.push('📋 Book a doctor appointment within 24–48 hours for a proper diagnosis and tests');
  else
    recs.push('🏠 Monitor your symptoms for 24–48 hours. Visit a clinic if they worsen or persist');

  if (duration !== 'Today' && duration !== '')
    recs.push('Since symptoms have persisted for ' + duration + ', blood tests may be recommended by your doctor');

  if (state.conditions && state.conditions !== 'None / Not sure')
    recs.push('Your pre-existing ' + state.conditions + ' condition may affect treatment — inform your doctor');

  recs.push('Never self-medicate or stop prescribed medicines without consulting a qualified physician');

  return recs;
}

// ── Render Result ──────────────────────────────
function renderResult({ riskScore, level, cls, msg, conditions, recommendations, emergency }) {
  const { name, age, gender, blood, symptoms, severity, duration, conditions: preex } = state;
  const now = new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const condHTML = conditions.map(c => `
    <div class="cond-item">
      <span class="cond-name">${c.name}</span>
      <span class="cond-match match-${c.match}">
        ${c.match==='high' ? '🔴 High Match' : c.match==='med' ? '🟡 Possible' : '🟢 Low Match'}
      </span>
    </div>
  `).join('');

  const recHTML = recommendations.map(r => `<li>${r}</li>`).join('');

  document.getElementById('resultCard').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
      <span style="font-size:0.7rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;">
        Health Assessment Report · ${now}
      </span>
      <span style="font-size:0.7rem;color:var(--muted);">MediCheck AI · For informational use only</span>
    </div>
    <hr class="divider" style="margin-top:0;">

    <div class="result-top">
      <div class="risk-circle ${cls}">
        <span class="r-score">${riskScore}</span>
        <span class="r-label">${level} RISK</span>
      </div>
      <div class="result-info">
        <h3>${name}${age ? ', Age ' + age : ''}${gender ? ' · ' + gender : ''}${blood ? ' · ' + blood : ''}</h3>
        <p>${msg}</p>
        <p class="result-meta">
          <strong>Symptoms:</strong> ${symptoms.join(', ')}<br>
          <strong>Duration:</strong> ${duration} &nbsp;·&nbsp;
          <strong>Severity:</strong> ${severity}/10
          ${preex && preex !== 'None / Not sure' ? ' &nbsp;·&nbsp; <strong>Pre-existing:</strong> ' + preex : ''}
        </p>
      </div>
    </div>

    <p class="r-section-title">🔍 Possible Conditions</p>
    <p class="r-subtitle">Based on your reported symptoms — requires clinical confirmation</p>
    <div class="conditions-list">${condHTML}</div>

    <p class="r-section-title">💡 Personalized Recommendations</p>
    <ul class="rec-list">${recHTML}</ul>

    ${emergency ? `
    <div class="emergency-banner">
      <div class="em-icon">🚨</div>
      <p><strong>Emergency Alert:</strong> One or more of your symptoms may indicate a
      <strong>life-threatening condition</strong>. Please call <strong>112</strong> or go to the
      nearest emergency hospital immediately. Do not wait — do not self-medicate.</p>
    </div>` : ''}
  `;
}

// ── Reset Everything ───────────────────────────
function resetAll() {
  // Clear state
  Object.assign(state, {
    name:'', age:'', gender:'', blood:'',
    conditions:'', allergies:'',
    symptoms:[], severity:5, duration:''
  });

  // Clear form inputs
  ['name','age','gender','blood','conditions','allergies'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset symptom chips
  document.querySelectorAll('.symptom-chip').forEach(c => c.classList.remove('selected'));

  // Reset duration
  document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('selected'));

  // Reset slider
  const slider  = document.getElementById('severity');
  const display = document.getElementById('severityVal');
  if (slider)  slider.value = 5;
  if (display) { display.textContent = '5 / 10'; display.style.color = 'var(--accent)'; }

  updateSymptomCount();
}

// ── Toast Notification ─────────────────────────
function showToast(msg, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.background = type === 'error'
    ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)';
  toast.style.color = 'white';
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 3500);
}

// ── Animated Counters ─────────────────────────
function animateCounters() {
  const els = document.querySelectorAll('[data-count]');
  els.forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    let current  = 0;
    const step   = Math.ceil(target / 50);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + suffix;
      if (current >= target) clearInterval(timer);
    }, 25);
  });
}