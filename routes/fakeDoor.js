import { Router } from "express";
import passport from "passport";
import FakeDoor from "../models/fake_door.js";

const router = Router();

// Endpoint untuk mencatat atau memperbarui aksi Fake Door
router.post(
  "/track",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const {
        featureTriggered,
        action,
        // hasOpenedModal,
        selectedPlan,
        // isConverted,
        // isDeclined,
      } = req.body;

      const existing = await FakeDoor.findOne({
        userId: req.user._id,
        featureTriggered,
      });

      // 1️⃣ If already converted, NEVER downgrade
      if (existing?.isConverted) {
        return res.json({
          success: true,
          message: "Already converted, ignoring weaker action",
          data: existing,
        });
      }

      // 2️⃣ Build update payload carefully
      const update = {
        deviceType: req.headers["user-agent"]?.includes("Mobi")
          ? "mobile"
          : "web",
      };

      if (action === "open") {
        update.hasOpenedModal = true;
      }

      if (action === "decline") {
        update.isDeclined = true;
      }

      if (action === "select_plan") {
        update.selectedPlan = selectedPlan;
        update.isConverted = true;
        update.isDeclined = false;
      }

      // Kita gunakan findOneAndUpdate dengan upsert: true
      // agar satu user hanya punya satu record per fitur (menghindari duplikasi data)
      const tracking = await FakeDoor.findOneAndUpdate(
        {
          userId: req.user._id,
          featureTriggered,
        },
        { $set: update },
        {
          upsert: true,
          new: true,
          // setDefaultsOnInsert: true,
        },
      );

      res.status(200).json({
        success: true,
        message: "Fake door interaction tracked",
        data: tracking,
      });
    } catch (error) {
      console.error("Error tracking fake door:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  },
);

// // Express Route
// router.get(
//   "/check-status",
//   passport.authenticate("jwt", { session: false }),
//   async (req, res) => {
//     const record = await FakeDoor.findOne({
//       userId: req.user.id,
//       isConverted: true,
//     });
//     res.json({ isConverted: !!record });
//   },
// );
//
// // Endpoint opsional untuk melihat hasil statistik (untuk dashboard internal Anda)
// router.get(
//   "/stats",
//   passport.authenticate("jwt", { session: false }),
//   async (req, res) => {
//     try {
//       // Hanya contoh sederhana: menghitung total konversi
//       const stats = await FakeDoor.aggregate([
//         {
//           $group: {
//             _id: "$featureTriggered",
//             totalClicks: { $sum: 1 },
//             conversions: { $sum: { $cond: ["$isConverted", 1, 0] } },
//           },
//         },
//       ]);
//       res.json(stats);
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   },
// );

export default router;
