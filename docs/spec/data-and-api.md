# 育てる地図：データとAPIの実装契約

版：1.0 / 更新日：2026年9月5日\
状態：[詳細仕様書](implementation.md)に対応する設計案。マイグレーションとAPIの実装は未着手。

データの正本、型、権限、更新単位をこの文書に定める。
記録から本人の説明、解釈、比較、提案へ至る参照を追い、訂正や共有取消を反映できる形にする。

## 1. すべての私有データに所有者・空間・版を持たせる

`space`はデータを分離する実行領域である。
通しデモでは一つのspaceを使い続け、場面が進んでも作り直さない。
途中の保存状態から独立して再開する場合だけ新しいspaceを作り、既存の会話や他のデモ実行を上書きしない。
ユーザーはSupabase AuthのUUIDで識別する。
地域IDと入力元の外部IDを除き、アプリ内のIDはUUIDとする。

時刻はUTCのISO 8601、DBは`timestamptz`、表示はAsia/Tokyoを既定とする。
位置はWGS84、GeoJSONの座標順は`[経度, 緯度]`、距離はメートル、時間差は秒とする。
不明な値は`null`にし、0や空文字で代用しない。
APIはsnake_case、TypeScript内部は変換境界を設けてcamelCaseを使ってよい。

### 1.1 保存の骨格

| 表 | 必須の列と制約 |
|---|---|
| `profiles` | `id=auth.users.id, display_name, created_at` |
| `spaces` | `id, mode(demo/personal), created_by, scenario_key?, created_at` |
| `space_members` | `space_id, user_id, role(participant/operator)`。組合せを一意にする |
| `owner_states` | `space_id, user_id, data_revision, access_revision`。ジョブ公開時の照合に使う |
| `resources` | `id, space_id, owner_id, kind, current_revision, status, created_at, updated_at, deleted_at?` |
| `resource_versions` | `resource_id, revision, payload, schema_version, origin, execution_meta?, created_by, created_at`。IDと版を複合主キーにする |
| `resource_dependencies` | `derived_id, derived_revision, source_id, source_revision, required_fields[], source_locator?`。両端を版への外部キーにする |
| `regions` | `id(text), name, bounds, center, manifest_uri, dataset_version` |
| `places` | `id, region_id, external_refs, name, kind, geometry, building_id?, level_id?, dataset_resource_id, dataset_revision` |
| `levels` | `id, building_id, label, ordinal?, footprint?, min_height_m?, max_height_m?, evidence_ref` |
| `level_connections` | `id, from_place_id, to_place_id, from_level_id?, to_level_id?, kind(entrance/stairs/elevator/ramp), geometry?, evidence_ref` |
| `observations` | `id, space_id, owner_id, source_id, source_record_id, observed_at, received_at, position, accuracy_m?, altitude_m?, sequence?, origin` |
| `media` | `id=resources.id, space_id, owner_id, storage_path, mime_type, byte_size, captured_at?, location?, origin, revision`。media resourceの検索用投影 |
| `share_grants` | `id, space_id, owner_id, recipient_id, revision, state(active/revoked), created_at, revoked_at?` |
| `share_items` | `grant_id, resource_id, fields[], granularity`。所有者が指定した項目だけを公開する |
| `shared_projections` | `grant_id, grant_revision, resource_id, resource_revision, permitted_payload` |
| `jobs` | `id, space_id, actor_id, kind, target_id?, state, input, input_hash, source_revisions, access_revisions, attempt, lease_until?, result_ref?, error?, created_at, updated_at` |
| `job_executions` | `id, job_id, attempt, provider, state, thread_id?, turn_id?, response_id?, process_session_id?, resume_state, limits, started_at, finished_at?, cancel_requested_at?` |
| `job_input_requests` | `id, execution_id, provider_request_id, request_type, payload, state(pending/answered/expired), response?, created_at, expires_at`。実行IDと要求IDを一意にする |
| `job_events` | `job_id, sequence, event_type, payload, created_at`。ジョブ内連番を一意にする |
| `space_events` | `space_id, sequence, event_type, audience_ids[], payload, created_at`。space内連番を一意にする |
| `demo_runs` | `id, space_id(unique), scenario_key, actors, checkpoint_version, created_by, created_at`。通し実行と途中再開を識別する |
| `demo_replays` | `id, run_id, source_fixture, fixture_hash, state(ready/running/paused/stopped/completed), speed, cursor, observed_time?, next_delivery_at?` |
| `idempotency_records` | `space_id, actor_id, method, path, key, body_hash, status_code, response, expires_at` |

`origin`は`device / imported / user_report / synthetic / public_source / model`のいずれかとする。
再生は入力方法であり、元の観測が実測か合成かは`origin`で別に保持する。
JSONの`payload`は後述する種類別Schemaで検証する。
私有データの版は追記し、現在値の参照と検索用の列を同じトランザクションで更新する。
検索用の形状・時刻・用途の索引を追加してよいが、原文と根拠を上書きしない。
公開地理データの`dataset`だけは`space_id`と`owner_id`をともに`null`とし、取込み処理だけが更新する。
他のkindは両方を必須とするCHECK制約を設ける。
施設、階、接続の正本はdatasetが指すチェックサム付きファイルとし、各表を検索・描画用の投影として扱う。
これらの根拠参照はdatasetのID・版とファイル内の項目パスを持つ。
写真はmedia resourceのID・版、記録点はそれを含むtraceのID・版と観測IDを参照する。
これにより、`ResourceRef`と依存関係の両端を必ず`resource_versions`へ結び付けられる。

