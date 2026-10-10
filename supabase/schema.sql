create type profile_id as enum ('S', 'K');
create type credit_type as enum ('half', 'full');
create type event_type as enum (
  'session','test','individual_assignment','individual_project',
  'group_assignment','group_project','exam','extracurricular','other'
);
create type event_status as enum ('scheduled','cancelled');
create type attendance_status as enum ('present','absent');

create table trimesters (
  id uuid primary key default gen_random_uuid(),
  profile profile_id not null,
  name text not null,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  profile profile_id not null,
  trimester_id uuid references trimesters(id) on delete set null,
  name text not null,
  code text not null default '',
  professor text not null default '',
  credit_type credit_type not null default 'full',
  min_sessions int not null default 20,
  color text not null default '#6366f1',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  profile profile_id not null,
  trimester_id uuid references trimesters(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  type event_type not null default 'other',
  title text not null default '',
  date date not null,
  start_time time,
  end_time time,
  room text not null default '',
  status event_status not null default 'scheduled',
  recurring_group_id text not null default '',
  linked_to uuid references events(id) on delete set null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attendance (
  event_id uuid primary key references events(id) on delete cascade,
  profile profile_id not null,
  course_id uuid references courses(id) on delete set null,
  date date,
  status attendance_status not null default 'present',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table trimesters enable row level security;
alter table courses enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;

create policy "anon_all" on trimesters for all using (true) with check (true);
create policy "anon_all" on courses for all using (true) with check (true);
create policy "anon_all" on events for all using (true) with check (true);
create policy "anon_all" on attendance for all using (true) with check (true);

create index on trimesters(profile);
create index on courses(profile);
create index on events(profile, date);
create index on events(course_id);
create index on attendance(profile);
