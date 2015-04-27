var _ = require("underscore"),
	Step = require("step");
var mapping = {
	stores: {
		key: "sid"
	},
  taxonomies: {
    key: "tid"
  },
  products: {
    key: "pid",
  },
  coupons: {
    key: "cid"
  },
  product_facts: {
    key: "pfid"
  },
  sub_of_the_day: {
    key: "sid"
  },
  promotions: {
  	key: "poid"
  }
}

function whichIsPrimaryKey(tablename) {
	return _.isUndefined(mapping[tablename]) ? false : mapping[tablename]['key']; 
}
function getPrimaryValue(tablename, key, data) {
  if (!_.isUndefined(data[key])) {
    return data[key];
  }
  else if (!_.isUndefined(data[tablename + "_" + key])) {
    return data[tablename + "_" + key];
  }
}

module.exports = function (tablename, locale) {
	// First check locale is supported or not
	var allowed_locale = ["cn"];
	var translate_table = "tr_" + tablename;
	if (_.indexOf(allowed_locale, locale) == -1) {
		return false;
	}
	else {
		return {
      getPrimaryValue: function (data) {
        var args = [tablename, this.whichIsPrimaryKey(), data];
        return getPrimaryValue.apply(null, args);
      },
      whichIsPrimaryKey: function () {
        return whichIsPrimaryKey(tablename);
      },
			translate: function (data, fields, cb) {
				var translateSingle = !_.isArray(data);
				var sourceData = !translateSingle ? data: [data];
				var key = whichIsPrimaryKey(tablename);
        if (_.isUndefined(cb)) {
          cb = fields;
          fields = [];
        }
				if (!key) {
					cb("missed primary key");
          return;
				}
				var keys = [];
				if (_.isArray(data)) {
					_.each(data, function (item) {
            keys.push(getPrimaryValue(tablename, key, item));
					});
				}
				else {
          keys.push(getPrimaryValue(tablename, key, data));
				}
        if (keys.length == 0) {
          cb(null, data);
          return;
        }
				Step(function () {
					var parallel = this.parallel();
					mysql.getConnection(function(err, connection) {
						if (err) {
							parallel(err, null);
						}
						var sql = "SELECT * FROM "+translate_table+" WHERE locale = ? AND "+key+" in (?)";
						var params = [locale, keys];
						connection.query(sql, params, function (err, rows) {
							if (err) {
								parallel(err, null);
							}
							else {
								parallel(null, rows);
							}
							connection.end();
						});
					});
				}, function (err, rows) {
          if (_.isNull(rows)) rows = [];
					if (rows.length == 0) {
						var retData = translateSingle ? _.first(sourceData) : sourceData;
						cb(err, retData);
					}
					else {
            if (_.isEmpty(fields)) {
              var indexes_source = _.keys(_.first(sourceData));
              var indexes_translation = _.keys(_.first(rows));
              var common_indexes = _.intersection(indexes_translation, indexes_source);
              fields = _.object(common_indexes, common_indexes);
            }

            // Apply translate row to source data.
						_.each(rows, function (translateRow) {
              // fields object : {sourceField: translateField}
              // example: {taxonomies_title: title}
              _.each(fields,function (translateField, sourceField) {
                _.each(sourceData, function (sourceDataItem, index) {
                  if (getPrimaryValue(tablename, key, sourceDataItem) == translateRow[key]) {
                    sourceData[index][sourceField] = translateRow[translateField];
                  }
                });
              })
            });

						var retData = translateSingle ? _.first(sourceData) : sourceData;            
						cb(err, retData);
					}

				});
			}
		}
	}
}