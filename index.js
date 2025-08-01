require("./config");
const { init } = require("./core");

const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const path = require("path");

const { Storage } = require("@google-cloud/storage");

const router = require("./router");

const app = express();

// HTTPS Redirect (only in production, and avoid infinite redirect loops)
app.use((req, res, next) => {
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
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bucket = new Storage().bucket("supercpanel");

/**
 * Determines project/theme/file based on hostname and request path.
 * Simplified stub; adapt logic to your domain conventions.
 */
function identifyProjectFile(hostname, reqPath) {
  // Example: parse subdomain as projectID; fallback to "CPanel"
  let projectID = "CPanel";
  if (hostname) {
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      projectID = parts[0]; // e.g., project.example.com
    }
  }

  // Default theme
  const theme = "default";

  // Normalize and decode the path
  let cleaned = decodeURIComponent(reqPath);
  if (cleaned === "/" || cleaned === "") {
    return { projectID, theme, filePath: "index.html" };
  }

  // Remove leading slash
  if (cleaned.startsWith("/")) cleaned = cleaned.slice(1);

  // If path appears to be a file (has extension), use it; else fallback to index.html
  const hasExt = path.extname(cleaned) !== "";
  const filePath = hasExt ? cleaned : "index.html";

  return { projectID, theme, filePath };
}

function getFile(projectID, theme, filePath) {
  // organize by first letter to shard if desired
  const prefix = projectID[0];
  return bucket.file(`${prefix}/${projectID}/${theme}/dist/${filePath}`);
}

// Attach existing routers first
app.use(router);

// Catch-all for file serving / SPA shell
app.all("/{*any}", async (req, res) => {
  const { projectID, theme, filePath } = identifyProjectFile(
    req.headers.host,
    req.path
  );

  const file = getFile(projectID, theme, filePath);
  const stream = file.createReadStream();

  stream.on("error", (err) => {
    console.error(
      `Error fetching "${filePath}" for project="${projectID}" theme="${theme}":`,
      err
    );
    if (err.code === 404 || err.code === 404 /* sometimes string */) {
      // If requested path was a non-file (e.g., /some/route) and we already tried index.html,
      // you could optionally send a 404 here or again attempt index.html. current logic:
      if (filePath !== "index.html") {
        // fallback to index.html once
        const fallback = getFile(projectID, theme, "index.html");
        const fbStream = fallback.createReadStream();
        fbStream.on("error", (fbErr) => {
          console.error("Fallback index.html failed:", fbErr);
          res.status(404).send("Not Found");
        });
        fbStream.on("response", (gcsRes) => {
          const contentType = gcsRes.headers && gcsRes.headers["content-type"];
          if (contentType) res.setHeader("Content-Type", contentType);
        });
        fbStream.pipe(res);
      } else {
        res.status(404).send("Not Found");
      }
    } else {
      res.status(502).send("Failed to load application shell");
    }
  });

  stream.on("response", (gcsRes) => {
    const contentType = gcsRes.headers && gcsRes.headers["content-type"];
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    // Optionally propagate cache control if set in GCS
    if (gcsRes.headers && gcsRes.headers["cache-control"]) {
      res.setHeader("Cache-Control", gcsRes.headers["cache-control"]);
    }
  });

  stream.pipe(res);
});

init(app);
