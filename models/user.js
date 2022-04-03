const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userGroup: { type: String, required: true },
  school: { type: mongoose.Types.ObjectId, required: true, ref: "School" },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
