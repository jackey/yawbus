var _ = require('underscore'),
	common = require("./common");

_.extend(exports, {
	loadUserBySessionId: function (session_id, cb) {
		mysql.getConnection(function (err, connection) {
			if (err) {
				cb(err);
			}
			else {
				connection.query("SELECT * FROM users WHERE session_id = ?", [session_id], function (err, rows) {
					common.handleInternalError(err);
					if (err) {
						cb(err);
					}
					else {
						cb(null, _.first(rows));
					}
					return connection.end();
				});
			}
		});
	},
	loadBy: function (propery, data, cb) {
		mysql.getConnection(function (err, connection) {
			common.handleInternalError(err);
			if (err) {
				cb(err);
			}
			else {
				var sql = "SELECT * FROM users WHERE "+propery+" = ?";
				connection.query(sql, [data], function (err, rows) {
					if (err) {
						cb(err);
					}
					else {
						cb(null, _.first(rows));
					}

					return connection.end();
				});
			}
		});
	}
});