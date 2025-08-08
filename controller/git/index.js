const fn = require("../../functions");

const { projects } = require("../../data").getData();

const updateDistAfterCommit = (req, res) => {
  const gitURL = req.body.repository.html_url;

  function findProjectByClientGitURL(gitURL) {
    for (const project of projects) {
      for (const clientObj of project.clients) {
        for (const [subname, clientURL] of Object.entries(clientObj)) {
          if (clientURL === gitURL) {
            return { project, subname };
          }
        }
      }
    }
    return null;
  }

  const { project, subname } = findProjectByClientGitURL(gitURL);

  fn.uploadRepoDist(gitURL, project.id, subname);

  res.send("Building Public Dist for Client");
};

module.exports = { updateDistAfterCommit };
