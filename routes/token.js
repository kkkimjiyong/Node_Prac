const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const SECRET_KEY = `myName`;

let tokenObject = {}; // Refresh Token을 저장할 Object

router.get("/set-token/:id", (req, res) => {
  const { id } = req.params;
  const accessToken = createAccessToken(id);
  const refreshToken = createRefreshToken();

  tokenObject[refreshToken] = id;
  res.json({ accessToken, refreshToken });
});
router.post("/get-token", (req, res) => {
  const { accessToken } = req.body;
  const { refreshToken } = req.body;

  //! ---------------------   없으면 400에러 먼저 띄우기  ---------------------
  if (!refreshToken)
    return res
      .status(400)
      .json({ message: "Refresh Token이 존재하지 않습니다." });
  if (!accessToken)
    return res
      .status(400)
      .json({ message: "Access Token이 존재하지 않습니다." });

  //! ---------------------  토큰 검증하기  ---------------------
  const isAccessTokenValidate = validateAccessToken(accessToken);
  const isRefreshTokenVallidate = validateRefreshToken(refreshToken);

  if (!isRefreshTokenVallidate)
    return res.status(419).json({ message: "리프레쉬 토큰 만료" });
  if (!isAccessTokenValidate) {
    const accessTokenId = tokenObject[refreshToken];
    if (!accessTokenId)
      return res
        .status(419)
        .json({ message: "리프레쉬 토큰이 존재하지 않습니다." });
    const newAccessToken = createAccessToken(accessToken);
    res.json({ newAccessToken });
    return res.json({ message: "액세스 토큰을 새롭게 발급하였습니다." });
  }

  const { id } = getAccessTokenPayload(accessToken);
  return res.json({ message: `${id}의 Payload를 가진 Token 인증성공` });
});

//? =====================  액세스토큰 발급  =====================
function createAccessToken(id) {
  const accessToken = jwt.sign({ id: id }, SECRET_KEY, { expiresIn: "20s" });
  return accessToken;
}
//? =====================  리프레쉬토큰 발급  =====================
function createRefreshToken() {
  const refreshToken = jwt.sign({}, SECRET_KEY, { expiresIn: "1m" });
  return refreshToken;
}
//? =====================  액세스토큰 검증  =====================
function validateAccessToken(accessToken) {
  try {
    jwt.verify(accessToken, SECRET_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
//? =====================  리프레쉬토큰 검증  =====================
function validateRefreshToken(refreshToken) {
  try {
    jwt.verify(refreshToken, SECRET_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
//? =====================  액세스토큰 페이로드  =====================
function getAccessTokenPayload(accessToken) {
  try {
    const payload = jwt.verify(accessToken, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = router;
