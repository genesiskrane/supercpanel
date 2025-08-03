const axios = require("axios");
const AdmZip = require("adm-zip");
const { Storage } = require("@google-cloud/storage");

const { projects, tokens } = require("../data").getData();

const storage = new Storage(); // Ensure GOOGLE_APPLICATION_CREDENTIALS or ADC is set
const bucketName = "supercpanel";

async function buildClientsToGoogleCloudStorage() {
  for (const project of projects) {
    const { id, clients } = project;

    for (const subs of clients) {
      for (const [subname, gitURL] of Object.entries(subs)) {
        await checkDownloadAndUploadRepoRelease(gitURL, subname, id);
      }
    }
  }
}

async function checkDownloadAndUploadRepoRelease(gitURL, subname, id) {
  const splits = gitURL.split("/");
  const owner = splits[3];
  const repo = splits[4];
  const latestReleaseURL = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

  try {
    const { data } = await axios.get(latestReleaseURL, {
      headers: {
        Authorization: `Bearer ${tokens[owner]}`,
        Accept: "application/vnd.github+json",
      },
    });

    const zipURL = data.assets[0].browser_download_url;
    const distfileName = zipURL.split("/").pop();
    const [_, commit, timestampRaw] = distfileName.split("-");
    const timestamp = timestampRaw.split(".")[0];

    const currentVersionDataFileURL = `https://storage.googleapis.com/${bucketName}/${id[0]}/${id}/${subname}/dist/info.json`;
    const currentClientInfo = await getCurrentClientStorageInfo(
      currentVersionDataFileURL
    );

    const needsUpdate =
      !currentClientInfo.commit ||
      !currentClientInfo.timestamp ||
      currentClientInfo.commit !== commit ||
      currentClientInfo.timestamp !== timestamp;

    if (!needsUpdate) return;

    await extractFileToCloudStorage(zipURL, subname, id, commit, timestamp);
  } catch (error) {
    console.error(
      `❌ Error checking release for ${subname} in project ${id}:`,
      error.response?.data || error.message
    );
  }
}

async function extractFileToCloudStorage(
  zipURL,
  subname,
  id,
  commit,
  timestamp
) {
  const bucket = storage.bucket(bucketName);

  console.log(`📥 Downloading zip file from ${zipURL}...`);

  try {
    const zipResponse = await axios.get(zipURL, {
      responseType: "arraybuffer",
    });
    const zip = new AdmZip(zipResponse.data);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        console.log("📁 Skipping directory:", entry.entryName);
        continue;
      }

      const cleanName = entry.entryName.replace(/^([^/]+)\//, "");
      const filePath = `${id[0]}/${id}/${subname}/dist/${cleanName}`;
      const remoteFile = bucket.file(filePath);

      console.log(`📦 Uploading: ${filePath}`);
      await remoteFile.save(entry.getData(), {
        metadata: { contentType: "application/octet-stream" },
      });
      console.log(`✅ Uploaded: ${filePath}`);
    }

    // Upload info.json
    const info = JSON.stringify({ commit, timestamp }, null, 2);
    const infoFilePath = `${id[0]}/${id}/${subname}/dist/info.json`;
    const infoFile = bucket.file(infoFilePath);

    await infoFile.save(Buffer.from(info), {
      metadata: { contentType: "application/json" },
    });

    console.log(`📝 Uploaded info.json: ${infoFilePath}`);
    console.log("✅ All files extracted and uploaded.");
  } catch (err) {
    console.error(`❌ Failed to extract/upload files from ${zipURL}:`, err);
  }
}

async function getCurrentClientStorageInfo(infoURL) {
  try {
    const res = await axios.get(infoURL, { responseType: "json" });
    const { commit, timestamp } = res.data || {};
    return {
      commit: commit || "",
      timestamp: timestamp || "",
    };
  } catch (err) {
    console.warn(`⚠️ Could not fetch info.json at ${infoURL}:`, err.message);
    return { commit: "", timestamp: "" };
  }
}

const init = async (app) => {
  console.log("🧠 Initializing Super Cpanel...");

  app.listen(process.env.PORT || 3000, async () => {
    console.log("🚀 Super Express App listening on port 3000");

    console.log(`📊 Loaded ${projects.length} projects`);
    console.info(`📡 Syncing project clients to Google Cloud Storage...`);

    await buildClientsToGoogleCloudStorage();

    console.log("🏁 Super Cpanel initialization complete.");
  });
};

module.exports = { init };
