const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const assignmentResultSchema = new Schema({
  role: { type: String },
});

module.exports = mongoose.model("AssignmentResult", assignmentResultSchema);
