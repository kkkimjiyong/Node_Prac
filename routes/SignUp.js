const express = require("express");
const router = express.Router();
const User = require("../models/SignUpModel");

router.post("/", (req, res) => {
  console.log(req.body);
  const New = new User(req.body.userInfo);
  New.save().then(() => {
    res.send({ New });
  });
});

router.get("/users", async (req, res) => {
  const users = await User.find();
  res.send(JSON.stringify(users));
});

module.exports = router;
