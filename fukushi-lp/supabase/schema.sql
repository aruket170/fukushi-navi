-- Supabase SQL Editor で実行する想定の facilities テーブル例
-- 市区町村は index.html の入力と完全一致させる（例：「東京都渋谷区」）

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  municipality text not null,
  name text not null,
  address text,
  phone text,
  service_type text,
  description text,
  created_at timestamptz default now()
);

create index if not exists facilities_municipality_idx on public.facilities (municipality);

alter table public.facilities enable row level security;

-- 匿名ユーザーは SELECT のみ許可（anon key 用）
create policy "Allow public read access"
  on public.facilities
  for select
  to anon
  using (true);

-- サンプルデータ
insert into public.facilities (municipality, name, address, phone, service_type, description) values
  ('東京都渋谷区', 'サンプル生活介護A', '東京都渋谷区○○1-2-3', '03-0000-0001', '生活介護', '平日昼間の活動支援'),
  ('東京都渋谷区', 'サンプル就労継続B', '東京都渋谷区△△4-5-6', '03-0000-0002', '就労継続支援B型', '軽作業・PC訓練');
