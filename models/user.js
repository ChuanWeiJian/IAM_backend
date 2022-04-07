const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userGroup: { type: String, required: true },
  status: {type: Number, required: true, default: 1},
  school: { type: mongoose.Types.ObjectId, required: true, ref: "School" },
  district: {type: String, required: true}
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