### 1.2 DB制約と索引

`observations`は`(space_id, owner_id, source_id, source_record_id)`を一意にする。
時系列取得用に`(space_id, owner_id, observed_at)`、空間取得用にgeometryのGiST索引を作る。
緯度は−90〜90、経度は−180〜180、精度は0以上、版は1以上とする。
同じresourceの新版作成は行ロックと期待版の確認後に行う。
版と依存参照は、同じspaceか参照可能な公開データに限定する。

DBの行ごとに閲覧・更新を制限するRLSは、認証済みの所有者とspace所属を基本とする。
相手の私有表をそのままSELECT可能にせず、共有項目を投影した`shared_projections`を返す。
publicな施設情報と個人の訪問・理由を別の表に保つ。
ワーカーの処理でも利用者の権限を再確認し、管理キーを共有情報の読取り判定の代わりに使わない。

## 2. 記録、体験、場所との関係を別の種類として保存する

以下は`resources.kind`に対応するpayloadの契約である。
`?`は省略可能ではなく、値が不明なら`null`を許すフィールドを示す。配列は空配列を許す。
API入力で省略できるフィールドは各APIの記述に従う。

| kind | payloadの主要フィールド |
|---|---|
| `dataset` | `region_id, version_label, files[{path, sha256, format}], source_urls[], attribution, retrieved_at, coordinate_system`。公開地理データだけに使用 |
| `media` | `storage_path, mime_type, byte_size, sha256, captured_at?, location?, linked_place_ids[]` |
| `trace` | `observation_ids[], segments[], gaps[], source_id, started_at?, ended_at?, provenance` |
| `visit` | `place_id?, level_id?, state(candidate/confirmed/rejected), candidate_place_ids[], observation_ids[], confirmed_by_message_id?, reported_at?, arrival_at?, departure_at?` |
| `experience` | `place_ids[], trace_id?, visit_ids[], started_at?, ended_at?, purpose_text?, context, memory_text?, media_ids[], evidence_refs[]` |
| `relation` | `target, purpose_text, reason_text?, context, evidence_refs[], assertion_type(reported/hypothesis/confirmed), valid_from?, valid_until?, supersedes?` |
| `interpretation` | `type(hypothesis/tendency), target_refs[], statement, context, evidence_refs[], state(proposed/confirmed/rejected/superseded), valid_from?, valid_until?` |
| `correction` | `target_ref, field_paths[], replacement, scope, reason_message_id, supersedes?, state(active/revoked)` |
| `conversation` | `target, message_ids[], last_sequence, state(open/closed)` |
| `message` | `conversation_id, sequence, role(user/assistant), text, client_message_id?, state(saved/processing/completed/failed), evidence_refs[], generated_result_ref?` |
| `question` | `conversation_id, target, text, intent_key, evidence_refs[], state(open/answered/deferred/skipped), answer_message_id?` |
| `comparison` | `left_user_id, right_user_id, filters, pair_ids[], state(ready/stale/revoked), evaluated_at` |
| `comparison_pair` | `left_relation_ref?, right_relation_ref, relation_type, shared_purpose?, common_points[], differences[], evidence_refs[], state(proposed/accepted/rejected)` |
| `transfer_draft` | `source_experience_ref, region_id, mode, experience_spec, constraints, edited_by_user` |
| `recommendation` | `draft_ref, candidate_ids[], selected_candidate_id?, rejected_candidates[], state(ready/no_candidates/stale/revoked), evaluation_version` |
| `route_candidate` | `waypoints[], geometry, distance_m, walking_seconds, staying_seconds, fidelity, personal_fit, coverage, preserved[], changed[], missing[], evidence_refs[], route_provider, route_request_hash` |
| `feedback` | `recommendation_ref, candidate_id?, outcome(visited/skipped), text, expectation_match?, experience_id?, correction_ids[]` |
| `feature` | `name, description, original_feature_ref?, latest_version_id` |
| `feature_version` | `feature_id, manifest, parent_version_id?, state(draft/generating/awaiting_input/validating/validated/failed/cancelled), artifact_ref?, artifact_hash?, validation_report_ref?` |
| `feature_install` | `feature_id, version_id, enabled, granted_capabilities[], granted_fields[]` |
| `feature_result` | `version_ref, install_ref?, input_refs[], input_hash, output, execution_mode, duration_ms, result_hash`。初回プレビューはinstallなし |
| `source` | `name, category, adapter_type, endpoint, allowed_hosts[], schedule_seconds, semantic_contract, stale_after_seconds, active_adapter_version_id?, latest_snapshot_id?, last_success_at?, health_state, last_failure_job_id?, last_error?` |
| `source_snapshot` | `source_id, input_hash, raw_artifact_ref, items[], observed_at?, published_at?, fetched_at, valid_until?, validation_report_ref, adapter_version_id` |
| `source_adapter_version` | `source_id, artifact_ref, artifact_hash, validation_suite_ref, state(candidate/validated/active/superseded/failed)` |
| `validation_suite` | `target_kind, schema_ref, immutable_case_refs[], semantic_checks, suite_hash` |
| `validation_report` | `suite_ref, artifact_hash, input_hashes[], checks[], outcome(passed/failed/held), executed_at` |
| `artifact` | `storage_path, mime_type, byte_size, sha256, provenance, dependency_lock_hash?` |

