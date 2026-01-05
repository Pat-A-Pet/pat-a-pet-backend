import dotenv from "dotenv";
import express from "express";
import serverless from "serverless-http";
import connectDB from "./configs/db.js";
import app from "./configs/express.js";
import routes from "./routes/index.js";

// Connect DB once (handled per cold start)
let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

// Attach routes
app.use("/api", routes);

// Export handler for Vercel
export const handler = serverless(app);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Running on ${PORT}`));
}
