const EntitySchema = require("typeorm").EntitySchema;

// TODO: Complete the Subject entity definition
// Reference: Look at Student.js and University.js for patterns
module.exports = new EntitySchema({
  name: "Subject",
  tableName: "subjects",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
    },
    name: {
      type: "varchar",
      nullable: false,
    },
    code: {
      type: "varchar",
      nullable: false,
      unique: true,
    },
    credits: {
      type: "integer",
      nullable: false,
    },
  },
  relations: {
    students: {
      target: "Student",
      type: "many-to-many",
      joinTable: { name: "student_subjects" },
      inverseSide: "subjects",
    },
  },
});

