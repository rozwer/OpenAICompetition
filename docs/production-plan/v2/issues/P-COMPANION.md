# P-COMPANION：相棒を取り込み・生成して採否と選択を決め、一緒に地図を歩ける

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

相棒を取り込む、または実画像providerで生成する → previewを見て採用・却下する → profileで相棒を選ぶ → 地図を歩く → 再入場で選択と動きを確認する。

## 依存と担当範囲

着手依存：P-MAP
接続時の依存：
必要provider：image-generation
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-017/`
- `docs/evidence/INT-018/`
- `docs/evidence/PET-001/`
- `docs/evidence/PET-003/`
- `docs/evidence/PET-006/`
- `docs/spec/ENTRY_CONTRACT.md`
- `server/adapters/pet-image-generation/`
- `server/features/pet-generation/`
- `server/features/pets/`
- `server/index.ts`
- `server/integrations/int-017/`
- `server/integrations/int-018/`
- `server/pet-image-generation-catalog.test.ts`
- `shared/logic/pet-package/`
- `src/client/services/companion-events/`
- `src/companion/`
- `src/features/companion/`
- `src/features/pet-studio/`
- `src/features/pets/`
- `src/integrations/int-017/`
- `src/integrations/int-018/`

## 読む契約

- `contracts/ai-task-entry.ts`
- `contracts/companion-health.ts`：CompanionEventsPort, PetImageGenerationPort, PetPackagePort, PetRendererPort
- `contracts/domain.ts`：CancelPetGenerationRequest, CancelPetGenerationResponse, CreatePetGenerationRequest, CreatePetGenerationResponse, DeletePetRequest, DeletePetResponse, ExportPetResponse, GetAssetResponse, GetCompanionProfileResponse, GetPetGenerationResponse, GetPetResponse, ImportPetRequest, ImportPetResponse, ListPetGenerationProvidersResponse, ListPetsResponse, PutCompanionProfileRequest, PutCompanionProfileResponse, ReviewPetGenerationRequest, ReviewPetGenerationResponse, UploadAssetResponse
- `contracts/operations.ts`：cancelPetGeneration, createPetGeneration, deletePet, exportPet, getAsset, getAssetContent, getCompanionProfile, getPet, getPetGeneration, importPet, listPetGenerationProviders, listPets, putCompanionProfile, reviewPetGeneration, uploadAsset
- `docs/spec/PET_COMPANION.md`

実装するoperation：cancelPetGeneration, createPetGeneration, deletePet, exportPet, getCompanionProfile, getPet, getPetGeneration, importPet, listPetGenerationProviders, listPets, putCompanionProfile, reviewPetGeneration
利用するoperation：getAsset, getAssetContent, uploadAsset
対応要件：PET-REQ-001, PET-REQ-002, PET-REQ-003, PET-REQ-004, PET-REQ-005, PET-REQ-006, PET-REQ-007

## 固有の受入条件

- 全標準行・未使用セルを検査する。外部コードを実行しない。UIや保存APIを含めない。
- renderer/event serviceを取込と生成で再利用する。profile保存はINT-017へ委譲する。
- 未設定と失敗を区別し、別providerへ無断切替しない。credential/費用/実生成は独立した接続前提として残す。
- 生成provider不要で実API/DBを通す。保存IDだけで成功とせずassetとprofileを再読込する。
- 別scopeの相棒は見せず、壊れたZIPを表示や設定へ適用しない。
- Node/SQLite通し操作と固定Bunの標準atlas decoderを別々に検証して同じasset/hashへ結び付ける。
- requiredProviders=image-generationの実証拠を同じbuildへ結び付ける。fixture結果でlive能力を解放しない。
- catalog登録を同じIssue内で終え、生成後に別配線Issueを作らない。取消・却下した結果をprofileへ残さない。

## 同じ担当が実装・接続する内容

- PET-001：取込と生成で同じ安全なv2形式検査を使える
- PET-003：選択した相棒が共通イベントで一貫して動く
- PET-006：画像providerを明示設定して共通Portから実行できる
- INT-017：持ち込んだ相棒を保存・選択し、再入場しても表示できる
- INT-018：相棒を生成し、previewで採用・却下を選んで保存できる

## 該当する再発防止

- R19：HTTP hostで同じ認可文脈の保存metadataとbytesからraw response/MIMEを返す。
  - 拒否例：PNG byteとContent-TypeをHTTPで一致させ、他actorはbytes読取り前に拒否する。
- R22：browserへNode依存を持ち込まず、serverで所有metadata/保存hash/bytes hash/atlasを再検査する。取込後の相棒選択は本人の別操作を残す。
  - 拒否例：取込失敗で現在profileを変えず、非表示設定でもAI相談入口を失わない。
- R23：同scopeのpackageとassetをrendererへ注入し、catalog組立てをこの操作内で完成する。採用とprofile選択を分け、却下状態を保持する。
  - 拒否例：取消後のpoll/bytesを捨て、DB確定失敗時のbytesを回収する。未設定providerを成功にしない。
