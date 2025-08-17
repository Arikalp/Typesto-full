# Typesto - MERN Stack Project

A full-stack web application built with MongoDB, Express.js, React (Next.js), and Node.js.

## Project Structure

```
Typesto/
├── client/          # Next.js frontend
├── server/          # Express.js backend
└── Documentation/   # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```
   
   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on http://localhost:3000

## Features

- User authentication (signup/login)
- JWT-based authentication
- MongoDB database integration
- Responsive UI with Tailwind CSS
- Protected routes

## API Endpoints

- `POST /api/signup` - User registration
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile (protected)

## Database

The application uses MongoDB with a User model containing:
- username (required)
- email (required, unique)
- password (required, hashed)

## Notes

- Backend runs on port 5000 to avoid conflicts with Next.js
- Frontend runs on port 3000
- CORS is configured to allow frontend-backend communication
- JWT tokens are stored in HTTP-only cookies for security
