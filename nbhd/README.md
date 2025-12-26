# nbhd.city Nbhd

Collaborative Nbhd site for nbhd.city - where groups of users collaborate on Nbhd-level projects and discussions.

## Overview

The Nbhd app is a shared space where users in a specific geographic or community area can:
- Collaborate on Nbhd projects
- Share discussions and announcements
- Organize local events
- Share resources and recommendations
- Build community relationships
- Coordinate Nbhd initiatives

## Features

- **Nbhd Directory**: Browse and join Nbhds
- **Discussion Boards**: Community discussions and announcements
- **Events**: Create and manage Nbhd events
- **Resources**: Share resources and recommendations
- **Member Directory**: View other Nbhd members
- **Projects**: Collaborate on Nbhd projects
- **Notifications**: Stay updated on Nbhd activity

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
# In the Nbhd directory (different port than homepage)
VITE_PORT=5174 npm run dev

# Runs on http://localhost:5174
```

Or run on same machine with different port:
```bash
npm run dev -- --port 5174
```

## Pages

- **Login** (`/login`) - BlueSky OAuth login
- **Nbhds** (`/Nbhds`) - Browse and join Nbhds
- **Nbhd Detail** (`/Nbhd/:id`) - View specific Nbhd
- **Discussions** (`/Nbhd/:id/discussions`) - Nbhd discussions
- **Events** (`/Nbhd/:id/events`) - Nbhd events
- **Members** (`/Nbhd/:id/members`) - Nbhd members
- **Settings** (`/Nbhd/:id/settings`) - Nbhd settings

## API Integration

Communicates with the nbhd.city API at `http://localhost:8000` for:
- Nbhd data and management
- User authentication
- Discussion forums
- Event management
- Member management
- Activity tracking

## Building

```bash
npm run build
```

## Development Notes

- Both `homepage` and `Nbhd` apps run independently
- They share the same authentication system
- Each communicates with the same backend API
- Can be deployed separately to different subdomains
- Examples:
  - homepage: `username.nbhd.city`
  - Nbhd: `Nbhd-name.nbhd.city`

## Related

- **Backend**: See `api/` folder
- **Homepage App**: See `homepage/` folder for personal features
- **Testing**: See `LOCAL_TEST_GUIDE.md` in project root
