# ペットとAIの相棒

2026-09-09追加仕様。ユーザーの「原理上可能なら、後から実装を受け入れられる構造を用意する」という指示を反映する。ここにあるAPI・型・保存先は実装契約であり、アプリの動作や画像生成サービスとの実接続を報告するものではない。

## 1. 利用体験と配置

利用者は、自分のペットを選び、AIへ相談したり、記録や発見への反応を受け取れる。4タブの構成は維持する。「アプリを育てる」に「相棒」管理を追加し、常設のcompanion-overlayと相談画面のchat-headerで同じ設定を使う。相棒を押すと、選択中の場所・日付を保って既存の相談/発見/振り返りの入口を開く。表示のためだけにAIを呼ばない。

相棒はAIを示す。現在地・過去の位置を示す既存の地図上の人物とは別の識別子・表示領域を使う。相棒のアニメーションから、利用者が実際に歩いた・訪問したという記録を作らない。画面隅の2D表示と、将来の地図上の3Dモデルは別rendererにする。2Dペットを読み込んだだけで3Dモデルを取得したことにしない。ペット設定を変更しても本人の人物や訪問記録は変更しない。

| 画面ID | 入口・操作 | 保存結果 | 戻る/失敗時 |
|---|---|---|---|
| S-PET-01 相棒管理 | アプリを育てる→相棒。選択、表示/非表示、大きさ、動きを選ぶ | CompanionProfile | 未選択なら既定のAIアイコン。設定再表示で復元 |
| S-PET-02 import | CodexペットZIP、またはpet.json＋画像を選択→検査→プレビュー→使う | PetPackageと選択設定。登録と選択は別操作 | 壊れたファイルは理由を表示し、現在の相棒を維持 |
| S-PET-03 制作 | 名前・外見・任意の参考画像→接続先を確認→生成→動作確認→採用 | PetGenerationJob、候補PetPackage。採用後も選択は明示 | 未接続は下書き保存/制作指示の持出し。生成成功と表示しない |
| S-PET-04 相棒表示 | 相棒を押してAI操作へ。隠す/縮小する | 表示設定だけ | 地図・入力欄・下部ナビを塞がない。非表示でもAI入口は残る |

UIセッションはこの画面ID・操作と保存の契約を使って見た目を決める。具体的なキャラクターや色をここで固定しない。自動の語りかけは既存の「本人が開く／余裕があるときだけ」の設定を優先する。成功への短い反応を、毎回の通知や操作の妨げにしない。

## 2. import形式

受入v1はCodex custom petのv2形式。必須ファイルはUTF-8のpet.jsonと、そこに指定されたspritesheet.webpまたはspritesheet.png。既存のカスタムペットは利用者が選択して持ち込む。Codexアプリ内蔵素材の抽出・再配布はこの機能に含めない。

```json
{"id":"my-pet","displayName":"My Pet","description":"街を一緒に探索する相棒","spriteVersionNumber":2,"spritesheetPath":"spritesheet.webp"}
```

画像は8列×11行、1セル192×208、全体1536×2288、透過ありの静止PNG/WebP atlas。アニメWebP/GIF/SVG、外部URL、スクリプトは受け付けない。上記は生成工程の中間画像ではなく完成atlasの形式。ペットの名前・絵・動きは移せるが、Codexの会話、アカウント、人格設定、記憶、実行権限は含まれない。

v2以外はUNSUPPORTED_MEDIA_TYPEで理由を表示し、現在設定を保持する。追加形式を受け入れるときはdecoderを追加し、内部PetPackageへの変換を定義する。現decoderに曖昧な自動推測を入れない。

初期上限：JSONは64KiB、画像は5,000,000 bytes（既存Asset uploadの5MB上限と共通）、ZIPは6MiB、展開総量は6MiB、通常ファイルは2件まで。画像寸法はdecode後に確認する。絶対パス・..・symlink・入れ子ZIPを拒否し、任意のローカルパスを読まない。ZIPは限定されたメモリ/作業領域で処理し、importされたコードは実行しない。

ブラウザでJSON/ZIPを読み、画像だけ既存uploadAssetへ送る。その後importPetへmanifest・atlasAssetId・画像のSHA-256を送る。serverが本人のasset所有・Content-Type・実寸法・透過・使用セル・空セルを再検査する。選択者の自己申告で検査成功にしない。既存asset導入時の上限もPET-002の受入上限に合わせる。失敗で残った未参照assetは明示的なcleanup対象とし、他の写真を削除しない。

## 3. 動作とイベント

| 行 | 状態 | 使用コマ数 | コマ時間ms |
|---|---|---|---|
| 0 | idle | 6 | 280,110,110,140,140,320 |
| 1 | running-right | 8 | 最初の7コマ120、最後220 |
| 2 | running-left | 8 | 最初の7コマ120、最後220 |
| 3 | waving | 4 | 最初の3コマ140、最後280 |
| 4 | jumping | 5 | 最初の4コマ140、最後280 |
| 5 | failed | 8 | 最初の7コマ140、最後240 |
| 6 | waiting | 6 | 最初の5コマ150、最後260 |
| 7 | running | 6 | 最初の5コマ120、最後220 |
| 8 | review | 6 | 最初の5コマ150、最後280 |
| 9–10 | 視線16方向 | 各8 | 0°は上、時計回り22.5°刻み。ニュートラルはidle |

