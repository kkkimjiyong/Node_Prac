const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  responses: { type: array },
});

module.exports = mongoose.model("Survey", surveySchema);
