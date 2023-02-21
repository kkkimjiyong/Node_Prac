const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema({
  error: { type: String },
});

module.exports = mongoose.model("Errors", errorSchema);
