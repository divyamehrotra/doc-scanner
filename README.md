# Document Scanner Application

A web-based document scanning application that allows users to scan and compare documents, with credit management and admin features.

## Features

- Document scanning and comparison
- User authentication system
- Credit-based usage system
- Admin dashboard for managing credit requests
- Real-time analytics

## Prerequisites

- Node.js v20.11.1 or higher
- SQLite3
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd doc-scanner
```

2. Install dependencies for both backend and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Configuration

1. The backend server will automatically:
   - Initialize the SQLite database
   - Create necessary tables
   - Set up the admin user
   - Set up the test user (user2)

2. Default user credentials:
   - Admin:
     - Username: `admin`
     - Password: `admin123`
   - Test User:
     - Username: `user2`
     - Password: `pass2`

## Running the Application

1. Start the backend server:
```bash
cd backend
node server.js
```
The server will automatically find an available port starting from 5000.

2. Start the frontend server:
```bash
cd frontend
node server.js
```
The frontend will run on port 8000.

3. Access the application:
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:5000 (or the port shown in console)

## Usage

1. **User Functions:**
   - Log in with your credentials
   - View your credit balance
   - Upload and scan documents
   - Request additional credits when needed

2. **Admin Functions:**
   - Access the admin dashboard
   - View all credit requests
   - Approve or deny credit requests
   - Monitor system analytics

## Troubleshooting

1. If you see "Port in use" messages:
   - The backend will automatically try the next available port
   - Note the final port number shown in the console

2. If you get "Unauthorized" errors:
   - Clear your browser cache
   - Try logging out and logging back in
   - Ensure you're using the correct credentials

3. For database issues:
   - The system will automatically initialize the database
   - Admin and user2 accounts are created automatically

## Security Notes

- Never expose your JWT tokens
- Keep your admin credentials secure
- The system uses bcrypt for password hashing
- All API endpoints are protected with authentication
