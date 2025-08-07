const fn = require("../../functions");

const updateDistAfterCommit = (req, res) => {

    console.log(req.body, req.body.html_url);
    fn.uploadRepoDist(gitURL, projectID, subname)
    res.send("Commit endpoint is under construction");
};

module.exports = { updateDistAfterCommit };
