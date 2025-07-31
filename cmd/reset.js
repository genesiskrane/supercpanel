const fs = require("fs");
const path = require("path");

function deleteStackFolders(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "stack") {
        // Delete the entire stack folder
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted: ${fullPath}`);
      } else {
        // Recurse into subdirectories
        deleteStackFolders(fullPath);
      }
    }
  }
}

// Start from project root (__dirname)
deleteStackFolders(path.join(__dirname, ".."));
