# P-RUNTIME：起動し、同じ本人領域でAPI・DB・画像を保存して読み直せる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

空のアプリを開く → 本人領域を選ぶ → APIでデータと画像を保存する → DBを再openして同じJSON/bytes/MIMEを読む → 領域を切り替えて旧応答を拒否する。

## 依存と担当範囲

着手依存：P-START
接続時の依存：P-DIARY
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `bun.lock`
- `db/seed/`
- `docs/evidence/MEDIA-HTTP-001/`
- `docs/evidence/TEST-002/`
- `docs/learnings/LRN-DEV-001-test-database-isolation.md`
- `docs/learnings/LRN-MEDIA-HTTP-001-binary-response.md`
- `fixtures/core/`
- `index.html`
- `mise.toml`
- `package.json`
- `server/core/changes/`
- `server/core/mutation/`
- `server/db/`
- `server/features/assets/`
- `server/features/context/`
- `server/index.test.ts`
- `server/index.ts`
- `server/integrations/int-009/entry.test.ts`
- `src/api/`
- `src/app/`
- `src/features/context/`
- `src/test/`
- `src/ui/`
- `tsconfig.json`
- `vite.config.ts`

## 読む契約

- `contracts/domain.ts`：GetAssetResponse, GetBootstrapResponse, GetChangesResponse, GetHealthResponse, PutContextRequest, PutContextResponse, UploadAssetResponse
- `contracts/operations.ts`：getAsset, getAssetContent, getBootstrap, getChanges, getHealth, putContext, uploadAsset
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：getAsset, getAssetContent, getBootstrap, getChanges, getHealth, putContext, uploadAsset
利用するoperation：
対応要件：CORE-001, CORE-002, CORE-004, DATA-001, DATA-008, DATA-011, DISC-007, EVAL-007, NAV-001, NAV-002, NAV-005, NAV-007, NAV-009, NEW-001, NEW-002, NEW-010, OPS-001, OPS-004, REC-001, REC-002, REC-006, REC-009, SELF-012, SOC-008

## 固有の受入条件

- 空状態を開く。未実装機能へ遷移しても成功表示で偽装しない。getHealthが実状態を返す。
- 同一opIdは同一結果。別payloadは409。途中例外で全rollback。同名idを別namespaceに保存できる。
- 409後も入力が残り、最新値との比較を表示。ライブ失敗をfixtureへ自動切替しない。
- seedを2回適用して重複しない。実店舗・道路・運賃でない旨がデータごとに残る。
- 390px幅で原文が読める。live/user/sample/importedとAI実行モードを別表示。
- 場所変更後に戻ると草稿・カメラが戻る。別場所のAI結果を現在地へ誤保存しない。
- 禁止画像型を拒否。静的public配下へ原写真を出さない。
- 実HTTPで画像upload→metadata→contentを通し、返却bytesとupload bytes、許可画像MIME、5MB境界、不正画像型拒否、他actor取得不可、通常JSON応答の維持を確認する。fakeだけで接続完了にしない。
- 空のcheckoutでmise exec -- bun run testをfile並列のまま連続2回実行し、registry.test.tsとINT-009を含む全suiteが成功する。各workerのDB pathが衝突せず、製品buildと明示file DBの再open確認も成功する。--no-file-parallelismで隠すだけ、既存data fileの事前削除、失敗suiteの除外では完了にしない。

## 同じ担当が実装・接続する内容

