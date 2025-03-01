const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 5000;
const SECRET_KEY = "doc-scanner";

app.use(cors());
app.use(bodyParser.json());

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

const authenticate = (req,res,next) =>{
    const token = req.header.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
}

// Upload Document Route
app.post("/upload", authenticate, upload.single("document"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ message: "File uploaded successfully", filename: req.file.filename });
    
    // Check user credits
    db.get("SELECT credits FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });

        if (user.credits <= 0) {
            return res.status(403).json({ error: "Not enough credits. Request more or wait until reset." });
        }

        // Deduct 1 credit
        db.run("UPDATE users SET credits = credits - 1 WHERE id = ?", [req.user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Database error" });

            res.json({ message: "File uploaded successfully", filename: req.file.filename });
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
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:5000}`);
});
