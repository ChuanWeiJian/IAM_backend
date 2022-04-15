const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const schoolSchema = new Schema({
  schoolName: { type: String, required: true },
  schoolCode: { type: String, required: true, unique: true },
  schoolAddress: { type: String, required: true },
  district: { type: String, required: true },
  postcode: { type: String, required: true },
  city: { type: String, required: true },
  stateCode: { type: String, required: true },
  areaCode: { type: String, required: true },
  schoolPhoneNumber: { type: String, required: true },
  taxNumber: { type: String, required: true },
  codeDun: { type: String, required: true },
  codeParlimen: { type: String, required: true },
  typeOfSchool: { type: String, required: true },
  schoolEmailAddress: { type: String, required: true },
  examCenters: [{ type: mongoose.Types.ObjectId, ref: "ExamCenter" }],
});

schoolSchema.plugin(uniqueValidator);

module.exports = mongoose.model("School", schoolSchema);
