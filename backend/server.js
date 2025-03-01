const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("./database");
const levenshtein = require("fast-levenshtein");

const app = express();
const PORT = 5000;
const SECRET_KEY = "doc-scanner";

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Function to compare documents using Levenshtein Distance
function compareDocuments(doc1, doc2) {
    const distance = levenshtein.get(doc1, doc2);
    const maxLen = Math.max(doc1.length, doc2.length);
    const similarity = (1 - distance / maxLen) * 100; // Convert to percentage
    return similarity;
}

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test Route
app.get("/", (req, res) => {
    res.send("Server is running...");
});

// Authentication Middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No auth header or invalid format");
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Verifying token:", token);

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error("Token verification error:", err);
            return res.status(403).json({ error: "Invalid token" });
        }
        console.log("Decoded token:", decoded);
        req.user = decoded;
        next();
    });
};

// Upload Document Route
app.post("/upload", authenticate, upload.single("document"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Check user credits
    db.get("SELECT credits FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "User not found" });
        }
    
        if (user.credits <= 0) {
            return res.status(403).json({ error: "Not enough credits. Request more or wait until reset." });
        }
    
        // Deduct 1 credit and send response
        db.run("UPDATE users SET credits = credits - 1 WHERE id = ?", [req.user.id], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: "Database error" });
            }
    
            res.json({ 
                message: "File uploaded successfully", 
                filename: req.file.filename,
                remainingCredits: user.credits - 1
            });
        });
    });
});

// User Signup
app.post("/auth/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (username, password, credits) VALUES (?, ?, 20)", [username, hashedPassword], (err) => {
        if (err) {
            return res.status(400).json({ error: "Username already exists" });
        }
        res.json({ message: "User registered successfully" });
    });
});

// User Login
app.post("/auth/login", (req, res) => {
    console.log("Login request received:", req.body);

    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (!user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }
        
        console.log("User found:", user);

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token with all necessary user data
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                is_admin: user.is_admin || false
            }, 
            SECRET_KEY, 
            { expiresIn: "1h" }
        );

        res.json({ 
            message: "Login successful", 
            token,
            user: {
                id: user.id,
                username: user.username,
                credits: user.credits,
                is_admin: user.is_admin || false
            }
        });
    });
});

// Get user profile
app.get("/user/profile", authenticate, (req, res) => {
    console.log("Getting profile for user:", req.user);
    
    db.get(
        "SELECT id, username, credits, is_admin FROM users WHERE id = ?", 
        [req.user.id], 
        (err, user) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (!user) {
                console.log("User not found:", req.user.id);
                return res.status(404).json({ error: "User not found" });
            }
            console.log("User profile found:", user);
            res.json(user);
        }
    );
});

// Request additional credits
app.post("/credits/request", authenticate, (req, res) => {
    const { reason } = req.body;
    const requestedCredits = 20; // Fixed amount for simplicity

    db.run(
        "INSERT INTO credit_requests (user_id, requested_credits, reason) VALUES (?, ?, ?)",
        [req.user.id, requestedCredits, reason],
        (err) => {
            if (err) return res.status(500).json({ error: "Failed to submit request" });
            res.json({ message: "Credit request submitted successfully" });
        }
    );
});

