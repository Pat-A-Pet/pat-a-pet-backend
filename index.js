import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import app from "./configs/express.js";
import routes from "./routes/index.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  app.use("/api", routes);

  const PORT = process.env.PORT || 5001;
  // swaggerDocs(app, PORT);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
