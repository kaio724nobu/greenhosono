Handicraft GREEN — デプロイ手順

目的別の公開方法をまとめました。最短は静的ホスティング、管理画面も含めた編集機能まで使うならコンテナ一体デプロイがおすすめです。

1) コンテナ一体デプロイ（おすすめ）
- できること: サイト配信 + /api（保存・アップロード）を同一オリジンで提供
- 必要要件: 永続ストレージ（`admin/`, `assets/data/`, `assets/uploads/` の書き込み）

手順（Render の例）
1. 本リポジトリを GitHub へプッシュ
2. Render で New → Web Service → リポジトリを選択
3. Runtime は Docker を選択（本リポジトリの `Dockerfile` を使用）
4. 環境変数は不要（`server.py` は `PORT` を自動使用）。必要であれば `PORT=8000` のままでOK
5. Disks で永続ディスクを追加し、`/app` にマウント（サイズ 1GB〜）
6. Deploy 後、`https://<your-domain>/api/health` が `200 OK` であることを確認
7. `https://<your-domain>/admin/login.html` にアクセスし、パスワード `admin123`（デモ）でログイン
8. 管理画面で編集→保存し、トップの「特集商品」に反映されることを確認

メモ
- Linux コンテナでは HEIC→JPEG 変換（macOS の `sips`）はスキップされます。必要なら ImageMagick などに置換してください。
- 管理画面のパスワードは以下のいずれかで上書き可能。
  - 環境変数 `ADMIN_PASSWORD` を設定（例: Render の Environment で設定）。サーバの `/api/admin-config` が返す値を `auth.js` が自動読込します。
  - または `window.ADMIN_PASSWORD = 'xxxx';` を `admin/login.html` などで先に定義。
  - 何も設定がなければデフォルト `admin123`。
  - 重要: これはデモ用途の簡易認証です。必要に応じて Basic 認証やIP制限で保護してください。

ローカル確認（Docker）
```
docker build -t handicraft-green .
docker run --rm -p 8000:8000 handicraft-green
# http://localhost:8000 を開く
```

2) 静的ホスティングのみ（編集は不可）
- 対象: GitHub Pages / Netlify / Vercel / Cloudflare Pages
- 方法: リポジトリをそのまま公開（ビルド不要）
- 制約: 管理画面の「ファイル保存」「画像アップロード」は利用不可（localStorage のみ）

3) ハイブリッド（静的 + 別ホストAPI）
- フロント: Netlify/Pages などに静的公開
- API: 上記コンテナ（Render 等）に `/api` だけ配置
- CORS: `server.py` は `*` 許可済み
- API ベースURL固定をしたい場合は、管理画面のHTMLに以下のいずれかを記述してください（実装済み）。
  - `<meta name="api-base" content="https://your-api-origin">`
  - または `window.API_BASE = 'https://your-api-origin'` を先に定義

トラブルシュート
- 「ファイル保存API: 未接続」表示のまま
  - サーバが起動しているか、`/api/health` が 200 か確認
  - オリジンが異なる場合でも CORS は許可済み（ネットワークエラー時は開発者ツールの Console を確認）
- 特集が表示されない
  - 変更は localStorage とファイルをマージします。即時反映は localStorage が優先。共有したい場合は「ファイルに保存」または「adminに保存」を実行
