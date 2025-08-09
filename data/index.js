const data = require("./data.json");

function getData() {
  return data;
}

function getAllowedHosts() {
  let allowedHosts = [
    "supercpanel.nw.r.appspot.com",
    "localhost:3000",
    "localhost",
  ];

  data.projects.forEach((project) => {
    allowedHosts.push(...project.domains);
  });

  console.log(allowedHosts);

  return allowedHosts;
}
module.exports = { getData, getAllowedHosts };
