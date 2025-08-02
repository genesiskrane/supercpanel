const { projects } = require("../data").getData();

function getProjectIDByHostname(hostname) {
  return (
    projects.find((project) => project.domains.includes(hostname)).id ||
    "CPanel"
  );
}

module.exports = { getProjectIDByHostname };
