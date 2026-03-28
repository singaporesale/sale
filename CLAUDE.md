# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SingaporeSales — A relocation sale website for selling household items in Singapore. Plain HTML/CSS/vanilla JS frontend with Supabase backend.

## Architecture

- **Frontend**: Plain HTML, CSS, vanilla JS (ES modules). No frameworks, no build tools, no npm.
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Two pages**: `index.html` (public storefront), `admin.html` (authenticated admin panel)
- **Supabase project ref**: ftbvdeinxehpjjkahjeg

## File Structure

```
index.html          — Public storefront
admin.html          — Admin panel (auth-protected)
css/styles.css      — Storefront styles (mobile-first)
css/admin.css       — Admin styles
js/config.js        — Supabase URL, anon key, categories, constants
js/supabase-client.js — Supabase client singleton
js/store.js         — Lightweight reactive store
js/api.js           — All Supabase queries
js/app.js           — Storefront init, routing, filters, realtime
js/components.js    — Storefront UI components
js/gallery.js       — Photo gallery + lightbox
js/countdown.js     — Sale countdown timer
js/admin-app.js     — Admin init, auth, routing
js/admin-components.js — Admin UI components
sql/schema.sql      — Database schema reference
```

## Development

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Credentials

- Never commit secrets (service_role key, personal access token, passwords)
- The anon key in config.js is public by design (protected by RLS)
- Admin login: single user, signups disabled