位置記録の`received_at`と訪問の到着・出発は別の値である。
訪問時間が分からない場合、最初と最後の記録点を確定した滞在時間として代入しない。
本人が過去の体験を語った場合も、正確な日時がなければ空のまま保持する。
traceには`segmentation_config, config_version`も保存し、点の分断と訪問候補に使った閾値を追えるようにする。
区間速度は2点間の測地距離を観測時刻の差で割る。時刻差が0以下の区間は結ばず、120秒の滞在判定は連続する候補点の最初と最後の観測時刻で行う。
情報源の`latest_snapshot_id`は最後に検証・反映できたsnapshotだけを指す。失敗した入力は失敗ジョブのartifactに保存し、この参照と`last_success_at`を更新しない。
古さは現在時刻とsnapshotの有効期限・情報源の`stale_after_seconds`から導出し、取得エラーと別に返す。

### 2.1 共通する値型

```typescript
type ResourceRef = {
  id: string;
  revision: number;
  fields: string[];
  locator: { file_path: string; feature_id: string } | null;
};

type Target =
  | { type: 'place'; id: string; level_id: string | null }
  | { type: 'trace' | 'experience' | 'comparison_pair'; id: string };

type Context = {
  day_types: Array<'weekday' | 'weekend'>;
  time_bands: Array<'morning' | 'afternoon' | 'evening' | 'night'>;
  weather: string[];
  companions: string[];
  moods: string[];
  trip_purposes: string[];
};

type CorrectionScope = {
  experience_ids: string[];
  conditions: Context;
  valid_from: string | null;
  valid_until: string | null;
};
```

`fields`は参照するpayload内のJSON Pointerの配列とする。共有APIの項目名は別の許可リストであり、サーバーが種類ごとのパスへ展開する。
公開datasetのファイル内項目は、`locator`にmanifestのファイルパスと安定したfeature IDを記録する。
ファイル外の通常の参照では`locator=null`とする。`fields`のパスとファイル内の位置指定を混同しない。

同じContextフィールド内の複数値はOR、異なるフィールドはANDとする。
空配列はその条件を指定していないことを表す。
観測側の条件が不明な場合、指定された条件を満たしたと判定しない。
訂正は体験指定、条件指定、全体適用の順に狭い範囲を優先し、同じ範囲では本人が作成した新しい有効版を使う。
AIによる条件の追加は仮説として提案し、訂正の適用範囲を黙って広げない。

### 2.2 依存関係と現在値

関係、比較、提案、機能結果には使った版とフィールドを`resource_dependencies`へ保存する。
`resources.current_revision`が変わると依存結果を`stale`にし、再計算ジョブを作る。
AIの文中の参照IDも、実際に渡したIDの集合に含まれることを検証する。
原文や引用を表示する際は、元の資料の共有項目をその都度確認する。

## 3. 更新のトランザクションと共有投影を定める

### 3.1 原文とAIの結果

最初のトランザクションで原文とジョブを保存する。
AI呼出し中にDBトランザクションを開き続けない。
完了時の別トランザクションで所有者の状態行をロックし、`data_revision`と`access_revision`を照合する。
参照した全所有者と実行者の状態行をUUID順にロックする。訂正・共有取消も同じ順序を使う。
本文の変更で`data_revision`、共有の変更で持ち主と受信者の`access_revision`を増やす。
一致した場合だけ抽出結果、回答、依存関係、現在版、完了イベントを確定する。
一致しなければ公開せず、最新入力を使う再試行を最大1回行う。再び変わった場合は`stale_input`を返す。

### 3.2 訂正

対象の期待版を照合し、訂正resource、新しい対象版、現在値への参照、依存結果の無効化を同じトランザクションで保存する。
重なった訂正の有効範囲が判定できなければ422で返し、勝手に両方を全期間へ適用しない。
訂正の取消も新しい版として残し、元の推論を無条件に復活させず再計算する。

訂正APIで変更できるフィールドはkindごとの許可リストに限定する。

| kind | 訂正できる内容 |
|---|---|
| relation | 用途、理由、条件、有効期間 |
| interpretation | 記述、条件、確認状態、有効期間 |
| comparison_pair | 対応の採否、共通点、違い |

visitの確定は専用API、本人の追加説明は新しいmessageで行う。
観測点、原文、公開地理データ、共有権限、機能コードは訂正APIの対象にしない。
`replacement`の型と`field_paths`の一致をSchemaで検査し、依存参照や所有者を変更するパスは拒否する。

### 3.3 共有と取消

