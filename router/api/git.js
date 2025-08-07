const express = require("express");

const router = express.Router();
const controller = require("../../controller");

router.post("/commit", controller.git.updateDistAfterCommit);

module.exports = router;
