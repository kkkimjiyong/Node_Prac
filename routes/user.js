const express = require("express");
const router = express.Router();
const User = require("../schemas/user");
const jwt = require("jsonwebtoken");
const axios = require("axios");
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
  const [authType, authToken] = (authorization || "").split(" ");

  if (!authToken || authType !== "Bearer") {
    res.status(401).send({ errorMessage: "로그인 후 이용 가능한 기능입니다." });
    return;
  }
  try {
    const { id } = jwt.verify(authToken, SECRET_KEY);
    console.log(id);
    const existUser = await User.findOne({ email: id });
    console.log(existUser, "get요청");
    res.status(200).send({
      phoneNumber: existUser.phoneNumber,
      name: existUser.name,
      email: existUser.email,
    });
  } catch (error) {
    console.log(error);
  }
});

//  ---------------------   카카오 인가코드 받아오기   ----------------------
// const passport = require("passport");
// const KakaoStrategy = require("passport-kakao").Strategy;
// passport.use(
//   "kakao",
//   new KakaoStrategy(
//     {
//       clientID: "6ad4090f0f6da30b4f468e9d81481e0e",
//       callbackURL: "http://localhost:3000/kakao/auth",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       //console.log(profile);
//       console.log(accessToken);
//       console.log(refreshToken);
//     }
//   )
// );

router.post("/kakao", async (req, res) => {
  const { code } = req.body;
  console.log(code);

  const baseUrl = "https://kauth.kakao.com/oauth/token";
  const config = {
    client_id: "6ad4090f0f6da30b4f468e9d81481e0e",
    grant_type: "authorization_code",
    redirect_uri: "https://tax-back-transfer.vercel.app/kakao/auth",
    // redirect_uri: "http://localhost:3000/kakao/auth",
    code: code,
  };

  const finalUrl = `${baseUrl}?${qs.stringify(config)}`;
  console.log(finalUrl);
  const kakaoTokenRequest = await axios.post(finalUrl).then((res) => {
    console.log("카카오", res);
    return res;
  });
  console.log(kakaoTokenRequest);
  console.log("카카오로부터 받은 토큰", kakaoTokenRequest);
  if ("access_token" in kakaoTokenRequest) {
    // 엑세스 토큰이 있는 경우 API에 접근
    const { access_token } = kakaoTokenRequest;
    const userRequest = await await axios("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-type": "application/json",
      },
    });
    console.log("유저정보", userRequest);
    const { kakao_account } = userRequest;
    //카카오로 로그인하면 카카오고유이메일를 이용해서 토큰을 만들고,
    const accessToken = createAccessToken(kakao_account.email);
    //카카오고유아이디를 통해서, 디비에서 유저를 찾아보고,
    const existUser = await User.find({ email: kakao_account.email });
    console.log("카카오 신규유저", kakao_account.email, existUser);
    console.log(Boolean(existUser.length));
    if (existUser.length) {
      //유저가 이미 가입되어있으면, 디비에 값 안넣고 토큰만 보내면 됨.
      // 그리고 프론트쪽에 신규가입이 아니니까, 메인으로 넘어가도록 메시지보내주자.
      return res
        .status(200)
        .send({ accessToken: accessToken, kakao: "already" });
    } else {
      // 신규유저면, 카카오에서 이메일이랑 이름, 고유아이디로 디비에 저장 후, 토큰지급.
      const user = new User({
        name: kakao_account.profile.nickname,
        email: kakao_account.email,
      });
      await user.save();
      return res.status(200).send({
        accessToken: accessToken,
        userInfo: {
          name: kakao_account.profile.nickname,
          email: kakao_account.email,
        },
      });
    }
  }
});

router.put("/kakao/signup", async (req, res) => {
  const { userInfo } = req.body;
  const { authorization } = req.headers;
  console.log(authorization);
  const [authType, authToken] = (authorization || "").split(" ");
  console.log("카카오 회원가입", userInfo);
  const { id } = jwt.verify(authToken, SECRET_KEY);
  console.log(id);
  await User.updateOne(
    { email: id },
    {
      $set: {
        email: userInfo.email,
        name: userInfo.name,
        phoneNumber: userInfo.phoneNumber,
      },
    }
  );
  res.status(200).send("성공");
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
