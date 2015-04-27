var Step = require('step'),
	_ = require('underscore'),
	common = require("../lib/common"),
	translate = require('../lib/translate');

function loadStores(sids, req, cb) {
  if (!_.isArray(sids) && !_.isNull(sids)) {
    sids = [sids];
  }
  var locale = req.query.locale;
  var lon = req.query.lon;
  var lat = req.query.lat;
  var order = common.getValue(req.query.order);
  var orderby = common.getValue(req.query.orderby);
  var radius = req.query.radius;
  if (_.keys(req.body).length > 0) {
    locale = req.body.locale;
    lon = req.body.lon;
    lat = req.body.lat;
    radius = req.body.radius;
    order = common.getValue(req.body.order);
    orderby = common.getValue(req.body.orderby);
  }
  Step(function getConnection() {
    mysql.getConnection(this.parallel());
  }, function (err, connection) {
    var step = this;
    if (err) {
      res.fjson(err, 500);
    }
    else {
      var sql = "SELECT * FROM stores WHERE 1 = 1 ";
      var params = [];
      if (sids) {
        sql += " AND sid in (?)";
        params.push(sids);
      }
      connection.query(sql, params, function (err, rows) {
        if (err) {
          cb(err);
        }
        else {
          if (lon && lat) {
            _.each(rows, function (row, index) {
              var d = common.coordinateDistinct({lat: row["latitude"], lon: row["longitude"]}, {lat: lat, lon: lon});
              rows[index]['distance'] = d;
            });
          }
          if (lon && lat && radius) {
            var matched_radius_rows = [];
            _.each(rows, function (row) {
              var d = row["distance"];
              if (!_.isNaN(d) && d <= radius) {
                matched_radius_rows.push(row);
              }
            });
            var parallel = step.parallel();
            parallel(null, matched_radius_rows);
          }
          else {
            var parallel = step.parallel();
            parallel(null, rows);
          }
        }
        connection.end();
      });
    }
  }, function (err, rows) {
    var step = this;
    var parallel = step.parallel();
    if (err) {
      parallel(err);
      return ;
    }
    // If need to be translate
    var storeTranslate = translate("stores", locale);
    if (locale && storeTranslate) {
        storeTranslate.translate(rows, {"city": "city", "address": "address", "region": "region"}, function (err, rows) {
          parallel(err, rows);
        });
    }
    else {
      parallel(null, rows);
    }
  }, function (err, rows) {
    if (err) {
      cb(err);
    }
    else {
      if (!order) {
        order = "ASC";
      }
      if (!orderby) {
        orderby = "distance";
      }
      if (orderby == "distance" && lat && lon) {
        rows = rows.sort(function(row1, row2) {
          if (order == "ASC") {
            return row1["distance"] - row2["distance"];
          }
          else {
            return row2["distance"] - row1["distance"];
          }
        });
      }
      cb(null, rows);
    }
  });
}

var post  = {

};

var get = {
  "/store/all": function (req, res) {
    loadStores(null, req, function (err, rows) {
      if (err) {
        res.fjson(err, 500);
      }
      else {
        res.fjson(rows);
      }
    });
  },
  "/store/:id": function (req, res)  {
    var sid = req.params.id;
    var locale = req.query.locale;
    if (req.body) {
      locale = req.body.locale;
    }
    Step(function (){
      mysql.getConnection(this.parallel());
    }, function (err, connection) {
      if (err) {
        res.fjson(err, 500);
      }
      else {
        connection.query("SELECT * FROM stores WHERE sid = ?", [sid], function (err, rows) {
          if (err) {
            res.fjson(err, 500);
          }
          else {
            var data = _.first(rows);
            if (!data) {
              res.fjson(data);
            }
            else {
              var storeTranslate = translate('stores', locale);
              if (locale && storeTranslate) {
                storeTranslate.translate(rows, {"city": "city", "address": "address", "region": "region"}, function (err, data) {
                  if (err) {
                    res.fjson(err, 500);
                  }
                  else {
                    res.fjson(_.first(data));
                  }
                });
              }
              else {
                res.fjson(_.first(rows));
              }
            }
          }
          connection.end();
        });
      }
    });
  },
};

module.exports = {
  post: function () {
    return _.extend(post, get);
  },
  get: function () {
    return get;
  },
  loadStores: loadStores
}