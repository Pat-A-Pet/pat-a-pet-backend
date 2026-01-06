import dotenv from "dotenv";
import express, { json } from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import passport from "./configs/passport.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import petsRoutes from "./routes/pets.js";
import postsRoutes from "./routes/posts.js";
import fakeDoorRoutes from "./routes/fakeDoor.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

const allowedOrigins = [
  "https://pat-a-pet-web-git-fakedoor-ananda-arti-widigdos-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server, Postman, mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight properly
app.options("*", cors());

// 4. Body parsing middleware
app.use(json());
app.use(express.urlencoded({ extended: true }));

// 6. Initialize passport
app.use(passport.initialize());

// 7. Connect to MongoDB
connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB Connected on database:", mongoose.connection.name),
  )
  .catch((err) => console.error("MongoDB Connection Error:", err));

// 8. Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Hello frontend, here's backend",
    endpoints: {
      auth: "/api/auth",
      pets: "/api/pets",
      posts: "/api/posts",
      chat: "/api/chat",
      fakeDoor: "/api/fake-door",
    },
  });
});

// 10. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/fake-door", fakeDoorRoutes);

// 11. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// 12. Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);

  // Handle CORS errors
  if (err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS Error",
      message: err.message,
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 13. Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(", ")}`);
});

export default app;
