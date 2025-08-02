const { init } = require("./core");

const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });


// Middlewares
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// WebSocket logic
wss.on("connection", (ws) => {
	console.log("Client connected via WebSocket");

	// Send current directory of this file
	ws.send(
		JSON.stringify({
			type: "server-dir",
			dir: __dirname,
		})
	);

	ws.on("message", (msg) => {
		console.log("Message from client:", msg);
	});
});

const PORT = process.env.PORT || 2001;

(async () => {
	await init();

	server.listen(PORT, () => {
		console.log(`Server Started @ ${PORT}`);
	});
})();
