/**
 * 受給可能性の簡易判定（参考情報。最終判断は市区町村・担当窓口へ）
 */

const DISABILITY_GRADES = {
  physical: { label: '身体障害', grades: ['1級', '2級', '3級', '4級', '5級', '6級', '7級'] },
  intellectual: { label: '知的障害', grades: ['区分なし（支援区分等で判断）'] },
  mental: { label: '精神障害', grades: ['1級', '2級', '3級'] },
  developmental: { label: '発達障害', grades: ['手帳なし', '軽度〜', '医師の診断あり'] },
  intractable: { label: '難病', grades: ['指定難病', 'その他'] },
  none: { label: '手帳・診断なし', grades: ['該当なし'] },
};

const INCOME_BRACKETS = [
  { id: 'low', label: '世帯年収 約360万円未満（目安）' },
  { id: 'mid', label: '世帯年収 約360万〜720万円（目安）' },
  { id: 'high', label: '世帯年収 約720万円以上（目安）' },
  { id: 'unknown', label: 'わからない・これから確認する' },
];

/**
 * @param {{ municipality: string, age: number, disabilityType: string, disabilityGrade: string, income: string }} input
 * @returns {{ id: string, name: string, summary: string, note: string }[]}
 */
function evaluateEligibility(input) {
  const { age, disabilityType, disabilityGrade, income } = input;
  const results = [];
  const isMinor = age < 18;
  const isAdult = age >= 18;
  const isSenior = age >= 65;
  const hasCertificate =
    disabilityType !== 'none' && disabilityGrade !== '該当なし' && disabilityGrade !== '手帳なし';
  const lowIncome = income === 'low' || income === 'unknown';
  const midOrBelow = income !== 'high';

  const add = (id, name, summary, note = '') => {
    results.push({ id, name, summary, note });
  };

  if (isMinor && hasCertificate) {
    add(
      'child-allowance',
      '障害児福祉手当',
      '18歳未満で障害児手帳等がある場合、所得制限の範囲で支給される可能性があります。',
      '所得制限・支給区分は世帯の状況により異なります。'
    );
  }

  if (isAdult && disabilityType === 'physical' && ['1級', '2級'].includes(disabilityGrade)) {
    add(
      'special-disability',
      '特別障害者手当',
      '身体障害1・2級など、一定の要件を満たす場合に検討されます。',
      '所得制限・他の手当との併給関係に注意が必要です。'
    );
  }

  if (isAdult && hasCertificate && midOrBelow) {
    add(
      'disability-allowance',
      '障害者手当',
      '20歳以上で障害者手帳等があり、所得・生活状況が基準内の場合に支給される可能性があります。',
      '特別障害者手当との選択となる場合があります。'
    );
  }

  if (isAdult && hasCertificate) {
    add(
      'disability-pension-basic',
      '障害基礎年金',
      '初診日・障害認定日・保険加入状況等により、障害等級に応じて受給できる場合があります。',
      '年金事務所での個別確認が必要です。'
    );
  }

  if (hasCertificate || disabilityType === 'developmental') {
    add(
      'support-law-services',
      '障害福祉サービス（総合支援法）',
      '居宅介護・生活介護・就労継続支援・移動支援など、障害支援区分の認定後に利用できるサービスです。',
      '市区町村の障害福祉担当へ「障害福祉サービス受給者証」の申請相談を。'
    );
  }

  if (isAdult && (disabilityType === 'mental' || disabilityType === 'developmental')) {
    add(
      'mental-health-welfare',
      '精神障害者保健福祉手当・地域活動支援',
      '精神障害者保健福祉手当、自立支援医療、地域活動支援センター等の制度があります。',
      '手帳の種類・所得により対象が変わります。'
    );
  }

  if (lowIncome && (hasCertificate || age >= 0)) {
    add(
      'livelihood-protection',
      '生活保護・医療扶助',
      '世帯の収入・資産が基準を下回る場合、生活保護や医療費の助成が検討されます。',
      '福祉事務所への相談が必要です。'
    );
  }

  if (isMinor || (isAdult && midOrBelow)) {
    add(
      'medical-cost-support',
      '自立支援医療（医療費助成）',
      '障害者・障害児の通院・治療費の自己負担を軽減する制度です。',
      '上限額管理・所得区分により自己負担額が決まります。'
    );
  }

  if (isSenior && hasCertificate) {
    add(
      'long-term-care',
      '介護保険・障害者の介護サービス',
      '65歳以上は要介護認定、65歳未満の重度障害者は障害福祉の居宅サービス等が対象になります。',
      '年齢・障害程度により窓口が異なります。'
    );
  }

  if (disabilityType === 'intractable') {
    add(
      'intractable-disease',
      '難病の患者に対する医療等に関する法律（難病医療費助成）',
      '指定難病に該当する場合、医療費助成の対象となることがあります。',
      '都道府県・疾患により要件が異なります。'
    );
  }

  add(
    'municipal-consultation',
    `${input.municipality || 'お住まいの地域'}の相談窓口`,
    '市区町村の障害福祉担当・地域包括支援センターで、個別の受給可否と申請手続きを確認できます。',
    '本シミュレーターは参考情報です。必ず公的窓口でご確認ください。'
  );

  if (results.length <= 1) {
    add(
      'general-info',
      '障害者手帳・診断書の取得相談',
      '手帳がない場合でも、医療機関・市区町村で今後の手続きを相談できます。',
      ''
    );
  }

  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
