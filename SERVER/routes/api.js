var express, router, bodyParser, expressJwt, jwt, bodyParserJson,
        db, config;
express = require('express');
router = express.Router();
bodyParser = require('body-parser');
expressJwt = require('express-jwt');
jwt = require('jsonwebtoken');
bodyParserJson = bodyParser.json();
env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
db = require('../dbService');
config = require('../config.js');
db = new db(config[env]);
router.route('/me')
        .get(bodyParserJson,function (req, res) {
            // get store from JWT and give readable value to the store
            res.json({
                store: req.user.storename,
                role: req.user.role,
                location: req.user.location
            });
        });

router.route('/clients')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("clients", function (result) {
                res.json({data: result, date: new Date().getTime()});
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("clients", req.body, success);
        });
router.route('/clients/:id')
        .post(bodyParserJson, function (req, res) {
            if (req.param("id") === req.body.id.toString()) {
                // get store from JWT and give readable value to the store
                var success = function (data) {
                    data ? res.send(data) : res.status(400).send({message: "Failed retrieve record"});
                };
                db.create("/clients", req.body, success);
            } else {
                console.log("NO", typeof req.param("id"), typeof req.body.id);
            }
        });
router.route('/deleteClients')
        .post(bodyParserJson, function (req, res) {
            db.findRecord("stores", {storename: req.store.storename}, function (store) {
                if (store[0].password === req.body.adminProof) {
                    var success = function (data) {
                        data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
                    };
                    db.deleteRecord("clients", req.body.client._id.$oid, success);
                } else {
                    res.status(403).send(false);
                }
            });

        });
router.route('/products')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("products", function (result) {
                res.json(result);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/products", req.body, success);
        });

router.route('/deleteProducts')
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
            };
            db.deleteRecord("products", req.body._id.$oid, success);
        });
router.route('/staff')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("staff", function (result) {
                res.json(result);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.json(data) : res.status(400).json({message: "Failed to create a record"});
            };
            db.create("/staff", req.body, success);
        });
router.route('/stores')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("stores", function (result) {
                var stores = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    stores.push({storename: result[i].storename,
                        password: '', role: result[i].role, _id: result[i]._id,
                        id: result[i].id, location: result[i].location});
                }
                res.json(stores);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.json(data) : res.status(400).json({message: "Failed to create a record"});
            };
            db.create("/stores", req.body, success);
        });
router.route('/deletestores')
        .post(bodyParserJson, function (req, res) {
            db.findRecord("stores", {storename: req.store.storename}, function (store) {
                if (store[0].password === req.body.adminProof) {
                    var success = function (data) {
                        data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
                    };
                    db.deleteRecord("stores", req.body.store._id.$oid, success);
                } else {
                    res.status(403).send(false);
                }
            });
        });
router.route('/orders')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("orders", function (result) {
                res.json(result);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/orders", req.body, success);
        });
// VISITS
router.route('/getDeletedVisits')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("deletedVisits", function (result) {
                res.json(result);
            });
        });
router.route('/restoreVisit')
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to restore visit"});
            };
            db.create("/haircuts", req.body, success);
        });
router.route('/visits')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("haircuts", function (result) {
                res.json(result);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get store from JWT and give readable value to the store
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/haircuts", req.body, success);
        });
router.route('/visit/:id')
        .post(bodyParserJson, function (req, res) {
            if (req.param("id") === req.body.id.toString()) {
                // get store from JWT and give readable value to the store
                var success = function (data) {
                    data ? res.send(data) : res.status(400).send({message: "Failed retrieve record"});
                };
                db.create("/haircuts", req.body, success);
            } else {
                console.log("NO", typeof req.param("id"), typeof req.body.id);
            }
        });
router.route('/visits/:id')
        .get(function (req, res) {
            // get store from JWT and give readable value to the store
            db.getAll("haircuts", function (result) {
                var visits = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    if (result[i].client.id === req.param("id")) {
                        visits.push(result[i]);
                    }
                }
                res.send(visits);
            });
        });
router.route('/deleteVisit')
        .post(bodyParserJson, function (req, res) {
            var success = function (data) {
                data ? res.send(data) : res.status(403).send({message: "Failed.."});
            };
            db.create('deletedVisits', req.body, function () {
                db.findRecord("haircuts", {id: req.body.id}, function (data) {
                    if (data.length === 1) {
                        db.deleteRecord("haircuts", data[0]._id.$oid, success);
                    } else {
                        res.status(403).send({message: "Failed.."});
                    }
                });
            });
        });
router.route('/removeLatestPurchase')
        .post(bodyParserJson, function (req, res) {
            var audit = {
                url: req.url,
                method: req.method,
                store: req.store,
                body: req.body
            };
            db.create("audit", audit, function () {
            });

            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
            };
            db.findRecord("haircuts", {client: req.body.client}, function (data) {
                if (Array.isArray(data)) {
                    var lastVisit = data.pop();
                }
                var success = function (data) {
                    data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
                };

                db.deleteRecord("haircuts", lastVisit._id.$oid, success);
            });
        });
// potentially replace with update
module.exports = router;



