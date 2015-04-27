var Promise = require('node-promise').Promise,
  common = require("../lib/common"),
  Step = require("step"), 
  _ = require("underscore")
  translate = require("../lib/translate");

var post = {};

var get = {
  "/taxonomy/all": function (req, res) {
    var sql = "SELECT distinct t.tid, t.*, GROUP_CONCAT(p.pid) as pids FROM taxonomies t " + 
      " LEFT JOIN product_taxo pt ON pt.tid = t.tid " + 
      " LEFT JOIN products p ON pt.pid = p.pid " + 
      " GROUP BY t.tid";
    Step(function() {
      var group = this.group();
      mysql.getConnection(function(err, connection) {
        if (err) {
          res.ejson(err);
        }
        else {
          connection.query(sql, function(err, rows) {
            if (err) {
              res.ejson(err);
              return;
            }
            connection.end();
            var pids = [];
            _.each(rows, function(row, index) {
              if (!_.isNull(row["pids"])) {
                rows[index]["pids"] = row["pids"].split(",");
              }
              else {
                rows[index]["pids"] = [];
              }
              pids = _.union(pids, rows[index]["pids"]);
            });
            var locale = common.getValue(req.query.locale);
            if (_.keys(req.body).length  > 0) {
              locale = common.getValue(req.body.locale);
            }
            // translate taxonomies
            var taxonomiesTranslate = translate('taxonomies', locale);
            if (taxonomiesTranslate) {
             taxonomiesTranslate.translate(rows, function (err, data) {
               //console.log(data);
             });
            }
            common.loadRouter("product").loadProducts(pids, req,function (err, products) {
              if (err) {
                req.ejson(err);
              }
              else {
                _.each(rows, function(taxonomy,index) {
                  rows[index]["products"] = [];
                  var pids = taxonomy["pids"];
                  _.each(pids, function (pid) {
                    _.each(products, function (product) {
                      if (product["pid"] == pid) {
                        rows[index]['products'].push(product);
                      }
                    });
                  });
                  delete rows[index]["pids"];
                });
                res.fjson(rows);
              }

            });
          });
        }
      });
    });
  }
};

module.exports = {
  post: function () {
    return _.extend(post, get);
  },
  get: function () {
    return get;
  }
}