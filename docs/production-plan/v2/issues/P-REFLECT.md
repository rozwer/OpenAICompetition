<!-- task-id: P-REFLECT -->
# P-REFLECT：記録を振り返って理由を訂正し、自己理解と候補の変化を確かめられる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

履歴とReplayを開く → 根拠・理由・用途を訂正する → 保存する → 再入場して自己理解・希望・候補の差分と失効を確認する。

## 依存と担当範囲

着手依存：P-RECORD, P-ROUTE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-002/`
- `docs/evidence/INT-004/`
- `server/features/corrections/`
- `server/features/self/`
- `server/integrations/int-002/`
- `server/integrations/int-004/`
- `shared/logic/hypotheses/`
- `src/features/corrections/`
- `src/features/self/`
- `src/integrations/int-002/`
- `src/integrations/int-004/`

## 読む契約

- `contracts/domain.ts`：CorrectExperienceRequest, CorrectExperienceResponse, GetHistoryResponse, ListHypothesesResponse, PutPreferenceRequest, PutPreferenceResponse, ReviewHypothesisRequest, ReviewHypothesisResponse
- `contracts/operations.ts`：correctExperience, getHistory, listHypotheses, putPreference, reviewHypothesis
- `contracts/ports.ts`：HypothesisPort
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：correctExperience, getHistory, listHypotheses, putPreference, reviewHypothesis
利用するoperation：
対応要件：CORE-001, DATA-002, DATA-004, EVAL-002, EVAL-004, MAP-014, NAV-005, NEW-004, OPS-007, REC-003, REC-004, REC-005, REC-007, REC-010, REC-011, SELF-001, SELF-002, SELF-003, SELF-004, SELF-005, SELF-006, SELF-007, SELF-008, SELF-009, SELF-011

## 固有の受入条件

- 同じ理由だけの訂正で必ず本体を変える演出をしない。409後の草稿保持。
- 古い版は409。原文は変わらない。scope外のAI遅着は適用できない。
- 通勤回数を好み得票にしない。確率を捏造せず1問をskipできる。
- weather unknownをrain支持に混ぜない。理由を訂正すると該当仮説だけ再計算。
- 希望保存と履歴集計が再表示される。拒否を全人格へ拡張しない。
- 理由だけ変更して、原文不変・説明差分・無関係な形維持を確認。
- 再取込して訪問数が増えず、Replayとlive位置を切替可能。

## 同じ担当が実装・接続する内容

- REC-003：原文と解釈と本人訂正を並べる。reasonとpurposeを別操作にする。 比較表示はSELF-001とRTE-004に渡し、このフォームに別の仮説・経路画面を再実装しない。
- REC-004：expectedRevisionを照合、Correction追加、Experience更新、派生とAIの依存版を失効させる。
- SELF-001：日/月履歴と支持/反例を示す仮説UI。知識0は足りないと示す。
- SELF-002：Context一致の支持/反例/代替説明から仮説。現在希望を履歴と分離する。
- SELF-003：日時窓、hypotheses再計算、明示希望・仮説確認を保存。
- INT-002：REC-003で訂正し、SELF-001で仮説差分、RTE-004で固定候補の説明差分と採用済みrouteの再確認を表示する。各UIを作り直さず接続する。
- INT-004：観測候補はconfirmed前に成長させずReplayへだけ使う。

## 該当する再発防止

- R05：geometryごとY-up基底を変換する。造形はPrimitiveで返し、hostはlive/replay位置と実注入poseを所有する。
  - 拒否例：非等方box・cylinder・非zero回転で高さを照合し、unknown headingを測定値にしない。
- R07：用途確認時刻を明示してMeaningへ渡す。訂正は原文・本人状態を保ち、同一transactionでAI staleと通知を確定する。
  - 拒否例：理由だけの変更で古い用途を最新にせず、Meaning失敗なら正本更新もrollbackする。
- R08：ObservationsPortの候補区間と精度・source identityを使い、一意の実在Placeだけへcandidate Visitを保存する。
  - 拒否例：曖昧な最近傍やplaceholder Placeを作らず、候補だけでconfirmedや成長にしない。
- R09：UIは使用IANA zoneを表示してUTCへ変換し、APIは半開区間でVisit開始/Observation観測/Experience作成時刻を使う。本人reviewは再計算で保持する。
  - 拒否例：UTC文字列の日付slice、Preference変更による原Evidence改変、自動confirmedを拒否する。
- R10：仮説は支持/反例/観測alternativeを局所文脈で扱い、rulesはproposed/needs_more_dataまでとする。
  - 拒否例：現在希望やunknown weatherを過去の確定傾向へ混入しない。
