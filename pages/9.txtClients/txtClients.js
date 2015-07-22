'use strict';

angular.module('myApp.txting', ['ngRoute'])

        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                $httpProvider.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $routeProvider.when('/message', {
                    templateUrl: 'pages/9.txtClients/txtClients.html',
                    controller: 'TxtClientsController'
                });
            }])
        .controller('TxtClientsController', function ($scope, $rootScope, $http, msgService, clientsService, DEFAULT_SETTINGS) {
            var clientIndex, lastVisitDateTemp;

            $http.get('/api/getClients')
                    .success(function (response) {
                        $scope.setPeopleList(response);
                        $scope.totalDue();
                    });
            $scope.lastVisitDate = new Date().setDate(new Date().getDate() - DEFAULT_SETTINGS.productExpiration);
            lastVisitDateTemp = new Date($scope.lastVisitDate);
            $scope.totalDue = function () {
                $scope.peopleDue = [];
                for (var i = 0, l = $scope.people.length; i < l; i++) {
                    if (new Date($scope.people[i].lastVisit) < lastVisitDateTemp) {
                        $scope.peopleDue.push($scope.people[i]);
                    }
                }
                return $scope.peopleDue.length;
            };

            $scope.checkStatusTxt = function (id) {
                clientIndex = clientsService.findClientIndex(id, $scope.people);
                if ((clientIndex || clientIndex === 0) 
                        && $scope.people[clientIndex].notification
                        && $scope.people[clientIndex].notification.msgId
                        ) {
                    msgService.queryTxtHttp($scope.people[clientIndex].notification.msgId)
                            .then(function (status) {
                                $scope.people[clientIndex].notification.msgStatus = status;
                            },
                            function(er) {
                            $scope.people = er;
                        
                            });
                }
                else {
                            $scope.people = "no if";
                    console.log("cannot find client index");
                }
            };

            $scope.sendTxt = function (id) {
                clientIndex = clientsService.findClientIndex(id, $scope.people);
                if (clientIndex || clientIndex === 0) {
                    msgService.sendTxtRest($scope.people[clientIndex])
                            .then(function (msgId) {
                                $scope.people[clientIndex].notification_sent = 'yes';
                                $scope.people[clientIndex].notification = {msgId: msgId};
                                $http.post('/api/clients/' + $scope.people[clientIndex].id, $scope.people[clientIndex])
                                        .success(function (r) {
                                            console.log("Update successfull");
                                        });
                            },
                                    function (error) {
                                        console.log(error);
                                    });
                } else {
                    console.log("No clientIndex");
                }
            };
        })
        // SERVICES
        .factory('msgService', function ($http, $q, appConfig, DbActionsService) {
            var msgService = {};
            msgService.validatePhoneNumberData = function (to) {
                var regex = new RegExp('^(642)[0-9]{8}$');
                if (!regex.test(to)) {
                    alert("Wrong format of phone number. (e.g. '642xxxxxxxx'");
                    return false;
                } else {
                    return true;
                }
            };

            msgService.queryTxtHttp = function (msgId) {
                var deferred = $q.defer();
                var queryMsgUrl = 'texting/smsquery';
                msgId = msgId.substr(4);
                var postData = {
                    "me": appConfig.MsgSvcUser,
                    "pwd": appConfig.MsgSvcPwd,
                    "apiId": appConfig.MsgSvcApiId,
                    "msgId": msgId
                };
                //action
                console.log("before post");
                $http.post(queryMsgUrl, postData)
                        .success(function (status) {
                            console.log('status');
                            status = status.substr(status.length - 3);
                            if (status === '004') {
                                status = 'delivered';
                            } else {
                                status = 'pending';
                            }
                            deferred.resolve(status);
                        })
                        .error(function (error) {
                            console.log(error);
                            deferred.reject(error);
                        });
                return deferred.promise;
            };

            // REST function might be redundant
            msgService.sendTxtRest = function (person) {
                var deferred = $q.defer();
                var data = {
                    "text": "Test Message",
                    "to": "64212457399",
                    "me": appConfig.MsgSvcUser,
                    "pwd": appConfig.MsgSvcPwd,
                    "apiId": appConfig.MsgSvcApiId
                };
                data.text = prompt("Please enter txt message", "Hi " + person.firstName);
                if (data.text) {
                    data.text = "Hi " + person.firstName;
                }
                // validation
                // validate number
                data.to = person.phone;
                if (!msgService.validatePhoneNumberData(person.phone)) {
                    deferred.reject('1');
                }
                if (person.phone != '64225051187' && person.phone != '64220998780') {
                    alert("It's testing mode now. Messages go to Alex&Muni only. The format '642XXXXXXXX'");
                    deferred.reject('2');
                } else {
                    console.log("Sending text to " + person.phone + " ::" + data.text + "::");
                }
                $http.post('/texting/smssendtxt', data).
                        success(function (id) {
                            console.log("Success", id);
                            deferred.resolve(id);
                        })
                        .error(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            };

            //            msgService.sendTxtHttp = function (person) {
            //                var deferred = $q.defer();
            //                var text;
            //                text = prompt("HTTP: Please enter txt message", "Hi " + person.firstName);
            //                if (text) {
            //                    text = "Hi " + person.firstName;
            //                }
            //                // validation
            //                // validate number
            //                if (!msgService.validateData(person.phone)) {
            //                    return;
            //                }
            //                if (person.phone != '64225051187' && person.phone != '64220998780') {
            //                    alert("It's testing mode now. Messages go to Alex&Muni only. The format '642XXXXXXXX'");
            //                    return;
            //                } else {
            //                    alert("Sending text to " + person.phone + " ::" + text + "::");
            //                }
            //                var url = appConfig.MsgSvcWebsite + "?user=" + appConfig.MsgSvcUser +
            //                        "&password=" + appConfig.MsgSvcPwd +
            //                        "&api_id=" + appConfig.MsgSvcApiId +
            //                        "&to=" + person.phone + "&text=" + text;
            //                $http.get(url).success(function (msgId) {
            //
            //                    person.notification = {
            //                        "msgId": msgId.substring(4)
            //                    }
            //                    DbActionsService.update('clients', person._id, person)
            //                    deferred.resolve(msgId);
            //                });
            //                return deferred.promise;
            //            };
            return msgService;
        })
