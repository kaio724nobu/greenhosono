# Handicraft GREEN

Handicraft GREEN は、シルバーアクセサリーや合成石/天然石を扱うハンドメイドアクセサリーの販売サイト（試作）です。緑を基調に、高級感のある柔らかい雰囲気で構成しています。簡易的な管理画面（ローカル専用デモ）も含みます。

## 構成

- `/index.html` トップページ（特集/カテゴリー/CTA）
- `/products.html` 商品一覧（カテゴリ絞り込み）
- `/subscribe.html` サブスク案内/申込CTA（将来の本番機能は要バックエンド）
- `/classes.html` 教室一覧（体験/コース/WS）
- `/faq.html` よくあるご質問（配送・お手入れ・サイズ等）
- `/cart.html` カート（ローカル保存）
- `/admin/login.html` 管理ログイン（デモ用、固定パスワード）
- `/admin/index.html` 管理ダッシュボード（統計ダミー）
- `/admin/products.html` 商品CRUD（ローカル保存）
- `/admin/classes.html` 教室CRUD（ローカル保存）

## 使い方（ローカル）

1. このフォルダを任意の場所で開き、`index.html` をブラウザで開きます。
2. 管理画面は `admin/login.html` から。デモ用パスワードは `admin123` です。
3. 管理 > 商品で商品の追加/編集/削除ができます（ブラウザの `localStorage` に保存）。
4. ストア側は `localStorage` の商品データがあればそれを、なければ同梱のサンプルデータを読み込みます。

### minne からの商品インポート（手動）

1. minne のショップ一覧ページ（例: https://minne.com/@your-shop ）をブラウザで開き、ページ下までスクロールして「全商品が見えている」状態にします。
2. ブラウザの開発者ツールを開き、コンソールに以下のスニペットを貼り付けて実行します（サイト構造により要調整）。

```
(() => {
  const items = [];
  // NOTE: サイトのDOM構造によりセレクタを調整してください
  document.querySelectorAll('a, article, li').forEach(el => {
    const nameEl = el.querySelector('[class*="title"], [class*="name"], .item-name');
    const priceEl = el.querySelector('[class*="price"], .item-price');
    const imgEl = el.querySelector('img');
    const name = nameEl && nameEl.textContent && nameEl.textContent.trim();
    const price = priceEl && priceEl.textContent && priceEl.textContent.trim();
    const image = imgEl && (imgEl.currentSrc || imgEl.src);
    if (name && price && image) {
      items.push({ name, price, image });
    }
  });
  const unique = Array.from(new Map(items.map(i => [i.name+':'+i.image, i])).values());
  console.log(JSON.stringify(unique, null, 2));
})();
```

3. 出力された JSON をコピーします。
4. 本プロジェクトの `admin/products.html` を開き、下部の「インポート（JSON貼り付け）」にペーストし、「読み込み」を押します。
5. カテゴリなど必要な項目を編集・保存してください。

注意: minne の利用規約や著作権/肖像権・画像のホットリンク可否をご確認の上、自己責任でご利用ください。画像の外部参照が制限されている場合は、自サーバーに画像を保存して URL を差し替えてください。

## 重要事項（デモ/試作の制限）

- 認証/決済/在庫管理などは未実装です。`localStorage` を使ったブラウザ内のデモです。
- 実運用するには、サーバーサイド（ユーザー/商品/注文/サブスク管理、決済連携）と本物の認証/権限管理が必要です。
- 画像はプレースホルダーSVGで代替しています。

## カスタマイズのヒント

- 色味は `assets/css/style.css` の CSS 変数で調整できます。
- 商品カテゴリや属性は `assets/js/data.js` のサンプル構造を参考に、管理画面から追加していけます。

## ライセンス

この試作は自由に編集してご利用ください（サンプルコード）。
