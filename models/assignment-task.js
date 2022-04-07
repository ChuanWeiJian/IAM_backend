const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const assignmentTaskSchema = new Schema({
  title: { type: String, required: true },
  examType: { type: String, required: true },
  createdDate: { type: Date, required: true },
  collectionDate: { type: Date, required: true },
  examCenters: [
    { type: mongoose.Types.ObjectId, required: true, ref: "ExamCenter" },
  ],
  examCenterData: [
    { type: mongoose.Types.ObjectId, ref: "ExamCenterData", default: [] },
  ],
  collectionStatus: [
    {
      examCenter: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "ExamCenter",
      },
      status: { type: String, required: true },
    },
  ],
  chiefInvigilatorComplete: { type: Boolean, required: true, default: false },
  viceChiefInvigilatorComplete: {
    type: Boolean,
    required: true,
    default: false,
  },
  invigilatorComplete: { type: Boolean, required: true, default: false },
  environmentalSupervisorComplete: {
    type: Boolean,
    required: true,
    default: false,
  },
  roomKeeperComplete: { type: Boolean, required: true, default: false },
  reservedInvigilatorComplete: {
    type: Boolean,
    required: true,
    default: false,
  },
  assignmentResults: [
    { type: mongoose.Types.ObjectId, ref: "AssignmentResult", default: [] },
  ],
  status: { type: String, required: true, default: "Collection in progress" },
  district: { type: String, required: true },
});

module.exports = mongoose.model("AssignmentTask", assignmentTaskSchema);
