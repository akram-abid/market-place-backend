create table categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    slug varchar(255) not null unique
);

create table products (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid not null references users(id),
    category_id uuid references categories(id),
    name varchar(255) not null,
    description text,
    price_cents integer not null check (price_cents >= 0),
    stock_quantity integer not null default 0 check(stock_quantity >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz 
);

create index products_seller_id_idx on products (seller_id);
create index products_category_idx on products (category_id);