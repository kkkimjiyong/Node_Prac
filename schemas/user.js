const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  phoneNumber: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  responses: { type: Array },
  secondResponses: { type: Array },
});

module.exports = mongoose.model("Users", userSchema);
