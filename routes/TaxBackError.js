const express = require("express");
const router = express.Router();
const TaxBackError = require("../schemas/error");
const multer = require("multer");

router.post("/error", async (req, res) => {
  const errorMessage = req.body;
  console.log(errorMessage);
  const newTaxBackError = new TaxBackError({
    error: errorMessage,
  });
  await newTaxBackError.save();
});

module.exports = router;
