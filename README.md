# Document Scanner Application

A web-based document scanning application that allows users to scan and compare documents, with credit management and admin features.

## Features

- Document scanning and comparison
- User authentication system
- Credit-based usage system
- Admin dashboard for managing credit requests
- Real-time analytics

## Local Development

### Prerequisites

- Node.js v20.11.1 or higher
- SQLite3
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/divyamehrotra/doc-scanner
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

### Configuration

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

### Running Locally

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


### Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets in production
   - Regularly rotate secrets and credentials

2. **Database:**
   - Regularly backup the SQLite database
   - Consider using a more robust database for high traffic
   - Set appropriate file permissions

3. **File Uploads:**
   - Limit file sizes and types
   - Regularly clean up old uploads
   - Use virus scanning when possible

4. **Authentication:**
   - Keep JWT expiration times reasonable
   - Implement rate limiting
   - Use secure password policies

### Monitoring

1. Use PM2 for process monitoring:
```bash
pm2 monit
pm2 logs
```

2. Monitor server resources:
```bash
pm2 install pm2-server-monit
```

3. Set up logging:
```bash
pm2 install pm2-logrotate
```

### Backup Strategy

1. Database backups:
```bash
# Create a backup script
#!/bin/bash
backup_dir="/path/to/backups"
timestamp=$(date +%Y%m%d_%H%M%S)
sqlite3 /path/to/your/database.db ".backup '${backup_dir}/backup_${timestamp}.db'"
```

2. Schedule regular backups:
```bash
# Add to crontab
0 0 * * * /path/to/backup-script.sh
```

## Troubleshooting

1. If you see "Port in use" messages:
   - Check running processes: `pm2 list`
   - Use different ports in the configuration
   - Check for other services using the ports

2. If you get "Unauthorized" errors:
   - Check JWT secret configuration
   - Verify API URL configuration
   - Clear browser cache and cookies

3. For database issues:
   - Check file permissions
   - Verify database path
   - Check backup integrity
