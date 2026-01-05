import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origins: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

export default app;
