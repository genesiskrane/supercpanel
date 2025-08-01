const axios = require("axios");

const init = async () => {
  console.log("Initializing Super Cpanel...");

  const projects = require("../data").getData().projects;

  console.log(projects);
};

module.exports = { init };