共有項目の許可リストは`location / route / purpose / reason / original_text / media / activity_area / feature_definition`とする。
`location`は地点、地域単位、位置非表示を選べる。
`activity_area`は集約ポリゴンを生成し、元の軌跡や住所を同じ応答へ含めない。
理由や原文に位置が書かれている場合、位置フィールドを除くだけでは場所を隠せない。
共有プレビューで文章も確認できるようにする。

共有投影を作る際は参照先まで許可されたフィールドへ限定する。
取消は`share_grants.state=revoked`、共有版の更新、投影の失効、受信者向け派生結果の無効化を一括で行う。
開いている画面には`data.invalidated`を通知する。
キャッシュキーにはspace、閲覧者、権限版、データ版を含め、古いキーから本文を返さない。
メディアと生成結果は認証付きAPIを経由して読み、取消後も使える長期の公開URLを発行しない。

実装の既定では、許可を受けて複製した機能のコードは独立した複製として残す。
元の共有を取り消すと新規の取得・複製は止まるが、複製先の本人の記録は削除しない。
元の非公開データを参照する計算は、複製後も現在の権限で判定する。

## 4. APIの共通形式と失敗の意味を固定する

ベースパスは`/api/v1`。通常のAPIは認証済みセッションを要求する。
spaceはセッションの選択状態から決め、要求されたspaceに所属していることを確認する。
クライアントから任意の所有者を指定して作成・更新するAPIは設けない。
成功は`{data, meta}`、失敗は`{error, meta}`とする。

```json
{
  "error": {
    "code": "revision_conflict",
    "message": "内容が更新されています。読み直してから保存してください。",
    "retryable": false,
    "details": {"expected_revision": 2, "current_revision": 3}
  },
  "meta": {"request_id": "c67d9a41-f0e8-4d48-9d78-7f9381687d80"}
}
```

| HTTP | codeの例 | 動作 |
|---|---|---|
| 400 | `invalid_request` | JSONやパラメータ形式を直す |
| 401 | `unauthenticated` | セッションを再取得する |
| 403 | `forbidden` | 許可された操作へ戻る。私有データの存在を列挙しない |
| 404 | `not_found` | 見つからない、または存在を公開できない対象 |
| 409 | `revision_conflict / idempotency_conflict / stale_input` | 再読取りや新しい入力が必要 |
| 422 | `invalid_evidence / invalid_scope / unsupported_format` | 根拠・条件・形式を直す |
| 429 | `quota_exceeded / too_many_jobs` | 上限と再試行可能時刻を示す |
| 502/503 | `provider_unavailable / integration_not_configured` | 入力を維持して再試行、または接続設定を行う |

認証の開始・終了を除くPOST・PATCHには`Idempotency-Key`を要求する。DELETEも同じ結果を繰り返し返せるようにする。
キーはspace、認証者、method、pathと組み合わせ、24時間保持する。
space作成前のデモ管理APIではspaceの代わりに固定値`demo-admin`と発表者IDを使う。
同じキー・同じ本文は前の応答または同じジョブを返し、本文が違えば409にする。
編集系は`expected_revision`を必須にする。
大量取得はカーソル方式、既定20件、最大100件。位置記録の一括取込みのみ最大1000点とする。

## 5. セッション、地図、記録、対話のAPI

表の入力欄は必須項目を先に書く。「任意」は省略できるフィールドである。
resourceを返すAPIは`id, kind, revision, payload`を共通の外形とする。
生成されたresourceには`execution_meta={job_id, execution_mode, generated_at, provider, input_origins[]}`も返す。元の`resource_versions`へ保存する値であり、画面の再読込みでも失わない。
保存済み結果の提示では元の生成情報を保ち、応答の`meta.delivery_mode=saved_result`を追加する。
地図へ複数の結果を重ねる場合はレイヤーごとにこの情報を返し、画面全体へ一律にライブ表示を付けない。

