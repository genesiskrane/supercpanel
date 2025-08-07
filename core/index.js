const { projects } = require("../data").getData();

const fn = require("../functions");

const init = async (app) => {
  console.log("🧠 Initializing Super Cpanel...");

  app.listen(process.env.PORT || 3000, async () => {
    console.log("🚀 Super Express App listening on port 3000");

    console.log(`📊 Loaded ${projects.length} projects`);
    console.info(`📡 Syncing project clients to Google Cloud Storage...`);

    await fn.buildClientsToGoogleCloudStorage();

    console.log("🏁 Super Cpanel initialization complete.");
  });
};

module.exports = { init };
