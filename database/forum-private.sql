-- v2: explicit PostgREST HTTP409 for business CAS/idempotency conflicts; no data reset.
-- Private synthetic pilot only. This migration does not open public registration.
-- Run as the trusted database migration owner, never from a browser.
-- All normal requests use a verified Supabase user JWT; service_role is limited
-- to session registration after server-side provider validation and test seeding.
BEGIN;

CREATE TABLE IF NOT EXISTS public.sfi_forum_members (
 user_id uuid PRIMARY KEY,
 alias text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 60),
 declared_role text NOT NULL DEFAULT 'former' CHECK (declared_role IN ('inmate','former','relative','professional')),
 synthetic_test boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended','deleted')),
 identity_state text NOT NULL DEFAULT 'pending' CHECK (identity_state IN ('pending','synthetic_verified','revoked')),
 login_verified_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 reviewed_by uuid, reviewed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_sessions (
 provider_session_id text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id),
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_reviewers (
 user_id uuid PRIMARY KEY REFERENCES public.sfi_forum_members(user_id),
 active boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_rooms (
 id text PRIMARY KEY CHECK (id IN ('inside','relatives')),
 title_no text NOT NULL, title_en text NOT NULL
);
INSERT INTO public.sfi_forum_rooms VALUES
 ('inside','Veien videre','The way forward'),
 ('relatives','For deg som står nær','For those close to someone inside')
ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.sfi_forum_grants (
 user_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id),
 room_id text NOT NULL REFERENCES public.sfi_forum_rooms(id),
 access_role text NOT NULL DEFAULT 'member' CHECK (access_role IN ('member','moderator')),
 state text NOT NULL DEFAULT 'revoked' CHECK (state IN ('active','revoked')),
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 PRIMARY KEY (user_id,room_id)
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id text NOT NULL REFERENCES public.sfi_forum_rooms(id),
 author_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id),
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
 state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','locked','deleted')),
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id,room_id)
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), room_id text NOT NULL,
 thread_id uuid NOT NULL, author_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id),
 client_request_id uuid NOT NULL, request_hash text,
 body text NOT NULL, state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','hidden','deleted')),
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (thread_id,room_id) REFERENCES public.sfi_forum_threads(id,room_id),
 UNIQUE (author_id,client_request_id),
 CHECK ((state='deleted' AND body='' AND request_hash IS NULL) OR
        (state IN ('active','hidden') AND char_length(body) BETWEEN 1 AND 6000 AND request_hash IS NOT NULL AND request_hash ~ '^[0-9a-f]{64}$'))
);
CREATE INDEX IF NOT EXISTS sfi_forum_threads_cursor ON public.sfi_forum_threads(room_id,created_at,id);
CREATE INDEX IF NOT EXISTS sfi_forum_messages_cursor ON public.sfi_forum_messages(thread_id,created_at,id);
CREATE TABLE IF NOT EXISTS public.sfi_forum_requests (
 user_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id), request_id uuid NOT NULL,
 action text NOT NULL, request_hash text, record_id uuid NOT NULL, related_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id,request_id)
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_id uuid NOT NULL REFERENCES public.sfi_forum_messages(id),
 reporter_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id), reported_version integer NOT NULL,
 reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1500),
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (message_id,reporter_id,reported_version)
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL, subject_id uuid,
 room_id text, action text NOT NULL, record_id uuid, record_version integer,
 reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_limits (bucket text PRIMARY KEY, limit_per_day integer NOT NULL CHECK (limit_per_day>0));
-- Bounded pilot defaults; duplicates and rejected transactions do not debit twice.
INSERT INTO public.sfi_forum_limits VALUES ('threads',20),('messages',200),('writes',500),('reports',30),('moderation',200),('applications',10)
ON CONFLICT (bucket) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.sfi_forum_quotas (
 user_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id), day date NOT NULL,
 bucket text NOT NULL REFERENCES public.sfi_forum_limits(bucket), count integer NOT NULL CHECK (count >= 0),
 PRIMARY KEY (user_id,day,bucket)
);
CREATE TABLE IF NOT EXISTS public.sfi_forum_privacy_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject_id uuid NOT NULL REFERENCES public.sfi_forum_members(user_id),
 kind text NOT NULL CHECK (kind IN ('erase')), state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','running','completed','failed')),
 attempt integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS sfi_forum_erase_once ON public.sfi_forum_privacy_jobs(subject_id,kind);

CREATE OR REPLACE FUNCTION public.sfi_forum_session_ok() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.sfi_forum_sessions s
  JOIN public.sfi_forum_members m ON m.user_id=s.user_id
  JOIN auth.sessions ps ON ps.id::text=s.provider_session_id AND ps.user_id=s.user_id
  WHERE s.user_id=auth.uid() AND s.provider_session_id=auth.jwt()->>'session_id'
    AND s.revoked_at IS NULL AND s.expires_at>now()
    AND m.synthetic_test AND m.status<>'deleted')
