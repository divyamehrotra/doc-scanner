const sqlite3 = require("sqlite3").verbose();

// Connect to the database (or create it if it doesn't exist)
const db = new sqlite3.Database("./users.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err);
    } else {
        console.log("Connected to database");
    }
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    credits INTEGER DEFAULT 20
)`);

module.exports = db;
