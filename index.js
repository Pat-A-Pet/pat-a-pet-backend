import "dotenv/config";
import express, { json } from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import passport from "passport";
import "./configs/passport.js";
import http from "http";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import petsRoutes from "./routes/pets.js";
import postsRoutes from "./routes/posts.js";
import fakeDoorRoutes from "./routes/fakeDoor.js";

const PORT = process.env.PORT;
const app = express();

app.use(
  cors({
    // origin: ["http://10.0.2.2:5000/api", "http://localhost:3000/api"],
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(json());
app.use(passport.initialize());

const server = http.createServer(app);

connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB Connected on database:", mongoose.connection.name),
  )
  .catch((err) => console.error("MongoDB Connection Error:", err));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello frontend, here's backend");
});

// Add this right after app.use(cors(...))
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/fake-door", fakeDoorRoutes);

export default app;
