var common = require("../lib/common"),
  Step = require("step"), 
  _ = require("underscore")
  translate = require("../lib/translate");

function loadEvents(ids, req, cb) {
  if (!_.isArray(ids) && !_.isNull(ids)) {
    ids = [ids];
  }
  var sdate = common.getValue(req.query.sdate);
  var edate = common.getValue(req.query.edate);
  var status = common.getValue(req.query.status);
  if (_.keys(req.body).length > 0) {
    sdate = common.getValue(req.body.sdate);
    edate = common.getValue(req.body.edate);
    status = common.getValue(req.body.status);
  }

  var sql = "SELECT * FROM events e" + 
    " INNER JOIN event_places ep ON e.eid = ep.eid " + 
    " INNER JOIN places p ON p.plid = ep.plid " + 
    " WHERE 1 = 1 ";
  var params = [];
  if (sdate) {
    sql += " AND e.sdate >= ?";
    params.push(sdate);
  }
  if (edate) {
    sql += " AND e.edate <= ?";
    params.push(edate);
  }
  if (status) {
    sql += " AND e.status = ?";
    params.push(status);
  }
  if (ids) {
    sql += " AND e.eid in (?)";
    params.push(ids);
  }
  
  Step(function () {
    mysql.getConnection(function (err, connection) {
      if (err) {
        cb(err)
      }
      else {
        connection.query(sql, params, function (err, rows) {
          connection.end();
          if (err) {
            cb(err);
          }
          else {
            // Load store date from result that from query
            var sids = [];
            _.each(rows, function (row) {
              if (row["sid"]) {
                sids.push(row['sid']);
              }
            });

            if (sids.length > 0) {
              common.loadRouter("store").loadStores(sids, req, function(err, stores) {
                // Attach the stores onto events
                _.each(rows, function (row, index) {
                  _.each(stores, function(store) {
                    if (store["sid"] == row["sid"]) {
                      rows[index]["store"] = store;
                    }
                  });
                  delete rows[index]["zipcode"];
                });

                cb(null, rows);
              });
            }
            else {
              cb(null, rows);
            }
          }
        });
      }
    });
  });
}

var post = {

}

var get = {
  "/event/all": function (req, res) {
    loadEvents(null, req, function (err, rows) {
      if (err) {
        res.ejson(err);
      }
      else {
        res.fjson(rows);
      }
    });
  },
  "/event/:id": function (req, res) {
    var id = req.params["id"];
    if (!_.isUndefined(id)) {
      loadEvents(id, req, function (err, rows) {
        if (err) {
          res.ejson(err);
        }
        else {
          res.fjson(_.first(rows));
        }
      });
    }
  }
}
_.extend(post, get);

module.exports = {
  post: function() {
    return post;
  },
  get: function () {
    return get;
  }
};