const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const path = require("path");
const http = require("http");
const bcrypt = require('bcryptjs');
const socketIO = require("socket.io");
require("dotenv").config();

// Route imports
const authRoutes = require("./routes/auth");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const classRoutes = require("./routes/class");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Database connection error:", err));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Debugging session secret
if (!process.env.SESSION_SECRET) {
  console.warn("⚠️ SESSION_SECRET is not set!");
} else {
  console.log(`✅ Session Secret Loaded`);
}

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_change_me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Middleware to expose user to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  req.user = req.session.user || null;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/teacher", teacherRoutes);
app.use("/student", studentRoutes);
app.use("/class", classRoutes);

// Role-based redirect
app.get("/", (req, res) => {
  if (req.session.user) {
    switch (req.session.user.role) {
      case "teacher":
        return res.redirect("/teacher/dashboard");
      case "student":
        return res.redirect("/student/dashboard");
      default:
        return res.redirect("/login");
    }
  }
  res.redirect("/login");
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Client joined room: ${room}`);
  });

  socket.on("chatMessage", ({ room, message, username }) => {
    io.to(room).emit("message", { message, username });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected");
  });
});

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
