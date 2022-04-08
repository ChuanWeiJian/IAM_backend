const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  icNumber: { type: String },
  listOfInvigilatorExperience: [
    { type: mongoose.Types.ObjectId, ref: "InvigilatorExperience" },
  ],
  race: { type: String },
  homeAddress: { type: String },
  teacherName: { type: String, required: true },
  teacherPhoneNumber: { type: String },
  teacherSex: { type: String },
  teacherEmailAddress: { type: String, required: true },
  salaryGrade: { type: String },
  salary: { type: String },
  jpnFileCode: { type: String },
  teacherTypesStaffCode: { type: String },
  teacherPositionCode: { type: String },
});

module.exports = mongoose.model("Teacher", teacherSchema);
