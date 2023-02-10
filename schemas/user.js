const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  phoneNumber: { type: String },
  registerNumber: { type: String },
  corporation: { type: Boolean },
  responses: { type: [Object] },
  type: { type: String },
});

module.exports = mongoose.model("Users", userSchema);
