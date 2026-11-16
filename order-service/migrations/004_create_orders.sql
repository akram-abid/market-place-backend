create table orders (
    id uuid primary key default gen_random_uuid(),
    buyer_id uuid references users(id) not null,
    status varchar(255) not null default 'pending' check (
        status in (
            'pending',
            'paid',
            'shipped',
            'delivered',
            'cancelled'
        )
    ),
    total_cents integer not null check(total_cents >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid not null references products(id),
    product_name_snapshot varchar(255) not null,
    unit_price_cents_snapshot integer not null,
    quantity integer not null check (quantity > 0) 
);

create index orders_buyer_id on orders (buyer_id);
create index order_items_order_id on order_items (order_id);