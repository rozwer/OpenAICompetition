# SQLite DB仕様 v2

## 1. 正本と実行環境
SQLiteを唯一の正本とし、JSONはexport/seed/HTTP輸送に使う。`db/schema.sql`を空DBへ1回適用する。38業務テーブル＋4制御テーブル＝42（SQLite内部sequence表は除く）。`DB_COLUMNS.csv`は業務テーブルの481列についてHTTP field、SQL型、null可否、nested schema、FKを示す。テーブルを全部UI化する前提ではなく、1回のDDLで空の領域を確保する。

Node 22.22.1組込み `node:sqlite` のDatabaseSyncを選ぶ。この版ではExperimentalであり、本番推奨の主張ではない。[V2-S1] 既存の外部ORMやnative addonを立上げずに短いtransactionとFKを利用するためのコンペ向け判断。Bunはinstall/script起動に使い、APIプロセスはNodeで動かす。複数Nodeが同じファイルを無秩序に書く構成は採らない。

接続ごとにforeign_keys=ON、busy_timeout=3000を設定し、ファイルDBはWAL。SQLiteは同時に1writerであり、DBが並列コード開発を直列化するわけではない。[V2-S2] AI待機をtransactionの外に出す。PRAGMA値はデータ競合対策であり、開発時間割ではない。

## 2. 共通列
全業務entityはnamespace_id,id,revision,created_at,updated_at,source_modeを持つ。PKは(namespace_id,id)。actor所属のentityは(namespace_id,actor_id)のFKで同namespaceを保証する。IDを全世界一意と仮定してnamespace条件を省略しない。

revisionはentityごとの楽観ロックで1から。timestampsはアプリがUTC RFC3339を生成する。SQL DEFAULTで架空の日時/情報源を埋めない。enum・数値範囲・bool・json_validはDDLで検査し、JSON内部のfield/ID/単位はschemaとサービスで検査する。

nested構造は `_json TEXT` に格納するが、自由な辞書ではない。例：places.facts_jsonはPlaceFacts、experiences.context_jsonはContext、ai_jobs.scope_jsonはScope。JSON内のID配列すべてにSQL FKがあるわけではないので、同namespace・所有・grant参照をアプリ境界で検証する。純関数へ渡す前にJSON Schemaで復号値を検査する。

## 3. 全業務テーブル
| table | API DTO | 列数 | 主な複合FK |
|---|---|---|---|
| actors | Actor | 8 | namespaceのみ |
| settings | Settings | 14 | actors(namespace_id,id) |
| app_contexts | AppContextEntity | 8 | actors(namespace_id,id) |
| sources | Source | 10 | namespaceのみ |
| buildings | Building | 11 | sources(namespace_id,id) |
| places | Place | 16 | buildings(namespace_id,id) |
| evidence | Evidence | 11 | actors(namespace_id,id), assets(namespace_id,id), sources(namespace_id,id) |
| observations | Observation | 15 | actors(namespace_id,id), sources(namespace_id,id) |
| visits | Visit | 12 | actors(namespace_id,id), places(namespace_id,id) |
| experiences | Experience | 17 | actors(namespace_id,id), evidence(namespace_id,id), places(namespace_id,id), visits(namespace_id,id) |
| corrections | Correction | 13 | actors(namespace_id,id), evidence(namespace_id,id), experiences(namespace_id,id) |
| correction_previews | CorrectionPreview | 12 | actors(namespace_id,id) |
| interpretations | Interpretation | 14 | actors(namespace_id,id), ai_jobs(namespace_id,id), experiences(namespace_id,id) |
| profile_hypotheses | Hypothesis | 14 | actors(namespace_id,id) |
| preferences | Preference | 11 | actors(namespace_id,id) |
| candidate_sets | CandidateSet | 11 | actors(namespace_id,id) |
| route_plans | RoutePlan | 16 | actors(namespace_id,id) |
| passes | Pass | 14 | actors(namespace_id,id) |
| quests | Quest | 10 | actors(namespace_id,id), route_plans(namespace_id,id) |
| share_grants | ShareGrant | 13 | actors(namespace_id,id) |
| comparisons | Comparison | 12 | actors(namespace_id,id) |
| recipes | Recipe | 12 | actors(namespace_id,id) |
| transfer_plans | TransferPlan | 16 | actors(namespace_id,id), candidate_sets(namespace_id,id), recipes(namespace_id,id), route_plans(namespace_id,id) |
| joint_plans | JointPlan | 11 | actors(namespace_id,id), route_plans(namespace_id,id) |
| feedback | Feedback | 15 | actors(namespace_id,id), experiences(namespace_id,id), transfer_plans(namespace_id,id) |
| discovery_cards | DiscoveryCard | 16 | actors(namespace_id,id) |
| discovery_events | DiscoveryEvent | 10 | actors(namespace_id,id), discovery_cards(namespace_id,id) |
| interests | Interest | 10 | actors(namespace_id,id), discovery_events(namespace_id,id) |
| diaries | Diary | 13 | actors(namespace_id,id), ai_jobs(namespace_id,id) |
| assets | Asset | 11 | actors(namespace_id,id) |
| extensions | Extension | 11 | actors(namespace_id,id) |
| extension_versions | ExtensionVersion | 13 | actors(namespace_id,id), extensions(namespace_id,id) |
| extension_installs | ExtensionInstall | 12 | actors(namespace_id,id), extension_versions(namespace_id,id), extensions(namespace_id,id) |
| extension_runs | ExtensionRun | 12 | actors(namespace_id,id), extension_versions(namespace_id,id) |
| source_snapshots | SourceSnapshot | 14 | sources(namespace_id,id) |
| repair_proposals | RepairProposal | 14 | actors(namespace_id,id), source_snapshots(namespace_id,id), sources(namespace_id,id) |
| ai_jobs | AiJob | 15 | actors(namespace_id,id) |
| development_requests | DevelopmentRequest | 14 | actors(namespace_id,id) |

