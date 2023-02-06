const express = require("express");
const router = express.Router();
const User = require("../schemas/user");

router.post("/", async (req, res) => {
  console.log(req.body);
  const { userInfo } = req.body;

  await User.create({
    name: userInfo.name,
    email: userInfo.email,
    phoneNumber: userInfo.phoneNumber,
    password: userInfo.password,
  });

  res.json("성공");
});

module.exports = router;
