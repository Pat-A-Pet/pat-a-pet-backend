import "dotenv/config";
import express, { json } from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import passport from "passport";
import "./config/passport.js";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import uploadImagesRoutes from "./routes/upload-image.js";
import userRoutes from "./routes/user-api.js";
import patientVerificationRoutes from "./routes/verification-api.js";
import fetchDataRoutes from "./routes/fetch-data.js";
import adminRoutes from "./routes/admin.js";

const PORT = process.env.PORT;
const app = express();

app.use(json());
app.use(
  cors({
    // origin: ["http://10.0.2.2:5000/api", "http://localhost:3000/api"],
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(passport.initialize());

const server = http.createServer(app);
initSocket(server);

connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB Connected on database:", mongoose.connection.name),
  )
  .catch((err) => console.error("MongoDB Connection Error:", err));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

app.use("/api/auth", authRoutes);
app.use("/api/upload-image", uploadImagesRoutes);
// app.use("/api/chat", chatRoutes);
app.use("/api/user-api", userRoutes);
app.use("/api/verification-api", patientVerificationRoutes);
app.use("/api/fetch-data", fetchDataRoutes);
app.use("/api/admin", adminRoutes);
