var _ = require("underscore"),
	Step = require("step"),
	translate = require("./translate");

module.exports = function (tablename) {
	var tableTranslate = translate(tablename, 'cn');
	return {
		loadMedia: function (entities, query, cb) {
			if (_.isNull(cb) || _.isUndefined(cb)) {
				cb = query;
				query = {};
			}
			var keys = {};
			_.each(entities, function (entitiy) {
				keys[tableTranslate.getPrimaryValue(entitiy)] = 1;
			});
			keys = _.keys(keys);
			if (keys.length == 0) {
				cb(null, []);
				return;
			}
			var sql = "SELECT * FROM media WHERE tablename=? AND tableid in (?)";
			var params = [tablename, keys];
			if (!_.isEmpty(query["screen_size"])) {
				params.push(query["screen_size"]);
				sql += " AND screen_size = ?";
			}
			if (!_.isEmpty(query["device_type"])) {
				params.push(query["device_type"]);
				sql += " AND device_type = ?";
			}
			mysql.getConnection(function (err, connection) {
				connection.query(sql, params, function (err, rows) {

					if (err) {
						cb(err, entities);
					}
					else {
						_.each(entities, function (entitiy, index) {
							entities[index]["media"] = [];
							_.each(rows, function (media, mIndex) {
								if (media["tableid"] == tableTranslate.getPrimaryValue(entitiy)) {
									media["path"] = subway.config["fileServer"] + media["path"];
									entities[index]["media"].push(media);
								}
								// Extrac basename from file path
								rows[mIndex]["filename"] = require('path').basename(media["path"]);
							});
						});
						cb(err, entities);
					}
					connection.end();
				});
			});
		}
	};
}