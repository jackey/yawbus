var Promise = require('node-promise').Promise;
var common = require("../lib/common"),
  Step = require("step");
module.exports = {
	// add/update
	post: function() {
		return {

		}
	},
	// query/list/delete
	get: function () {
		return {
			"/meal/all": function (req, res) {
        res.ejson("not supported yet");
			},
			"/meal/:id": function (req, res) {
        res.ejson("not supported yet");
			},
		}
	}
};