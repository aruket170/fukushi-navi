/**
 * Supabase facilities テーブルから市区町村完全一致で事業所を取得
 * カラム: name, type, area, address, url
 */

/** @param {string} url */
function getSupabaseRestBase(url) {
  return (url || '').trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '');
}

/**
 * @param {string} municipality ユーザー入力の市区町村（area カラムと完全一致）
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

  const base = getSupabaseRestBase(url);
  const areaColumn = municipalityColumn || 'area';
  const params = new URLSearchParams();
  params.set('select', 'name,type,area,address,url');
  params.set(areaColumn, `eq.${trimmed}`);

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
  const name = facilityField(facility, ['name'], '事業所名未登録');
  const type = facilityField(facility, ['type'], '');
  const area = facilityField(facility, ['area'], '');
  const address = facilityField(facility, ['address'], '');
  const url = facilityField(facility, ['url'], '');

  const card = document.createElement('article');
  card.className =
    'rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md';

  const safeUrl = url && url !== '—' && /^https?:\/\//i.test(url) ? url : '';
  const linkHtml = safeUrl
    ? `<p class="mt-3"><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-emerald-700 underline hover:text-emerald-900">公式サイト・詳細を見る</a></p>`
    : '';

  card.innerHTML = `
    <h4 class="text-lg font-semibold text-emerald-900">${escapeHtml(name)}</h4>
    ${type && type !== '—' ? `<p class="mt-1 text-sm font-medium text-emerald-700">${escapeHtml(type)}</p>` : ''}
    <dl class="mt-3 space-y-1 text-sm text-stone-600">
      ${area && area !== '—' ? `<div class="flex gap-2"><dt class="shrink-0 text-stone-500">地域</dt><dd>${escapeHtml(area)}</dd></div>` : ''}
      ${address && address !== '—' ? `<div class="flex gap-2"><dt class="shrink-0 text-stone-500">住所</dt><dd>${escapeHtml(address)}</dd></div>` : ''}
    </dl>
    ${linkHtml}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
