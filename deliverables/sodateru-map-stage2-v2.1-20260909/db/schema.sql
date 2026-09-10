-- 育てる地図 schema v2; real columns for scalars, typed JSON only for nested values.

PRAGMA foreign_keys = ON;

PRAGMA journal_mode = WAL;

PRAGMA busy_timeout = 3000;

CREATE TABLE namespaces (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('user','demo')),
 canonical_revision INTEGER NOT NULL DEFAULT 0 CHECK(canonical_revision >= 0),
 seed_version TEXT
);

CREATE TABLE actors (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  display_name TEXT NOT NULL CHECK(length(display_name) <= 120),
  is_demo INTEGER NOT NULL CHECK(is_demo IN (0,1)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE
);

CREATE TABLE settings (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  discovery_enabled INTEGER NOT NULL CHECK(discovery_enabled IN (0,1)),
  proactive_suggestions INTEGER NOT NULL CHECK(proactive_suggestions IN (0,1)),
  explore_unfamiliar INTEGER NOT NULL CHECK(explore_unfamiliar IN (0,1)),
  blocked_concept_ids_json TEXT NOT NULL CHECK(json_valid(blocked_concept_ids_json)),
  preferred_entry TEXT NOT NULL CHECK(preferred_entry IN ('map','home')),
  location_enabled INTEGER NOT NULL CHECK(location_enabled IN (0,1)),
  ai_enabled INTEGER NOT NULL CHECK(ai_enabled IN (0,1)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id)
);

CREATE INDEX ix_settings_actor ON settings(namespace_id,actor_id);

CREATE TABLE app_contexts (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  context_json TEXT NOT NULL CHECK(json_valid(context_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id)
);

CREATE INDEX ix_app_contexts_actor ON app_contexts(namespace_id,actor_id);

CREATE TABLE sources (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  name TEXT NOT NULL CHECK(length(name) <= 200),
  provider TEXT NOT NULL CHECK(length(provider) <= 100),
  url TEXT,
  license TEXT CHECK(license IS NULL OR (length(license) <= 300)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE
);

CREATE TABLE buildings (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  city_id TEXT NOT NULL CHECK(length(city_id) <= 80),
  footprint_json TEXT NOT NULL CHECK(json_valid(footprint_json)),
  height_meters REAL CHECK(height_meters IS NULL OR (height_meters >= 0)),
  height_source_id TEXT CHECK(height_source_id IS NULL OR (length(height_source_id) <= 80)),
  level_labels_json TEXT NOT NULL CHECK(json_valid(level_labels_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,height_source_id) REFERENCES sources(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE places (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  city_id TEXT NOT NULL CHECK(length(city_id) <= 80),
  name TEXT NOT NULL CHECK(length(name) <= 200),
  location_json TEXT NOT NULL CHECK(json_valid(location_json)),
  building_id TEXT CHECK(building_id IS NULL OR (length(building_id) <= 80)),
  level_label TEXT CHECK(level_label IS NULL OR (length(level_label) <= 80)),
  categories_json TEXT NOT NULL CHECK(json_valid(categories_json)),
  role_tags_json TEXT NOT NULL CHECK(json_valid(role_tags_json)),
  provider_refs_json TEXT NOT NULL CHECK(json_valid(provider_refs_json)),
  facts_json TEXT NOT NULL CHECK(json_valid(facts_json)),
  provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,building_id) REFERENCES buildings(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE evidence (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  kind TEXT NOT NULL CHECK(kind IN ('utterance','observation','public')),
  text TEXT NOT NULL CHECK(length(text) <= 12000),
  source_id TEXT CHECK(source_id IS NULL OR (length(source_id) <= 80)),
  asset_id TEXT CHECK(asset_id IS NULL OR (length(asset_id) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,source_id) REFERENCES sources(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,asset_id) REFERENCES assets(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_evidence_actor ON evidence(namespace_id,actor_id);

CREATE TABLE observations (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  source_id TEXT NOT NULL CHECK(length(source_id) <= 80),
  source_record_id TEXT NOT NULL CHECK(length(source_record_id) <= 200),
  observed_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  position_json TEXT NOT NULL CHECK(json_valid(position_json)),
  accuracy_meters REAL CHECK(accuracy_meters IS NULL OR (accuracy_meters >= 0)),
  motion_mode TEXT NOT NULL CHECK(motion_mode IN ('walk','rail','vehicle','unknown')),
  import_hash TEXT NOT NULL CHECK(length(import_hash) <= 64),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,source_id) REFERENCES sources(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id,source_id,source_record_id)
);

CREATE INDEX ix_observations_actor ON observations(namespace_id,actor_id);

CREATE TABLE visits (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  place_id TEXT NOT NULL CHECK(length(place_id) <= 80),
  level_label TEXT CHECK(level_label IS NULL OR (length(level_label) <= 80)),
  time_json TEXT NOT NULL CHECK(json_valid(time_json)),
  status TEXT NOT NULL CHECK(status IN ('candidate','confirmed','rejected','deleted')),
  observation_ids_json TEXT NOT NULL CHECK(json_valid(observation_ids_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,place_id) REFERENCES places(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_visits_actor ON visits(namespace_id,actor_id);

CREATE INDEX ix_visits_place ON visits(namespace_id,place_id);

CREATE INDEX ix_visits_status ON visits(namespace_id,status);

CREATE TABLE experiences (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  place_id TEXT NOT NULL CHECK(length(place_id) <= 80),
  visit_id TEXT CHECK(visit_id IS NULL OR (length(visit_id) <= 80)),
  original_evidence_id TEXT NOT NULL CHECK(length(original_evidence_id) <= 80),
  evidence_ids_json TEXT NOT NULL CHECK(json_valid(evidence_ids_json)),
  purpose TEXT CHECK(purpose IS NULL OR (length(purpose) <= 500)),
  reason TEXT CHECK(reason IS NULL OR (length(reason) <= 2000)),
  context_json TEXT NOT NULL CHECK(json_valid(context_json)),
  explicit_preference TEXT NOT NULL CHECK(explicit_preference IN ('like','dislike','neutral','unspecified')),
  outcome TEXT CHECK(outcome IS NULL OR (length(outcome) <= 2000)),
  status TEXT NOT NULL CHECK(status IN ('active','deleted')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,place_id) REFERENCES places(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,visit_id) REFERENCES visits(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,original_evidence_id) REFERENCES evidence(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_experiences_actor ON experiences(namespace_id,actor_id);

CREATE INDEX ix_experiences_place ON experiences(namespace_id,place_id);

CREATE INDEX ix_experiences_status ON experiences(namespace_id,status);

CREATE TABLE corrections (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  experience_id TEXT NOT NULL CHECK(length(experience_id) <= 80),
  patch_json TEXT NOT NULL CHECK(json_valid(patch_json)),
  previous_patch_json TEXT NOT NULL CHECK(json_valid(previous_patch_json)),
  reason_evidence_id TEXT CHECK(reason_evidence_id IS NULL OR (length(reason_evidence_id) <= 80)),
  scope_kind TEXT NOT NULL CHECK(scope_kind IN ('experience','context','global')),
  affected_versions_json TEXT NOT NULL CHECK(json_valid(affected_versions_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,reason_evidence_id) REFERENCES evidence(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_corrections_actor ON corrections(namespace_id,actor_id);

CREATE TABLE correction_previews (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  scope_kind TEXT NOT NULL CHECK(scope_kind IN ('context','global')),
  context_filter_json TEXT CHECK(context_filter_json IS NULL OR (json_valid(context_filter_json))),
  patch_json TEXT NOT NULL CHECK(json_valid(patch_json)),
  target_versions_json TEXT NOT NULL CHECK(json_valid(target_versions_json)),
  status TEXT NOT NULL CHECK(status IN ('proposed','applied','stale')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_correction_previews_actor ON correction_previews(namespace_id,actor_id);

CREATE INDEX ix_correction_previews_status ON correction_previews(namespace_id,status);

CREATE TABLE interpretations (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  experience_id TEXT NOT NULL CHECK(length(experience_id) <= 80),
  job_id TEXT NOT NULL CHECK(length(job_id) <= 80),
  purpose TEXT CHECK(purpose IS NULL OR (length(purpose) <= 500)),
  reason TEXT CHECK(reason IS NULL OR (length(reason) <= 2000)),
  context_json TEXT NOT NULL CHECK(json_valid(context_json)),
  evidence_ids_json TEXT NOT NULL CHECK(json_valid(evidence_ids_json)),
  status TEXT NOT NULL CHECK(status IN ('proposed','accepted','rejected')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,job_id) REFERENCES ai_jobs(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_interpretations_actor ON interpretations(namespace_id,actor_id);

CREATE INDEX ix_interpretations_status ON interpretations(namespace_id,status);

CREATE TABLE follow_up_questions (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  experience_id TEXT NOT NULL CHECK(length(experience_id) <= 80),
  job_id TEXT CHECK(job_id IS NULL OR (length(job_id) <= 80)),
  topic TEXT NOT NULL CHECK(topic IN ('purpose','reason','context','alternative')),
  text TEXT NOT NULL CHECK(length(text) <= 500),
  dedup_key TEXT NOT NULL CHECK(length(dedup_key) <= 64),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  status TEXT NOT NULL CHECK(status IN ('open','answered','deferred','skipped','stale')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,job_id) REFERENCES ai_jobs(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id,dedup_key)
);

CREATE INDEX ix_follow_up_questions_actor ON follow_up_questions(namespace_id,actor_id);

CREATE INDEX ix_follow_up_questions_status ON follow_up_questions(namespace_id,status);

CREATE TABLE question_responses (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  question_id TEXT NOT NULL CHECK(length(question_id) <= 80),
  experience_id TEXT NOT NULL CHECK(length(experience_id) <= 80),
  action TEXT NOT NULL CHECK(action IN ('answered','deferred','skipped')),
  answer_evidence_id TEXT CHECK(answer_evidence_id IS NULL OR (length(answer_evidence_id) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,question_id) REFERENCES follow_up_questions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,answer_evidence_id) REFERENCES evidence(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_question_responses_actor ON question_responses(namespace_id,actor_id);

CREATE TABLE profile_hypotheses (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  condition_json TEXT NOT NULL CHECK(json_valid(condition_json)),
  claim TEXT NOT NULL CHECK(length(claim) <= 1200),
  support_evidence_ids_json TEXT NOT NULL CHECK(json_valid(support_evidence_ids_json)),
  counter_evidence_ids_json TEXT NOT NULL CHECK(json_valid(counter_evidence_ids_json)),
  alternative TEXT CHECK(alternative IS NULL OR (length(alternative) <= 1200)),
  status TEXT NOT NULL CHECK(status IN ('proposed','confirmed','rejected','needs_more_data')),
  input_revision INTEGER NOT NULL CHECK(input_revision >= 0 AND input_revision <= 9007199254740991),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_profile_hypotheses_actor ON profile_hypotheses(namespace_id,actor_id);

CREATE INDEX ix_profile_hypotheses_status ON profile_hypotheses(namespace_id,status);

CREATE TABLE preferences (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  current_intent TEXT CHECK(current_intent IS NULL OR (length(current_intent) <= 1000)),
  context_json TEXT NOT NULL CHECK(json_valid(context_json)),
  preferred_purposes_json TEXT NOT NULL CHECK(json_valid(preferred_purposes_json)),
  avoid_purposes_json TEXT NOT NULL CHECK(json_valid(avoid_purposes_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id)
);

CREATE INDEX ix_preferences_actor ON preferences(namespace_id,actor_id);

CREATE TABLE candidate_sets (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  query_json TEXT NOT NULL CHECK(json_valid(query_json)),
  place_ids_json TEXT NOT NULL CHECK(json_valid(place_ids_json)),
  provider TEXT NOT NULL CHECK(length(provider) <= 100),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_candidate_sets_actor ON candidate_sets(namespace_id,actor_id);

CREATE TABLE route_plans (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  input_json TEXT NOT NULL CHECK(json_valid(input_json)),
  legs_json TEXT NOT NULL CHECK(json_valid(legs_json)),
  constraints_json TEXT NOT NULL CHECK(json_valid(constraints_json)),
  total_travel_seconds REAL NOT NULL CHECK(total_travel_seconds >= 0),
  total_stay_seconds REAL NOT NULL CHECK(total_stay_seconds >= 0),
  cost_json TEXT NOT NULL CHECK(json_valid(cost_json)),
  status TEXT NOT NULL CHECK(status IN ('proposed','selected','deferred','rejected','stale')),
  feasibility TEXT NOT NULL CHECK(feasibility IN ('pass','fail','unknown')),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_route_plans_actor ON route_plans(namespace_id,actor_id);

CREATE INDEX ix_route_plans_status ON route_plans(namespace_id,status);

CREATE TABLE passes (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  operator_codes_json TEXT NOT NULL CHECK(json_valid(operator_codes_json)),
  station_codes_json TEXT NOT NULL CHECK(json_valid(station_codes_json)),
  via_codes_json TEXT NOT NULL CHECK(json_valid(via_codes_json)),
  valid_from TEXT NOT NULL,
  valid_through TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK(length(card_type) <= 100),
  provider_course TEXT CHECK(provider_course IS NULL OR (length(provider_course) <= 4000)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_passes_actor ON passes(namespace_id,actor_id);

CREATE TABLE quests (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  route_plan_id TEXT NOT NULL CHECK(length(route_plan_id) <= 80),
  status TEXT NOT NULL CHECK(status IN ('planned','active','completed','deferred','canceled')),
  completed_experience_ids_json TEXT NOT NULL CHECK(json_valid(completed_experience_ids_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,route_plan_id) REFERENCES route_plans(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_quests_actor ON quests(namespace_id,actor_id);

CREATE INDEX ix_quests_status ON quests(namespace_id,status);

CREATE TABLE share_grants (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  recipient_actor_id TEXT CHECK(recipient_actor_id IS NULL OR (length(recipient_actor_id) <= 80)),
  target_type TEXT NOT NULL CHECK(target_type IN ('experience','route','extension')),
  target_id TEXT NOT NULL CHECK(length(target_id) <= 80),
  fields_json TEXT NOT NULL CHECK(json_valid(fields_json)),
  visibility TEXT NOT NULL CHECK(visibility IN ('peer','public')),
  status TEXT NOT NULL CHECK(status IN ('active','revoked')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,recipient_actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_share_grants_actor ON share_grants(namespace_id,actor_id);

CREATE INDEX ix_share_grants_status ON share_grants(namespace_id,status);

CREATE TABLE comparisons (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  peer_id TEXT NOT NULL CHECK(length(peer_id) <= 80),
  mappings_json TEXT NOT NULL CHECK(json_valid(mappings_json)),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  grant_versions_json TEXT NOT NULL CHECK(json_valid(grant_versions_json)),
  status TEXT NOT NULL CHECK(status IN ('current','stale')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,peer_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_comparisons_actor ON comparisons(namespace_id,actor_id);

CREATE INDEX ix_comparisons_status ON comparisons(namespace_id,status);

CREATE TABLE recipes (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  source_experience_ids_json TEXT NOT NULL CHECK(json_valid(source_experience_ids_json)),
  name TEXT NOT NULL CHECK(length(name) <= 200),
  roles_json TEXT NOT NULL CHECK(json_valid(roles_json)),
  transitions_json TEXT NOT NULL CHECK(json_valid(transitions_json)),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_recipes_actor ON recipes(namespace_id,actor_id);

CREATE TABLE transfer_plans (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  recipe_id TEXT NOT NULL CHECK(length(recipe_id) <= 80),
  candidate_set_id TEXT NOT NULL CHECK(length(candidate_set_id) <= 80),
  target_city_id TEXT NOT NULL CHECK(length(target_city_id) <= 80),
  mode TEXT NOT NULL CHECK(mode IN ('faithful','personal')),
  roles_json TEXT NOT NULL CHECK(json_valid(roles_json)),
  route_plan_id TEXT CHECK(route_plan_id IS NULL OR (length(route_plan_id) <= 80)),
  constraints_json TEXT NOT NULL CHECK(json_valid(constraints_json)),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  status TEXT NOT NULL CHECK(status IN ('proposed','selected','stale')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,recipe_id) REFERENCES recipes(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,candidate_set_id) REFERENCES candidate_sets(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,route_plan_id) REFERENCES route_plans(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_transfer_plans_actor ON transfer_plans(namespace_id,actor_id);

CREATE INDEX ix_transfer_plans_status ON transfer_plans(namespace_id,status);

CREATE TABLE joint_plans (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  participants_json TEXT NOT NULL CHECK(json_valid(participants_json)),
  candidates_json TEXT NOT NULL CHECK(json_valid(candidates_json)),
  conflicts_json TEXT NOT NULL CHECK(json_valid(conflicts_json)),
  selected_route_plan_id TEXT CHECK(selected_route_plan_id IS NULL OR (length(selected_route_plan_id) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,selected_route_plan_id) REFERENCES route_plans(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_joint_plans_actor ON joint_plans(namespace_id,actor_id);

CREATE TABLE feedback (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  own_experience_id TEXT NOT NULL CHECK(length(own_experience_id) <= 80),
  source_experience_id TEXT CHECK(source_experience_id IS NULL OR (length(source_experience_id) <= 80)),
  transfer_plan_id TEXT CHECK(transfer_plan_id IS NULL OR (length(transfer_plan_id) <= 80)),
  retained TEXT NOT NULL CHECK(length(retained) <= 1500),
  changed TEXT NOT NULL CHECK(length(changed) <= 1500),
  fit TEXT NOT NULL CHECK(fit IN ('fit','not-fit','mixed','not-tried')),
  reason TEXT NOT NULL CHECK(length(reason) <= 2000),
  send_to_author INTEGER NOT NULL CHECK(send_to_author IN (0,1)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,own_experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,source_experience_id) REFERENCES experiences(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,transfer_plan_id) REFERENCES transfer_plans(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_feedback_actor ON feedback(namespace_id,actor_id);

CREATE TABLE discovery_cards (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  anchor_json TEXT NOT NULL CHECK(json_valid(anchor_json)),
  bridge TEXT NOT NULL CHECK(length(bridge) <= 1500),
  knowledge TEXT NOT NULL CHECK(length(knowledge) <= 2500),
  observation_prompt TEXT NOT NULL CHECK(length(observation_prompt) <= 1000),
  concept_ids_json TEXT NOT NULL CHECK(json_valid(concept_ids_json)),
  sources_json TEXT NOT NULL CHECK(json_valid(sources_json)),
  intent TEXT NOT NULL CHECK(intent IN ('normal','explore')),
  input_versions_json TEXT NOT NULL CHECK(json_valid(input_versions_json)),
  execution_mode TEXT NOT NULL CHECK(execution_mode IN ('live-codex','rules','manual','replay')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_discovery_cards_actor ON discovery_cards(namespace_id,actor_id);

CREATE TABLE discovery_events (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  card_id TEXT NOT NULL CHECK(length(card_id) <= 80),
  event TEXT NOT NULL CHECK(event IN ('opened','known','interested','dismissed','blocked')),
  concept_id TEXT CHECK(concept_id IS NULL OR (length(concept_id) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,card_id) REFERENCES discovery_cards(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_discovery_events_actor ON discovery_events(namespace_id,actor_id);

CREATE TABLE interests (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  concept_id TEXT NOT NULL CHECK(length(concept_id) <= 80),
  state TEXT NOT NULL CHECK(state IN ('interested','known','blocked')),
  source_event_id TEXT NOT NULL CHECK(length(source_event_id) <= 80),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,source_event_id) REFERENCES discovery_events(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id,concept_id)
);

CREATE INDEX ix_interests_actor ON interests(namespace_id,actor_id);

CREATE TABLE diaries (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  date TEXT NOT NULL,
  text TEXT NOT NULL CHECK(length(text) <= 20000),
  experience_ids_json TEXT NOT NULL CHECK(json_valid(experience_ids_json)),
  asset_ids_json TEXT NOT NULL CHECK(json_valid(asset_ids_json)),
  status TEXT NOT NULL CHECK(status IN ('draft','approved')),
  job_id TEXT CHECK(job_id IS NULL OR (length(job_id) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,job_id) REFERENCES ai_jobs(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_diaries_actor ON diaries(namespace_id,actor_id);

CREATE INDEX ix_diaries_status ON diaries(namespace_id,status);

CREATE TABLE assets (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  content_type TEXT NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
  byte_length INTEGER NOT NULL CHECK(byte_length >= 1 AND byte_length <= 9007199254740991),
  sha256 TEXT NOT NULL CHECK(length(sha256) <= 64),
  filename TEXT NOT NULL CHECK(length(filename) <= 200),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_assets_actor ON assets(namespace_id,actor_id);

CREATE TABLE extensions (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  name TEXT NOT NULL CHECK(length(name) <= 200),
  description TEXT NOT NULL CHECK(length(description) <= 2000),
  theme TEXT NOT NULL CHECK(theme IN ('general','disaster','motorcycle','pilgrimage')),
  visibility TEXT NOT NULL CHECK(visibility IN ('private','shared','public')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_extensions_actor ON extensions(namespace_id,actor_id);

CREATE TABLE extension_versions (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  extension_id TEXT NOT NULL CHECK(length(extension_id) <= 80),
  version_tag TEXT NOT NULL CHECK(length(version_tag) <= 80),
  definition_json TEXT NOT NULL CHECK(json_valid(definition_json)),
  artifact_hash TEXT NOT NULL CHECK(length(artifact_hash) <= 64),
  runtime_kind TEXT NOT NULL CHECK(runtime_kind IN ('dsl','code')),
  status TEXT NOT NULL CHECK(status IN ('draft','validated','rejected')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,extension_id) REFERENCES extensions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,extension_id,version_tag)
);

CREATE INDEX ix_extension_versions_actor ON extension_versions(namespace_id,actor_id);

CREATE INDEX ix_extension_versions_status ON extension_versions(namespace_id,status);

CREATE TABLE extension_installs (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  extension_id TEXT NOT NULL CHECK(length(extension_id) <= 80),
  active_version_id TEXT NOT NULL CHECK(length(active_version_id) <= 80),
  previous_version_id TEXT CHECK(previous_version_id IS NULL OR (length(previous_version_id) <= 80)),
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  private_state_json TEXT NOT NULL CHECK(json_valid(private_state_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,extension_id) REFERENCES extensions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,active_version_id) REFERENCES extension_versions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,previous_version_id) REFERENCES extension_versions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(namespace_id,actor_id,extension_id)
);

CREATE INDEX ix_extension_installs_actor ON extension_installs(namespace_id,actor_id);

CREATE TABLE extension_runs (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  version_id TEXT NOT NULL CHECK(length(version_id) <= 80),
  inputs_json TEXT NOT NULL CHECK(json_valid(inputs_json)),
  outputs_json TEXT NOT NULL CHECK(json_valid(outputs_json)),
  status TEXT NOT NULL CHECK(status IN ('succeeded','failed')),
  error_code TEXT CHECK(error_code IS NULL OR (length(error_code) <= 80)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,version_id) REFERENCES extension_versions(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_extension_runs_actor ON extension_runs(namespace_id,actor_id);

CREATE INDEX ix_extension_runs_status ON extension_runs(namespace_id,status);

CREATE TABLE source_snapshots (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  source_id TEXT NOT NULL CHECK(length(source_id) <= 80),
  format TEXT NOT NULL CHECK(format IN ('json','csv','geojson','html','pdf')),
  raw_hash TEXT NOT NULL CHECK(length(raw_hash) <= 64),
  raw_text TEXT NOT NULL CHECK(length(raw_text) <= 2000000),
  schema_version TEXT NOT NULL CHECK(length(schema_version) <= 80),
  parser_version TEXT NOT NULL CHECK(length(parser_version) <= 80),
  fetched_at TEXT NOT NULL,
  valid_until TEXT,
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,source_id) REFERENCES sources(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE repair_proposals (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  source_id TEXT NOT NULL CHECK(length(source_id) <= 80),
  snapshot_id TEXT NOT NULL CHECK(length(snapshot_id) <= 80),
  old_parser_version TEXT NOT NULL CHECK(length(old_parser_version) <= 80),
  new_parser_version TEXT NOT NULL CHECK(length(new_parser_version) <= 80),
  mappings_json TEXT NOT NULL CHECK(json_valid(mappings_json)),
  status TEXT NOT NULL CHECK(status IN ('proposed','approved','rejected','stale')),
  warnings_json TEXT NOT NULL CHECK(json_valid(warnings_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,source_id) REFERENCES sources(namespace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(namespace_id,snapshot_id) REFERENCES source_snapshots(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_repair_proposals_actor ON repair_proposals(namespace_id,actor_id);

CREATE INDEX ix_repair_proposals_status ON repair_proposals(namespace_id,status);

CREATE TABLE ai_jobs (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  request_json TEXT NOT NULL CHECK(json_valid(request_json)),
  scope_json TEXT NOT NULL CHECK(json_valid(scope_json)),
  input_hash TEXT NOT NULL CHECK(length(input_hash) <= 64),
  status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed','canceled','interrupted','stale')),
  execution_mode TEXT NOT NULL CHECK(execution_mode IN ('live-codex','rules','manual','replay')),
  result_json TEXT CHECK(result_json IS NULL OR (json_valid(result_json))),
  error_code TEXT CHECK(error_code IS NULL OR (length(error_code) <= 80)),
  applied_entity_ids_json TEXT NOT NULL CHECK(json_valid(applied_entity_ids_json)),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_ai_jobs_actor ON ai_jobs(namespace_id,actor_id);

CREATE INDEX ix_ai_jobs_status ON ai_jobs(namespace_id,status);

CREATE TABLE development_requests (
  namespace_id TEXT NOT NULL CHECK(length(namespace_id) <= 80),
  id TEXT NOT NULL CHECK(length(id) <= 80),
  revision INTEGER NOT NULL CHECK(revision >= 1 AND revision <= 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK(source_mode IN ('live','user','sample','imported')),
  actor_id TEXT NOT NULL CHECK(length(actor_id) <= 80),
  requirement TEXT NOT NULL CHECK(length(requirement) <= 12000),
  target_level TEXT NOT NULL CHECK(target_level IN ('compose','local-bridge','code-plugin','app-modification')),
  base_commit TEXT CHECK(base_commit IS NULL OR (length(base_commit) <= 64)),
  allowed_paths_json TEXT NOT NULL CHECK(json_valid(allowed_paths_json)),
  data_policy TEXT NOT NULL CHECK(data_policy IN ('clone-only','backward-compatible')),
  acceptance_json TEXT NOT NULL CHECK(json_valid(acceptance_json)),
  status TEXT NOT NULL CHECK(status IN ('draft','exported','preview','approved','reverted')),
  PRIMARY KEY(namespace_id,id),
  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
  FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ix_development_requests_actor ON development_requests(namespace_id,actor_id);

CREATE INDEX ix_development_requests_status ON development_requests(namespace_id,status);

CREATE TABLE request_dedup (
 namespace_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 op_id TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 http_status INTEGER NOT NULL,
 response_json TEXT NOT NULL CHECK(json_valid(response_json)),
 created_at TEXT NOT NULL,
 PRIMARY KEY(namespace_id,actor_id,op_id),
 FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
 FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE change_events (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 namespace_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 canonical_revision INTEGER NOT NULL CHECK(canonical_revision >= 1),
 changed_json TEXT NOT NULL CHECK(json_valid(changed_json)),
 invalidated_json TEXT NOT NULL CHECK(json_valid(invalidated_json)),
 created_at TEXT NOT NULL,
 FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE
);

CREATE INDEX ix_changes_namespace ON change_events(namespace_id,sequence);

CREATE TABLE asset_storage (
 namespace_id TEXT NOT NULL,
 asset_id TEXT NOT NULL,
 relative_path TEXT NOT NULL,
 PRIMARY KEY(namespace_id,asset_id),
 FOREIGN KEY(namespace_id,asset_id) REFERENCES assets(namespace_id,id) ON DELETE CASCADE
);
