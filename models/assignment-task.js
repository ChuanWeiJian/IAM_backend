const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const assignmentTaskSchema = new Schema({
  title: { type: String, required: true },
});

module.exports = mongoose.model("AssignmentTask", assignmentTaskSchema);
