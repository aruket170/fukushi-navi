/**
 * Supabase 接続設定
 * GitHub 公開前に Cloudflare Pages の環境変数へ移すか、
 * 本番ではビルド時に差し替えてください（anon key は公開前提のキーのみ使用）。
 */
const SUPABASE_CONFIG = {
  /** プロジェクトのベース URL（/rest/v1 は付けない） */
  url: 'https://ywuvtgbpzcnedcunorxo.supabase.co',
  anonKey: 'sb_publishable_cGugyAP6PNFG41HXM0BTOQ_rsUDD7_f',
  /** facilities テーブルの市区町村カラム名 */
  municipalityColumn: 'area',
};
