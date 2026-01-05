import { Router } from "express";
import authRoutes from "./auth.js";
import chatRoutes from "./chat.js";
import petsRoutes from "./pets.js";
import postsRoutes from "./posts.js";
import fakeDoorRoutes from "./fakeDoor.js";

const router = Router();

router.get("/", (req, res) => res.send("Hello frontend, here's backend"));
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/pets", petsRoutes);
router.use("/posts", postsRoutes);
router.use("/fake-door", fakeDoorRoutes);

export default router;
