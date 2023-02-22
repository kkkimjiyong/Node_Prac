const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema({
  error: { type: Object },
});

module.exports = mongoose.model("Errors", errorSchema);
