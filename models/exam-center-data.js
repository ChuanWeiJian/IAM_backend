const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const examCenterDataSchema = new Schema({
  title: { type: String, required: true },
});


module.exports = mongoose.model("ExamCenterData", examCenterDataSchema);
