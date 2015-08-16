var express, router, bodyParser, expressJwt, jwt, secret, bodyParserJson,
        db, success, token, attrs, store, config, env;

express = require('express');
router = express.Router();
bodyParser = require('body-parser');
expressJwt = require('express-jwt');
jwt = require('jsonwebtoken');
//db = require('../dbService');
secret = "TheAnswerIs42";
bodyParserJson = bodyParser.json();
env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

config = require('../config.js');
db = require('../dbService');
db = new db(config[env]);

router.route('/')
        .get(function (req, res) {
            res.send("Please submit credentials via POST request");
        })
        .post(bodyParserJson, function (req, res) {
            //TODO validate req.body.storename and req.body.password
            success = function (result) {
                // We are sending the profile inside the token
                if (typeof result === "object" && result.length === 1) {
                    store = {
                        storename: result[0].storename,
                        role: result[0].role,
                        location:result[0].location
                    };
                    token = jwt.sign(store, secret, {expiresInMinutes: 60 * 60 * 10});
                    res.json({token: token, storename: result[0].storename, role: result[0].role});
                } else {
                    res.status(401);
                    res.json({message: 'Incorrect credentials'});
                }
            };
            attrs = {storename: req.body.storename, password: req.body.password};
            req.body.query = attrs;
            db.login(attrs, success);
        });


module.exports = router;



