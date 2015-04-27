var common = require("../lib/common"),
  Step = require("step"),
  _ = require('underscore'),
  translate = require('../lib/translate'),
  productFact = require("../lib/product_fact"),
  media = require('../lib/media');

function loadProducts(ids, req, cb) {
	if (!_.isArray(ids) && !_.isNull(ids)) {
		ids = [ids];
	}
	var taxonomy = common.getValue(req.query.taxonomy);
	var locale = common.getValue(req.query.locale);
  var screen_size = common.getValue(req.query.screen_size);
  var device_type = common.getValue(req.query.device_type);
  var highlight = common.getValue(req.query.highlight);
  if (_.keys(req.body).length > 0) {
    taxonomy = common.getValue(req.body.taxonomy);
    locale = common.getValue(req.body.locale);
    screen_size = common.getValue(req.body.screen_size);
    device_type = common.getValue(req.body.device_type);
    highlight = common.getValue(req.body.highlight);
  }
	Step(function () {
		var parallel = this.parallel();
		mysql.getConnection(function (err, connection) {
			if (err) {
				parallel(err);
			}
			else {
				Step(function() {
          var parallelL2 = this.parallel();
          // Load taxonomies.
          var sql = "SELECT * FROM taxonomies WHERE 1 = 1 ";
          var params = [];
          // We support query product with taxonomy title(only english title)
          // and taxonomy id.
          if (_.isNumber(parseInt(taxonomy)) && !_.isNaN(parseInt(taxonomy))) {
            sql += " AND taxonomies.tid = ?";
            params.push(taxonomy);
          }
          else if (_.isString(taxonomy)) {
            sql += " AND taxonomies.title = ?";
            params.push(taxonomy);
          }

          connection.query(sql, params, function (err, taxonomies) {
            if (err) {
              parallelL2(err);
            }
            else {
              // translate taxonomies
              var taxonomiesTranslate = translate('taxonomies', locale);
              if (taxonomiesTranslate) {
               taxonomiesTranslate.translate(taxonomies, function (err, data) {
                 parallelL2(err, data);
               });
              }
              else {
               parallelL2(err, taxonomies);
              }
            }
          });

        }, function (err, taxonomies) {
          var translateHelper = translate('taxonomies', 'cn');
          var tids = [];
          _.each(taxonomies, function(taxonomy) {
            tids.push(translateHelper.getPrimaryValue(taxonomy));
          });
          var params = [tids];
					var sql = "select * " + 
						" from products " +
						//"left join media on media.tableid=products.pid " +
						"left join product_taxo on product_taxo.pid = products.pid " +
						//"left join taxonomies on taxonomies.tid = product_taxo.tid " + 
						//"left join product_facts on product_facts.pid = products.pid " + 
            " WHERE 1 = 1 AND product_taxo.tid in (?)";
          if (_.isArray(ids)) {
            sql += " AND products.pid in (?)";
            params.push(ids);
          }
          var isHightlight = highlight ? highlight.toString().toLowerCase() ==  "true" ? 1 : highlight.toString().toLowerCase() == "false" ? 0 : -1 : -1;

          if (isHightlight != -1) {
            sql += " AND products.highlight = ?";
            params.push(isHightlight);
          }
					connection.query(sql, params, function (err, products) {
						if (err) {
							parallel(err, null);
						}
						else {
              // Attache taxonomies onto products
              _.each(products, function (product, index) {
                products[index]["taxonomies"] = [];
                var tid = product["tid"];
                _.each(taxonomies, function (taxonomy) {
                  if (tid == translateHelper.getPrimaryValue(taxonomy)) {
                    products[index]["taxonomies"].push(taxonomy);
                  }
                });
              });
							parallel(err, products);
						}
						connection.end();
					});
				});
			}
		});
	},function (err, rows) {
		var parallel = this.parallel();
    parallel(err, rows);
    // mysql.getConnection(function(err, connection) {
    //   if (err) {
    //     parallel(err)
    //   }
    //   else {
    //     var translateHelper = translate('sub_of_the_day', 'cn');
    //     var pids = [];
    //     _.each(rows,function (product) {
    //       pids.push(translateHelper.getPrimaryValue(product));
    //     });
    //     if (pids.length) {
    //       connection.query("SELECT * FROM sub_of_the_day WHERE pid in (?)", [pids], function(err, subOfDays) {

    //         function mergeSubOfDayIntoProduct(subOfDays) {
    //             _.each(subOfDays, function (subOfDay) {
    //               var pid = subOfDay["pid"];
    //               _.each(rows, function (product, index) {
    //                 rows[index]["sub_of_the_day"] = [];
    //                 if (translateHelper.getPrimaryValue(product) == pid) {
    //                   rows[index]["is_sub_of_the_day"] = 1;
    //                   rows[index]["sub_of_the_day"].push(subOfDay);
    //                 }
    //               });
    //             });
    //             return rows;
    //         }
    //         // Translate it 
    //         var subOfDayTranslate = translate('sub_of_the_day', locale);
    //         if (subOfDayTranslate) {
    //           subOfDayTranslate.translate(subOfDays, function (err, subOfDays) {
    //             mergeSubOfDayIntoProduct(subOfDays);
    //             parallel(err, rows);
    //           });
    //         }
    //         else {
    //           mergeSubOfDayIntoProduct(subOfDays);
    //         }
    //         connection.end();
    //       });
    //     }
    //     else {
    //       connection.end();
    //       parallel(err, rows);
    //     }
    //   }
    // });
	}, function (err, rows) {
    // Translate products.
		var parallel = this.parallel();
		if (err) {
			parallel(err);
		}
		else {
			var productTranslate = translate("products", locale);
			if (productTranslate) {
				productTranslate.translate(rows, function (err, data) {
					parallel(err, data);
				});
			}
			else {
				parallel(err, rows);
			}
		}
	}, function (err, products) {
    // Load product. media
		var parallel = this.parallel();
    if (err) {
      parallel(err);
    }
    else {
      media("products").loadMedia(products, {screen_size: screen_size, device_type: device_type}, 
        function(err, productsWithMedia) {
        if (err) {
          parallel(err, products);
        }
        else {
          parallel(null, productsWithMedia);
        }
      });
    }
	}, function (err, products) {
    // Load product facet
    var parallel = this.parallel();
    if (err) {
      parallel(err);
    }
    else {
      productFact("products", locale).loadProductFact(products, function(err, data) {
        parallel(err, data);
      });
    }
  }, function (err, rows) {
    cb(err, rows);
	});
}

var post = {};

var get = {
	// Query:
	// screen_size=?&device_type=?
	"/product/all": function (req, res) {
    common.loadRouter("taxonomy")["get"]()["/taxonomy/all"](req, res);
    // loadProducts(null, req, function (err, rows) {
    //   if (err) {
    //     res.ejson(err);
    //   }
    //   else {
    //     res.fjson(rows);
    //   }
    // });
	},
	"/product/:id": function (req, res) {
		loadProducts(req.params['id'], req, function (err, rows) {
      if (err) {
        res.ejson(err);
      }
      else {
        res.fjson(rows.length == 0 ? [] : _.first(rows));
      }
    });
	}
};

module.exports = {
  post: function () {
    return _.extend(post, get);
  },
  get: function () {
    return get;
  },
  loadProducts: loadProducts
}