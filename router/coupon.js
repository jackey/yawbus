var Promise = require('node-promise').Promise;
var common = require("../lib/common"),
  Step = require("step"), 
  _ = require("underscore")
  translate = require("../lib/translate"),
  media = require('../lib/media');

function loadCoupons(ids, req, cb) {
  if (!_.isArray(ids) && !_.isNaN(parseInt(ids))) {
    ids = [ids];
  }
  else if (!_.isArray(ids)){
    cb = req;
    req = ids;
    ids = null;
  }

  var locale = common.getValue(req.query["locale"]);
  var screen_size = common.getValue(req.query.screen_size);
  var device_type = common.getValue(req.query.device_type);
  var sdate = common.getValue(req.query.sdate);
  var edate = common.getValue(req.query.edate);
  if (_.keys(req.body).length > 0) {
    locale = common.getValue(req.body.locale);
    screen_size = common.getValue(req.body.screen_size);
    device_type = common.getValue(req.body.device_type);
    sdate = common.getValue(req.body.sdate);
    edate = common.getValue(req.body.edate);
  }
  Step(function () {
  // Query basci coupon
  var parallel = this.parallel();
  mysql.getConnection(function (err, connection) {
    if (err) {
      parallel(err);
    }
    else {
      var sql = "SELECT * FROM coupons WHERE 1 = 1 ";
      var params = [];
      if (ids) {
        sql += " AND cid in (?)";
        params.push(ids);
      }
      if (sdate) {
        sql += " AND sdate >= ?";
        params.push(sdate);
      }
      if (edate) {
        sql += " AND edate <= ?";
        params.push(edate);
      }
      connection.query(sql, params, function (err,rows) {
        parallel(err, rows);
      });
    }
    connection.end();
  });
  }, function (err, coupons) {
    var parallel = this.parallel();
    var couponTranslate = translate("coupons", locale);
    if (couponTranslate) {
      couponTranslate.translate(coupons, {"description": "description"}, function(err, coupons) {
        parallel(err, coupons);
      });
    }
    else {
      parallel(err,coupons);
    }
  },function (err, coupons) {
    // Load coupons media
    var parallel = this.parallel();
    if (err) {
      parallel(err);
    }
    else {
      media("coupons").loadMedia(coupons, {screen_size: screen_size, device_type: device_type}, 
        function(err, couponsWithMedia) {
        if (err) {
          parallel(err, coupons);
        }
        else {
          parallel(null, couponsWithMedia);
        }
      });
    }
  },function (err, coupons) {
    cb(err, coupons);
  });
}

function loadUserCoupons(uid, req, cb) {
  Step(function () {
    var parallel = this.parallel();
    mysql.getConnection(function (err, connection) {
      if (err) {
        parallel(err);
      }
      else {
        var sql = "SELECT * FROM user_coupons WHERE uid = ?";
        connection.query(sql, [uid], function (err, rows) {
          if (err) {
            parallel(err);
          }
          else {
            parallel(null, rows);
          }
          connection.end();
        });
      }
    });
  }, function (err, rows) {
    if (err) {
      cb(err)
    }
    else {
      cb(null, _.first(rows));
    }
  });
}

var post = {

}

var get = {
		"/coupon/all": function (req, res) {
      var uid = common.getValue(req.query.uid);
      if (_.keys(req.body) > 0) {
        uid = common.getValue(req.body.uid);
      }
      if (!uid && req.user) {
        uid = req.user["uid"];
      }
      loadCoupons(req, function (err, coupons) {
        if (err) {
          res.ejson(err);
        }
        else {
          if (uid) {
            loadUserCoupons(uid, req, function (err, userCoupon) {
              _.each(coupons, function (coupon) {
                if (coupon["cid"] == userCoupon["cid"]) {
                  coupon["userstatus"] = userCoupon["status"];
                }
              });
              res.fjson(coupons);
            });
          }
          else {
            res.fjson(coupons);
          }
        }
      });
		},
		"/coupon/:id": function (req, res) {
      var uid = common.getValue(req.query.uid);
      if (_.keys(req.body) > 0) {
        uid = common.getValue(req.body.uid);
      }
      if (!uid && req.user) {
        uid = req.user["uid"];
      }
	   loadCoupons(req.params.id, req, function (err, coupons) {
      if (err) {
        res.ejson(err);
      }
      else {
        if (_.isArray(coupons) && coupons.length > 0) {
          if (uid) {
            loadUserCoupons(uid, req, function (err, userCoupon) {
              if (err){
                res.ejson(err);
              }
              else {
                var coupon = _.first(coupons);
                coupon["userstatus"] = userCoupon["status"];
                res.fjson(coupon);
              }
            });
          }
          else {
            res.fjson(_.first(coupons));  
          }
        }
        else {
          res.ejson("not found coupons");
        }
      }
     });
		},
    "/coupon/:cid/stamp": function (req, res) {
      var uid = common.getValue(req.query.uid);
      if (_.keys(req.body) > 0) {
        uid = common.getValue(req.body.uid);
      }
      if (!uid && req.user) {
        uid = req.user["uid"];
      }

      if (!uid) {
        res.ejson('missed uid');
      }
      else {
        Step(function () {
          mysql.getConnection(function (err, connection) {
            if (err) {
              res.ejson(err);
            }
            else {
              connection.query("UPDATE user_coupons SET status = 'off'  WHERE uid = ? AND cid = ?", [uid, req.params["cid"]], function (err, result) {
                if (err) {
                  res.ejson(err);
                }
                else {
                  res.fjson("success");
                }
                connection.end();
              });
            }
          });
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
	},
  loadCoupons: loadCoupons
};