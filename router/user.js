var Step = require('step'),
	_ = require('underscore'),
	common = require("../lib/common");

var post = {
	"/user/register": function (req, res) {
		var weiboid = common.getValue(req.body.weiboid);
		var name = common.getValue(req.body.name);
		var region = common.getValue(req.body.region);
		if (_.isNull(weiboid) || _.isNull(name)) {
			res.ejson("miss required field");
			return;
		}
		var userUtil = require('../lib/user');
		Step(function () {
			var parallel = this.parallel();
			userUtil.loadBy("name", name,function (err,user) {
				if (_.isNull(user) || _.isUndefined(user)) {
					user = [];
				}
				if (err) {
					parallel(err)
				}
				else {
					if (user.length == 0) {
						parallel(null)
					}
					else {
						parallel("user exist");
					}
				}
			});
		},function (err) {
			var parallel = this.parallel();
			if (err) {
				parallel(err)
			}
			else {
				userUtil.loadBy('weiboid', weiboid, function (err, user) {
					if (_.isNull(user) || _.isUndefined(user)) {
						user = [];
					}
					if (err) {
						parallel(err);
					}
					else {
						if (user.length == 0) {
							parallel();
						}
						else {
							parallel("user exist");
						}
					}
				});
			}
		}, function (err) {
			var parallel = this.parallel();
			if (err) {
				parallel(err);
			}
			else {
				var sql = "INSERT INTO users (weiboid, name, region, session_id) VALUES (?, ?, ? , ?)";
				mysql.getConnection(function (err, connection) {
					var session_id = common.newSessionId();
					if (err) {
						parallel(err);
					}
					else {
						connection.query(sql, [weiboid, name, region, session_id], function (err, result) {
							if (err) {
								parallel(err);
							}
							else  {
								var user = {
									weiboid: weiboid,
									name: name,
									region: region,
									uid: result.insertId
								}
								parallel(null, {data: user, session_id: session_id});
							}
              connection.end();
						});
					}
				});
			}
		}, function (err, user) {
			if (err) {
				res.ejson(err);
			}
			else {
				res.fjson(user);
			}
		});
	}
}

var get = {
	"/user/login": function (req, res) {
		var weiboid = common.getValue(req.query.weiboid);
		if (_.keys(req.body).length > 0) {
			weiboid = common.getValue(req.body.weiboid);
		}
		Step(function() {
    		var parallel = this.parallel();
			mysql.getConnection(function(err, connection) {
				if (err) {
					parallel(err);
				}
				else {
					connection.query("SELECT * FROM users WHERE weiboid = ?", [weiboid], function (err, rows ) {
						if (err) {
							parallel(err);
						}
						else {
							if (rows.length > 0) {
								parallel(null, _.first(rows));
							}
							else {
								parallel(null, []);
							}
						}
						connection.end();
					});
				}
			});
		}, function (err, user) {
			var parallel = this.parallel();
			if (err) {
				res.ejson(err);
			}
			else {
				var session_id = common.newSessionId();
				var data = {
					user: user,
					session_id: session_id
				}
				delete user["session_id"];
				mysql.getConnection(function(err, connection) {
					if (err) {
						parallel(err);
					}
					else {
						connection.query("UPDATE users SET session_id = ? WHERE uid = ?", [session_id, user['uid']], function (err, result) {
							connection.end();

							parallel(err, data);
						});
					}
				});
			}
		}, function (err, data) {
			if (err) {
				res.ejson(err);
			}
			else {
				res.fjson(data);
			}
		});
	},
  "/user/:uid": function (req, res) {
    var uid = req.params['uid'];
    if (!_.isUndefined(uid)) {
      Step(function () {
        var parallel = this.parallel();
        mysql.getConnection(function (err, connection) {
          if (err) {
            parallel(err);
          }
          else {
            connection.query("SELECT * FROM users WHERE uid=?", [uid], function (err, rows) {
              if (err) {
                parallel(err);
              }
              else {
                if (rows.length == 0) {
                  parallel(null, []);
                }
                else {
                  parallel(null, _.first(rows));
                }
              }
              connection.end();
            });
          }
        });
      }, function (err, user) {
        if (err) {
          res.ejson(err);
        }
        else {
          delete user["session_id"];
          res.fjson(user);
        }
      });
    }
    else {
      res.ejson("uid missed");
    }
  },
  '/user/:uid/coupon': function (req, res) {
    var uid = req.params["uid"];
    Step(function () {
      var parallel = this.parallel();
      mysql.getConnection(function (err, connection) {
        if (err) {
          parallel(err);
        }
        else {
          var sql = "SELECT u.*, GROUP_CONCAT(uc.cid) as cids FROM users u " + 
            " LEFT JOIN user_coupons uc ON u.uid = uc.uid WHERE 1=1 ";
          var params = [];
          if (!_.isUndefined(uid)) {
            sql += " AND u.uid = ? ";
            params.push(uid);
          }
          sql += " GROUP BY u.uid";
          connection.query(sql, params, function(err, rows) {
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
    }, function(err, rows) {
      var parallel = this.parallel();
      if (err) {
        parallel(err);
      }
      else {
        if (rows.length == 0) {
          parallel('user not found');
        }
        else {
          var user = _.first(rows);
        }
        // Load coupons of user
        var cids = [];
        _.each(rows, function (row) {
          cids = _.isNull(row['cids']) ? [] : row['cids'].split(",");
        });
        common.loadRouter('coupon').loadCoupons(cids, req, function (err, coupons) {
          if (err) {
            parallel(err);
          }
          else {
            user["coupons"] = coupons;
            delete user["cids"];
            parallel(null, user);
          }
        });
      }
    }, function (err, rows) {
      if (err) {
        res.ejson(err);
      }
      else {
        res.fjson(rows);
      }
    });
  }
}

module.exports = {
	post: function (){
		return _.extend(post, get);
	},
	get: function () {
		return get;
	}
};