| method / path | 入力 | 成功時のdataと副作用 |
|---|---|---|
| GET `/session` | なし | user、space、操作権、設定済み接続の状態 |
| POST `/demo/operator-session` | `email, password` | 発表者用の管理セッション。初回ログインだけ未認証を許すが、デモモード・loopback・同一Originは必須 |
| POST `/demo/sessions` | `actor(a/b/new), space_id` | 認証セッションを発行。loopback、デモモード、発表者の操作権が必要 |
| POST `/session/logout` | なし | セッション終了 |
| GET `/regions` | なし | 地域一覧とデータの準備状態 |
| GET `/places/search` | `region_id, q`、任意`cursor, limit` | 施設の候補。私有の記憶は混ぜない |
| GET `/places/:id` | なし | 施設、建物、階、出典。本人に見える関係は別フィールド |
| GET `/buildings/:id/levels` | なし | `levels[]`。ID、表示名、高さ・形状の既知/不明、入口と根拠参照 |
| GET `/levels/:id/connections` | なし | `connections[]`。接続する階・施設ID、種類、形状と根拠参照 |
| GET `/map` | `region_id, bbox, zoom`、任意`from, to, other_user_id, mode, level_id, include_unknown_level` | 地理レイヤー、許可された体験、状態、帰属表示、データ版 |
| GET `/resources/:id` | 任意`revision` | 現在版または指定版。過去版にも現在の共有権限を適用し、失効した派生本文は返さない |
| GET `/conversations` | `target`、任意`cursor, limit` | 対象に結び付いた本人の会話一覧 |
| GET `/conversations/:id/messages` | 任意`cursor, limit` | 時系列のメッセージと質問状態。対象版と現在引用できる根拠を含む |
| POST `/observations/batches` | `source_id, points[]` | 201。accepted、duplicate、trace_id。形式不正があれば全体を422にして不正な配列位置を返す |
| POST `/experiences` | `place_ids, context`、任意`trace_id, visit_ids, text, media_ids, started_at, ended_at` | 201。本人申告の体験を保存 |
| PATCH `/visits/:id` | `expected_revision, state`、任意`place_id, level_id, statement, decision_message_id` | 更新した訪問。確定・拒否の本人の根拠を残す |
| POST `/media` | multipartのfile、任意`captured_at, place_id` | 201。media_id。JPEG/PNG/WebP、最大20MiB。Exifは原データとして扱い、公開用画像から除く |
| GET `/media/:id` | なし | 現在の権限を確認して画像を返す |
| PATCH `/media/:id` | `expected_revision, linked_place_ids` | 原画像を保持して関連する場所の新版を保存 |
| POST `/conversations` | `target` | 201。conversation resource |
| POST `/conversations/:id/messages` | `client_message_id, text, target_revision` | 202。message_id、job_id。原文を保存して解釈を開始 |
| POST `/questions/:id/actions` | `expected_revision, action(defer/skip)` | questionの状態。AI呼出しを伴わない |
| POST `/relations` | `target, purpose_text, reason_text, context, evidence_refs` | 201。本人の説明として関係を追加 |
| PATCH `/relations/:id` | `expected_revision, changes, scope, statement` | 訂正と新版を一括作成 |
| POST `/corrections` | `target_ref, field_paths, replacement, scope, statement` | 201。correction、新版、無効化した対象数 |

画像が位置と関係しない場合は、場所を強制的に推定せず後から関連付ける。
訪問の候補一覧はサーバーが保存し、`GET /resources/:id`で取得する。本人は候補外の実在する施設も`place_id`で選び直せる。
確定には施設IDと、空でない`statement`または本人の発言を指す`decision_message_id`のどちらかを必須にする。
statementを渡した場合は対象に結び付いたmessageを同時作成し、`confirmed_by_message_id`へ保存する。拒否・施設変更の説明も新版の根拠へ残す。
写真の場所の追加・変更は`PATCH /media/:id`に`expected_revision, linked_place_ids`を渡し、原画像を変更せずmediaの新版を作る。
自由文は1メッセージ4000文字、用途・理由の表示用の要約は各300文字を既定上限とする。
原文は表示要約の上限で切り捨てない。

### 5.1 初回起動時の認証

`demo:seed`で発表者用のSupabase Authアカウントを作る。
資格情報はGit管理外の`.local/demo-accounts.json`へ所有者だけが読める権限で保存し、生成したパスワードをログへ出さない。
発表者はS01からこの資格情報で一度ログインし、デモ実行領域を作成してA・Bを選ぶ。
デモ利用者の資格情報もサーバー側で保持し、人物選択時にSupabase Authへサインインして利用者セッションを発行する。
管理用と利用者用は別のHttpOnly・SameSite=Strict cookieにし、人物切替で管理セッションを失わない。
開発時のHTTP接続に限りSecureを外し、公開構成の認証へこの仕組みを持ち込まない。
通常のデータAPIは利用者のJWTだけを使う。管理セッションは人物切替・再生・場面準備を許可するもので、個人データのRLSを迂回しない。
S09のコード・確認要求はジョブの所有者が閲覧し、発表者はその利用者セッションから操作する。
ログアウトは利用者用と管理用をともに破棄する。別プロファイルでは発表者のログインから行う。

### 5.2 位置記録の要求例

```json
{
  "source_id": "demo-a-walk",
  "points": [
    {
      "source_record_id": "point-0001",
      "observed_at": "2026-09-05T08:00:00Z",
      "longitude": 139.7901,
      "latitude": 35.7031,
      "accuracy_m": 8,
      "altitude_m": null,
      "sequence": 1,
      "origin": "synthetic"
    }
  ]
}
```

座標は形式確認用の合成例であり、施設の存在や訪問を証明するデータではない。
入力元IDは空でない文字列、元記録IDは入力元内で安定した値にする。

### 5.3 対話の構造化出力

```typescript
type DialogueResult = {
  reply: string;
  relation_changes: Array<{
    target: Target;
    purpose_text: string;
    reason_text: string | null;
    context: Context;
    assertion_type: 'reported' | 'hypothesis';
    evidence_refs: ResourceRef[];
  }>;
  hypotheses: Array<{
    statement: string;
    context: Context;
    evidence_refs: ResourceRef[];
  }>;
  next_question: {
    text: string;
    intent_key: string;
    target: Target;
  } | null;
};
```

