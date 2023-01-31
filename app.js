const express = require("express");
const app = express();
const port = 3001;
const cors = require("cors");
const bodyParser = require("body-parser");
const goodsRouter = require("./routes/goods");
const signUpRouter = require("./routes/SignUp");

// cors해결해주자.
app.use(
  cors({
    origin: "*",
  })
);

// json으로 들어오는 데이터를 다시 변환  =>  이거때문에 안되고있엇구만
app.use(bodyParser.json());

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
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

app.use("/api", [goodsRouter]);
app.use("/signup", [signUpRouter]);
