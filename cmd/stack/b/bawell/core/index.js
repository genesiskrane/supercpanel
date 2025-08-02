const { exec } = require("child_process");

const chokidar = require("chokidar");
const path = require("path");
const os = require("os");
const fs = require("fs");

let data;

function init() {
	data = fs.existsSync("data.json")
		? JSON.parse(fs.readFileSync("data.json", "utf-8"))
		: {};

	const url = `https://bawell.online/setup`;
	const startCommand =
		process.platform === "win32"
			? "start"
			: process.platform === "darwin"
				? "open"
				: "xdg-open";

	exec(`${startCommand} ${url}?dirname=${__dirname}`, (err) => {
		if (err) {
			console.error("Failed to open browser:", err);
		} else {
			console.log(`Browser launched at ${url}`);
			if (data.username) start();
			else {
				console.info("Setting up your account [view browser]...");
			}
		}
	});

	// Save All Altered Files To Repository
}

function signin() {
	const data = {
		username: "augmentchinedu",
		workspace: "Documents",
	};

	fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

function start() {
	const docsPath = path.join(os.homedir(), data.workspace);

	console.log(`📂 Watching: ${docsPath} (excluding node_modules)`);

	// Ignore hidden files AND node_modules folders
	chokidar
		.watch(docsPath, {
			ignored: /(^|[\/\\])(\.git|node_modules)/,
			persistent: true,
		})
		.on("add", (path) => console.log(`📄 File added: ${path}`))
		.on("change", (path) => console.log(`✏️ File changed: ${path}`))
		.on("unlink", (path) => console.log(`🗑️ File removed: ${path}`))
		.on("addDir", (path) => console.log(`📁 Directory added: ${path}`))
		.on("unlinkDir", (path) => console.log(`❌ Directory removed: ${path}`))
		.on("error", (error) => console.error(`❗Error: ${error}`));
}

module.exports = { init };
