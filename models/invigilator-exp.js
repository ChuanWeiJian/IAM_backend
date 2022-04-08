const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const invigilatorExpSchema = new Schema({
  role: { type: String, required: true },
  assignmentTask: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "AssignmentTask",
  },
  assignedTo: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "ExamCenter",
  },
});

module.exports = mongoose.model("InvigilatorExperience", invigilatorExpSchema);
