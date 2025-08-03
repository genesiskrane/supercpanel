require("./config");
const { init } = require("./core");

const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const path = require("path");

const mime = require("mime-types");

const fn = require("./functions");

const { Storage } = require("@google-cloud/storage");

const router = require("./router");

const app = express();

const allowedHosts = require("./data").getAllowedHosts();

// HTTPS Redirect (only in production, and avoid infinite redirect loops)
app.use((req, res, next) => {
  if (!allowedHosts.includes(req.headers.host)) {
    console.warn(`Blocked request from host: ${req.headers.host}`);
    return res.status(403).send("Forbidden");
  }

  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.set("trust proxy", true);

// Middlewares
app.use(cors());
app.use(morgan('common'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bucket = new Storage().bucket("supercpanel");

/**
 * Determines project/subname/file based on hostname and request path.
 * Simplified stub; adapt logic to your domain conventions.
 */
function identifyProjectFile(hostname, reqPath) {
  // Example: parse subdomain as projectID; fallback to "CPanel"
  let projectID = fn.getProjectIDByHostname(hostname);

  // Default subname
  const subname = "default";

  // Normalize and decode the path
  let cleaned = decodeURIComponent(reqPath);
  if (cleaned === "/" || cleaned === "") {
    return { projectID, subname, filePath: "index.html" };
  }

  // Remove leading slash
  if (cleaned.startsWith("/")) cleaned = cleaned.slice(1);

  // If path appears to be a file (has extension), use it; else fallback to index.html
  const hasExt = path.extname(cleaned) !== "";

  const filePath = hasExt ? cleaned : path.join("index.html");

  return { projectID, subname, filePath };
}

function getFile(projectID, subname, filePath) {
  // organize by first letter to shard if desired
  const prefix = projectID[0];
  return bucket.file(`${prefix}/${projectID}/${subname}/dist/${filePath}`);
}

// Attach existing routers first
app.use(router);

// Catch-all for file serving / SPA shell
app.all("/{*any}", async (req, res) => {
  const { projectID, subname, filePath } = identifyProjectFile(
    req.headers.host,
    req.path
  );

  const file = getFile(projectID, subname, filePath);
  const [exists] = await file.exists();
  if (!exists) return res.status(404).send("File not found");

  const contentType = mime.lookup(file.name) || "application/octet-stream";

  res.set("Cache-Control", "public, max-age=36000, immutable");

  const [buffer] = await file.download();
  res.type(contentType).send(buffer);
});

init(app);
