# MERN Stack Application

A full-stack application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Prerequisites

- Node.js & npm
- MongoDB (local installation or MongoDB Atlas account)

## Project Structure

```
📦 MERN-App
 ┣ 📂 client (React frontend)
 ┗ 📂 server (Express & Node.js backend)
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mernapp
   NODE_ENV=development
   ```

4. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React application:
   ```
   npm start
   ```

## Available Scripts

### Server

- `npm start`: Start server in production mode
- `npm run dev`: Start server with nodemon in development mode

### Client

- `npm start`: Start the development server
- `npm build`: Build the app for production
- `npm test`: Run tests
- `npm run eject`: Eject from create-react-app

## API Endpoints

- `GET /api/users`: Get all users
- `POST /api/users`: Register a new user 