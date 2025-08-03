const config = require('../../../../config/stack/d/dotstore');

const init = () => {
	// Initialize database connection
	console.log(`Starting ${config.appName} on port ${config.port}`);
};

module.exports = { init };