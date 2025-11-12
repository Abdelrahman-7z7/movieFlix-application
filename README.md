<div align="center">
  <img src="https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/NativeWind-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge" />
</div>

## MovieFlix — React Native + Expo

A production‑ready movie discovery app. Browse trending titles, search the TMDB catalog, and view rich details. Built with Expo Router, TypeScript, and a utility‑first design system.

## Contents

- Introduction
- Tech Stack
- Features
- App Architecture
- Project Structure
- Setup & Scripts
- Environment Variables
- API Integration
- Conventions
- Troubleshooting

## Introduction

MovieFlix provides:

- Fast home feed with trending and latest movies
- Powerful search with debounced input
- Movie details screen with poster, ratings, genres, budget, revenue, and production companies
- Pull‑to‑refresh across screens
- Notch‑safe UI with dynamic status inset coloring

## Tech Stack

- Expo SDK 52 (Expo Router, Metro)
- React Native 0.76 + TypeScript
- NativeWind (Tailwind‑like styling)
- Appwrite (for trending data) and TMDB (for movie data)

## Features

- Home: trending (Appwrite) + latest (TMDB)
- Search: query TMDB, show grid of results
- Details: posters, info, rating, overview, genres, budget/revenue
- Global RefreshableScroll for pull‑to‑refresh
- SafeArea handling and flexible status bar coloring

## App Architecture

- File‑based routing via Expo Router (`app/`)
- Stateless UI components in `components/`
- Data layer in `services/` with `useFetch` hook for async state
- Types in `interfaces/`
- Centralized image/icon constants in `constants/`
- Tailwind config via NativeWind + `globals.css`

## Project Structure

```
app/
  (tabs)/
    _layout.tsx           # Bottom tabs layout
    index.tsx             # Home screen (Trending + Latest)
    search.tsx            # Search screen
    save.tsx              # Saved (stub)
    profile.tsx           # Profile (stub)
  _layout.tsx             # Root stack, SafeArea & StatusBar
  movie/[id].tsx          # Movie details screen

components/
  MovieCard.tsx           # Grid card for a movie
  TrendıngCard.tsx        # Horizontal trending card
  SearchBar.tsx           # Search input with CTA
  RefreshableScroll.tsx   # Reusable pull‑to‑refresh wrapper
  TopInset.tsx            # Optional notch spacer

services/
  api.ts                  # TMDB API calls
  appwrite.ts             # Appwrite client & queries (trending)
  usefetch.ts             # Generic fetching hook

constants/
  icons.ts, images.ts     # Local assets

interfaces/
  interfaces.d.ts         # Movie, MovieDetails, TrendingMovie types

tailwind.config.js        # Theme tokens (primary, text, etc.)
app/globals.css           # Tailwind (NativeWind) base
```

## Setup & Scripts

```bash
# install deps
pnpm install

# start dev server
pnpm start

# format
pnpm run format
pnpm run format:check

# lint
pnpm run lint
```

## Environment Variables

Create `.env` in project root:

```
EXPO_PUBLIC_MOVIE_API_KEY=your_tmdb_token_or_api_key
EXPO_PUBLIC_PROJECT_URL=...  # if Appwrite used
EXPO_PUBLIC_API_KEY=...      # if Appwrite used
```

## API Integration

- TMDB base: `https://api.themoviedb.org/3`
- Images: `https://image.tmdb.org/t/p/w500${poster_path}`
- Details endpoint used: `/movie/:id`

See `services/api.ts` for implemented calls.

## Conventions

- TypeScript everywhere; strong types in `interfaces/`
- Utility classes via NativeWind (see `tailwind.config.js`)
- Components use descriptive prop names; avoid one‑letter vars
- Prefer early returns; avoid deep nesting

## Troubleshooting

- Refresh indicator hidden by notch → root `app/_layout.tsx` wraps in `SafeAreaView` and uses a top inset
- Pull‑to‑refresh not visible → `RefreshableScroll` enables bounce and sets iOS/Android indicator props
- Image not showing → ensure `poster_path` present; fallback placeholder is used on details screen

---

MIT License. No external promotional content or authorship branding included.
