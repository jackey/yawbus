var _ = require("underscore"),
	Step = require("step"),
	common = require('./common'),
	translate = require("./translate");

module.exports =  {
	loadTaxonomy: function (tids, req, cb) {
		var locale = common.getValue(req.query["locale"]);
		if (_.keys(req.body) > 0) {
			locale = common.getValue(req.body.locale);
		}

		Step(function () {
				var parallel = this.parallel();
			mysql.getConnection(function (err, connection) {
				if (err) {
					parallel(err);
				}
				else {
					var sql = "SELECT * FROM taxonomies WHERE tid in (?)";
					connection.query(sql, [tids], function (err, rows) {
						if (err) {
							parallel(err);
						}
						else {
							// translate taxonomies
							var taxonomiesTranslate = translate('taxonomies', locale);
							if (taxonomiesTranslate) {
								taxonomiesTranslate.translate(rows, {title: "title"}, function (err, data) {
									if (err) {
										parallel(err);
									}
									else {
										parallel(null, data);
									}
								});
							}
							else {
								parallel(null, rows);
							}
						}
						connection.end();
					});
				}
			});
		}, function(err, data) {
			cb(err, data);
		});
	},
}
