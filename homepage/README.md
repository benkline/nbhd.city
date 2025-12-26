# nbhd.city Homepage

Personal user homepage for nbhd.city - where individual users manage their profile and personal neighborhood data.

**Static Site**: Deployed as pure client-side application to S3 + CloudFront (or other static hosts).

## Overview

The homepage is a personalized space for each user where they can:
- View and edit their profile
- Manage their neighborhood connections
- See their activity and contributions
- Access their personal settings
- View neighborhood recommendations

## Static Deployment

This homepage is configured as a **static site**:
- ✅ Client-side hash-based routing (works without server)
- ✅ Deployable to S3, CloudFront, GitHub Pages, Vercel, Netlify, etc.
- ✅ OAuth callback handler included (`public/callback.html`)
- ✅ No server required, minimal infrastructure

See **[STATIC_DEPLOYMENT.md](./STATIC_DEPLOYMENT.md)** for complete deployment instructions to:
- AWS S3 + CloudFront
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

## Features

- **User Profile**: Display and edit personal information
- **Activity Feed**: See their own activities and contributions
- **Neighborhood List**: View neighborhoods they're part of
- **Settings**: Manage preferences and privacy
- **Connections**: Manage connections with other users

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS Modules** - Scoped styling

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Running Locally

```bash
# In the homepage directory
npm run dev

# Runs on http://localhost:5173
```

## Pages

- **Login** (`/login`) - BlueSky OAuth login
- **Dashboard** (`/dashboard`) - Main page with profile summary and neighborhoods
- **Profile** (`/profile`) - User profile page
- **Settings** (`/settings`) - User settings

## API Integration

Communicates with the nbhd.city API at `http://localhost:8000` for:
- User authentication and profiles
- Neighborhood data
- Activity tracking
- User connections

## Building

```bash
npm run build
```

## Related

- **Backend**: See `api/` folder
- **Neighborhood App**: See `neighborhood/` folder for collaborative features
- **Testing**: See `LOCAL_TEST_GUIDE.md` in project root
