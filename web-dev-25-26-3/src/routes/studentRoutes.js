const express = require("express");
const router = express.Router();
const AppDataSource = require("../config/database");
const { In } = require("typeorm");

router.post("/", async (req, res) => {
  try {
    const {
      facultyNumber,
      firstName,
      middleName,
      lastName,
      universityId,
      subjectIds,              // <-- НОВО
    } = req.body;

    if (!facultyNumber || !firstName || !lastName || !universityId) {
      return res.status(400).json({
        error:
          "Faculty number, first name, last name, and university ID are required",
      });
    }

    const universityRepo = AppDataSource.getRepository("University");
    const university = await universityRepo.findOne({
      where: { id: parseInt(universityId) },
    });

    if (!university) {
      return res.status(404).json({ error: "University not found" });
    }

    const studentRepo = AppDataSource.getRepository("Student");
    const subjectRepo = AppDataSource.getRepository("Subject");

    let subjects = [];
    if (Array.isArray(subjectIds) && subjectIds.length > 0) {
      const ids = subjectIds.map((id) => parseInt(id));
      subjects = await subjectRepo.findBy({ id: In(ids) });
    }

    const student = studentRepo.create({
      facultyNumber,
      firstName,
      middleName,
      lastName,
      university,
      subjects, // <-- many-to-many
    });

    const savedStudent = await studentRepo.save(student);
    const result = await studentRepo.findOne({
      where: { id: savedStudent.id },
      relations: ["university", "subjects"], // <-- добавихме subjects
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const studentRepo = AppDataSource.getRepository("Student");
    const students = await studentRepo.find({
      relations: ["university"],
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const studentRepo = AppDataSource.getRepository("Student");
    const students = await studentRepo.find({
      relations: ["university", "subjects"],
    });
    

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      facultyNumber,
      firstName,
      middleName,
      lastName,
      universityId,
      subjectIds,              // <-- НОВО
    } = req.body;
    const studentRepo = AppDataSource.getRepository("Student");

    const student = await studentRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ["university", "subjects"],
    });
    

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (facultyNumber) student.facultyNumber = facultyNumber;
    if (firstName) student.firstName = firstName;
    if (middleName !== undefined) student.middleName = middleName;
    if (lastName) student.lastName = lastName;

    if (universityId) {
      const universityRepo = AppDataSource.getRepository("University");
      const university = await universityRepo.findOne({
        where: { id: parseInt(universityId) },
      });

      if (!university) {
        return res.status(404).json({ error: "University not found" });
      }

      student.university = university;
    }

    // НОВО: сменяме предметите, ако subjectIds е подадено
    if (Array.isArray(subjectIds)) {
      const subjectRepo = AppDataSource.getRepository("Subject");
      if (subjectIds.length === 0) {
        student.subjects = [];
      } else {
        const ids = subjectIds.map((id) => parseInt(id));
        student.subjects = await subjectRepo.findBy({ id: In(ids) });
      }
    }

    const updatedStudent = await studentRepo.save(student);
    const result = await studentRepo.findOne({
      where: { id: updatedStudent.id },
      relations: ["university", "subjects"],
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const studentRepo = AppDataSource.getRepository("Student");
    const student = await studentRepo.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    await studentRepo.remove(student);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