$$;
CREATE OR REPLACE FUNCTION public.sfi_forum_is_reviewer() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT public.sfi_forum_session_ok() AND EXISTS (
  SELECT 1 FROM public.sfi_forum_reviewers r JOIN public.sfi_forum_members m ON m.user_id=r.user_id
  WHERE r.user_id=auth.uid() AND r.active AND m.synthetic_test AND m.status='approved'
    AND m.identity_state='synthetic_verified' AND m.login_verified_at IS NOT NULL)
$$;
CREATE OR REPLACE FUNCTION public.sfi_forum_can_read_room(p_room text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT public.sfi_forum_session_ok() AND EXISTS (
  SELECT 1 FROM public.sfi_forum_members m JOIN public.sfi_forum_grants g ON g.user_id=m.user_id
  WHERE m.user_id=auth.uid() AND m.synthetic_test AND m.status='approved'
    AND m.identity_state='synthetic_verified' AND m.login_verified_at IS NOT NULL
    AND g.room_id=p_room AND g.state='active')
$$;
CREATE OR REPLACE FUNCTION public.sfi_forum_can_moderate_room(p_room text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT public.sfi_forum_can_read_room(p_room) AND EXISTS (
  SELECT 1 FROM public.sfi_forum_grants g WHERE g.user_id=auth.uid() AND g.room_id=p_room
   AND g.state='active' AND g.access_role='moderator')
$$;

CREATE OR REPLACE FUNCTION public.sfi_forum_register_session(
 p_user_id uuid,p_session_id text,p_expires_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_member public.sfi_forum_members; v_session public.sfi_forum_sessions;
BEGIN
 PERFORM pg_advisory_xact_lock(7071112026);
 SELECT * INTO v_member FROM public.sfi_forum_members WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR NOT v_member.synthetic_test OR v_member.status='deleted' THEN
  RAISE EXCEPTION 'pilot_access_denied' USING ERRCODE='42501';
 END IF;
 IF p_session_id IS NULL OR char_length(p_session_id)>100 OR p_expires_at IS NULL OR p_expires_at<=now()
  OR p_expires_at>now()+interval '2 hours'
  OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id::text=p_session_id AND user_id=p_user_id) THEN
  RAISE EXCEPTION 'invalid_provider_session' USING ERRCODE='28000';
 END IF;
 SELECT * INTO v_session FROM public.sfi_forum_sessions WHERE provider_session_id=p_session_id FOR UPDATE;
 IF FOUND THEN
  IF v_session.user_id<>p_user_id OR v_session.revoked_at IS NOT NULL THEN
   RAISE EXCEPTION 'session_revoked' USING ERRCODE='28000';
  END IF;
  UPDATE public.sfi_forum_sessions SET expires_at=greatest(expires_at,p_expires_at) WHERE provider_session_id=p_session_id;
 ELSE
  INSERT INTO public.sfi_forum_sessions(provider_session_id,user_id,expires_at) VALUES (p_session_id,p_user_id,p_expires_at);
 END IF;
 UPDATE public.sfi_forum_members SET login_verified_at=now() WHERE user_id=p_user_id;
 RETURN jsonb_build_object('registered',true,'syntheticOnly',true);
END $$;

CREATE OR REPLACE FUNCTION public._sfi_forum_debit(p_user uuid,p_bucket text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_limit integer; v_count integer;
BEGIN
 SELECT limit_per_day INTO v_limit FROM public.sfi_forum_limits WHERE bucket=p_bucket;
 IF v_limit IS NULL THEN RAISE EXCEPTION 'invalid_quota_bucket' USING ERRCODE='22023'; END IF;
 INSERT INTO public.sfi_forum_quotas(user_id,day,bucket,count) VALUES(p_user,(now() AT TIME ZONE 'UTC')::date,p_bucket,1)
 ON CONFLICT(user_id,day,bucket) DO UPDATE SET count=sfi_forum_quotas.count+1
 WHERE sfi_forum_quotas.count<v_limit RETURNING count INTO v_count;
 IF v_count IS NULL THEN RAISE EXCEPTION 'quota_exceeded' USING ERRCODE='P0001'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public._sfi_forum_alias(p_user uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce((SELECT CASE WHEN status='deleted' THEN 'Test participant' ELSE alias END
  FROM public.sfi_forum_members WHERE user_id=p_user),'Test participant')
$$;

CREATE OR REPLACE FUNCTION public.sfi_forum_rpc(p_action text,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
 v_actor uuid:=auth.uid(); v_member public.sfi_forum_members; v_target public.sfi_forum_members;
 v_thread public.sfi_forum_threads; v_message public.sfi_forum_messages;
 v_request public.sfi_forum_requests; v_report public.sfi_forum_reports;
 v_job public.sfi_forum_privacy_jobs;
 v_room text; v_title text; v_body text; v_reason text; v_decision text; v_state text;
 v_id uuid; v_key uuid; v_subject uuid; v_hash text; v_version integer; v_rows jsonb; v_grants jsonb;
 v_rooms text[]; v_moderate text[]; v_limit integer; v_after timestamptz; v_after_id uuid;
 v_allowed text[]; v_required text[]; v_field text;
BEGIN
 -- A short global transaction guard serialises pilot mutations, including
 -- membership/session revocation. All checks happen after the same lock.
 PERFORM pg_advisory_xact_lock(7071112026);
 IF v_actor IS NULL OR NOT public.sfi_forum_session_ok() THEN
  RAISE EXCEPTION 'unauthenticated' USING ERRCODE='28000';
 END IF;
 IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR octet_length(p_payload::text)>24000 THEN
  RAISE EXCEPTION 'invalid_payload' USING ERRCODE='22023';
 END IF;
 -- Validate at the RPC boundary too: direct provider clients do not pass
 -- through the HTTP handler and must not inject hidden approval/role fields.
 CASE p_action
 WHEN 'me','rooms','applications','logout','export','request_erasure' THEN v_allowed:=ARRAY[]::text[];v_required:=ARRAY[]::text[];
 WHEN 'threads','reports' THEN v_allowed:=ARRAY['room'];v_required:=ARRAY['room'];
 WHEN 'messages' THEN v_allowed:=ARRAY['thread_id','after','limit'];v_required:=ARRAY['thread_id'];
 WHEN 'application' THEN v_allowed:=ARRAY['alias','declared_role','version','ack'];v_required:=ARRAY['alias','declared_role'];
 WHEN 'create_thread' THEN v_allowed:=ARRAY['room','title','body','idempotency_key'];v_required:=v_allowed;
 WHEN 'create_message' THEN v_allowed:=ARRAY['thread_id','body','idempotency_key'];v_required:=v_allowed;
 WHEN 'edit_message' THEN v_allowed:=ARRAY['message_id','body','version'];v_required:=ARRAY['message_id','body'];
 WHEN 'delete_message' THEN v_allowed:=ARRAY['message_id','version'];v_required:=ARRAY['message_id'];
 WHEN 'report_message' THEN v_allowed:=ARRAY['message_id','version','reason'];v_required:=ARRAY['message_id','reason'];
 WHEN 'moderate_message' THEN v_allowed:=ARRAY['message_id','version','state','reason'];v_required:=ARRAY['message_id','state','reason'];
 WHEN 'review_member' THEN v_allowed:=ARRAY['subject_id','version','decision','rooms','reason'];v_required:=ARRAY['subject_id','decision','reason'];
 ELSE RAISE EXCEPTION 'unknown_action' USING ERRCODE='22023'; END CASE;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) AS keys(key) WHERE NOT key=ANY(v_allowed)) THEN RAISE EXCEPTION 'invalid_fields' USING ERRCODE='22023'; END IF;
 FOREACH v_field IN ARRAY v_required LOOP
  IF jsonb_typeof(p_payload->v_field) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'invalid_field_type' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p_action IN ('application','review_member','edit_message','delete_message','report_message','moderate_message') THEN
  IF jsonb_typeof(p_payload->'version') IS DISTINCT FROM 'number' OR NOT (p_payload->>'version')~'^[1-9][0-9]{0,8}$' THEN RAISE EXCEPTION 'invalid_version' USING ERRCODE='22023'; END IF;
 END IF;
 IF p_action='application' AND p_payload->'ack' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'ack_required' USING ERRCODE='22023'; END IF;
 IF p_payload ? 'after' THEN
  IF jsonb_typeof(p_payload->'after') IS DISTINCT FROM 'object'
   OR (SELECT count(*) FROM jsonb_object_keys(p_payload->'after'))<>2
   OR jsonb_typeof(p_payload->'after'->'created_at') IS DISTINCT FROM 'string'
   OR jsonb_typeof(p_payload->'after'->'id') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'invalid_cursor' USING ERRCODE='22023'; END IF;
 END IF;
 IF p_payload ? 'limit' THEN
  IF jsonb_typeof(p_payload->'limit') IS DISTINCT FROM 'number' OR NOT (p_payload->>'limit')~'^[1-9][0-9]{0,2}$'
   OR (p_payload->>'limit')::integer>100 THEN RAISE EXCEPTION 'invalid_limit' USING ERRCODE='22023'; END IF;
 END IF;
 SELECT * INTO v_member FROM public.sfi_forum_members WHERE user_id=v_actor FOR UPDATE;

 IF p_action='me' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(g) ORDER BY g.room_id),'[]'::jsonb) INTO v_grants FROM public.sfi_forum_grants g WHERE user_id=v_actor;
  SELECT coalesce(array_agg(room_id ORDER BY room_id),ARRAY[]::text[]) INTO v_moderate FROM public.sfi_forum_grants
   WHERE user_id=v_actor AND state='active' AND access_role='moderator' AND public.sfi_forum_can_moderate_room(room_id);
  RETURN jsonb_build_object('member',to_jsonb(v_member),'grants',v_grants,
   'permissions',jsonb_build_object('reviewMembership',public.sfi_forum_is_reviewer(),'moderateRooms',to_jsonb(v_moderate)),
   'pilot',jsonb_build_object('syntheticOnly',true,'kyc',false));
 ELSIF p_action='logout' THEN
  UPDATE public.sfi_forum_sessions SET revoked_at=now() WHERE user_id=v_actor AND provider_session_id=auth.jwt()->>'session_id';
  RETURN jsonb_build_object('loggedOut',true);
 ELSIF p_action='export' THEN
  RETURN jsonb_build_object('scope','own_data_only','export',jsonb_build_object(
   'member',to_jsonb(v_member),
   'ownThreads',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM public.sfi_forum_threads t WHERE author_id=v_actor),
   'ownMessages',(SELECT coalesce(jsonb_agg(to_jsonb(m)-'request_hash'-'client_request_id'),'[]'::jsonb) FROM public.sfi_forum_messages m WHERE author_id=v_actor),
   'ownReports',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.sfi_forum_reports r WHERE reporter_id=v_actor)));
 ELSIF p_action='request_erasure' THEN
  INSERT INTO public.sfi_forum_privacy_jobs(subject_id,kind) VALUES(v_actor,'erase') ON CONFLICT(subject_id,kind) DO NOTHING;
  SELECT * INTO v_job FROM public.sfi_forum_privacy_jobs WHERE subject_id=v_actor AND kind='erase';
  UPDATE public.sfi_forum_members SET status='deleted',identity_state='revoked',version=version+1,updated_at=now() WHERE user_id=v_actor;
  UPDATE public.sfi_forum_grants SET state='revoked',version=version+1 WHERE user_id=v_actor;
  UPDATE public.sfi_forum_sessions SET revoked_at=coalesce(revoked_at,now()) WHERE user_id=v_actor;
  INSERT INTO public.sfi_forum_audit(actor_id,subject_id,action,record_id) VALUES(v_actor,v_actor,'erasure_requested',v_job.id);
  RETURN jsonb_build_object('job',to_jsonb(v_job),'accessRevoked',true,'providerDeletionCompleted',false);
 ELSIF p_action='application' THEN
  IF p_payload->>'ack'<>'true' OR v_member.status<>'pending' THEN RAISE EXCEPTION 'application_not_allowed' USING ERRCODE='42501'; END IF;
  v_title:=p_payload->>'alias'; v_state:=p_payload->>'declared_role';v_version:=(p_payload->>'version')::integer;
  IF char_length(v_title) NOT BETWEEN 2 AND 60 OR v_state NOT IN ('inmate','former','relative','professional') THEN RAISE EXCEPTION 'invalid_application' USING ERRCODE='22023'; END IF;
  IF v_version IS NULL OR v_version<>v_member.version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='PT409'; END IF;
  PERFORM public._sfi_forum_debit(v_actor,'applications');
  UPDATE public.sfi_forum_members SET alias=v_title,declared_role=v_state,version=version+1,updated_at=now() WHERE user_id=v_actor RETURNING * INTO v_member;
  INSERT INTO public.sfi_forum_audit(actor_id,subject_id,action,record_version) VALUES(v_actor,v_actor,'application_updated',v_member.version);
  RETURN jsonb_build_object('member',to_jsonb(v_member));
 ELSIF p_action='applications' THEN
  IF NOT public.sfi_forum_is_reviewer() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY updated_at,user_id),'[]'::jsonb) INTO v_rows
   FROM (SELECT * FROM public.sfi_forum_members WHERE synthetic_test AND status<>'deleted' ORDER BY updated_at,user_id LIMIT 100) m;
  RETURN jsonb_build_object('applications',v_rows);
 ELSIF p_action='review_member' THEN
  IF NOT public.sfi_forum_is_reviewer() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  v_subject:=(p_payload->>'subject_id')::uuid; v_version:=(p_payload->>'version')::integer;
  v_decision:=p_payload->>'decision';v_reason:=p_payload->>'reason';
  IF v_subject IS NULL OR v_subject=v_actor OR char_length(btrim(v_reason)) NOT BETWEEN 3 AND 1500 THEN
   RAISE EXCEPTION 'invalid_review' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_target FROM public.sfi_forum_members WHERE user_id=v_subject AND synthetic_test FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_version IS NULL OR v_version<>v_target.version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='PT409'; END IF;
  IF v_decision='verify_test' THEN
   IF v_target.status<>'pending' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE='PT409'; END IF;
   UPDATE public.sfi_forum_members SET identity_state='synthetic_verified' WHERE user_id=v_subject;
  ELSIF v_decision='approve' THEN
   IF v_target.status<>'pending' OR v_target.identity_state<>'synthetic_verified' OR v_target.login_verified_at IS NULL THEN
    RAISE EXCEPTION 'review_gates_incomplete' USING ERRCODE='PT409';
   END IF;
   IF v_target.declared_role IN ('inmate','former') THEN v_rooms:=ARRAY['inside'];
   ELSIF v_target.declared_role='relative' THEN v_rooms:=ARRAY['relatives'];
   ELSE
    IF jsonb_typeof(p_payload->'rooms')<>'array' THEN RAISE EXCEPTION 'invalid_rooms' USING ERRCODE='22023'; END IF;
    SELECT array_agg(DISTINCT value) INTO v_rooms FROM jsonb_array_elements_text(p_payload->'rooms');
    IF cardinality(v_rooms) IS NULL OR cardinality(v_rooms)<1 OR cardinality(v_rooms)>2 OR NOT v_rooms<@ARRAY['inside','relatives'] THEN RAISE EXCEPTION 'invalid_rooms' USING ERRCODE='22023'; END IF;
   END IF;
   UPDATE public.sfi_forum_grants SET state='revoked',version=version+1 WHERE user_id=v_subject;
   FOREACH v_room IN ARRAY v_rooms LOOP
    INSERT INTO public.sfi_forum_grants(user_id,room_id,access_role,state) VALUES(v_subject,v_room,'member','active')
     ON CONFLICT(user_id,room_id) DO UPDATE SET state='active',access_role='member',version=sfi_forum_grants.version+1;
   END LOOP;
   UPDATE public.sfi_forum_members SET status='approved' WHERE user_id=v_subject;
  ELSIF v_decision='reject' THEN
   IF v_target.status<>'pending' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE='PT409'; END IF;
   UPDATE public.sfi_forum_members SET status='rejected',identity_state='revoked' WHERE user_id=v_subject;
  ELSIF v_decision='suspend' THEN
   IF v_target.status<>'approved' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE='PT409'; END IF;
   UPDATE public.sfi_forum_members SET status='suspended' WHERE user_id=v_subject;
  ELSIF v_decision='reopen' THEN
   IF v_target.status NOT IN ('rejected','suspended') THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE='PT409'; END IF;
   UPDATE public.sfi_forum_members SET status='pending',identity_state='pending' WHERE user_id=v_subject;
  ELSE RAISE EXCEPTION 'invalid_transition' USING ERRCODE='22023'; END IF;
  IF v_decision IN ('reject','suspend','reopen') THEN
   UPDATE public.sfi_forum_grants SET state='revoked',version=version+1 WHERE user_id=v_subject;
   UPDATE public.sfi_forum_sessions SET revoked_at=coalesce(revoked_at,now()) WHERE user_id=v_subject;
  END IF;
  PERFORM public._sfi_forum_debit(v_actor,'moderation');
  UPDATE public.sfi_forum_members SET reviewed_by=v_actor,reviewed_at=now(),version=version+1,updated_at=now() WHERE user_id=v_subject RETURNING * INTO v_target;
  INSERT INTO public.sfi_forum_audit(actor_id,subject_id,action,record_version,reason) VALUES(v_actor,v_subject,'member_'||v_decision,v_target.version,v_reason);
  RETURN jsonb_build_object('member',to_jsonb(v_target));
 ELSIF p_action='rooms' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]'::jsonb) INTO v_rows FROM public.sfi_forum_rooms r WHERE public.sfi_forum_can_read_room(id);
  RETURN jsonb_build_object('rooms',v_rows);
 ELSIF p_action IN ('threads','create_thread') THEN
  v_room:=p_payload->>'room';
  IF v_room NOT IN ('inside','relatives') THEN RAISE EXCEPTION 'invalid_room' USING ERRCODE='22023'; END IF;
  IF NOT public.sfi_forum_can_read_room(v_room) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_action='threads' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY created_at,id),'[]'::jsonb) INTO v_rows
    FROM (SELECT x.*,public._sfi_forum_alias(x.author_id) AS author_alias FROM public.sfi_forum_threads x WHERE room_id=v_room AND state<>'deleted' ORDER BY created_at,id LIMIT 100) t;
   RETURN jsonb_build_object('threads',v_rows);
  END IF;
  v_title:=p_payload->>'title';v_body:=p_payload->>'body';v_key:=(p_payload->>'idempotency_key')::uuid;
  IF v_key IS NULL OR char_length(btrim(v_title)) NOT BETWEEN 3 AND 160 OR char_length(v_title)>160
   OR char_length(btrim(v_body)) NOT BETWEEN 1 AND 6000 OR char_length(v_body)>6000 THEN RAISE EXCEPTION 'invalid_content' USING ERRCODE='22023'; END IF;
  v_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'room',v_room,'title',v_title,'body',v_body)::text,'UTF8')),'hex');
  SELECT * INTO v_request FROM public.sfi_forum_requests WHERE user_id=v_actor AND request_id=v_key;
  IF FOUND THEN
   IF v_request.action<>p_action OR v_request.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='PT409'; END IF;
   SELECT * INTO v_thread FROM public.sfi_forum_threads WHERE id=v_request.record_id AND room_id=v_room AND state<>'deleted';
   SELECT * INTO v_message FROM public.sfi_forum_messages WHERE id=v_request.related_id AND state='active';
   IF v_thread.id IS NULL OR v_message.id IS NULL THEN RAISE EXCEPTION 'request_no_longer_available' USING ERRCODE='PT409'; END IF;
   RETURN jsonb_build_object('thread',to_jsonb(v_thread)||jsonb_build_object('author_alias',public._sfi_forum_alias(v_thread.author_id)),'message',(to_jsonb(v_message)-'request_hash')||jsonb_build_object('author_alias',public._sfi_forum_alias(v_message.author_id)),'replayed',true);
  END IF;
  PERFORM public._sfi_forum_debit(v_actor,'threads');PERFORM public._sfi_forum_debit(v_actor,'writes');
  INSERT INTO public.sfi_forum_threads(room_id,author_id,title) VALUES(v_room,v_actor,v_title) RETURNING * INTO v_thread;
  INSERT INTO public.sfi_forum_messages(room_id,thread_id,author_id,client_request_id,request_hash,body) VALUES(v_room,v_thread.id,v_actor,v_key,v_hash,v_body) RETURNING * INTO v_message;
  INSERT INTO public.sfi_forum_requests VALUES(v_actor,v_key,p_action,v_hash,v_thread.id,v_message.id,now());
  INSERT INTO public.sfi_forum_audit(actor_id,room_id,action,record_id,record_version) VALUES(v_actor,v_room,'thread_created',v_thread.id,1);
  RETURN jsonb_build_object('thread',to_jsonb(v_thread)||jsonb_build_object('author_alias',public._sfi_forum_alias(v_thread.author_id)),'message',(to_jsonb(v_message)-'request_hash')||jsonb_build_object('author_alias',public._sfi_forum_alias(v_message.author_id)),'replayed',false);
 ELSIF p_action IN ('messages','create_message') THEN
  v_id:=(p_payload->>'thread_id')::uuid;
  SELECT * INTO v_thread FROM public.sfi_forum_threads WHERE id=v_id AND state<>'deleted' FOR UPDATE;
  IF NOT FOUND OR NOT public.sfi_forum_can_read_room(v_thread.room_id) THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  v_room:=v_thread.room_id;
  IF p_action='messages' THEN
   v_limit:=least(100,greatest(1,coalesce((p_payload->>'limit')::integer,100)));
   v_after:=(p_payload->'after'->>'created_at')::timestamptz;v_after_id:=(p_payload->'after'->>'id')::uuid;
   IF (v_after IS NULL)<>(v_after_id IS NULL) THEN RAISE EXCEPTION 'invalid_cursor' USING ERRCODE='22023'; END IF;
   SELECT coalesce(jsonb_agg(to_jsonb(m)-'request_hash' ORDER BY created_at,id),'[]'::jsonb) INTO v_rows
    FROM (SELECT x.*,public._sfi_forum_alias(x.author_id) AS author_alias FROM public.sfi_forum_messages x WHERE thread_id=v_id
     AND (state='active' OR (state='hidden' AND public.sfi_forum_can_moderate_room(room_id)))
     AND (v_after IS NULL OR (created_at,id)>(v_after,v_after_id)) ORDER BY created_at,id LIMIT v_limit) m;
   RETURN jsonb_build_object('thread',to_jsonb(v_thread)||jsonb_build_object('author_alias',public._sfi_forum_alias(v_thread.author_id)),'messages',v_rows);
  END IF;
  IF v_thread.state<>'active' THEN RAISE EXCEPTION 'thread_locked' USING ERRCODE='PT409'; END IF;
  v_body:=p_payload->>'body';v_key:=(p_payload->>'idempotency_key')::uuid;
  IF v_key IS NULL OR char_length(btrim(v_body)) NOT BETWEEN 1 AND 6000 OR char_length(v_body)>6000 THEN RAISE EXCEPTION 'invalid_content' USING ERRCODE='22023'; END IF;
  v_hash:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'thread',v_id,'body',v_body)::text,'UTF8')),'hex');
  SELECT * INTO v_request FROM public.sfi_forum_requests WHERE user_id=v_actor AND request_id=v_key;
  IF FOUND THEN
   IF v_request.action<>p_action OR v_request.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='PT409'; END IF;
   SELECT * INTO v_message FROM public.sfi_forum_messages WHERE id=v_request.record_id AND thread_id=v_id AND state='active';
   IF v_message.id IS NULL THEN RAISE EXCEPTION 'request_no_longer_available' USING ERRCODE='PT409'; END IF;
   RETURN jsonb_build_object('message',(to_jsonb(v_message)-'request_hash')||jsonb_build_object('author_alias',public._sfi_forum_alias(v_message.author_id)),'replayed',true);
  END IF;
  PERFORM public._sfi_forum_debit(v_actor,'messages');PERFORM public._sfi_forum_debit(v_actor,'writes');
  INSERT INTO public.sfi_forum_messages(room_id,thread_id,author_id,client_request_id,request_hash,body) VALUES(v_room,v_id,v_actor,v_key,v_hash,v_body) RETURNING * INTO v_message;
  INSERT INTO public.sfi_forum_requests VALUES(v_actor,v_key,p_action,v_hash,v_message.id,NULL,now());
  INSERT INTO public.sfi_forum_audit(actor_id,room_id,action,record_id,record_version) VALUES(v_actor,v_room,'message_created',v_message.id,1);
  RETURN jsonb_build_object('message',(to_jsonb(v_message)-'request_hash')||jsonb_build_object('author_alias',public._sfi_forum_alias(v_message.author_id)),'replayed',false);
 ELSIF p_action IN ('edit_message','delete_message','report_message','moderate_message') THEN
  v_id:=(p_payload->>'message_id')::uuid;v_version:=(p_payload->>'version')::integer;
  SELECT * INTO v_message FROM public.sfi_forum_messages WHERE id=v_id AND state<>'deleted' FOR UPDATE;
  IF NOT FOUND OR NOT public.sfi_forum_can_read_room(v_message.room_id) THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_version IS NULL OR v_version<>v_message.version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='PT409'; END IF;
  v_room:=v_message.room_id;
  IF p_action='report_message' THEN
   IF v_message.state<>'active' THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
   v_reason:=p_payload->>'reason';IF char_length(btrim(v_reason)) NOT BETWEEN 3 AND 1500 OR char_length(v_reason)>1500 THEN RAISE EXCEPTION 'invalid_reason' USING ERRCODE='22023'; END IF;
   SELECT * INTO v_report FROM public.sfi_forum_reports WHERE message_id=v_id AND reporter_id=v_actor AND reported_version=v_version;
   IF FOUND THEN
    IF v_report.reason<>v_reason THEN RAISE EXCEPTION 'report_conflict' USING ERRCODE='PT409'; END IF;
    RETURN jsonb_build_object('report',to_jsonb(v_report),'replayed',true);
   END IF;
   PERFORM public._sfi_forum_debit(v_actor,'reports');
   INSERT INTO public.sfi_forum_reports(message_id,reporter_id,reported_version,reason) VALUES(v_id,v_actor,v_version,v_reason) RETURNING * INTO v_report;
   INSERT INTO public.sfi_forum_audit(actor_id,room_id,action,record_id,record_version) VALUES(v_actor,v_room,'message_reported',v_report.id,v_version);
   RETURN jsonb_build_object('report',to_jsonb(v_report),'replayed',false);
  ELSIF p_action='moderate_message' THEN
   IF NOT public.sfi_forum_can_moderate_room(v_room) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
   v_state:=p_payload->>'state';v_reason:=p_payload->>'reason';
   IF v_state NOT IN ('active','hidden') OR v_state=v_message.state OR char_length(btrim(v_reason)) NOT BETWEEN 3 AND 1500 OR char_length(v_reason)>1500 THEN RAISE EXCEPTION 'invalid_moderation' USING ERRCODE='22023'; END IF;
   PERFORM public._sfi_forum_debit(v_actor,'moderation');
   UPDATE public.sfi_forum_messages SET state=v_state,version=version+1,updated_at=now() WHERE id=v_id RETURNING * INTO v_message;
   UPDATE public.sfi_forum_reports SET state='resolved' WHERE message_id=v_id;
  ELSE
   IF v_message.author_id<>v_actor OR v_message.state<>'active' THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
   PERFORM public._sfi_forum_debit(v_actor,'writes');
   IF p_action='edit_message' THEN
    v_body:=p_payload->>'body';IF char_length(btrim(v_body)) NOT BETWEEN 1 AND 6000 OR char_length(v_body)>6000 THEN RAISE EXCEPTION 'invalid_content' USING ERRCODE='22023'; END IF;
    UPDATE public.sfi_forum_messages SET body=v_body,version=version+1,updated_at=now() WHERE id=v_id RETURNING * INTO v_message;
   ELSE
    UPDATE public.sfi_forum_messages SET body='',request_hash=NULL,state='deleted',version=version+1,updated_at=now() WHERE id=v_id RETURNING * INTO v_message;
    UPDATE public.sfi_forum_requests SET request_hash=NULL WHERE user_id=v_actor AND (record_id=v_id OR related_id=v_id);
   END IF;
  END IF;
  INSERT INTO public.sfi_forum_audit(actor_id,room_id,action,record_id,record_version,reason) VALUES(v_actor,v_room,p_action,v_id,v_message.version,coalesce(v_reason,''));
  RETURN jsonb_build_object('message',(to_jsonb(v_message)-'request_hash')||jsonb_build_object('author_alias',public._sfi_forum_alias(v_message.author_id)));
 ELSIF p_action='reports' THEN
  v_room:=p_payload->>'room';IF NOT public.sfi_forum_can_moderate_room(v_room) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY created_at,id),'[]'::jsonb) INTO v_rows FROM
   (SELECT r.* FROM public.sfi_forum_reports r JOIN public.sfi_forum_messages m ON m.id=r.message_id WHERE m.room_id=v_room ORDER BY r.created_at,r.id LIMIT 100) r;
  RETURN jsonb_build_object('reports',v_rows);
 ELSE RAISE EXCEPTION 'unknown_action' USING ERRCODE='22023';
 END IF;
