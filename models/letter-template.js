const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const letterTemplateSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ value: { type: String, required: true } }],
  district: { type: String, required: true },
});

module.exports = mongoose.model("LetterTemplate", letterTemplateSchema);
