require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

// 🚀 Signup Route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if the email is already registered
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password and store user in DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔑 Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

    // Compare hashed passwords
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🎯 Health Check Route (for debugging & monitoring)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🚀 Start Server with Port Conflict Handling
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Handle port already in use error
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`⚠️ Port ${PORT} is in use, retrying on another port...`);
    server.listen(0); // Auto-assign available port
  } else {
    console.error("Server Error:", err);
  }
});
