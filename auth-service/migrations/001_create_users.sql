CREATE EXTENSION IF NOT EXISTS "pgcrypto";

create table users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) unique not null,
    password_hash text not null,
    role varchar(20) not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
    is_email_verified boolean not null default FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;