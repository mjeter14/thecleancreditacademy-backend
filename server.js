require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./database");

const app = express();
app.use(cors());
app.use(express.json()); // Ensure JSON body parsing

// ✅ Root Route to Check if Backend is Running
app.get("/", (req, res) => {
  res.json({ message: "🚀 Backend is live!", status: "OK" });
});

// 🚀 Signup Route
app.post("/signup", async (req, res) => {
  console.log("Received Signup Request:", req.body); // Debugging
  const { email, password } = req.body;

  // Validate request body
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json({ message: "User created successfully", user: result.rows[0] });
  } catch (err) {
    console.error("🚨 Signup Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔑 Login Route
app.post("/login", async (req, res) => {
  console.log("Received Login Request:", req.body); // Debugging
  const { email, password } = req.body;

  // Validate request body
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("🚨 Login Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🚀 Start Server with Port Conflict Handling
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Handle Port Already in Use Error
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`⚠️ Port ${PORT} is already in use. Retrying on a new port...`);
    setTimeout(() => {
      server.listen(0, () => {
        console.log(`✅ Server running on a new available port`);
      });
    }, 1000);
  } else {
    console.error("🚨 Server Error:", err);
  }
});
