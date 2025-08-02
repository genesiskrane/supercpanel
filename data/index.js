const data = require("./data.json");

function getData() {
  return data;
}

function getAllowedHosts() {
  let allowedHosts = [];

  data.projects.forEach((project) => {
    allowedHosts.push(...project.domains);
  });

  console.log(allowedHosts);
  
  return allowedHosts;
}
module.exports = { getData, getAllowedHosts };
