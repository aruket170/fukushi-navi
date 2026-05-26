/**
 * ステップフォーム・判定・事業所表示
 */

const TOTAL_STEPS = 4;
let currentStep = 1;

const formState = {
  municipality: '',
  age: '',
  disabilityType: 'none',
  disabilityGrade: '該当なし',
  income: 'unknown',
};

document.addEventListener('DOMContentLoaded', () => {
  initDisabilityGradeOptions();
  bindNavigation();
  bindDisabilityTypeChange();
  updateStepUI();
});

function initDisabilityGradeOptions() {
  const typeSelect = document.getElementById('disabilityType');
  if (typeSelect) {
    typeSelect.addEventListener('change', syncGradeOptions);
    syncGradeOptions();
  }
}

function bindDisabilityTypeChange() {
  const typeSelect = document.getElementById('disabilityType');
  if (!typeSelect) return;
  typeSelect.innerHTML = Object.entries(DISABILITY_GRADES)
    .map(([value, { label }]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function syncGradeOptions() {
  const type = document.getElementById('disabilityType')?.value || 'none';
  const gradeSelect = document.getElementById('disabilityGrade');
  if (!gradeSelect) return;
  const grades = DISABILITY_GRADES[type]?.grades || ['該当なし'];
  gradeSelect.innerHTML = grades.map((g) => `<option value="${g}">${g}</option>`).join('');
  formState.disabilityType = type;
  formState.disabilityGrade = grades[0];
}

function bindNavigation() {
  document.getElementById('btnNext')?.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    saveStep(currentStep);
    if (currentStep < TOTAL_STEPS) {
      currentStep += 1;
      updateStepUI();
    }
  });

  document.getElementById('btnPrev')?.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep -= 1;
      updateStepUI();
    }
  });

  document.getElementById('simulatorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    saveStep(currentStep);
    await runJudgment();
  });
}

function saveStep(step) {
  if (step === 1) {
    formState.municipality = document.getElementById('municipality')?.value.trim() || '';
  }
  if (step === 2) {
    formState.age = document.getElementById('age')?.value || '';
  }
  if (step === 3) {
    formState.disabilityType = document.getElementById('disabilityType')?.value || 'none';
    formState.disabilityGrade = document.getElementById('disabilityGrade')?.value || '';
  }
  if (step === 4) {
    formState.income =
      document.querySelector('input[name="income"]:checked')?.value || 'unknown';
  }
}

function validateStep(step) {
  const err = document.getElementById('stepError');
  if (err) {
    err.classList.add('hidden');
    err.textContent = '';
  }

  if (step === 1) {
    const v = document.getElementById('municipality')?.value.trim();
    if (!v) {
      showStepError('お住まいの市区町村を入力してください。（例：東京都渋谷区）');
      return false;
    }
  }
  if (step === 2) {
    const age = Number(document.getElementById('age')?.value);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      showStepError('0〜120の範囲で年齢を入力してください。');
      return false;
    }
  }
  return true;
}

function showStepError(message) {
  const err = document.getElementById('stepError');
  if (!err) return;
  err.textContent = message;
  err.classList.remove('hidden');
}

function updateStepUI() {
  document.querySelectorAll('[data-step-panel]').forEach((panel) => {
    const step = Number(panel.dataset.stepPanel);
    panel.classList.toggle('hidden', step !== currentStep);
  });

  document.querySelectorAll('[data-step-indicator]').forEach((dot) => {
    const step = Number(dot.dataset.stepIndicator);
    dot.classList.toggle('bg-emerald-600', step <= currentStep);
    dot.classList.toggle('text-white', step <= currentStep);
    dot.classList.toggle('bg-stone-200', step > currentStep);
    dot.classList.toggle('text-stone-600', step > currentStep);
  });

  const prevBtn = document.getElementById('btnPrev');
  const nextBtn = document.getElementById('btnNext');
  const submitBtn = document.getElementById('btnSubmit');

  if (prevBtn) prevBtn.classList.toggle('hidden', currentStep === 1);
  if (nextBtn) nextBtn.classList.toggle('hidden', currentStep === TOTAL_STEPS);
  if (submitBtn) submitBtn.classList.toggle('hidden', currentStep !== TOTAL_STEPS);

  document.getElementById('stepLabel').textContent = `ステップ ${currentStep} / ${TOTAL_STEPS}`;
}

async function runJudgment() {
  const resultsSection = document.getElementById('resultsSection');
  const facilitiesSection = document.getElementById('facilitiesSection');
  const eligibilityList = document.getElementById('eligibilityList');
  const facilitiesList = document.getElementById('facilitiesList');
  const facilitiesStatus = document.getElementById('facilitiesStatus');
  const facilitiesTitle = document.getElementById('facilitiesTitle');

  resultsSection?.classList.remove('hidden');
  facilitiesSection?.classList.remove('hidden');
  resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const input = {
    municipality: formState.municipality,
    age: Number(formState.age),
    disabilityType: formState.disabilityType,
    disabilityGrade: formState.disabilityGrade,
    income: formState.income,
  };

  const programs = evaluateEligibility(input);
  if (eligibilityList) {
    eligibilityList.innerHTML = programs
      .map(
        (p) => `
      <li class="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
        <h3 class="text-lg font-semibold text-emerald-900">${escapeHtml(p.name)}</h3>
        <p class="mt-2 text-sm leading-relaxed text-stone-700">${escapeHtml(p.summary)}</p>
        ${p.note ? `<p class="mt-2 text-xs text-stone-500">※ ${escapeHtml(p.note)}</p>` : ''}
      </li>
    `
      )
      .join('');
  }

  if (facilitiesTitle) {
    facilitiesTitle.textContent = `「${input.municipality}」の事業所一覧`;
  }
  if (facilitiesStatus) {
    facilitiesStatus.textContent = '事業所情報を読み込み中…';
    facilitiesStatus.className = 'text-sm text-stone-500';
  }
  if (facilitiesList) facilitiesList.innerHTML = '';

  const { data, error } = await fetchFacilitiesByMunicipality(input.municipality);

  if (error) {
    if (facilitiesStatus) {
      facilitiesStatus.textContent = error;
      facilitiesStatus.className = 'text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3';
    }
    return;
  }

  if (!data || data.length === 0) {
    if (facilitiesStatus) {
      facilitiesStatus.textContent = `「${input.municipality}」に完全一致する事業所は見つかりませんでした。表記（「市」「区」など）がデータと同一かご確認ください。`;
      facilitiesStatus.className = 'text-sm text-stone-600';
    }
    return;
  }

  if (facilitiesStatus) {
    facilitiesStatus.textContent = `${data.length} 件の事業所が見つかりました`;
    facilitiesStatus.className = 'text-sm text-emerald-700';
  }

  if (facilitiesList) {
    data.forEach((row) => {
      facilitiesList.appendChild(createFacilityCard(row));
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