この型から追加プロパティを許さないJSON Schemaを生成する。
モデルによる拒否、途中終了、出力なしを成功とせず、原文保存後のジョブ失敗として扱う。
モデルが指定したIDの存在、本人の訂正との整合、引用可能な項目を検査する。

## 6. 比較・提案・感想・共有のAPI

| method / path | 入力 | 成功時のdataと副作用 |
|---|---|---|
| POST `/comparisons` | `other_user_id, filters` | 202。job_id。結果にcomparisonとpair一覧 |
| GET `/comparisons/:id` | なし | 現在の権限で読める結果。失効済み本文は返さない |
| PATCH `/comparison-pairs/:id` | `expected_revision, decision(accept/reject), statement` | 対応の訂正を保存 |
| POST `/transfer-drafts` | `source_experience_ref, region_id, mode, constraints` | 202。体験の役割と条件を抽出するjob_id |
| PATCH `/transfer-drafts/:id` | `expected_revision, experience_spec, constraints, mode` | 利用者による確認・編集を保存 |
| POST `/transfer-drafts/:id/proposals` | `expected_revision` | 202。探索job_id。結果はrecommendation |
| GET `/recommendations/:id` | なし | 最大3案、評価、根拠、不足条件 |
| POST `/recommendations/:id/selection` | `expected_revision, candidate_id`、任意`reason` | 採用した案と参照版を保存 |
| POST `/feedback` | `recommendation_ref, outcome, text`、任意`candidate_id, expectation_match, correction` | 201。感想と本人申告の体験、訂正、再計算対象を保存 |
| POST `/shares/preview` | `recipient_id, items[]` | 実際に公開される投影。保存は行わない |
| POST `/shares` | `recipient_id, items[], preview_hash` | 201。プレビューと同じ内容の共有を作る |
| GET `/shares` | 任意`direction(sent/received)` | 有効・取消済みの共有一覧 |
| DELETE `/shares/:id` | `expected_revision` | 取消と投影・派生結果の失効。再実行は同じ取消状態 |

`filters`は期間、Context、用途語句を持ち、期間の開始は終了より前とする。
期間は`from`以上・`to`未満で判定し、未指定なら全期間を対象にする。地図の`mode`は`self / other / overlay`、移し替えの`mode`は`their_view / personalized`とする。
comparison_pairの`relation_type`は`same_place_same_purpose / same_place_different_purpose / different_place_same_purpose / other_only`のいずれかとする。
`constraints`は`start_position, max_total_seconds, max_distance_m, stay_seconds_by_role, avoid_steps, required_features, optional_preferences`を持つ。
時間・距離は正の値、候補探索は対象地域の範囲内とする。
経由地が道路から離れすぎる、経路情報に必要な条件がない場合は理由を付けて除外する。
初期の道路への接続許容距離は50mとし、未検証の設計値として調整可能にする。

`experience_spec`は`purpose, roles[], order[], essential_conditions[], transferable_reasons[], nontransferable_memories[]`とする。
各要素に元の本人の説明とAIの解釈を区別する参照を付ける。
役割の順序は循環を許さない。
同じ場所を複数回含む候補は、元の体験仕様にその場所へ戻る順序が明示されている場合だけ許可する。
往路と復路は別の役割IDにし、場所へ戻ることと役割の循環を区別する。
route_candidateの`fidelity`と`personal_fit`は0〜1または`null`とする。
`coverage`は`{fidelity, personal_fit}`を同じ値域で持ち、順位比較では非nullの充足率の平均を使う。両方がnullなら充足率も未評価とする。
各評価は項目、重み、評価値、根拠参照を`evaluation_items[]`に残し、総合値を再計算できるようにする。

## 7. 機能の版と実行の契約

```typescript
type FeatureManifest = {
  schema_version: 1;
  name: string;
  kind: 'configuration' | 'code';
  entrypoint: string | null;
  input_schema: object;
  output_schema: object;
  source_ids: string[];
  requested_fields: string[];
  capabilities: Array<'places.search' | 'routes.walk' | 'knowledge.query' | 'personal.read'>;
  update_policy: { mode: 'on_demand' | 'scheduled'; interval_seconds: number | null };
  validation_suite_id: string;
};

type FeatureOutput = {
  layers: Array<{ id: string; geojson: object; style: object; evidence_refs: ResourceRef[] }>;
  cards: Array<{ id: string; title: string; body: string; evidence_refs: ResourceRef[] }>;
  scores: Array<{ target_id: string; value: number; explanation: string }>;
  warnings: string[];
  custom_view_data: object | null;
};
```

JSON Schemaとして受け付ける種類とサイズを制限し、参照先を外部URLから勝手に取得しない。
地図スタイルは色、不透明度、線幅、記号などの許可項目に限定する。
任意のHTMLを地図のポップアップへ挿入せず、文字列はエスケープする。
出力のGeoJSONは座標、件数、サイズ、対象地域を検査する。

`evaluate`は入力と共通操作を受け、`FeatureOutput`を返す。
コンテナ内の関数は、共通操作の要求をJSONLでstdoutへ出す。
ワーカーは許可を確認し、結果をstdinへ返す。この入出力方式を既定とする。
要求にはrun_id、連番、操作名、引数を持たせる。ワーカーはinstallに許可された操作・項目だけを実行する。
コンテナから任意のホストやURLへ接続する経路を設けない。
タイムアウト、無効な要求、出力上限超過で実行を停止し、現在の機能登録を維持する。

