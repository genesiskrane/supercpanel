const fs = require("fs");
const path = require("path");
const express = require("express");

const { projects } = require("../data").getData();

const router = express.Router();

function init() {
  console.log("🧠 Initializing Routers from ./stack");

  for (const project of projects) {
    routerPath = path.join(
      __dirname,
      "stack",
      project.id[0],
      project.id,
      "index.js"
    );
    console.log(routerPath + " exists=" + fs.existsSync(routerPath));

    const router = require(routerPath);
    console.log(router);
  }
}

init();

module.exports = router;
