'use strict';

angular.module('myApp.scanClient', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/scanClient', {
                    templateUrl: 'pages/7.scanClient/scanClient.html',
                    controller: 'ScanClientController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('ScanClientController', function ($scope, DEFAULT_SETTINGS, clientsService, commonFunctions) {
            $scope.init = function () {
                $scope.scanning = false;

                $scope.checkClients().then(
                        function () {
                        },
                        function () {
                            $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't get client list"});
                        });
                $scope.scanQRAgain();


            };
            $scope.scanQRAgain = function () {
                $scope.scanning = true;
                $('#qrCodeReader').html5_qrcode(function (data) {
                    // do something when code is read
                    console.log("QR code: " + data);
                    $scope.addVisitViaQR(data);
                },
                        function (error) {
                            console.log(error);
                        }, function (videoError) {
                }
                );
            };
            $scope.addVisitViaQR = function (qrcode) {
                var client = clientsService.findClientByQrCode(qrcode, $scope.clientList);
                if (client) {
                    if (clientsService.lastVisitInAnHour(client)) {
                        commonFunctions.customAlert("You've already had a haircut today");
                    } else {
                        var visit = {};
                        visit = {
                            barber: $scope.currentUser.user,
                            client: client,
                            price: DEFAULT_SETTINGS.defaultPrice,
                            date: new Date(),
                            new : false
                        };
                        $scope.recordVisit(visit);
                        commonFunctions.customAlert("Thank you for visiting Groom Barbers ");
                        $scope.scanning = false;
                    }
                } else {
                    $scope.alerts.push({type: 'danger', msg: "No contact found"});
                    $scope.stopScan();
                }
            };
            $scope.stopScan = function () {
//                $.fn.html5_qrcode_stop();
                $scope.scanning = false;
            };
            ;
            $scope.init();
        });