- FND-001：docs/spec/ENTRY_CONTRACT.mdのdefault exportを収集する。UI・server・integration・service entryを分け、重複ID/operationと未解決capabilityを検査。未接続は無効化する。 v2.2のoptional client-serviceとai-task descriptor、companion-overlay/settings-panel/health-panelを収集する。未実装providerで本体起動を止めない。
- FND-002：db/schema.sqlを一括適用。transaction内だけ書くDbPortを実装。複合外部キー・opId・changed/invalidatedを扱う。
- FND-003：contracts/operations.tsのOperationMapから型付きAPI clientを実装。path/query/bodyを分離し、操作とDTOを一致させる。opIdは論理操作開始時に一度生成し再送で保持、expectedRevisionは編集開始時の対象版を保持する。
- FND-004：サンプル12地点・道graph・異なる理由・同じ候補集合・3テーマ入力を、contractsの型どおり生成。
- UI-001：Sheet、Button、Field、SourceBadge、ErrorStateをpropsだけで作る。画面routerやDBは触らない。
- UI-002：AppContextのIDを画面間で運ぶ。draftはlocal、確定文脈はDB。bootstrapは全DBを返さない。
- MEDIA-001：multipart・hash・メタデータとprivate保存先を分離。5MB/枚を初期制限。
- MEDIA-HTTP-001：getAssetContentのUint8Arrayを保存済みの許可画像MIMEとともにbinary HTTP応答へ接続し、既存JSON応答・認可・エラー変換を維持する。
- TEST-002：Vitest workerがserver/index.tsをimportしても既定data/sodateru-map.sqliteを共有しないテスト用DB境界を設ける。製品起動時のfile DB、個別fixture DB、SODATERU_DB_PATHを明示する統合テストの意味は変えない。

## 該当する再発防止

- R01：health/bootstrapは実catalogの能力を使用する。AIのprobe-ready、実task実行、INT receiptを区別し、未登録AIでも本体を起動する。 HTTPの既知errorは契約statusへ写し、JSON bodyはparameterの型変換と分離して非破壊で検査する。対向catalogのmanifest・wire IDも照合する。
  - 拒否例：fixture handler・古いbuild receipt・未設定AIをavailableへ上げない。 数値originalTextを文字列へ変換して受理せず、REVISION_CONFLICTを一律500へ変えない。
- R04：C2の共通ケースを基盤で検証し、各UIは現在scope・request identity・abortを既存境界で照合する。 草稿保存を持つUIは、保存開始時のtext snapshotと成功時の最新draftが一致する場合だけclearし、待機中の追記は未送信のまま再入場後も選択・コピーできる。
  - 拒否例：A→B→A、reset、unmount後の旧応答を表示・保存しない。 保存待ち中に追記して成功させても新しい原文を消さない。遅着テストは旧Promiseが実際にresolveして処理を完了したことまで確認する。
- R15：現在grantと最新Evidenceから読み直して投影し、非許可fieldはnull/空配列にする。同じinput/grant版の拒否mappingは保存層で除外する。
  - 拒否例：許可取消後の原文・写真流出、保存した拒否の再提示を拒否する。
- R16：本人ごとに所有する同一順序placeIdsを使い、忠実さ/本人適合/実行可能性を別々に記録する。
  - 拒否例：rules scoreを成功確率や実利用者評価とせず、unknown道路・運賃をゼロにしない。
- R19：HTTP hostで同じ認可文脈の保存metadataとbytesからraw response/MIMEを返す。
  - 拒否例：PNG byteとContent-TypeをHTTPで一致させ、他actorはbytes読取り前に拒否する。
- R20：実在actorと設定contextをseedし、C3の表宣言・除外理由・同scope resetを操作として確認する。
  - 拒否例：原文/provenance表のreset漏れ、空actor、unknown health-derivedのexport混入を拒否する。
- R27：標準runnerの収集とNode/Bunを明示分離し、テストworkerへ一時DBを注入する。file再open受入は残す。 提出するtestの命名・配置・環境指定が標準runnerの収集対象であることを確認し、独自configだけの成功を提出しない。
  - 拒否例：型cast、suite除外、常時直列化、既定DB事前削除で失敗を隠さない。
- R30：fixtureは実部品をmountし、狭幅寸法と閉じる・再試行操作によるstate変化を確認する。 StrictModeのeffect cleanupは取消として処理し、利用者向け失敗表示にしない。通常mountと再mountの操作結果を確認する。
  - 拒否例：静的スクリーンショットだけを実部品の受入証拠にしない。