END $$;

-- Explicit RLS on every pilot table. Control tables have no client read policy.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['members','sessions','reviewers','rooms','grants','threads','messages','requests','reports','audit','limits','quotas','privacy_jobs'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY','sfi_forum_'||t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated','sfi_forum_'||t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role','sfi_forum_'||t);
 END LOOP;
END $$;
GRANT SELECT ON public.sfi_forum_members,public.sfi_forum_grants,public.sfi_forum_rooms,public.sfi_forum_threads,public.sfi_forum_reports,public.sfi_forum_privacy_jobs TO authenticated;
GRANT SELECT(id,room_id,thread_id,author_id,body,state,version,created_at,updated_at) ON public.sfi_forum_messages TO authenticated;
DROP POLICY IF EXISTS sfi_member_read ON public.sfi_forum_members;
CREATE POLICY sfi_member_read ON public.sfi_forum_members FOR SELECT TO authenticated USING(public.sfi_forum_session_ok() AND (user_id=auth.uid() OR public.sfi_forum_is_reviewer()));
DROP POLICY IF EXISTS sfi_grant_read ON public.sfi_forum_grants;
CREATE POLICY sfi_grant_read ON public.sfi_forum_grants FOR SELECT TO authenticated USING(public.sfi_forum_session_ok() AND (user_id=auth.uid() OR public.sfi_forum_is_reviewer()));
DROP POLICY IF EXISTS sfi_room_read ON public.sfi_forum_rooms;
CREATE POLICY sfi_room_read ON public.sfi_forum_rooms FOR SELECT TO authenticated USING(public.sfi_forum_can_read_room(id));
DROP POLICY IF EXISTS sfi_thread_read ON public.sfi_forum_threads;
CREATE POLICY sfi_thread_read ON public.sfi_forum_threads FOR SELECT TO authenticated USING(public.sfi_forum_can_read_room(room_id) AND state<>'deleted');
DROP POLICY IF EXISTS sfi_message_read ON public.sfi_forum_messages;
CREATE POLICY sfi_message_read ON public.sfi_forum_messages FOR SELECT TO authenticated USING(public.sfi_forum_can_read_room(room_id) AND (state='active' OR (state='hidden' AND public.sfi_forum_can_moderate_room(room_id))));
DROP POLICY IF EXISTS sfi_report_read ON public.sfi_forum_reports;
CREATE POLICY sfi_report_read ON public.sfi_forum_reports FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.sfi_forum_messages m WHERE m.id=message_id AND public.sfi_forum_can_moderate_room(m.room_id)));
DROP POLICY IF EXISTS sfi_privacy_read ON public.sfi_forum_privacy_jobs;
CREATE POLICY sfi_privacy_read ON public.sfi_forum_privacy_jobs FOR SELECT TO authenticated USING(public.sfi_forum_session_ok() AND subject_id=auth.uid());

-- PostgreSQL grants EXECUTE to PUBLIC by default. Remove it on all pilot funcs,
-- including private internals, then grant only the reviewed external interface.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (left(p.proname,10)='sfi_forum_' OR left(p.proname,11)='_sfi_forum_') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',f.sig);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.sfi_forum_session_ok(),public.sfi_forum_is_reviewer(),public.sfi_forum_can_read_room(text),public.sfi_forum_can_moderate_room(text),public.sfi_forum_rpc(text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfi_forum_register_session(uuid,text,timestamptz) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
