const fn = require("../../functions");

const updateDistAfterCommit = (req, res) => {
  console.log(req.body, req.body.repository.html_url);

  let gitURL = req.body.repository.html_url;
  fn.uploadRepoDist(gitURL, projectID, subname);
  res.send("Commit endpoint is under construction");
};

module.exports = { updateDistAfterCommit };
