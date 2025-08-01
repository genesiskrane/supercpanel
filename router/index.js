const express = require("express");

const router = express.Router();

router.get("/api", (req, res) => {
  res.json({ index: "Welcome to the Super Cpanel API!" });
});

module.exports = router;
