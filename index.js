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

// 1. CORS Configuration - SIMPLIFIED VERSION
const allowedOrigins = [
  "https://pat-a-pet-web-git-fakedoor-ananda-arti-widigdos-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://10.0.2.2:5000",
  "http://10.0.2.2:3000", // For React Native/Android
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// 2. Handle preflight requests manually if needed
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

// 3. OR use this simpler approach for preflight:
// app.options('*', cors()); // This might work better

// 4. Body parsing middleware
app.use(json());
app.use(express.urlencoded({ extended: true }));

// 5. Add manual CORS headers for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    // If you want to allow all origins, use:
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

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

// 9. Test CORS endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins,
    requestOrigin: req.headers.origin || "No origin header",
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
