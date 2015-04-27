var common = require("../lib/common"),
  Step = require("step"), 
  _ = require("underscore");

var get = {
  "/token/register/:md5": function (req, res) {
    var timestamp = req.query.timestamp;
    res.fjson(timestamp);
  }
}

var post = {

}

module.exports = {
  post: function () {
    return _.extend(post, get);
  },
  get: function () {
    return get;
  }
}