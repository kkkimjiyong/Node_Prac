const express = require("express");
const router = express.Router();
const User = require("../schemas/user");
const jwt = require("jsonwebtoken");
const SECRET_KEY = `hi`;

let tokenObject = {}; // Refresh Token을 저장할 Object

//----------------------------   회원가입   -------------------------------

router.post("/signup", async (req, res) => {
  console.log(req.body);
  const { userInfo } = req.body;

  // email or nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
  const existUser = await User.findOne({
    $or: [{ phoneNumber: userInfo.phoneNumber }, { name: userInfo.name }],
  });
  if (existUser) {
    return res
      .status(400)
      .send({ errorMessage: "이메일 또는 닉네임이 이미 사용중입니다." });
  }
  const user = new User({
    name: userInfo.name,
    email: userInfo.email,
    phoneNumber: userInfo.phoneNumber,
    password: userInfo.password,
  });
  await user.save();

  const accessToken = createAccessToken(userInfo.email);
  const refreshToken = createRefreshToken();

  tokenObject[refreshToken] = userInfo.email;

  res
    .status(200)
    .send({ accessToken, refreshToken, message: "회원가입 성공!" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const existUser = await User.findOne({ email });

  if (!existUser || existUser.password !== password)
    return res.status(400).send("이메일 또는 패스워드가 틀렸습니다.");

  const accessToken = createAccessToken(email);
  const refreshToken = createRefreshToken();

  tokenObject[refreshToken] = email;

  return res
    .status(200)
    .send({ accessToken, refreshToken, message: "로그인 성공!" });
});

router.post("/survey", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  const { id } = jwt.verify(authToken, SECRET_KEY);
  //일단 회원정보를 가져오고
  const existUser = await User.findOne({ email: id });
  const { responses } = req.body;
  console.log(responses);

  //회원이 응답 내역이 있으면,
  try {
    if (existUser.responses) {
      console.log(1);
      await User.updateOne({ email: id }, { $set: { responses: responses } });
    } else {
      console.log(2);

      await User.updateOne({ email: id }, { $push: { responses: responses } });
    }

    res.status(200).send("성공");
  } catch (error) {
    console.log(error);
  }
});
router.post("/survey/second", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  const { id } = jwt.verify(authToken, SECRET_KEY);
  //일단 회원정보를 가져오고
  const existUser = await User.findOne({ email: id });
  const { secondResponses } = req.body;

  //회원이 응답 내역이 있으면,
  try {
    if (existUser.secondResponses) {
      await User.updateOne(
        { email: id },
        { $set: { secondResponses: secondResponses } }
      );
    } else {
      await User.updateOne(
        { email: id },
        { $push: { secondResponses: secondResponses } }
      );
    }

    res.status(200).send("성공");
  } catch (error) {
    console.log(error);
  }
});

// ---------------------------   회원 설문지 결과 get요청   ---------------------------
router.get("/survey/result", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  const { id } = jwt.verify(authToken, SECRET_KEY);
  //일단 회원정보를 가져오고
  const existUser = await User.findOne({ email: id });

  try {
    if (existUser.secondResponses) {
      res.status(200).send({
        responses: existUser.responses,
        secondResponses: existUser.secondResponses,
        name: existUser.name,
      });
    } else {
      res
        .status(200)
        .send({ responses: existUser.responses, name: existUser.name });
    }
  } catch (error) {
    console.log(error);
  }
});

//  --------------------- 설문지 시작 전 유저가 설문지 했는 지, 안했는 지 확인요청   ----------------------
router.get("/survey/start", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  if (!authToken || authType !== "Bearer") {
    res.status(401).send({ errorMessage: "로그인 후 이용 가능한 기능입니다." });
    return;
  }
  try {
    const { id } = jwt.verify(authToken, SECRET_KEY);
    console.log(id);
    const existUser = await User.findOne({ email: id });
    console.log(existUser);
    if (existUser.responses.length > 1) {
      res.status(200).send({ message: "already" });
    } else {
      res.status(200).send({ message: "none" });
    }
  } catch (error) {
    console.log(error);
  }
});

//  ---------------------   토큰을 통해, 유저정보 get요청   ----------------------
router.get("/", async (req, res) => {
  const { authorization } = req.headers;
  console.log(authorization);
  const [authType, authToken] = (authorization || "").split(" ");
  console.log(authType);
  console.log(authToken);

  if (!authToken || authType !== "Bearer") {
    res.status(401).send({ errorMessage: "로그인 후 이용 가능한 기능입니다." });
    return;
  }
  try {
    const { id } = jwt.verify(authToken, SECRET_KEY);
    console.log(id);
    const existUser = await User.findOne({ email: id });
    res
      .status(200)
      .send({ phoneNumber: existUser.phoneNumber, name: existUser.name });
  } catch (error) {
    console.log(error);
  }
});

//  ---------------------   카카오 인가코드 받아오기   ----------------------
const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;

router.post("/kakao", async (req, res) => {
  const { code } = req.body;
  console.log(code);

  const baseUrl = "https://kauth.kakao.com/oauth/token";
  const config = {
    client_id: "6ad4090f0f6da30b4f468e9d81481e0e",
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:3000/kakao/auth",
    code: code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const kakaoTokenRequest = await fetch(finalUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json", // 이 부분을 명시하지않으면 text로 응답을 받게됨
    },
  });
  const json = await kakaoTokenRequest.json();
  console.log(json);
});

//? =====================  액세스토큰 발급  =====================
function createAccessToken(id) {
  const accessToken = jwt.sign({ id: id }, SECRET_KEY, { expiresIn: "1d" });
  return accessToken;
}
//? =====================  리프레쉬토큰 발급  =====================
function createRefreshToken() {
  const refreshToken = jwt.sign({}, SECRET_KEY, { expiresIn: "1d" });
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
