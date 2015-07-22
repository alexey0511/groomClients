'use strict';

angular.module('myApp.txting', ['ngRoute','myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/message', {
                    templateUrl: 'pages/9.txtClients/txtClients.html',
                    controller: 'TxtClientsController',
                    data: {authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('TxtClientsController', function ($scope, $rootScope, $http, msgService, clientsService, DEFAULT_SETTINGS) {
            var clientIndex, lastVisitDateTemp;
            $scope.init = function () {
                $scope.lastVisitDate = new Date().setDate(new Date().getDate() - DEFAULT_SETTINGS.productExpiration);
                lastVisitDateTemp = new Date($scope.lastVisitDate);

                $scope.checkClients().then(
                        function () {
                            $scope.totalDue();
                        },
                        function () {
                            $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't add the product"});
                        });
            };
            $scope.totalDue = function () {
                $scope.clientListDue = [];
                for (var i = 0, l = $scope.clientList.length; i < l; i++) {
                    if (new Date($scope.clientList[i].lastVisit) < lastVisitDateTemp) {
                        $scope.clientListDue.push($scope.clientList[i]);
                    }
                }
                return $scope.clientListDue.length;
            };
            $scope.checkStatusTxt = function (id) {
                clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                if ((clientIndex || clientIndex === 0)
                        && $scope.clientList[clientIndex].notification
                        && $scope.clientList[clientIndex].notification.msgId
                        ) {
                    msgService.queryTxtHttp($scope.clientList[clientIndex].notification.msgId)
                            .then(function (status) {
                                $scope.clientList[clientIndex].notification.msgStatus = status;
                            },
                                    function (er) {
                                        $scope.alerts.push({type: 'danger', msg: "Cannot execute your request"});
                                    });
                } else {
                    $scope.alerts.push({type: 'danger', msg: "Cannot execute your request"});
                }
            };

            $scope.sendTxt = function (id) {
                clientIndex = clientsService.findClientIndex(id, $scope.clientList);
                if (clientIndex || clientIndex === 0) {
                    msgService.sendTxtRest($scope.clientList[clientIndex])
                            .then(function (msgId) {
                                $scope.clientList[clientIndex].notification_sent = 'yes';
                                $scope.clientList[clientIndex].notification = {msgId: msgId};
                                $http.post('/api/clients/' + $scope.clientList[clientIndex].id, $scope.clientList[clientIndex])
                                        .success(function (r) {
                                            $scope.alerts.push({type: 'success', msg: "Message has been sent"});
                                        });
                            },
                                    function (error) {
                                        $scope.alerts.push({type: 'danger', msg: "Cannot execute your request"});
                                    });
                } else {
                    $scope.alerts.push({type: 'danger', msg: "Cannot execute your request"});
                }
            };
            $scope.init();
        })
        // SERVICES
        .factory('msgService', function ($http, $q, appConfig, commonFunctions) {
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
                $http.post(queryMsgUrl, postData)
                        .success(function (status) {
                            status = status.substr(status.length - 3);
                            if (status === '004') {
                                status = 'delivered';
                            } else {
                                status = 'pending';
                            }
                            deferred.resolve(status);
                        })
                        .error(function (error) {
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
                    commonFunctions.customAlert("It's testing mode now. Messages go to Alex&Muni only. The format '642XXXXXXXX'");
                    deferred.reject('2');
                } else {
                    // 
                    commonFunctions.customAlert("Sending text to " + person.phone + " ::" + data.text + "::");
                }
                $http.post('/texting/smssendtxt', data).
                        success(function (id) {
                            deferred.resolve(id);
                        })
                        .error(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            };
            return msgService;
        });
