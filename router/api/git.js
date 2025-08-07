const express = require("express");

const router = express.Router();

router.post("/commit", (req, res) => {
  console.log(req.body);
  res.send("Commit endpoint is under construction");
});


module.exports = router;