イベントはCompanionEventsPortを通す。AIや記録featureがrendererを直接importしない。processing→running、needs-input→waiting、reply-ready→review、discovery→waving、record-saved→jumping、failed→failed、その他→idle。イベントに会話本文や健康値を入れない。

同一eventIdは一回、sequenceが古いイベントは破棄。jobIdが異なる古い完了は現在処理を上書きしない。有効期限後はidleへ戻す。失敗/待機/処理中が同時なら失敗→待機→処理中→短い反応の優先とし、終了したjobから継続イベントを発行しない。short reactionは一巡のみ。背景タブ・非表示では再生停止、reduced-motionでは状態ごとの静止コマを使う。視線は装飾であり位置記録へ影響しない。

## 4. 接続点

- UI：src/features/pets/entry.tsx、src/features/companion/entry.tsx。
- client event service：src/client/services/companion-events/entry.ts。新しいclient-service収集規則はdocs/spec/ENTRY_CONTRACT.mdを参照。
- renderer：src/companion/renderers/codex-v2/。PetRendererPortを実装する。将来の3D rendererも同じ入力を受けるが、別asset形式を追加するまでは未対応。
- API：server/features/pets/、server/features/pet-generation/。
- 純粋な検査：shared/logic/pet-package/。PetPackagePortを提供する。
- 画像生成：server/adapters/pet-image-generation/。PetImageGenerationPortを提供し、登録済みproviderIdだけ選択できる。
- 組立て：src/integrations/int-017/、server/integrations/int-017/（importと相棒）、int-018/（生成）。アプリ起動に両方の完成を要求しない。

GET /pet-generation-providersで未接続を説明できる。選択したproviderが未接続なら生成ボタンを無効にし、既存ペットのimport・選択は使える。外見を表示するだけの代替アイコンを「生成できた」と扱わない。

## 5. APIと保存

正本はcontracts/openapi.yaml、contracts/companion-health.ts、db/schema.sql。各pathは/api/v1を前置する。

| operationId | メソッド・path | 入出力の中心 |
|---|---|---|
| listPets / getPet | GET /pets、/pets/{petId} | 本人のPetPackage |
| importPet | POST /pets/imports | manifest、atlasAssetId、expectedContentHash→検査済みPetPackage |
| exportPet | GET /pets/{petId}/export | manifest＋atlasAssetId＋hash。既存getAssetContentで画像を取得し、clientが2ファイルZIPへ組む |
| deletePet | DELETE /pets/{petId} | revision照合。使用中ならprofileを未選択にし、他の画像参照を保持 |
| getCompanionProfile / putCompanionProfile | GET/PUT /companion-profile | 未作成GETはnull。PUT expectedRevision=0は新規作成だけ、既存なら409 |
| listPetGenerationProviders | GET /pet-generation-providers | 接続能力一覧 |
| createPetGeneration / getPetGeneration | POST /pet-generations、GET /pet-generations/{generationId} | 入力、provider、進捗、候補ID |
| cancelPetGeneration / reviewPetGeneration | POST /pet-generations/{generationId}/cancel、/review | revision照合、取消または候補の採用/却下 |

pet_packagesは画像asset参照と検査結果、companion_profilesは本人の選択、pet_generation_jobsは生成工程と候補を保存する。画像bytesをDBのJSONへ埋めない。manifestの外部idは表示/持出し用で、DBのpetIdとは別。異なる所有者の同名ペットを混同しない。contentHashは画像bytesのSHA-256。画像hashとmanifestの両方が同じownerの既存packageと一致する場合は再利用できる。opIdの再送で二重登録しない。

生成の流れはqueued→running→awaiting-review→succeeded。失敗・取消・unsupportedは明示終端。再生成は新しいjobとして旧候補を保持する。採用操作後に初めてcandidateをreadyにし、相棒への設定変更は別操作。取消後に届いたprovider結果は採用しない。

制作手順はキャラクターの基準画像→各状態→視線→atlas組立て→形式検査→利用者のプレビュー確認。hatch-petの形式・検査知見は再利用できるが、そのCodexセッション専用imagegen能力がアプリへ自動移植されるとは扱わない。接続済み画像生成adapter、または外部制作した完成ファイルのimportで実現する。必要な課金・契約を無断で有効化しない。

## 6. 受入

PET-REQ-001 import、002再表示/持出し、003AI状態の表示、004選択/非表示、005生成接続、006候補確認/取消、007将来rendererの追加を要件IDとする。詳細な受入とTask対応はFULL_REQUIREMENT_MATRIX.csv。

形式不正・壊れた画像・未知version・他人のasset・同じopId再送・使用中削除・再読込み・動きを減らす・AI取消後の古い完了を確認する。生成のmoduleはfixtureで検査できるが、INT-018の完了には実画像生成と成果物のimport/表示が必要。import側INT-017は画像生成の完成を待たない。

出典：ローカルhatch-petのv2形式とanimation-rows.md、2026-09-09に確認したカスタムペットのpet.json構成。特定のキャラクター画像はこの仕様に同梱していない。
