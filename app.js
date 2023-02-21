const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const helmet = require("helmet");
const userRouter = require("./routes/user");
const tokenRouter = require("./routes/token");
const taxBackErrorRouter = require("./routes/TaxBackError");
const bodyParser = require("body-parser");
const multer = require("multer");
const form_data = multer();

// 헤더 설정에서 보안이슈 방어
app.use(helmet());

// cors해결해주자.
app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(form_data.array());

// json으로 들어오는 데이터를 다시 변환  =>  이거때문에 안되고있엇구만
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
// 이거 localhost가 아닌 127.0.0.1로 해야 연결되네 ㅅㅂ;
mongoose
  .connect(
    "mongodb+srv://test:sparta@cluster0.qwdzo5h.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("몽고 연결 완료");
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸어요!");
});

//! ---------------------  jsonwebtoken 연습  -------------------------------
const jwt = require("jsonwebtoken");
const SECRET_KEY = `myNameIsJiYong`;
const token = jwt.sign({ myPayloadData: 1234 }, "mysecretkey");

//! ---------------------  액세스토큰 발급 연습  -------------------------------
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// 미들웨어역할 , 앞의 url주소가 앞에 오면 아래 미들웨어를 거쳐간다.
app.use("/taxback", [taxBackErrorRouter]);
app.use("/user", [userRouter]);
app.use("/token", [tokenRouter]);
