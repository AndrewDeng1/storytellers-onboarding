# Todo List App with Remix and Supabase

A modern todo list application built with Remix and Supabase, featuring user authentication and task management.

## Features

- User authentication (sign up and login)
- Create, read, update, and delete tasks
- Mark tasks as completed
- Modern UI with Tailwind CSS
- Secure data access with Supabase Row Level Security

## Prerequisites

- Node.js (v20 or higher)
- A Supabase account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Supabase database:
   - Create a new project at https://supabase.com
   - Run the SQL commands from `supabase.sql` in the Supabase SQL editor

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application can be deployed to any platform that supports Remix applications. Here are some popular options:

1. **Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

3. **Fly.io**:
   ```bash
   fly launch
   fly deploy
   ```

Make sure to set up the environment variables in your deployment platform's settings.

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## License

MIT
