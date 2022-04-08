const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const assignmentResultSchema = new Schema({
  assignmentTask: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "AssignmentTask",
  },
  role: { type: String, required: true },
  results: [
    {
      examCenter: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "ExamCenter",
      },
      invigilators: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Teacher" },
      ],
    },
  ],
});

module.exports = mongoose.model("AssignmentResult", assignmentResultSchema);
