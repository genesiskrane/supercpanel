const fs = require("fs");
const path = require("path");

const CONFIG_BASE = path.join(__dirname, "..", "config", "stack");

// Recursively find all config/index.js files
function getAllConfigModules() {
  const configs = [];

  for (const initial of fs.readdirSync(CONFIG_BASE)) {
    const initialPath = path.join(CONFIG_BASE, initial);
    if (!fs.lstatSync(initialPath).isDirectory()) continue;

    for (const id of fs.readdirSync(initialPath)) {
      const configPath = path.join(initialPath, id, "index.js");
      if (fs.existsSync(configPath)) {
        const config = require(configPath);
        configs.push({ id, config });
      }
    }
  }

  return configs;
}

// Mount each tenant
const configs = getAllConfigModules();

module.exports = configs;

console.log(`🔧 ${configs.length} tenant configurations found`);
