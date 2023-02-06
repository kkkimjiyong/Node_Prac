const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const SECRET_KEY = `myName`;

let tokenObject = {}; // Refresh Token을 저장할 Object

router.get("/token/:id", (req, res) => {
  const { id } = req.params;
  const accessToken = createAccessToken(id);
  const refreshToken = createRefreshToken();

  tokenObject[refreshToken] = id;
  res.json({ accessToken, refreshToken });
});
function createAccessToken(id) {
  const accessToken = jwt.sign({ id: id }, SECRET_KEY, { expiresIn: "20s" });
  return accessToken;
}
function createRefreshToken() {
  const refreshToken = jwt.sign({}, SECRET_KEY, { expiresIn: "1m" });
  return refreshToken;
}

module.exports = router;
