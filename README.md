# HostelBook — FUTA Off-Campus Housing Platform

A WhatsApp-style housing booking + chat platform for FUTA students. **Frontend-only demo**: no backend, no database — all data lives in `localStorage` (web) / AsyncStorage (mobile) behind a small mock engine that mirrors the original REST + Socket.io API.

| Folder | Stack | Layout shell |
|--------|-------|--------------|
| `Web/HousingBooking/` | React 19 · Vite · Tailwind · Leaflet | WhatsApp-Web-style sidebar + right panel |
| `Mobile/HousingBooking/` | Expo SDK 57 · React Native · expo-router | Bottom tabs (Feed / Map / Chat / Profile) |

## Features

- **Auth** — Student (matric no), Agent (admin-approval gate), fixed Admin accounts, forgot-password flow. Every demo account uses password `Password123!`.
- **Feed** — listing cards with photos, region badges, room type, price/month, walk time, filters (region/price/availability)
- **Listing detail** — gallery, amenities, room types, agent card w/ verified badge, Message Agent + Book Now
- **Map** — Leaflet (web) / react-native-maps (mobile), color-coded pins by region, walk distance, "Use My Location"
- **Chat** — mock real-time (simulated agent replies + typing via an event bus), WhatsApp bubbles, read receipts (✓/✓✓), typing indicator, system messages, booking invites
- **Bookings & payments** — mock escrow flow: Requested → Pending Payment → Paid (Escrow) → Confirmed → Active → Completed, with dispute window
- **Agent dashboard** — post/manage listings, confirm bookings, earnings view (web route `/agent`)
- **Admin portal** — `/admin`: approve/suspend agents, moderate listings, all bookings, transactions & revenue, users

## Quick Start

### 1. Web app

```bash
cd Web/HousingBooking
npm install
npm run dev                # http://localhost:5173
```

### 2. Mobile app

```bash
cd Mobile/HousingBooking
npm install
npm start                  # Expo — scan QR with Expo Go
```

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student@housingbooking.app` | `Password123!` |
| Agent | `agent1@housingbooking.app` | `Password123!` |
| Admin | `supresident@student.futa.edu.ng` | `Password123!` |

## How the mock works

- `Web/HousingBooking/src/mock.ts` and `Mobile/HousingBooking/src/lib/mock.ts` hold the entire in-memory database: 9 seeded hostels (West/South/North Gate), 3 agents, 2 admins, 2 students, seeded conversations/messages, and bookings.
- Web persists to `localStorage` (key `hb_mock_db_v2`); mobile persists to AsyncStorage (same key). Reset by clearing that key.
- The API layer (`src/api.ts` web, `src/lib/api.ts` plus `src/lib/store.ts` mobile) exposes the same `authApi`, `listingsApi`, `bookingsApi`, `paymentsApi`, `messagesApi` shapes as the old REST API, resolved from the mock after a small delay.
- Real-time chat is simulated: a global event bus replaces Socket.io, and agents auto-reply with canned messages + typing indicator ~2s after you send.
- Payments return a fake Paystack `authorization_url` — no money moves.

## Verification

- Web: `npm run build` (Vite) and `npm run lint` both clean (0 errors).
- Mobile: `npx tsc --noEmit` clean; `npx expo export --platform web` builds all 15 routes.