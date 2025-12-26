# nbhd.city Neighborhood

Collaborative neighborhood site for nbhd.city - where groups of users collaborate on neighborhood-level projects and discussions.

## Overview

The neighborhood app is a shared space where users in a specific geographic or community area can:
- Collaborate on neighborhood projects
- Share discussions and announcements
- Organize local events
- Share resources and recommendations
- Build community relationships
- Coordinate neighborhood initiatives

## Features

- **Neighborhood Directory**: Browse and join neighborhoods
- **Discussion Boards**: Community discussions and announcements
- **Events**: Create and manage neighborhood events
- **Resources**: Share resources and recommendations
- **Member Directory**: View other neighborhood members
- **Projects**: Collaborate on neighborhood projects
- **Notifications**: Stay updated on neighborhood activity

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
# In the neighborhood directory (different port than homepage)
VITE_PORT=5174 npm run dev

# Runs on http://localhost:5174
```

Or run on same machine with different port:
```bash
npm run dev -- --port 5174
```

## Pages

- **Login** (`/login`) - BlueSky OAuth login
- **Neighborhoods** (`/neighborhoods`) - Browse and join neighborhoods
- **Neighborhood Detail** (`/neighborhood/:id`) - View specific neighborhood
- **Discussions** (`/neighborhood/:id/discussions`) - Neighborhood discussions
- **Events** (`/neighborhood/:id/events`) - Neighborhood events
- **Members** (`/neighborhood/:id/members`) - Neighborhood members
- **Settings** (`/neighborhood/:id/settings`) - Neighborhood settings

## API Integration

Communicates with the nbhd.city API at `http://localhost:8000` for:
- Neighborhood data and management
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

- Both `homepage` and `neighborhood` apps run independently
- They share the same authentication system
- Each communicates with the same backend API
- Can be deployed separately to different subdomains
- Examples:
  - homepage: `username.nbhd.city`
  - neighborhood: `neighborhood-name.nbhd.city`

## Related

- **Backend**: See `api/` folder
- **Homepage App**: See `homepage/` folder for personal features
- **Testing**: See `LOCAL_TEST_GUIDE.md` in project root
