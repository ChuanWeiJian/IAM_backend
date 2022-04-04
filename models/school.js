const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const schoolSchema = new Schema({
  name: { type: String, required: true },
  schoolCode: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  examCenters: [{ type: mongoose.Types.ObjectId, ref: "ExamCenter" }],
  examSecretary: { type: mongoose.Types.ObjectId, ref: "User" },
});

schoolSchema.plugin(uniqueValidator);

module.exports = mongoose.model("School", schoolSchema);
