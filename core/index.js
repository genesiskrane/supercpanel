const { Storage } = require("@google-cloud/storage");
const { exec: _exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const os = require("os");
const url = require("url");
const { CLIENT_RENEG_LIMIT } = require("tls");

const exec = promisify(_exec);
const storage = new Storage(); // ensure GOOGLE_APPLICATION_CREDENTIALS or ADC is set

//
const { projects } = require("../data").getData();

// Use App Engine tmp dir
const bucketName = "supercpanel";

async function buildClientsToGoogleCloudStorage() {
  for (const project of projects) {
    const { id, clients } = project;

    for (const subs of clients) {
      for (const [subname, gitURL] of Object.entries(subs))
        downloadRepoRelease(gitURL, id)
          .then((distZip) => extractFileToCloudStorage(distZip, subname, id))
          .catch((err) =>
            console.error(`Failed to upload ${subname} for project ${id}:`, err)
          );
    }
  }
}

async function downloadRepoRelease(gitURL) {
  console.log(`Downloading release from ${gitURL}`);
}
async function extractFileToCloudStorage() {}

const init = async (app) => {
  console.log("Initializing Super Cpanel...");

  app.listen(process.env.PORT || 3000, async () => {
    console.log("🚀 Super Express App listening on port 3000");

    console.log(`Loaded ${projects.length} projects`);
    console.info(`Loading project clients to Google Cloud Storage...`);

    await buildClientsToGoogleCloudStorage();

    console.log("Super Cpanel initialization complete.");

    // Update All Project Clients
  });
};

module.exports = { init };
