const express = require("express");
const router = express.Router();
const AppDataSource = require("../config/database");

// POST /api/subjects - Create a new subject
router.post("/", async (req, res) => {
  try {
    const { name, code, credits } = req.body;

    if (!name || !code || credits === undefined) {
      return res.status(400).json({
        error: "Name, code and credits are required",
      });
    }

    const parsedCredits = parseInt(credits);
    if (isNaN(parsedCredits)) {
      return res.status(400).json({ error: "Credits must be a number" });
    }

    const subjectRepo = AppDataSource.getRepository("Subject");

    const existing = await subjectRepo.findOne({ where: { code } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Subject with this code already exists" });
    }

    const subject = subjectRepo.create({
      name,
      code,
      credits: parsedCredits,
    });

    const savedSubject = await subjectRepo.save(subject);
    const result = await subjectRepo.findOne({
      where: { id: savedSubject.id },
      relations: ["students"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subjects - Get all subjects
router.get("/", async (req, res) => {
  try {
    const subjectRepo = AppDataSource.getRepository("Subject");
    const subjects = await subjectRepo.find({
      relations: ["students"],
    });
    res.json(subjects);
  } catch (error) {
    console.error("Error getting subjects:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subjects/:id - Get subject by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const subjectRepo = AppDataSource.getRepository("Subject");

    const subject = await subjectRepo.findOne({
      where: { id },
      relations: ["students"],
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    console.error("Error getting subject:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/subjects/:id - Update subject
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, credits } = req.body;

    const subjectRepo = AppDataSource.getRepository("Subject");
    const subject = await subjectRepo.findOne({ where: { id } });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    if (name) subject.name = name;

    if (credits !== undefined) {
      const parsedCredits = parseInt(credits);
      if (isNaN(parsedCredits)) {
        return res.status(400).json({ error: "Credits must be a number" });
      }
      subject.credits = parsedCredits;
    }

    if (code) {
      if (code !== subject.code) {
        const existing = await subjectRepo.findOne({ where: { code } });
        if (existing) {
          return res
            .status(400)
            .json({ error: "Subject with this code already exists" });
        }
      }
      subject.code = code;
    }

    const updatedSubject = await subjectRepo.save(subject);
    const result = await subjectRepo.findOne({
      where: { id: updatedSubject.id },
      relations: ["students"],
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/subjects/:id - Delete subject
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const subjectRepo = AppDataSource.getRepository("Subject");

    const subject = await subjectRepo.findOne({ where: { id } });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await subjectRepo.remove(subject);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
