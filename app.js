const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
// const bodyParser = require("body-parser");
const goodsRouter = require("./routes/goods");
const signUpRouter = require("./routes/SignUp");
const cartsRouter = require("./routes/cart");

// cors해결해주자.
app.use(
  cors({
    origin: "*",
  })
);

// json으로 들어오는 데이터를 다시 변환  =>  이거때문에 안되고있엇구만
app.use(express.json());

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
// 이거 localhost가 아닌 127.0.0.1로 해야 연결되네 ㅅㅂ;
mongoose.connect("mongodb://127.0.0.1:27017/prac").then(() => {
  console.log("몽고 연결 완료");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸어요!");
});

// 미들웨어역할 , 앞의 url주소가 앞에 오면 아래 미들웨어를 거쳐간다.
app.use("/api", [goodsRouter]);
app.use("/signup", [signUpRouter]);
