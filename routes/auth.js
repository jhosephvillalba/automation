const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  //User and password in env
  if (
    username === process.env.SINGEL_USER &&
    password === process.env.PASSWORD_USER
  ) {
    const accessToken = jwt.sign({ username }, config.secret);
    res.json({ accessToken });
  } else {
    res.send("Not Allowed");
  }
});

module.exports = router;
