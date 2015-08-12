var express, expressJwt,
        app, secret, port, env,
        authentication, texting, apiRoute, db, config;

env = process.env.NODE_ENV || 'development';
var config = require('./SERVER/config.js');
console.log('Environment: ', env);

express = require("./node_modules/express");
expressJwt = require('./node_modules/express-jwt');


app = express();
secret = "TheAnswerIs42";
app.all('*', function (req, res, next) {
    // TODO : restrict to white list domains
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if ('OPTIONS' == req.method) {
        return res.status(200).send({});
    }
    next();
});
app.use(express.static("./public"));

authentication = require('./SERVER/routes/authenticate');
app.use('/authenticate', authentication);

texting = require('./SERVER/routes/texting');
app.use('/texting', texting);

apiRoute = require('./SERVER/routes/api');
app.use('/api', expressJwt({secret: secret}));
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({error: 'invalid token...'});
    } else {
        console.log(err.name);
        res.status(403).send({error: 'unauthorised access'});

    }
});
app.use('/api', apiRoute);

port = Number(process.env.PORT || 5001);
app.listen(port, function () {
    console.log("Listening on " + port);
});
