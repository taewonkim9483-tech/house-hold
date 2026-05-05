-- TASK-04: 영수증 분석

-- 카테고리 마스터
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.groups(id) on delete cascade,
  name_ko     text not null,
  name_ja     text not null,
  icon        text not null,
  is_system   boolean not null default false,
  sort_order  int not null default 0
);

insert into public.categories (name_ko, name_ja, icon, is_system, sort_order) values
  ('신선식품', '生鮮食品', '🥬', true, 1),
  ('가공식품', '加工食品', '🥫', true, 2),
  ('음료',     '飲料',     '🥤', true, 3),
  ('주류',     'アルコール','🍺', true, 4),
  ('생활용품', '日用品',   '🧴', true, 5),
  ('청소용품', '清掃用品', '🧹', true, 6),
  ('의약품/건강','医薬品・健康','💊', true, 7),
  ('반려동물용품','ペット用品','🐾', true, 8),
  ('육아용품', '育児用品', '👶', true, 9),
  ('기타',     'その他',   '📦', true, 10);

-- 커스텀 단위 설정
create table public.custom_units (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  item_name   text,
  category_id uuid references public.categories(id),
  unit_type   text not null check (unit_type in ('per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml')),
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

-- 태그
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- 영수증
create table public.receipts (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  uploaded_by  uuid not null references public.users(id),
  store_name   text not null,
  purchased_at timestamptz not null,
  total_amount int not null,
  tax_amount   int,
  image_url    text,
  created_at   timestamptz not null default now()
);

-- 영수증 상품
create table public.receipt_items (
  id            uuid primary key default gen_random_uuid(),
  receipt_id    uuid not null references public.receipts(id) on delete cascade,
  name          text not null,
  category_id   uuid references public.categories(id),
  quantity      numeric not null default 1,
  unit_price    int not null,
  subtotal      int not null,
  unit_type     text not null default 'per_count'
                  check (unit_type in ('per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml')),
  weight_g      numeric,
  volume_ml     numeric,
  price_per_100 numeric,
  created_at    timestamptz not null default now()
);

-- 상품-태그 매핑
create table public.item_tags (
  item_id uuid not null references public.receipt_items(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

-- RLS
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;
alter table public.categories enable row level security;
alter table public.custom_units enable row level security;
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;

create policy "그룹 멤버만 접근" on public.receipts
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));

create policy "영수증 통해 접근" on public.receipt_items
  using (receipt_id in (
    select id from public.receipts where group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  ));

create policy "시스템 카테고리 전체 공개, 그룹 카테고리는 멤버만" on public.categories
  using (
    is_system = true
    or group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

create policy "그룹 멤버만 custom_units 접근" on public.custom_units
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));

create policy "태그 전체 공개" on public.tags
  using (true);

create policy "item_tags — 영수증 통해 접근" on public.item_tags
  using (item_id in (
    select ri.id from public.receipt_items ri
    join public.receipts r on r.id = ri.receipt_id
    where r.group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  ));
