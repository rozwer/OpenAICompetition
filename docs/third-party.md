# 使用資産

依存の正確な版はpnpm-lock.yaml。著作権表示・ライセンス本文は各パッケージに同梱されるものを保持する。

| 資産 | 用途 | ライセンス・出典 |
|---|---|---|
| OpenStreetMap | 横浜の建物輪郭・既知高さ・道路・水面 | ODbL 1.0。https://www.openstreetmap.org/copyright |
| Next.js / React | Web画面・HTTPサーバー | MIT |
| MapLibre GL JS | 3D地図表示 | BSD-3-Clause |
| @tmcw/togeojson | GPXの地理形式変換 | BSD-2-Clause |
| @openai/codex | ChatGPT認証を使うApp Server | Apache-2.0 |
| Zod | 入力・AI出力の検証 | MIT |
| Lucide | UIアイコン | ISC |
| Vitest / Playwright / TypeScript / Prettier | 開発・検証 | 各パッケージ同梱ライセンスを参照 |

地理データの取得範囲、加工方法、ファイルハッシュは`public/data/manifest.json`。
再加工は`python scripts/prepare-geodata.py`。元の公開データも同じディレクトリに保持する。
収録したデータは抜粋で、施設の網羅性や最新性、OSM高さタグの測量精度を保証するものではない。
場所マーカーは手動選択した概略位置。架空散歩の線はナビゲーション用経路ではない。
アプリの記憶・友人データはこの公開地理データと分けて`.local`に保存する。
