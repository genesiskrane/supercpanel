const config = require('../../../../config/stack/d/dotpro');

const init = () => {
	// Initialize database connection
	console.log(`Starting ${config.appName} on port ${config.port}`);
};

module.exports = { init };