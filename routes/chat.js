import { Router } from "express";
import { serverClient } from "../configs/getstreams.js";

const router = Router();

router.post("/chatToken", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const token = serverClient.createToken(userId);
  res.json({ token });
});

export default router;
