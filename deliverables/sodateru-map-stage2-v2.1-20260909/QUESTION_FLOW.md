# 任意の質問・回答・再抽出

v2のquestion文字列をQuestionProposal {topic,text}へ変更した。既存v2とはwire互換ではない。改訂版の型・API・生成器を一緒に配布する。現行アプリや既存DBへの自動移行は行わない。

## 保存対象と取得

FollowUpQuestionは質問本文、対象Experience、jobId（ルール質問ならnull）、topic、入力版、dedupKey、open/answered/deferred/skipped/staleを持つ。QuestionResponseは回答・後回し・スキップの不変イベントで、回答時だけanswerEvidenceIdを持つ。本人の回答は新しいEvidence.textへ保存し、Experience.originalEvidenceIdの原文を上書きしない。

`GET /experiences/{experienceId}/questions` と `GET /experiences/{experienceId}/question-responses`（いずれも/api/v1配下）で状態を復元する。回答本文は認可されたgetEvidenceで読む。質問とイベントも本人exportに含める。共有時は本人の回答を自動公開しない。Experience削除時の原文消去規約は回答Evidenceとjobの保存入力にも適用する。

## 質問を作る

AI-002のextract applyと同じtransaction内でQuestionPort.proposeを呼ぶ。入力はscope、現在のExperience、QuestionProposal、検証済みinputVersions、now、生成済みquestionId、実行元に対応するsourceMode。AIやHTTPはこのtransaction内で呼ばない。

dedupKeyはcanonical JSON `{namespaceId,actorId,experienceId,originalEvidenceId,topic}` のSHA-256。質問の言い回しや毎回増えるjobIdをキーにしない。同じキーがある場合、状態にかかわらず新しい質問を作らずnullを返す。既存openは一覧から開ける。answered/skippedを再入場でopenに戻さない。別の質問を本人が明示要求する高度な経路は後続で定義し、通常の再抽出で繰り返さない。

## 回答・後回し・スキップ

`POST /questions/{questionId}/responses` は `{opId,expectedRevision,payload}`。expectedRevisionは質問の版。payloadは `action=answered` と空白でないanswerText、または `action=deferred/skipped` とanswerText=null。JSON Schemaに加えtrim後空文字を422で拒否する。

scope確認→dedup→質問版と対象Experienceの参照版照合→必要なら新Evidence→QuestionResponse→質問のstatus/revision→回答EvidenceをExperience.evidenceIdsへ追加→changed/invalidated→commit。回答時のみExperienceのrevisionも増える。用途・理由・本人の好みはこの操作だけで変更しない。同opIdの再送は同じ結果、古い質問版は409、異なる体験の質問参照は拒否する。

open→answered/deferred/skipped、deferred→answered/skipped、skipped→answered（本人が一覧で明示的に答えた時だけ）を許す。answeredへの別opIdの再回答は409で拒否する。回答訂正を実装する場合は元Evidenceを更新せず新イベントを追加する別契約が必要。入力版が古い質問への新回答はSTALE_INPUTで草稿を保持する。既存の回答を消さない。

## 回答を使って再抽出

回答保存後、本人が「この回答で解釈を更新」を選ぶと、createAiJobのextract inputへexperienceIdとquestionResponseIdsを渡す。サーバーはIDが同じactor/namespace/Experienceに属しaction=answeredであることを確認し、元原文と回答Evidenceを解決する。clientの任意本文を保存済み原文として扱わない。

scope.entityVersionsには現在のExperience、QuestionResponse、回答Evidenceの版を含める。受信後の版照合と本人確認を経てInterpretationを提案する。回答保存や再抽出だけで用途・理由を自動確定しない。answered/deferred/skippedは再抽出の成否にかかわらず残る。

`examples/question-flow.json` が質問→回答保存→再抽出入力→再入場の同じIDを使った例。`tools/test_questions.mjs` はローカルDB参考実装の確認であり、INT-016のライブCodex確認を代替しない。
