const data = require("./data.json");

function getData() {
  return data;
}

function getAllowedHosts() {
  let allowedHosts = ["localhost:3000"];

  data.projects.forEach((project) => {
    allowedHosts.push(...project.domains);
  });

  console.log(allowedHosts);

  return allowedHosts;
}
module.exports = { getData, getAllowedHosts };
