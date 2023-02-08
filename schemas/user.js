const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  phoneNumber: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  responses: { type: [String] },
  secondResponses: { type: [String] },
});

module.exports = mongoose.model("Users", userSchema);
