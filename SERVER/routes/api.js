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
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            res.json({
                user: req.user.username,
                role: req.user.role
            });
        })
router.route('/getClients')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("clients", function (result) {
                res.json(result);
            });
        });
router.route('/clients')
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("clients", req.body, success);
        });
router.route('/clients/:id')
        .post(bodyParserJson, function (req, res) {
            if (req.param("id") === req.body.id.toString()) {
                console.log("YES");
                // get user from JWT and give readable value to the user
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
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
            };
            console.log(req.body);
            db.deleteRecord("clients", req.body._id.$oid, success);
        })

router.route('/getProducts')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("products", function (result) {
                res.json(result);
            });
        });
router.route('/products')
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/products", req.body, success);
        })
router.route('/deleteProducts')
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
            };
            console.log(req.body);
            db.deleteRecord("products", req.body._id.$oid, success);
        })

router.route('/getUserList')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("users", function (result) {
                var users = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    users.push(result[i].username);
                }
                res.json(users);
            });
        });
router.route('/getUsers')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("users", function (result) {
                var users = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    users.push({username: result[i].username,
                        password: '*******', role: result[i].role, _id: result[i]._id, id: result[i].id});
                }
                res.json(users);
            });
        });
router.route('/users')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("users", function (result) {
                var users = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    users.push({username: result[i].username,
                        password: '*******', role: result[i].role, _id: result[i]._id, id: result[i].id});
                }
                res.json(users);
            });
        })
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/users", req.body, success);
        });
router.route('/deleteUsers')
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to delete a record"});
            };
            console.log('delete', req.body);
            db.deleteRecord("users", req.body._id.$oid, success);
        })
// VISITS
router.route('/getVisits')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
            db.getAll("haircuts", function (result) {
                res.json(result);
            });
        });
router.route('/visits')
        .post(bodyParserJson, function (req, res) {
            // get user from JWT and give readable value to the user
            var success = function (data) {
                data ? res.send(data) : res.status(400).send({message: "Failed to create a record"});
            };
            db.create("/haircuts", req.body, success);
        });
router.route('/visits/:id')
        .get(function (req, res) {
            // get user from JWT and give readable value to the user
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

// potentially replace with update
module.exports = router;



