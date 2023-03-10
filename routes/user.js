const express = require("express");
const router = express.Router();
const User = require("../schemas/user");
const jwt = require("jsonwebtoken");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const SECRET_KEY = `hi`;

let tokenObject = {}; // Refresh Token을 저장할 Object

//----------------------------   회원가입   -------------------------------

router.post("/signup", async (req, res) => {
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
  const existUser = await User.findOne({ phoneNumber: id });
  const { responses } = req.body;
  //회원이 응답 내역이 있으면,
  try {
    if (existUser.responses) {
      await User.updateOne(
        { phoneNumber: id },
        // 추가적으로 주택, 토지, 상가를 type으로 추가 (보기 편하니까)
        { $set: { responses: responses, type: responses[0].response[0] } }
      );
    } else {
      await User.updateOne(
        { phoneNumber: id },
        { $push: { responses: responses, type: responses[0].response[0] } }
      );
    }

    res.status(200).send("성공");
  } catch (error) {
    console.log(error);
  }
});

//! ---------------------   설문지 수정 api   ----------------------------
router.put("/survey/edit/:process", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  const { id } = jwt.verify(authToken, SECRET_KEY);
  const existUser = await User.findOne({ phoneNumber: id });
  const { editResponse } = req.body;
  // 질문 index 파라미터로
  const index = req.params.process;
  let responses = existUser.responses;
  responses[index].response = editResponse;
  await User.updateOne({ phoneNumber: id }, { $set: { responses: responses } });
  res.status(200).send("성공");
});
// 아이디 및 주민번호를 통해, 중복체크 라우터
// router.post('/check' , (req,res) => {
//   const { corporation, name, phoneNumber, registerNumber } = req.body;
//   console.log(req.body);

//   const existUser = await User.findOne({
//     $or: [{ phoneNumber }, { name }, { registerNumber }],
//   });
//   if (existUser) {
//     return res.status(200).send({ already: true });
//   }

// })

router.post("/verify", async (req, res) => {
  const { corporation, name, phoneNumber, registerNumber } = req.body;
  const accessToken = createAccessToken(phoneNumber);
  const refreshToken = createRefreshToken();

  tokenObject[refreshToken] = phoneNumber;

  const existUser = await User.findOne({
    $or: [{ phoneNumber }, { name }, { registerNumber }],
  });
  if (existUser) {
    return res.status(200).send({ already: true, accessToken });
  } else {
    const user = new User({
      name,
      registerNumber,
      phoneNumber,
      corporation,
    });
    await user.save();
    res.status(200).send({ accessToken, message: "성공" });
  }
});

// ---------------------------   회원 설문지 결과 get요청   ---------------------------
router.get("/survey/result", async (req, res) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");
  const { id } = jwt.verify(authToken, SECRET_KEY);
  //일단 회원정보를 가져오고
  const existUser = await User.findOne({ phoneNumber: id });

  try {
    res.status(200).send({
      responses: existUser.responses,
      name: existUser.name,
      type: existUser.type,
    });
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
    const existUser = await User.findOne({ email: id });
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
    const existUser = await User.findOne({ phoneNumber: id });
    res.status(200).send({
      phoneNumber: existUser.phoneNumber,
      name: existUser.name,
    });
  } catch (error) {
    console.log(error);
  }
});

//!  ---------------------   카카오 소셜로그인   ----------------------

// router.post("/kakao", async (req, res) => {
//   const { code } = req.body;
//   console.log(code);

//   const baseUrl = "https://kauth.kakao.com/oauth/token";
//   const config = {
//     client_id: "6ad4090f0f6da30b4f468e9d81481e0e",
//     grant_type: "authorization_code",
//     redirect_uri: "https://tax-back-transfer.vercel.app/kakao/auth",
//     code: code,
//   };

//   const params = new URLSearchParams(config).toString();
//   const finalUrl = `${baseUrl}?${params}`;
//   console.log(finalUrl);
//   const kakaoTokenRequest = await fetch(finalUrl, {
//     method: "POST",
//     headers: {
//       "Content-type": "application/json", // 이 부분을 명시하지않으면 text로 응답을 받게됨
//     },
//   });
//   const json = await kakaoTokenRequest.json();
//   console.log("카카오로부터 받은 토큰", json);
//   if ("access_token" in json) {
//     // 엑세스 토큰이 있는 경우 API에 접근
//     const { access_token } = json;
//     const userRequest = await (
//       await fetch("https://kapi.kakao.com/v2/user/me", {
//         headers: {
//           Authorization: `Bearer ${access_token}`,
//           "Content-type": "application/json",
//         },
//       })
//     ).json();
//     console.log("유저정보", userRequest);
//     const { kakao_account } = userRequest;
//     //카카오로 로그인하면 카카오고유이메일를 이용해서 토큰을 만들고,
//     const accessToken = createAccessToken(kakao_account.email);
//     //카카오고유아이디를 통해서, 디비에서 유저를 찾아보고,
//     const existUser = await User.find({ email: kakao_account.email });
//     console.log("카카오 신규유저", kakao_account.email, existUser);
//     console.log(Boolean(existUser.length));
//     if (existUser.length) {
//       //유저가 이미 가입되어있으면, 디비에 값 안넣고 토큰만 보내면 됨.
//       // 그리고 프론트쪽에 신규가입이 아니니까, 메인으로 넘어가도록 메시지보내주자.
//       return res
//         .status(200)
//         .send({ accessToken: accessToken, kakao: "already" });
//     } else {
//       // 신규유저면, 카카오에서 이메일이랑 이름, 고유아이디로 디비에 저장 후, 토큰지급.
//       const user = new User({
//         name: kakao_account.profile.nickname,
//         email: kakao_account.email,
//       });
//       await user.save();
//       return res.status(200).send({
//         accessToken: accessToken,
//         userInfo: {
//           name: kakao_account.profile.nickname,
//           email: kakao_account.email,
//         },
//       });
//     }
//   }
// });

// router.put("/kakao/signup", async (req, res) => {
//   const { userInfo } = req.body;
//   const { authorization } = req.headers;
//   console.log(authorization);
//   const [authType, authToken] = (authorization || "").split(" ");
//   console.log("카카오 회원가입", userInfo);
//   const { id } = jwt.verify(authToken, SECRET_KEY);
//   console.log(id);
//   await User.updateOne(
//     { email: id },
//     {
//       $set: {
//         email: userInfo.email,
//         name: userInfo.name,
//         phoneNumber: userInfo.phoneNumber,
//       },
//     }
//   );
//   res.status(200).send("성공");
// });

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
