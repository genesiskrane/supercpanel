const config = require('../config');

const init = () => {
	// Initialize database connection
	console.log(`Starting ${config.appName} on port ${config.port}`);
};

module.exports = { init };