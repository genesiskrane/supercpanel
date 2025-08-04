const express = require("express");

const router = express.Router();

router.post("/commit", (req, res) => {
  res.send("Commit endpoint is under construction");
});

module.exports = router;
