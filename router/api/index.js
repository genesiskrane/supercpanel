const express = require("express");

const gitRouter = require("./git");

const router = express.Router();

router.use("/git", gitRouter);

router.get("/", (req, res) => {
  res.json({
    text: "Welcome to the Super CPanel API",
  });
});

router.get("/data/domain", (req, res) => {
  res.json({
    text: "Domain data endpoint is under construction",
    domain: req.headers.host,
  });
});

module.exports = router;
