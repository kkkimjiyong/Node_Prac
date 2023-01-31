const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log(req.body);
  console.log(req.body.userInfo);
  res.send("처음으로 혼자서 디비연결 성공!");
});

module.exports = router;
