const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const examCenterSchema = new Schema({
  examCenterCode: { type: String, required: true, unique: true },
  safeRoomNo: { type: String, required: true },
  district: { type: String, required: true },
  school: { type: mongoose.Types.ObjectId, required: true, ref: "School" },
  assignmentTasks: [{ type: mongoose.Types.ObjectId, ref: "AssignmentTask" }],
});

examCenterSchema.plugin(uniqueValidator);

module.exports = mongoose.model("ExamCenter", examCenterSchema);
