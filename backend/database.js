const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcrypt');

// Connect to the database (or create it if it doesn't exist)
const db = new sqlite3.Database("./users.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err);
    } else {
        console.log("Connected to database");
    }
});

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    credits INTEGER DEFAULT 20,
    is_admin INTEGER DEFAULT 0,
    last_credit_reset TEXT
)`, (err) => {
    if (err) {
        console.error('Error creating users table:', err);
    } else {
        console.log('✅ Users table ready.');
        
        // Create admin user if it doesn't exist
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (username, password, credits, is_admin) 
                VALUES (?, ?, ?, ?)`, 
                ['admin', adminPassword, 999999, 1], 
                (err) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else {
                        console.log('✅ Admin user ready.');
                    }
                });

        // Create user2 if it doesn't exist
        const user2Password = bcrypt.hashSync('pass2', 10);
        db.run(`INSERT OR IGNORE INTO users (username, password, credits) 
                VALUES (?, ?, ?)`, 
                ['user2', user2Password, 20], 
                (err) => {
                    if (err) {
                        console.error('Error creating user2:', err);
                    } else {
                        console.log('✅ User2 ready.');
                    }
                });
    }
});

// Create credit requests table
db.run(`CREATE TABLE IF NOT EXISTS credit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    requested_credits INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`, (err) => {
    if (err) console.error("❌ Credit requests table creation error:", err.message);
    else console.log("✅ Credit requests table ready.");
});

// Create scan history table for analytics
db.run(`CREATE TABLE IF NOT EXISTS scan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    similarity_score REAL,
    scanned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`, (err) => {
    if (err) console.error("❌ Scan history table creation error:", err.message);
    else console.log("✅ Scan history table ready.");
});

module.exports = db;
