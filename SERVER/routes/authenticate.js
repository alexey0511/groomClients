var express, router, bodyParser, expressJwt, jwt, secret, bodyParserJson,
        db, success, token, attrs, user, config, env;

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
            //TODO validate req.body.username and req.body.password
            success = function (result) {
                // We are sending the profile inside the token
                if (typeof result === "object" && result.length === 1) {
                    user = {
                        username: result[0].username,
                        role: result[0].role
                    };
                    token = jwt.sign(user, secret, {expiresInMinutes: 60 * 5});
                    res.json({token: token, username: result[0].username, role: result[0].role});
                } else {
                    res.status(401);
                    res.json({message: 'Incorrect credentials'});
                }
            };
            attrs = {username: req.body.username, password: req.body.password};
            req.body.query = attrs;
            db.login(attrs, success);
        });


module.exports = router;



