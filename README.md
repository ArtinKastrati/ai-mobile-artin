# 🍔 FoodRush

A modern food delivery mobile app built with **React Native + Expo**, featuring restaurant discovery, menu browsing, cart management, and user authentication with role-based access.

## Features

- **Discover** — Browse featured and categorized restaurants
- **Search** — Filter by cuisine, name, and category
- **Cart** — Add items, adjust quantities, checkout flow
- **Orders** — View order history and live status tracking
- **Auth** — Sign up / sign in with email & password (Supabase)
- **Roles** — `client`, `admin`, `restaurant_admin`, and `employee`
- **Admin Panel** — Manage users, restaurants, menu items, and order status by role

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router v6 (file-based) |
| Backend / Auth / DB | Supabase |
| Server State | TanStack React Query |
| Animations | React Native Reanimated |
| Fonts | Google Fonts – Nunito |
| Storage | AsyncStorage + expo-secure-store |

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
data/              # Mock restaurant & menu data
```

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project

### Environment Variables

Set these in Replit Secrets:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

Run the following SQL in your Supabase **SQL Editor** to enable profiles and roles:

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Create helper function to check admin role (security definer avoids recursion)
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
  for select using (
    auth.uid() = id
    or public.is_admin()
  );

create policy "Users can update own profile" on public.profiles
  for update using (
    auth.uid() = id
    or public.is_admin()
  );

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

### Multi-Role Migration SQL (Session 8)
Run the following SQL in your Supabase SQL editor to enable the new partner roles and link profiles to restaurants:
```sql
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('client', 'admin', 'restaurant_admin', 'employee'));
alter table public.profiles add column if not exists restaurant_id text;
```

To promote yourself to admin:
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

### Run

```bash
npm install
npx expo start --web --port 5000
```

## Deployment

Hosted on [Replit](https://replit.com). The app runs as a web SPA via Metro bundler on port 5000.

---

Built with Expo + Supabase · FoodRush v1.0.0