専用表示は、ビルド時に依存をまとめたJSを隔離フレーム内で実行する。
実行時の任意パッケージ取得は行わない。
フレームから親へ渡せる操作は、許可済みの対象選択と描画出力に限る。
生成機能のSchema、共通操作、検証例は契約の版を付け、アプリ更新時に互換性を検証する。

| method / path | 入力 | 成功時のdataと副作用 |
|---|---|---|
| POST `/features` | `request, input_refs[]` | 202。featureと初回候補、生成job_id |
| POST `/features/:id/versions` | `parent_version_id, request` | 202。新しい候補と生成job_id |
| GET `/features/:id` | なし | 許可された定義、版、登録状態 |
| POST `/feature-versions/:id/preview` | `input_refs[]` | 202。検証済み版の実行job_id |
| POST `/feature-installs` | `version_id, artifact_hash, granted_capabilities, granted_fields` | 201。検証結果と権限を再確認して登録 |
| POST `/feature-installs/:id/upgrade` | `expected_revision, version_id, artifact_hash, granted_capabilities, granted_fields` | 200。検証済み新版へ切替。追加の項目・操作の許可も確認 |
| PATCH `/feature-installs/:id` | `expected_revision, enabled` | 有効・無効を切り替える |
| POST `/feature-installs/:id/rollback` | `expected_revision, version_id` | 202。旧版の再確認後に切り替える |
| POST `/features/:id/clone` | `source_version_id, name` | 201。独立した所有者の機能と版を作る |
| POST `/feature-installs/:id/runs` | `input_refs[], parameters` | 202。機能実行job_id |

機能共有は通常の`/shares`で`feature_definition`を指定する。
同じspace・所有者・featureのinstallは一つとし、既存登録への重複POSTは409を返す。新版への切替はupgradeを使う。
初回プレビューの共通操作も要求された項目と所有者の現在の権限を照合し、未許可の共有情報を入力にしない。
機能が要求する情報が新たに増えた版は、元の権限を無条件に引き継がない。
必須のデータ・操作が足りなければ、プレビューで不足を示して有効化を止める。

## 8. 情報源の契約と修復API

`semantic_contract`には座標系、座標順、各量の単位、観測・公開時刻の意味、必須項目、空データの可否、有効範囲を持たせる。
`health_state`は`pending / healthy / fetch_failed / parse_failed / semantic_failed / repair_queued / repairing / validating / awaiting_activation / held`とする。初回検証前は`pending`とする。
情報の共通項目は`geometry, category, label, properties, observed_at, published_at, valid_from, valid_until, source_locator`とする。
`source_locator`はURLと、CSVの行・HTMLのセレクタ・PDFのページなどの参照箇所を保持する。

CSVの列名が変わった場合は新しい列と既存の意味の対応を検証する。
単位・座標系・時刻の意味が変わる場合は、値が数値として読めても自動反映しない。
APIやHTMLの取得先は情報源ごとの許可ホストに限定し、リダイレクト先も検査する。
一般の取得処理からlocalhost、私用アドレス、クラウドのメタデータへアクセスさせない。
デモ用のローカル入力は、別のfixtureアダプターからファイルで供給する。

| method / path | 入力 | 成功時のdataと副作用 |
|---|---|---|
| GET `/sources` | 任意`region_id, category` | 情報源、出典、時刻、取得・保留状態 |
| GET `/sources/:id` | なし | 契約、最新スナップショット、読める検証結果 |
| POST `/sources` | `definition, semantic_contract` | 201。所有者用の候補情報源を登録。初回検証後に有効化 |
| POST `/sources/:id/refresh` | `expected_revision` | 202。取得と検証のjob_id |
| POST `/sources/:id/repairs` | `failure_job_id` | 202。同じ失敗の重複を避けて修復job_idを返す |
| POST `/source-adapter-versions/:id/activate` | `artifact_hash, validation_report_id` | 200。所有者または担当者が検証済みの版へ切替 |
| POST `/sources/:id/rollback` | `expected_revision, adapter_version_id` | 202。旧版を再検証して切替 |

新規の情報源や修復候補は、公開前に固定した検証Suiteで確認する。
Suiteを改訂する操作は修復ジョブから切り離し、担当者が理由と根拠を残す。
元のSuiteに失敗した結果を、新しい期待値へ書き換えて成功扱いにしない。

## 9. ジョブ、イベント、再開の規則

```text
queued → running → succeeded
                 → waiting_input → queued
                 → retry_wait → queued
                 → failed
                 → cancelled
                 → stale
```

