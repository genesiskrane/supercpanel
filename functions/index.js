const { Storage } = require("@google-cloud/storage");

const storage = new Storage(); // Ensure GOOGLE_APPLICATION_CREDENTIALS or ADC is set
const bucketName = "supercpanel";

const axios = require("axios");

const { projects, tokens } = require("../data").getData();

function getProjectIDByHostname(hostname) {
  const project = projects.find((project) =>
    project.domains.includes(hostname)
  );

  if (project) return project.id;
  else return "CPanel";
}

async function buildClientsToGoogleCloudStorage() {
  for (const project of projects) {
    const { id, clients } = project;

    for (const subs of clients) {
      for (const [subname, gitURL] of Object.entries(subs)) {
        await uploadRepoDist(gitURL, subname, id);
      }
    }
  }
}

async function uploadRepoDist(gitURL, subname, id) {
  const [_, __, ___, owner, repo] = gitURL.split("/");

  const token = tokens[owner];
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // Step 1: Get default branch
    const repoRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );
    const defaultBranch = repoRes.data.default_branch;

    // Step 2: Get latest commit
    const branchRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`,
      { headers }
    );
    const commit = branchRes.data.sha;
    const timestamp = new Date(branchRes.data.commit.committer.date)
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    // Step 3: Check current version in storage
    const infoURL = `https://storage.googleapis.com/${bucketName}/${id[0]}/${id}/${subname}/dist/info.json`;
    const current = await getCurrentClientStorageInfo(infoURL);

    const needsUpdate =
      !current.commit ||
      !current.timestamp ||
      current.commit !== commit ||
      current.timestamp !== timestamp;

    if (!needsUpdate) return;

    // Step 4: Get dist folder contents
    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${commit}?recursive=1`,
      { headers }
    );

    const distFiles = treeRes.data.tree.filter(
      (item) => item.path.startsWith("dist/") && item.type === "blob"
    );

    if (distFiles.length === 0) {
      console.warn(`⚠️ No dist folder found in latest commit of ${repo}`);
      return;
    }

    // Step 5: Download each file from raw URL and upload
    const baseRaw = `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/`;

    for (const file of distFiles) {
      const rawURL = baseRaw + file.path;
      const filePath = `${id[0]}/${id}/${subname}/dist/${file.path.replace(
        /^dist\//,
        ""
      )}`;
      const remoteFile = storage.bucket(bucketName).file(filePath);

      const fileRes = await axios.get(rawURL, { responseType: "arraybuffer" });
      const contentType =
        require("mime-types").lookup(file.path) || "application/octet-stream";

      console.log(`📤 Uploading ${filePath}`);
      await remoteFile.save(fileRes.data, {
        metadata: { contentType },
      });
    }

    // Step 6: Upload info.json
    const info = JSON.stringify({ commit, timestamp }, null, 2);
    const infoPath = `${id[0]}/${id}/${subname}/dist/info.json`;
    const infoFile = storage.bucket(bucketName).file(infoPath);

    await infoFile.save(Buffer.from(info), {
      metadata: { contentType: "application/json" },
    });

    console.log(`✅ Uploaded dist folder for ${subname} (${commit})`);
  } catch (error) {
    console.error(
      `❌ Error processing ${subname}:`,
      error.response?.data || error.message
    );
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

module.exports = { getProjectIDByHostname, buildClientsToGoogleCloudStorage, uploadRepoDist };
