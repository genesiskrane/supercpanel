const fs = require("fs");
const path = require("path");

const axios = require("axios");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "logs.json");

// Ensure the logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Start fresh each build
fs.writeFileSync(LOG_FILE, "[]", "utf8");

const logs = [];

const overrideConsole = (methodName) => {
  const original = console[methodName];

  console[methodName] = (...args) => {
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
      .join(" ");

    const entry = {
      type: methodName,
      timestamp: new Date().toISOString(),
      projectID: args.length == 1 ? "Super Cpanel" : args[args.length - 1],
      message,
    };

    logs.push(entry);
    original(...args); // Keep the normal behavior
  };
};

// Override each desired console method
["log", "info", "error"].forEach(overrideConsole);

const client = new SecretManagerServiceClient();
let tokens = {};

async function main() {
  console.info(
    process.env.IN_CLOUD_BUILD === "true"
      ? "Production Build"
      : "Development Build"
  );

  const secret = await getSecret("SECRET");

  console.log("Starting build process...");

  try {
    const { data } = await axios.get(
      "https://gkrane.online/api/CP/build?secret=" + secret
    );

    console.log(data);

    tokens = data.tokens;

    // Save Data to disk
    try {
      const dataPath = path.join(__dirname, "..", "data", "data.json");
      fs.mkdir(path.dirname(dataPath), { recursive: true }, (err) => {
        if (err) {
          console.error("Failed to create directory:", err);
          return;
        }
      });

      // write file
      fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf8", (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log(`Wrote data to ${dataPath}`);
        }
      });
    } catch (err) {
      console.error("Error saving data to disk:", err);
    }

    // Build Express Projects
    console.log("Building Express Projects...");

    for (const project of data.projects)
      await buildExpressProject(project.repo, project.id);
  } catch (error) {
    console.error(`❌ Error fetching data: ${error.message}`);
  }
}

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/28739726663/secrets/${secretName}/versions/latest`,
  });

  return version.payload.data.toString("utf8");
}

async function buildExpressProject(repo_url, id) {
  console.log(`Building project ${id} from repo ${repo_url}...`, id);

  const { owner, repo } = parseGitHubUrl(repo_url);
  const TOKEN = tokens[owner];
  const dirPath = "";
  const branch = "main";

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

  try {
    const files = await getFilesRecursive(url, TOKEN);
    console.log(`✅ Found ${files.length} files for ${repo_url}`, id);

    for (const file of files) {
      writeFileToDisk(file, TOKEN, id);
    }
  } catch (error) {
    console.error(`❌ Failed to build project ${id}: ${error.message}`);
  }

  console.log(`Project ${id} build completed.`, id);
}

async function getFilesRecursive(url, token) {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Node.js script",
      },
    });

    const items = response.data;
    let allFiles = [];

    for (const item of items) {
      if (item.type === "file") {
        allFiles.push(item);
      } else if (item.type === "dir") {
        const nestedFiles = await getFilesRecursive(item.url, token); // 🔁 recurse
        allFiles = allFiles.concat(nestedFiles);
      }
    }

    return allFiles;
  } catch (error) {
    console.error("Error fetching files:", error.message);
    return [];
  }
}

function parseGitHubUrl(url) {
  const regex =
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/(tree|blob)\/([^\/]+)(\/.*)?)?/;
  const match = url.match(regex);

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  const owner = match[1];
  const repo = match[2];
  const type = match[3];
  const branch = match[4] || "main";
  const rawPath = match[5] || "";
  const path = rawPath.replace(/^\/+/, "");

  return { owner, repo, branch, path };
}

async function writeFileToDisk(file, token, id) {
  try {
    const idInitial = id[0]; // e.g., "a" from "abc123"
    const parts = file.path.split("/");

    // Insert the path segment: stack/<initial>/<id>
    if (parts.length > 1) {
      parts.splice(1, 0, "stack", idInitial, id);
    } else {
      // File at root level
      parts.unshift("stack", idInitial, id);
    }

    const modifiedPath = path.join(__dirname, "..", ...parts);
    const dir = path.dirname(modifiedPath);

    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`, id);

    const { data: fileContent } = await axios.get(file.url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "Node.js script",
      },
      responseType: "arraybuffer",
    });

    fs.writeFileSync(modifiedPath, fileContent);
    console.log(`📝 Wrote file: ${parts.join("/")}`, id);
  } catch (error) {
    console.error(`❌ Failed to write ${file.path}: ${error.message}`, id);
  }
}

main()
  .finally(() => {
    console.log("Build process completed.");
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  })
  .catch((error) => {
    console.error(`❌ Error in main function: ${error.message}`);
    process.exit(1);
  });
