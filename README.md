# 障害福祉サービス受給要件シミュレーター LP

GitHub + Cloudflare Pages で無料ホスティングする静的サイトです。

## ファイル構成

```
fukushi-lp/
├── index.html          # トップ（ステップ質問・判定・事業所カード）
├── privacy.html        # プライバシーポリシー
├── contact.html        # お問い合わせ
├── profile.html        # 運営者プロフィール
├── css/
│   └── custom.css
├── js/
│   ├── config.js       # Supabase URL / anon key
│   ├── simulator.js    # 受給可能性の簡易ロジック
│   ├── facilities.js   # facilities テーブル取得
│   └── app.js          # UI・ステップフォーム
└── supabase/
    └── schema.sql      # テーブル・RLS・サンプルデータ
```

## セットアップ

1. **Supabase**  
   - プロジェクト作成 → `supabase/schema.sql` を SQL Editor で実行  
   - `js/config.js` に Project URL と anon public key を設定  
   - `municipality` の表記はユーザー入力と完全一致させる  

2. **お問い合わせ**  
   - `contact.html` の `action` を [Formspree](https://formspree.io) 等の URL に変更  

3. **デプロイ（Cloudflare Pages）**  
   - GitHub に push  
   - Cloudflare Pages → Connect to Git → ビルドコマンドなし、出力ディレクトリ `/`（ルート）  

## ローカル確認

静的ファイルのため、任意のローカルサーバーで `index.html` を開いてください。

```bash
npx serve .
```

## 注意

判定結果は参考情報です。受給の最終判断は市区町村・年金事務所等の公的窓口で行ってください。
