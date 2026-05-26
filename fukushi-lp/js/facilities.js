/**
 * Supabase facilities テーブルから市区町村完全一致で事業所を取得
 */

/**
 * @param {string} municipality ユーザー入力の市区町村（完全一致）
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
async function fetchFacilitiesByMunicipality(municipality) {
  const trimmed = (municipality || '').trim();
  if (!trimmed) {
    return { data: [], error: null };
  }

  const { url, anonKey, municipalityColumn } = SUPABASE_CONFIG;

  if (url.includes('YOUR_PROJECT') || anonKey.includes('YOUR_SUPABASE')) {
    return {
      data: null,
      error:
        'Supabase の接続設定が未設定です。js/config.js の url と anonKey を設定してください。',
    };
  }

  const base = url.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set(municipalityColumn, `eq.${trimmed}`);

  const endpoint = `${base}/rest/v1/facilities?${params.toString()}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        data: null,
        error: `事業所データの取得に失敗しました（${res.status}）。設定と RLS ポリシーをご確認ください。`,
      };
    }

    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: 'ネットワークエラーにより事業所を取得できませんでした。',
    };
  }
}

/**
 * カラム名のゆらぎに対応して表示用の値を取得
 */
function facilityField(row, keys, fallback = '—') {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  return fallback;
}

/**
 * @param {object} facility
 * @returns {HTMLElement}
 */
function createFacilityCard(facility) {
  const name = facilityField(facility, ['name', 'facility_name', '事業所名'], '事業所名未登録');
  const address = facilityField(facility, ['address', '所在地', 'full_address']);
  const phone = facilityField(facility, ['phone', 'tel', '電話番号']);
  const service = facilityField(facility, ['service_type', 'services', 'サービス種別'], '');
  const description = facilityField(facility, ['description', 'memo', '備考'], '');

  const card = document.createElement('article');
  card.className =
    'rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md';
  card.innerHTML = `
    <h4 class="text-lg font-semibold text-emerald-900">${escapeHtml(name)}</h4>
    ${service && service !== '—' ? `<p class="mt-1 text-sm font-medium text-emerald-700">${escapeHtml(service)}</p>` : ''}
    <dl class="mt-3 space-y-1 text-sm text-stone-600">
      <div class="flex gap-2"><dt class="shrink-0 text-stone-500">住所</dt><dd>${escapeHtml(address)}</dd></div>
      <div class="flex gap-2"><dt class="shrink-0 text-stone-500">電話</dt><dd>${escapeHtml(phone)}</dd></div>
    </dl>
    ${description && description !== '—' ? `<p class="mt-3 text-sm leading-relaxed text-stone-600">${escapeHtml(description)}</p>` : ''}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
