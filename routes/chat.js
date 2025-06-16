import { Router } from "express";
import { serverClient } from "../configs/getstreams.js";
import Pet from "../models/pet.js";
import passport from "passport";
import { createHash } from "crypto";

const router = Router();

router.post(
  "/chatToken",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const token = serverClient.createToken(userId);
    res.json({ token });
  },
);

router.post(
  "/create-channel",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { petId, requesterId, ownerId } = req.body;

      const pet = await Pet.findById(petId).select("name").lean();
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }

      // The user who initiated the channel creation (typically the owner)
      const createdById = ownerId; // or req.user.id if using authenticated user

      // Create a shorter hash-based channel ID
      const channelId = createHash("sha256")
        .update(`${petId}_${requesterId}_${ownerId}`)
        .digest("hex")
        .substring(0, 32);

      console.log("Creating channel with ID:", channelId);

      const channel = serverClient.channel("messaging", channelId, {
        name: `Adoption Chat for Pet ${pet.name}`, // Shortened name
        members: [requesterId, ownerId],
        created_by_id: createdById, // Add this required field
        custom_fields: {
          pet_id: petId,
          requester_id: requesterId,
          owner_id: ownerId,
          is_adoption_chat: true,
        },
      });

      await channel.create();

      // Update pet document
      await Pet.findOneAndUpdate(
        {
          _id: petId,
          "adoptionRequests.user": requesterId,
        },
        {
          $set: { "adoptionRequests.$.channelId": channelId },
        },
      );

      res.json({
        success: true,
        channelId,
        message: "Channel created successfully",
      });
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(500).json({
        error: "Failed to create chat channel",
        details: error.message,
      });
    }
  },
);

export default router;
