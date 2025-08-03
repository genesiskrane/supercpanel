const fs = require("fs");
const path = require("path");
const express = require("express");

const APIRouter = require("./api")

const { projects } = require("../data").getData();

const router = express.Router();
const domainRouterMap = new Map(); // Store domain-router pairs

function init() {
  console.log("🧠 Initializing Routers from ./stack");

  for (const project of projects) {
    const routerPath = path.join(
      __dirname,
      "stack",
      project.id[0],
      project.id,
      "index.js"
    );

    if (fs.existsSync(routerPath)) {
      const projectRouter = require(routerPath);

      for (const domain of project.domains || []) {
        domainRouterMap.set(domain, projectRouter);
      }
    } else {
      console.warn(`⚠️  Router not found: ${routerPath}`);
    }
  }
}

init();

// Middleware to route based on req.headers.host
router.use((req, res, next) => {
  const host = req.headers.host?.split(":")[0]; // Remove port if present
  const matchedRouter = domainRouterMap.get(host);

  if (matchedRouter) {
    return matchedRouter(req, res, next); // Delegate to matched router
  } else {
    return next();
  }
});

router.use("/api", APIRouter);

module.exports = router;