ジョブkindは`dialogue / comparison / transfer_extract / transfer_search / feature_build / feature_run / source_refresh / source_repair / recompute`とする。
生成物の状態とジョブの実行状態は別に保存する。
ワーカーはPostgresの行ロックと`SKIP LOCKED`で取得し、30秒のleaseを10秒ごとに更新する。
lease切れのジョブを再取得しても、外部の生成ターンを二重起動しないよう、Codexのthread_id・turn_idを先に確認する。
結果のコミットはjob_idにつき一度だけにする。ジョブ行をロックして確定済みの結果と出力ハッシュを照合し、同じ出力の再送は既存結果を返し、異なる出力は競合として拒否する。
外部呼出し前にexecutionを`dispatching`で保存し、応答を受けたら外部IDを保存する。provider・thread_id・turn_idの非nullの組合せを一意にする。
呼出し受理後に落ちて外部IDを保存できなかった場合、再開照会で受理状態を確認できるまで新しい生成を起動しない。
確認不能なら`provider_state_unknown`で入力待ちにし、二重の費用・生成が起き得る再実行を自動で行わない。
古いプロセスの確認要求へ返信せず、executionとprocess_session_idを照合する。期限切れは409で現状の再読取りを求める。

失敗には`failure_stage, code, retryable, duration_ms, limit_ms`を持たせる。
`execution_timeout / validation_timeout / output_limit_exceeded / capability_denied`を分け、実効上限をexecutionの`limits`に記録する。
検証失敗はvalidation_reportへ、実行失敗はジョブへ残し、成功していない出力をfeature_resultの正本にしない。

| method / path | 入力 | 成功時のdata |
|---|---|---|
| GET `/jobs/:id` | なし | 状態、進行、入力待ち、結果参照、エラー |
| GET `/jobs/:id/events` | SSE、任意`Last-Event-ID` | 未配信の連番からイベントを送る |
| POST `/jobs/:id/cancel` | なし | 中断要求を保存。外部ターンも中断する |
| POST `/jobs/:id/retry` | `expected_attempt` | 再試行可能な失敗から同じ意味の処理を開始する |
| POST `/jobs/:id/inputs` | `request_id, response` | 対応する確認要求へ返答する |
| GET `/events` | spaceのSSE、任意`Last-Event-ID` | 権限・データの無効化イベント |

イベントの外形は`sequence, type, occurred_at, job_id, payload`とする。
typeは`job.accepted / job.started / message.delta / job.progress / job.input_required / artifact.ready / validation.completed / job.completed / job.failed / job.cancelled / data.invalidated`を使う。
SSEのidには永続化した連番を使う。クライアントは同じ連番を二度反映しない。
保持期間外からの再開は410を返し、ジョブのスナップショットから再接続する。初期保持期間は7日とする。

`job.completed`のpayloadには`result_ref, execution_mode, source_revisions, access_revisions`を含める。
`execution_mode`は`live / replay_input / saved_result`とする。
`live`はその場で実処理・必要な実APIを実行、`replay_input`は保存したプロバイダー応答等を使う再現検証、`saved_result`は計算せず既存結果を提示した状態とする。
位置記録が再生でも、AIやコードをその場で実行した処理は`live`とし、入力元のoriginを別に示す。

## 10. デモ実行を実データの初期化から分離する

| method / path | 入力 | 成功時のdata |
|---|---|---|
| POST `/demo/runs` | `scenario_key` | 201。新しいspace、シナリオ、人物、開始状態 |
| POST `/demo/replays` | `source_fixture, speed` | 201。再生IDと開始状態 |
| POST `/demo/replays/:id/actions` | `action(start/pause/resume/stop)`、任意`speed` | 再生状態 |
| POST `/demo/sources/:id/scenario` | `scenario(normal/renamed_columns/changed_units/offline)` | fixtureの切替状態 |
| GET `/demo/readiness` | なし | DB、地図、経路、AI、Codex、実行環境、各場面の準備状態 |

再開用のscenarioは`grow-map / compare / transfer / build-feature / repair-source / feedback`とする。
各scenarioは必要な前段の状態を新しいspaceへ複製する。
`grow-map`から6場面を連続操作する場合は同じrun・spaceを使い、次の場面へ進むために`POST /demo/runs`を呼ばない。
他のscenarioは途中から独立して見せるための開始状態であり、A51で確認する。前段の値を実際に使い続ける確認はA55で行う。
私有resourceのIDを新規発行し、依存関係・会話・共有・ジョブ結果の参照も同じ対応表で変換する。公開datasetの版は共有する。
複製した保存済み結果には元の実行IDと`saved_result`を残し、今回の生成成功として数えない。
同じspace内で再生を繰り返しても元記録IDで重複を排除し、最初から見せ直す場合は新しいrunを作る。
再生時刻を戻すために、本人の会話や全DBを削除しない。
デモ用エンドポイントは`DEMO_MODE=true`かつloopbackからの認証済み管理操作に限定する。
外部公開構成ではエンドポイント自体を無効化する。

## 11. ログと成果物を実装の検証へ使う

ログにはrequest_id、job_id、resourceと版、処理段階、所要時間、プロバイダーの応答ID、使用量、エラー種別を残す。
秘密情報や会話原文を通常の構造化ログへ無差別に出力しない。
原文や位置記録はアプリの認証付き画面とDBで確認する。
生成コード、依存lock、入力契約、検証Suite、レポート、出典manifestのハッシュを結び付ける。
受入確認は画面、API結果、保存された参照版の三つから判断する。
