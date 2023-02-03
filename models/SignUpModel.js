const mongoose = require("mongoose");

const SignUpSchema = new mongoose.Schema({
  name: String,
  phoneNumber: Number,
});

// 스키마 virtual 실험 예상값( 이름 뒤에 30 이 붙음)
SignUpSchema.virtual("nickName").get(() => {
  return this.name + 30;
});

// mongoose virtual을 사용한다는 뜻인듯?
SignUpSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("User", SignUpSchema);
