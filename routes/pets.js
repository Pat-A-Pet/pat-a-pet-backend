import { Router } from "express";
import passport from "passport";
import Pet from "../models/pet.js";

const router = Router();

// Create a new pet (requires auth)
router.post(
  "/create-listing",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const petData = { ...req.body, owner: req.user._id };
      const pet = new Pet(petData);
      await pet.save();
      res.status(201).json(pet);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

// Get all pets (optionally filter by species or owner)
router.get("/get-listings", async (req, res) => {
  try {
    const filters = {};
    if (req.query.species) filters.species = req.query.species;
    if (req.query.owner) filters.owner = req.query.owner;

    const pets = await Pet.find(filters).populate("owner", "fullname email");
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Pet.distinct("species");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get-loved-pets/:userId", async (req, res) => {
  try {
    const pets = await Pet.find({ loves: req.params.userId });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pet by ID
router.get("/get-listing/:id", async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "owner",
      "fullname email",
    );
    if (!pet) return res.status(404).json({ error: "Pet not found" });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pet (only owner can update)
router.put(
  "/update-listing/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet not found" });

      if (!pet.owner.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      Object.assign(pet, req.body);
      await pet.save();
      res.json(pet);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

// Delete pet (only owner can delete)
router.delete(
  "/delete-listing/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet not found" });

      if (!pet.owner.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      await pet.remove();
      res.json({ message: "Pet deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
