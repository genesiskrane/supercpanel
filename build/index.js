const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const axios = require("axios");
const { exec } = require("child_process");

// This script builds the server files and accesses a secret from Google Cloud Secret Manager

const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/28739726663/secrets/${secretName}/versions/latest`,
  });

  const payload = version.payload.data.toString("utf8");
  return payload;
}

// Run npm install to ensure default dependencies are installed
exec("npm install", async (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`⚠️ Stderr: ${stderr}`);
    return;
  }

  console.log(`${stdout}`);

  const secret = await getSecret("SECRET");

  try {
    const { data } = await axios.get(
      "https://gkrane.online/api/CP/build?secret=" + secret
    );

    console.log(data);

    // Build Express Projects
    console.log("Building Express Projects...");

    for (const project of data.express)
      buildExpressProject(project.repo, project.id);
  } catch (error) {
    console.error(`❌ Error fetching data: ${error.message}`);
  }

  console.log("Server Files Built Successfully!");
});

console.log(
  process.env.IN_CLOUD_BUILD === "true"
    ? "Production Build"
    : "Development Build"
);

function buildExpressProject(repo, id) {
  return new Promise((resolve, reject) => {
    console.log(`Building project ${id} from repo ${repo}...`);
  });
}
