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
  const domain = req.headers.host;

  if (req.headers.host !== "localhost:3000")
    return res.json({
      id: "default",
    });

  res.json({
    id: "default",
  });
});

module.exports = router;