## 4. 制御テーブル

| Table | 列 / 制約 | 用途 |
|---|---|---|
| namespaces | id TEXT PK, kind user/demo, canonical_revision INTEGER>=0, seed_version nullable | 本人とサンプルを分離、派生の入力版 |
| request_dedup | namespace_id,actor_id,op_idがPK; payload_hash TEXT,http_status INTEGER,response_json TEXT,created_at TEXT; actorへFK | 同じ操作の再送に初回結果を返す |
| change_events | sequence INTEGER PK AUTOINCREMENT,namespace_id,actor_id,canonical_revision,changed_json,invalidated_json,created_at | commit済み変更を順序付き通知 |
| asset_storage | namespace_id,asset_idがPK/FK; relative_path TEXT | 公開しない画像ファイル場所 |

schema.sql内で追加indexを固定済み。settings/app_contexts/preferencesは(namespace_id,actor_id)をunique。観測は(namespace,actor,source,source_record_id)をunique。関心は(namespace,actor,concept)、導入は(namespace,actor,extension)、拡張版は(namespace,extension,version_tag)をuniqueにする。

## 5. 記録transactionの具体例

1. scope・placeを確認。originalText→Evidence行を作り、Visit指定があればconfirmed Visitを作る。
2. Experienceにoriginal_evidence_idを持たせ、purpose/reason/contextを分けて保存する。
3. correction時はcurrent revisionを照合しbefore/afterをCorrectionへ、Experienceの対象fieldだけを更新する。
4. namespace canonical_revisionを1増加しchange_eventsとrequest_dedupを同一commitで保存する。
5. Meaningは正本のquery投影。仮説と候補の保存済み計算はinputRevision/参照版で古さを検出する。原文を派生結果で上書きしない。

```sql
BEGIN IMMEDIATE;
UPDATE experiences
SET reason = ?, revision = revision + 1, updated_at = ?
WHERE namespace_id = ? AND id = ? AND revision = ?;
-- changes()が0ならROLLBACKし409。続けてCorrection/changed/dedupを保存。
COMMIT;
```

上は楽観更新の部分例であり完全handlerではない。実行可能なtransaction/dedup参考は `db/mutation-reference.mjs`。FKとsingleton/uniqueはDDLに、意味的整合はfeature handlerに分担する。

## 6. 更新・削除・再計算
FKは同namespaceの参照を保つ。全削除へCASCADEを広く付けて他人の体験を消すことはしない。本文削除と参照tombstoneの規約はAPI_CONTRACTの削除節。job・preview・recipe・transferの参照版は明示保存して古いものの適用を拒否する。

seedは `examples/seed-core.json` の最小actor/settings/context/preferenceから始める。fixtureの2都市/他者/道路はFND-004/POOL taskが拡張する。ここに含まれる緯度経度や場所名はサンプルで現実案内のデータではない。resetでnamespaceのrevisionを0へ戻さない。

既存DBへの再実行はしない。FUT02のmigrationではschema_versionを管理してexport→新DB→検証→切替を行う。JSON snapshotを無理に経由して毎mutationで全DBを書き出す実装は廃止。将来DBのJSON配列を中間tableへ正規化する時もHTTP DTOを保持し、adapterのみ変更できる。
