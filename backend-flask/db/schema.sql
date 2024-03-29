CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.users cascade;
DROP TABLE IF EXISTS public.activities;

CREATE TABLE IF NOT EXISTS public.schema_information (
  last_successful_run text,
  last_migration_file text
);

CREATE TABLE public.users (
  uuid UUID default uuid_generate_v4() primary key,
  display_name text NOT NULL,
  handle text NOT NULL,
  email text NOT NULL,
  cognito_user_id text NOT NULL,
  created_at timestamp default current_timestamp NOT NULL
);

CREATE TABLE public.activities (
  uuid UUID default uuid_generate_v4() primary key,
  user_uuid UUID REFERENCES public.users(uuid) NOT NULL,
  message text NOT NULL,
  replies_count integer default 0,
  reposts_count integer default 0,
  likes_count integer default 0,
  reply_to_activity_uuid integer,
  expires_at timestamp,
  created_at timestamp default current_timestamp NOT NULL
);