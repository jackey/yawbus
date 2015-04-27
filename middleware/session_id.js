var common = require("../lib/common"),
	_ = require('underscore'),
	user = require("../lib/user");

module.exports = function sessionUser() {
	return function sessionUser(req, res, next) {
		var method = req.originalMethod;
		if (method == "GET" && !_.isUndefined(req.query.session_id)) {
			req.session_id = req.query.session_id;
		}
		else if (method == "POST") {
			if (!_.isUndefined(req.body.session_id)) {
				req.session_id = req.body.session_id;
			}
		}
		user.loadUserBySessionId(req.session_id, function(err, data) {
			if (err) {
				common.handleInternalError(err);
				next();
			}
			else {
				req.user = data;
				next();
			}
		});
	}
}