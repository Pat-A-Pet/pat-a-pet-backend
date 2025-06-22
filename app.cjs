const startupFile = "./index.js"; // Your ESM module
import(startupFile)
  .then((module) => {
    const app = module.default; // Assuming `export default app` in index.js
    // Start the server or pass `app` to lsnode.js
  })
  .catch((err) => {
    console.error("Failed to load ESM module:", err);
    process.exit(1);
  });
