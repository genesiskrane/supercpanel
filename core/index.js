const { Storage } = require("@google-cloud/storage");
const { exec: _exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const os = require("os");
const url = require("url");

const exec = promisify(_exec);
const storage = new Storage(); // ensure GOOGLE_APPLICATION_CREDENTIALS or ADC is set

//
const { projects } = require("../data").getData();

// Use App Engine tmp dir
const bucketName = "supercpanel";

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function safeRemoveDir(dirPath, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fsp.rm(dirPath, { recursive: true, force: true });
      return;
    } catch (err) {
      if (err.code === "EBUSY" && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function normalizeRepoURL(repoUrl) {
  let parsed = repoUrl.trim();
  if (parsed.endsWith(".git")) parsed = parsed.slice(0, -4);
  if (parsed.endsWith("/")) parsed = parsed.slice(0, -1);
  return parsed;
}

async function uploadFolderToGCS(localDir, bucketName, destPrefix) {
  const bucket = storage.bucket(bucketName);
  const entries = await fsp.readdir(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(localDir, entry.name);
    const remotePath = path.posix.join(destPrefix, entry.name);
    if (entry.isDirectory()) {
      uploadFolderToGCS(
        fullPath,
        bucketName,
        path.posix.join(destPrefix, entry.name)
      );
    } else if (entry.isFile()) {
      console.info(`Uploading ${fullPath} -> gs://${bucketName}/${remotePath}`);
      bucket.upload(fullPath, {
        destination: remotePath,
        gzip: true,
        metadata: {
          cacheControl: "public, max-age=3600",
        },
      });
    }
  }
}

async function buildDistFolder(id, subname, gitURL) {
  console.log(`Building ${subname} client for project ${id}`);

  const normalizedURL = normalizeRepoURL(gitURL);

  const workdir = path.join(
    path.join(__dirname, "..", "tmp", "supercpanel-builds", id[0]),
    id,
    subname
  ); // isolates per subclient

  try {
    await safeRemoveDir(workdir);
    await ensureDir(workdir);

    await exec(`git clone --depth=1 ${normalizedURL} .`, { cwd: workdir });
    console.log(`Cloned ${normalizedURL} to ${workdir}`);

    await exec("npm ci", { cwd: workdir });
    console.log(`Installed deps for ${subname} of project ${id}`);

    await exec("npm run build", { cwd: workdir });
    console.log(`Built ${subname}`);
  } catch (err) {
    console.error(`Build failed for ${subname} in project ${id}:`, err.message);
    throw err; // propagate so upload is skipped
  }

  const distPath = path.join(workdir, "dist");
  if (!(await pathExists(distPath))) {
    throw new Error(
      `dist folder missing after build for ${subname} in project ${id}`
    );
  }
  return distPath;
}

async function uploadDistFolder(distDir, subname, id) {
  if (!(await pathExists(distDir))) {
    throw new Error('Build finished but "dist" folder not found.');
  }

  // Adjust prefix to your desired layout. Example: initials/{projectID}/{subname}/dist
  const destPrefix = path.posix.join(id[0], id, subname, "dist");
  await uploadFolderToGCS(distDir, bucketName, destPrefix);
  console.log(`Successfully uploaded ${subname} for project ${id}`);
  await safeRemoveDir(path.join(distDir, "..")); // Clean up after upload
}

async function buildClientsToGoogleCloudStorage() {
  for (const project of projects) {
    const { id, clients } = project;

    for (const subs of clients) {
      for (const [subname, gitURL] of Object.entries(subs)) {
        try {
          const distDir = await buildDistFolder(id, subname, gitURL);
          uploadDistFolder(distDir, subname, id);
        } catch (err) {
          console.error(
            `Skipping upload for ${subname} of project ${id}:`,
            err.message
          );
        }
      }
    }
  }
}

const init = async (app) => {
  console.log("Initializing Super Cpanel...");

  app.listen(process.env.PORT || 3000, async () => {
    console.log("🚀 Super Express App listening on port 3000");

    console.log(`Loaded ${projects.length} projects`);
    console.info(`Loading project clients to Google Cloud Storage...`);

    await buildClientsToGoogleCloudStorage();
    console.log("Super Cpanel initialization complete.");
  });
};

module.exports = { init };
