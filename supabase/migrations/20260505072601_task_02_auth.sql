-- TASK-02: 인증 — public.users 프로필 테이블 + 자동 생성 트리거

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  lang         text not null default 'ko' check (lang in ('ko', 'ja')),
  created_at   timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;

create policy "본인만 조회/수정"
  on public.users
  using (auth.uid() = id);

-- Google OAuth 로그인 시 자동 프로필 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
