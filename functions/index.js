const { projects } = require("../data").getData();

function getProjectIDByHostname(hostname) {
  console.log(projects, hostname);

  return "bawell";
}

module.exports = { getProjectIDByHostname };
