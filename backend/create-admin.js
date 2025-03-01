const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
    createAdmin();
});

function createAdmin() {
    const adminCredentials = {
        username: 'admin',
        password: 'admin123',
        credits: 999999,
        is_admin: 1
    };

    // Hash the password
    bcrypt.hash(adminCredentials.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            db.close();
            process.exit(1);
        }

        // Insert admin user
        const query = `INSERT INTO users (username, password, credits, is_admin) VALUES (?, ?, ?, ?)`;
        db.run(query, [adminCredentials.username, hash, adminCredentials.credits, adminCredentials.is_admin], function(err) {
            if (err) {
                console.error('Error creating admin user:', err);
                if (err.code === 'SQLITE_CONSTRAINT') {
                    console.log('Admin user already exists');
                }
            } else {
                console.log('✅ Admin user created successfully');
                console.log('Username: admin');
                console.log('Password: admin123');
            }
            db.close(() => {
                console.log('Database connection closed');
                process.exit(0);
            });
        });
    });
} 