// Admin: Get credit requests
app.get("/admin/credit-requests", authenticate, (req, res) => {
    db.get("SELECT is_admin FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user?.is_admin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        db.all(`
            SELECT cr.*, u.username 
            FROM credit_requests cr 
            JOIN users u ON cr.user_id = u.id 
            WHERE cr.status = 'pending'
            ORDER BY cr.created_at DESC
        `, (err, requests) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ requests });
        });
    });
});

// Admin: Handle credit request
app.post("/admin/credit-requests/:requestId", authenticate, async (req, res) => {
    const { requestId } = req.params;
    const { approved } = req.body;

    db.get("SELECT is_admin FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user?.is_admin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        db.get("SELECT * FROM credit_requests WHERE id = ?", [requestId], (err, request) => {
            if (err || !request) {
                return res.status(404).json({ error: "Request not found" });
            }

            if (approved) {
                // Update user credits and request status
                db.run(
                    "UPDATE users SET credits = credits + ? WHERE id = ?",
                    [request.requested_credits, request.user_id],
                    (err) => {
                        if (err) return res.status(500).json({ error: "Failed to update credits" });
                        
                        db.run(
                            "UPDATE credit_requests SET status = 'approved' WHERE id = ?",
                            [requestId],
                            (err) => {
                                if (err) return res.status(500).json({ error: "Failed to update request status" });
                                res.json({ message: "Request approved successfully" });
                            }
                        );
                    }
                );
            } else {
                // Mark request as denied
                db.run(
                    "UPDATE credit_requests SET status = 'denied' WHERE id = ?",
                    [requestId],
                    (err) => {
                        if (err) return res.status(500).json({ error: "Failed to update request status" });
                        res.json({ message: "Request denied successfully" });
                    }
                );
            }
        });
    });
});

// Admin: Get analytics
app.get("/admin/analytics", authenticate, (req, res) => {
    db.get("SELECT is_admin FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user?.is_admin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const today = new Date().toISOString().split('T')[0];
        
        Promise.all([
            // Total users
            new Promise((resolve, reject) => {
                db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
                    if (err) reject(err);
                    else resolve(result.count);
                });
            }),
            // Scans today
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT COUNT(*) as count FROM scan_history WHERE date(scanned_at) = ?",
                    [today],
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result.count);
                    }
                );
            }),
            // Active users today
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT COUNT(DISTINCT user_id) as count FROM scan_history WHERE date(scanned_at) = ?",
                    [today],
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result.count);
                    }
                );
            }),
            // Average similarity score
            new Promise((resolve, reject) => {
                db.get(
                    "SELECT AVG(similarity_score) as avg FROM scan_history",
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result.avg || 0);
                    }
                );
            }),
            // Top users by scan count
            new Promise((resolve, reject) => {
                db.all(`
                    SELECT u.username, COUNT(*) as scan_count 
                    FROM scan_history sh
                    JOIN users u ON sh.user_id = u.id
                    GROUP BY sh.user_id
                    ORDER BY scan_count DESC
                    LIMIT 5
                `, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            })
        ])
        .then(([totalUsers, scansToday, activeUsersToday, avgSimilarity, topUsers]) => {
            res.json({
                totalUsers,
                scansToday,
                activeUsersToday,
                avgSimilarity,
                topUsers
            });
        })
        .catch(error => {
            console.error("Analytics error:", error);
            res.status(500).json({ error: "Failed to fetch analytics" });
        });
    });
});

// Modify the existing scan endpoint to update scan history
app.post("/scan", authenticate, upload.single("document"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Check user credits first
    db.get("SELECT credits FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "User not found" });
        }

        if (user.credits <= 0) {
            return res.status(403).json({ error: "Not enough credits" });
        }

        // Process the scan
        try {
            const uploadedText = fs.readFileSync(req.file.path, "utf-8");
            const files = fs.readdirSync(uploadDir);
            let bestMatch = { filename: "", similarity: 0 };

            files.forEach((file) => {
                if (file !== req.file.filename) {
                    const filePath = path.join(uploadDir, file);
                    try {
                        const fileContent = fs.readFileSync(filePath, "utf-8");
                        const similarity = compareDocuments(uploadedText, fileContent);
                        if (similarity > bestMatch.similarity) {
                            bestMatch = { filename: file, similarity };
                        }
                    } catch (error) {
                        console.error("Error reading file:", filePath, error.message);
                    }
                }
            });

            // Only deduct credit and update history after successful scan
            db.run(
                "UPDATE users SET credits = credits - 1 WHERE id = ?",
                [req.user.id],
                (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating credits:", updateErr);
                        return res.status(500).json({ error: "Failed to update credits" });
                    }

                    // Record the scan in history
                    db.run(
                        "INSERT INTO scan_history (user_id, document_name, similarity_score) VALUES (?, ?, ?)",
                        [req.user.id, req.file.filename, bestMatch.similarity],
                        (historyErr) => {
                            if (historyErr) {
                                console.error("Error recording scan history:", historyErr);
                            }
                        }
                    );

                    res.json({ 
                        bestMatch,
                        remainingCredits: user.credits - 1
                    });
                }
            );
        } catch (error) {
            console.error("Scan processing error:", error);
            res.status(500).json({ error: "Failed to process scan" });
        }
    });
});

// Credit reset job (runs every day at midnight)
function resetDailyCredits() {
    const now = new Date().toISOString();
    db.run(
        "UPDATE users SET credits = 20, last_credit_reset = ? WHERE last_credit_reset < date('now', 'start of day')",
        [now],
        (err) => {
            if (err) {
                console.error("Error resetting credits:", err);
            } else {
                console.log("Daily credits reset successfully");
            }
        }
    );
}

// Schedule daily credit reset
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyCredits();
    }
}, 60000); // Check every minute

// Start Server
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`✅ Server running on http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(PORT);
