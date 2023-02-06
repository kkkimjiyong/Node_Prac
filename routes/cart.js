// routes/goods.js
const express = require("express");
const router = express.Router();
const Cart = require("../schemas/cart");
const Goods = require("../schemas/goods");

router.get("/goods/cart", async (req, res) => {
  const cartList = await Cart.find();
  const goodsIds = cartList.map((cart) => cart.goodsId);

  const goods = await Goods.find({ goodsId: goodsIds });

  const results = cartList.map((cart) => {
    return {
      quantity: cart.quantity,
      goods: goods.find((item) => item.goodsId === cart.goodsId),
    };
  });
  res.json({
    cartList: results,
  });
});

router.post("/goods/:goodsId/cart", async (req, res) => {
  const { goodsId } = req.params;
  const { quantity } = req.body;

  const existsCarts = await Cart.find({ goodsId: Number(goodsId) });
  if (existsCarts.length) {
    return res.json({
      success: false,
      errorMessage: "이미 장바구니에 존재합니다.",
    });
  }
  await Cart.create({ goodsId: Number(goodsId), quantity: quantity });
  res.json({ result: "success" });
});

router.put("/goods/:goodsId/cart", async (req, res) => {
  const { goodsId } = req.params;
  const { quantity } = req.body;
  if (quantity < 1) {
    res.status(400).json({ errorMessage: "수량은 1 이상이어야 합니다." });
  }

  const existsCarts = await Cart.find({ goodsId: Number(goodsId) });
  if (existsCarts.length) {
    await Cart.updateOne({ goodsId: Number(goodsId) }, { $set: { quantity } });
  } else {
    res.status(400).json({ errorMessage: "존재하지않는 상품입니다." });
  }

  res.json({ result: "success" });
});

router.delete("/goods/:goodsId/cart", async (req, res) => {
  const { goodsId } = req.params;

  const existsCarts = await Cart.find({ goodsId });
  if (existsCarts.length > 0) {
    await Cart.deleteOne({ goodsId });
  }
  res.json({ result: "success" });
});

module.exports = router;
