# 🍔 FoodRush

A modern food delivery mobile app built with **React Native + Expo**, featuring restaurant discovery, menu browsing, cart management, and user authentication with role-based access. All data is persisted live in **Supabase**.

## Features

- **Discover** — Browse featured and categorized restaurants (live from Supabase)
- **Search** — Filter by cuisine, name, and category
- **Cart** — Add items with customization modifiers, adjust quantities, checkout flow
- **Orders** — View order history and live status tracking (synced to Supabase)
- **Reviews** — Post restaurant reviews and ratings (stored in Supabase)
- **Favorites** — Bookmark restaurants (persisted per user in Supabase)
- **Addresses** — Manage saved delivery addresses (synced to Supabase)
- **Auth** — Sign up / sign in with email & password (Supabase Auth)
- **Roles** — `client`, `admin`, `restaurant_admin`, and `employee`
- **Admin Panel** — Manage users, restaurants, menu items, and order status by role

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router v6 (file-based) |
| Backend / Auth / DB | Supabase (PostgreSQL) |
| Server State | TanStack React Query |
| Animations | React Native Reanimated |
| Fonts | Google Fonts – Nunito |
| Storage | Supabase + AsyncStorage fallback |

## Project Structure

```
app/
  (tabs)/          # Bottom tab screens: Discover, Search, Orders, Profile
  restaurant/[id]  # Dynamic restaurant detail page
  auth.tsx         # Sign in / Sign up modal
  checkout.tsx     # Checkout modal
  admin.tsx        # Admin dashboard (admin role only)
components/        # Reusable UI components
context/           # Auth, cart, data, notification, and preferences contexts
hooks/             # useColors (theme)
lib/               # Supabase client, QueryClient, haptics
data/              # Seed data (restaurants, menu items)
```

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project

### Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

Run all of the following SQL blocks in your Supabase **SQL Editor** (Dashboard → SQL Editor → New Query).

#### 1. Profiles & Auth

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'client'
    check (role in ('client', 'admin', 'restaurant_admin', 'employee')),
  restaurant_id text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### 2. Restaurants

```sql
create table public.restaurants (
  id text primary key,
  name text not null,
  cuisine text,
  rating numeric default 0,
  review_count int default 0,
  delivery_time text,
  delivery_fee numeric default 0,
  min_order numeric default 0,
  image_url text,
  categories text[],
  featured boolean default false,
  price_range text,
  description text
);

-- RLS disabled: restaurants are public catalogue data — the app seeds and manages them directly
alter table public.restaurants disable row level security;
```

#### 3. Menu Items

```sql
create table public.menu_items (
  id text primary key,
  restaurant_id text references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  image_url text,
  category text,
  popular boolean default false,
  modifier_groups jsonb
);

-- RLS disabled: menu items are public catalogue data — the app seeds and manages them directly
alter table public.menu_items disable row level security;
```

#### 4. Orders

```sql
create table public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  restaurant_id text references public.restaurants(id),
  items text[],
  items_raw jsonb,
  reviewed boolean default false,
  total numeric,
  status text default 'pending',
  date text,
  address_label text,
  address_details text,
  discount_applied numeric,
  promo_code_used text,
  payment_method text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users see own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Users update own orders" on public.orders
  for update using (auth.uid() = user_id or public.is_admin());
```

#### 5. Reviews

```sql
create table public.reviews (
  id text primary key,
  restaurant_id text references public.restaurants(id) on delete cascade,
  user_id uuid references auth.users(id),
  user_name text,
  rating int,
  comment text,
  date text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Public read" on public.reviews
  for select using (true);

create policy "Anyone can insert reviews" on public.reviews
  for insert with check (true);
```

#### 6. Favorites

```sql
create table public.user_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  restaurant_id text references public.restaurants(id) on delete cascade,
  primary key (user_id, restaurant_id)
);

alter table public.user_favorites enable row level security;

create policy "Users manage own favorites" on public.user_favorites
  for all using (auth.uid() = user_id);
```

#### 7. Addresses

```sql
create table public.user_addresses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  label text,
  details text,
  notes text
);

alter table public.user_addresses enable row level security;

create policy "Users manage own addresses" on public.user_addresses
  for all using (auth.uid() = user_id);
```

#### 8. Promote a user to Admin

```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

### Run

```bash
npm install
npx expo start --web --port 8081
# or for mobile
npx expo start
```

The app auto-seeds restaurants, menu items, and reviews into Supabase on first launch. Subsequent starts read directly from the database.

## Deployment

The app runs as a web SPA via Metro bundler.

---

Built with Expo + Supabase · FoodRush v1.0.0
