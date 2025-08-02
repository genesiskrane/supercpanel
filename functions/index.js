const { projects } = require("../data").getData();

function getProjectIDByHostname(hostname) {
  const project = projects.find((project) =>
    project.domains.includes(hostname)
  );

  if (project) return project.id;
  else return "CPanel";
}

module.exports = { getProjectIDByHostname };
