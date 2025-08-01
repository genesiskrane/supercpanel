const axios = require("axios");

const { projects, tokens } = require("../data").getData();

const init = async () => {
  console.log("Initializing Super Cpanel...");
  console.log(`Loaded ${projects.length} projects`);

  // Build each project's clients to Google Cloud Storage
  buildClientsToGoogleCloudStorage();
};

function buildClientsToGoogleCloudStorage() {
  for (let project of projects) {
    const { id, clients } = project;

    console.log(id, clients);
  }
}
module.exports = { init };
