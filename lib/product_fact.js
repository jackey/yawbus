var _ = require("underscore"),
	Step = require("step"),
	translate = require("./translate");

module.exports = function (tablename, locale) {
	return {
		loadProductFact: function (entities, params, cb) {
			if (_.isNull(cb) || _.isUndefined(cb)) {
				cb = params;
				params = {};
			}
			var keys = {};
			var helperRanslate = translate(tablename, "cn");
			_.each(entities, function (entitiy) {
				keys[helperRanslate.getPrimaryValue(entitiy)] = 1;
			});
			keys = _.keys(keys);
			if (keys.length == 0) {
				cb(null, []);
				return;
			}
			Step(function() {
				mysql.getConnection(function (err, connection) {
					if (err) {
						cb(err, entities);
					}
					else {
						connection.query("SELECT * FROM product_facts WHERE pid IN (?)", [keys], function (err, facts) {
							// helper function.
							function mergeProductfactsOntoProducts(facts) {
								_.each(entities, function (entitiy, index) {
									tableTranslate = translate("product_facts", 'cn');
									var productKey = helperRanslate.getPrimaryValue(entitiy);
									entities[index]["product_facts"] = [];
									_.each(facts, function (row) {
										if (productKey == row["pid"]) {
											entities[index]["product_facts"].push(row);
										}
									});
								});
								return entities;
							}

							if (err) {
								cb(err,entities);
							}
							else {
								var tableTranslate = translate("product_facts", locale);
								if (tableTranslate) {
									tableTranslate.translate(facts, {"description": "description"}, function (err, translatedFacts) {
										if (err) {
											cb(err, mergeProductfactsOntoProducts(facts));
										}
										else {
											cb(err, mergeProductfactsOntoProducts(translatedFacts));
										}
									});
								}
								else {
									cb(null, mergeProductfactsOntoProducts(facts));
								}
							}
						});
						connection.end();
					}
				});
			});
		}
	};
}