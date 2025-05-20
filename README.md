# AI Insurance FactFind Application

An AI-powered insurance fact-finding web application with Supabase integration, dynamic question flows, PDF generation, and data exports.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Supabase Database
DATABASE_URL=your_supabase_connection_string

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# SendGrid (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 2. Supabase Database Setup

1. Go to the [Supabase dashboard](https://supabase.com/dashboard/projects)
2. Create a new project if you haven't already
3. Once in the project page, click the "Connect" button on the top toolbar
4. Copy URI value under "Connection string" -> "Transaction pooler"
5. Replace `[YOUR-PASSWORD]` with the database password you set for the project
6. Add this connection string to your `.env` file as `DATABASE_URL`

### 3. Initialize Database

After setting up your Supabase project and adding the connection string to your `.env` file, run the database initialization script:

```
node scripts/initialize-database.js
```

This will create all necessary tables and seed the database with sample insurance questions.

### 4. Clerk Authentication Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Create a new application
3. Go to the API Keys section
4. Copy the "Publishable Key"
5. Add this key to your `.env` file as `VITE_CLERK_PUBLISHABLE_KEY`

### 5. OpenAI API Setup

1. Go to [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Add this key to your `.env` file as `OPENAI_API_KEY`

### 6. SendGrid Setup (Optional)

For email functionality:

1. Go to [SendGrid](https://app.sendgrid.com/)
2. Create an API key with appropriate permissions
3. Add this key to your `.env` file as `SENDGRID_API_KEY`

## Development

To start the development server:

```
npm run dev
```

## Features

- AI-powered conversational interface for collecting insurance information
- Conditional question flows based on previous answers
- Admin dashboard for managing questions and settings
- PDF generation of completed fact finds
- Excel export of data
- Email notifications with fact find information
- Supabase PostgreSQL database integration

## Technology Stack

- React + Vite for the frontend
- Express for the backend API
- Supabase for PostgreSQL database
- Drizzle ORM for database interactions
- OpenAI API for AI assistant
- Clerk for authentication
- SendGrid for email notifications
- Shadcn UI components
- TanStack Query for data fetching