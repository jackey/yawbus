var Promise = require('node-promise').Promise;
var common = require("../lib/common"),
  Step = require("step"), 
  _ = require("underscore")
  translate = require("../lib/translate"),
  media = require('../lib/media'),
  taxonomy = require('../lib/taxonomy');

function loadPromotion(pids, req, cb) {
    if (!_.isFunction(cb)) {
        cb = req;
        req = pids;
        pids = null;
    }
    else if (!_.isArray(pids) && _.isFunction(cb)) {
        pids = [pids];
    }
    var locale = common.getValue(req.query["locale"]);
    var sdate = common.getValue(req.query.sdate);
    var edate = common.getValue(req.query.edate);
    if (_.keys(req.body).length > 0) {
        locale = common.getValue(req.body.locale);
        sdate = common.getValue(req.body.sdate);
        edate = common.getValue(req.body.edate);
    }
    Step(function () {
        var parallel = this.parallel();
        mysql.getConnection(function(err, connection) {
            var sql = "SELECT * FROM promotions WHERE 1=1 ";
            var params = [];
            if (sdate) {
                sql += " AND sdate >= ? ";
                params.push(sdate);
            }
            if (edate) {
                sql += "  AND edate <= ? ";
                params.push(edate);
            }
            if (pids) {
                sql += " AND poid in  (?) ";
                params.push(pids);
            }
            connection.query(sql, params, function (err, rows) {
                if (err) {
                    parallel(err);
                }
                else {
                    var tids = [];
                    _.each(rows, function (row) {
                        tids.push(row['tid']);
                    });
                    taxonomy.loadTaxonomy(tids, req, function (err, taxonomies) {
                        if (err) {
                            parallel(err);
                        }
                        else {
                            _.each(rows,function (row, index) {
                                _.each(taxonomies, function(taxonomy) {
                                    if (row["tid"] == taxonomy["tid"]) {
                                        rows[index]["taxonomy"] = taxonomy;
                                    }
                                });
                                delete rows[index]["tid"];
                            });
                            parallel(null, rows);
                        }
                    });
                }
                connection.end();
            });
        });
    },function(err, rows) {
        var parallel = this.parallel();
        if (err) {
            parallel(err);
        }
        else {
            var locale = common.getValue(req.query["locale"]);
            if (_.keys(req.body).length > 0) {
                locale = common.getValue(req.body.locale);
            }
            var promotionTranslate = translate("promotions", locale);
            if (promotionTranslate) {
                promotionTranslate.translate(rows, {description: "description"}, function (err, rows) {
                    if (err) {
                        parallel(err);
                    }
                    else {
                        parallel(null, rows);
                    }
                });
            }
            else {
                parallel(err, rows)
            }
        }

    }, function (err, rows) {
        cb(err, rows);
    });
}


var post = {

};

var get = {
	"/promotion/all": function (req, res) {
        loadPromotion(req, function (err, rows) {
            if (err) {
                res.ejson(err);
            }
            else {
                res.fjson(rows);
            }
        });
	},
	"/promotion/:id": function (req, res) {
		loadPromotion(req.params["id"], req, function(err, rows) {
            if (err) {
                res.ejson(err);
            }
            else {
                var promotion = _.first(rows);
                if (promotion) {
                    res.fjson(promotion);
                }
                else {
                    res.ejson("not found promotion");
                }
            }
        });
	}
};

_.extend(post, get);
module.exports = {
	post: function() {
		return post;
	},
	get: function () {
		return get;
	},
};