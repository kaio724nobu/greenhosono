// Sample product data for storefront fallback
// If admin has created products, storefront will use localStorage products instead

window.SampleProducts = [
  {
    id: "p-sv-ring-001",
    name: "SV925 リング - シンプル",
    category: "silver",
    price: 8800,
    description: "SV925の素地を活かしたミニマルなリング。マット仕上げ。",
    image: "svg:ring",
    featured: true
  },
  {
    id: "p-sv-neck-emerald-synth",
    name: "シルバー ネックレス - 合成エメラルド",
    category: "synthetic",
    price: 12800,
    description: "合成エメラルドをセットした上品な一粒ネックレス。",
    image: "svg:gem",
    featured: true
  },
  {
    id: "p-nat-amu-brace",
    name: "天然アメジスト ブレスレット",
    category: "natural",
    price: 15800,
    description: "深い紫の天然アメジストが手元を彩る。",
    image: "svg:bracelet",
    featured: true
  },
  {
    id: "p-sv-pierce-002",
    name: "シルバー ピアス - ハンマーテクスチャ",
    category: "silver",
    price: 6800,
    description: "手打ちのテクスチャが光を柔らかく反射。",
    image: "svg:earring",
    featured: false
  },
  {
    id: "p-synth-ruby-ring",
    name: "合成ルビー リング",
    category: "synthetic",
    price: 9900,
    description: "鮮やかな赤が指元を引き立てる。",
    image: "svg:ring",
    featured: false
  },
  {
    id: "p-nat-moon-neck",
    name: "天然ムーンストーン ネックレス",
    category: "natural",
    price: 17200,
    description: "青白いシラーが魅力のムーンストーン。",
    image: "svg:gem",
    featured: false
  }
];

window.Categories = [
  { id: "all", label: "すべて" },
  { id: "silver", label: "シルバー" },
  { id: "synthetic", label: "合成石" },
  { id: "natural", label: "天然石" }
];

// Simple NEWS topics for homepage (fallback)
window.News = [
  { date: "2025-08-01", title: "新作リングを入荷しました", url: "./products.html#silver" },
  { date: "2025-07-25", title: "夏季配送スケジュールのお知らせ", url: "./faq.html" },
  { date: "2025-07-10", title: "サブスクの内容を一部更新しました", url: "./subscribe.html" }
];

// Sample classes data (fallback for storefront/admin)
window.SampleClasses = [
  {
    id: "c-trial-90",
    name: "体験レッスン（90分）",
    type: "trial",
    price: 4400,
    schedule: "土・日（午前/午後）",
    capacity: 4,
    description: "初心者歓迎。シルバーの基本加工を学び、シンプルなリングを制作。",
    featured: true
  },
  {
    id: "c-course-basic",
    name: "月謝コース（基礎）",
    type: "course",
    price: 9900,
    schedule: "平日夜（第1/3 水）",
    capacity: 6,
    description: "ヤスリ/ロウ付け/磨きなど基礎技法を段階的に学ぶ。",
    featured: true
  },
  {
    id: "c-ws-stone",
    name: "ワークショップ：天然石ペンダント",
    type: "workshop",
    price: 6600,
    schedule: "月1回 日曜午後",
    capacity: 6,
    description: "天然石の魅力を活かしたペンダントを制作。",
    featured: false
  }
];
