const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();

router.get("/api", (req, res) => {
  res.json({ index: "Welcome to the Super Cpanel API!" });
});

function init() {
  console.log("🧠 Initializing Routers from ./stack");

  const stackDir = path.join(__dirname, "stack");

  fs.readdirSync(stackDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((dir) => {
      const routerPath = path.join(stackDir, dir.name, "router.js");

      if (fs.existsSync(routerPath)) {
        const childRouter = require(routerPath);

        // Mount the router with a path like /api/projectA/*
        router.use(`/api/${dir.name}`, childRouter);

        console.log(`✅ Mounted /api/${dir.name}`);
      } else {
        console.warn(`⚠️ No router.js found in ${dir.name}`);
      }
    });
}

init();

module.exports = router;
