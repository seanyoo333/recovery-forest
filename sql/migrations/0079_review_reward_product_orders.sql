-- Create table to store product orders for review verification
-- CSV 컬럼 예시: 주문번호, 상품번호, 주문일시, 구매자, 상품명, 주문수량, 판매단가
create table if not exists public.product_orders (
  product_order_id bigserial primary key,
  order_number text not null,
  product_id bigint not null references public.products(product_id) on delete cascade,
  order_datetime timestamptz not null,
  buyer text, -- CSV의 구매자
  product_name text, -- CSV의 상품명
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  profile_id uuid references public.profiles(profile_id) on delete cascade,
  is_review_rewarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index to speed up lookup by order_number / product / profile
create index if not exists product_orders_lookup_idx
  on public.product_orders (order_number, product_id, profile_id);

alter table public.product_orders enable row level security;

-- Users can see their own orders (for verification)
create policy "product-orders select own"
  on public.product_orders
  for select
  to authenticated
  using (profile_id = auth.uid());

-- Users can mark their own orders as rewarded (used when writing a review)
create policy "product-orders update own"
  on public.product_orders
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());


