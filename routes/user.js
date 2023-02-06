const express = require("express");
const router = express.Router();
const User = require("../schemas/user");
const jwt = require("jsonwebtoken");
const SECRET_KEY = `hi`;

router.post("/signup", async (req, res) => {
  console.log(req.body);
  const { userInfo } = req.body;

  // email or nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
  const existUser = await User.findOne({
    $or: [{ phoneNumber: userInfo.phoneNumber }, { name: userInfo.name }],
  });
  if (existUser)
    return res
      .status(400)
      .send({ errorMessage: "이메일 또는 닉네임이 이미 사용중입니다." });
  const user = new User({
    name: userInfo.name,
    email: userInfo.email,
    phoneNumber: userInfo.phoneNumber,
    password: userInfo.password,
  });
  await user.save();

  res.status(200).send("성공");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const existUser = await User.findOne({ email });

  if (!existUser || existUser.password !== password)
    return res.status(400).send("이메일 또는 패스워드가 틀렸습니다.");

  const token = jwt.sign({ email, password }, SECRET_KEY, { expiresIn: "7s" });

  return res.status(200).send(token);
});

module.exports = router;
