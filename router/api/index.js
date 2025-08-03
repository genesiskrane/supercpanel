const express = require("express");

const gitRouter = require("./git");

const router = express.Router();

router.use("/git", gitRouter);

router.get("/", (req, res) => {
  res.json({
    text: "Welcome to the Super CPanel API",
  });
});

module.exports = router;
