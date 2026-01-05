import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    // origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    origin: [
      "https://pat-a-pet-web-git-fakedoor-ananda-arti-widigdos-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
  }),
);

// Add headers middleware BEFORE routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Set-Cookie",
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("ngrok-skip-browser-warning", "true");
  next();
});

export default app;
