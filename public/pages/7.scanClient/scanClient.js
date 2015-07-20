'use strict';

angular.module('myApp.scanClient', ['ngRoute'])

        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                $httpProvider.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $routeProvider.when('/scanClient', {
                    templateUrl: 'pages/7.scanClient/scanClient.html',
                    controller: 'ScanClientController'
                });
            }])
        .controller('ScanClientController', function ($scope, DEFAULT_SETTINGS, $rootScope, $location, DbActionsService, $http, clientsService) {
            $scope.init = function () {
                $scope.scanning = true;
                $http.get('/api/getClients')
                        .success(function (response) {
                            $scope.setPeopleList(response);
                        })
                        .error(function (response) {
                            console.log("error downloading clients");
                        });
                $scope.scanQRAgain();

            };
            $scope.scanQRAgain = function () {
                $scope.scanning = true;
                $('#qrCodeReader').html5_qrcode(function (data) {
                    // do something when code is read
                    console.log("QR code " + data);
                    $scope.addVisitViaQR(data);
                },
                        function (error) {
                            console.log(error);
                        }, function (videoError) {
                }
                );
            };
            $scope.addVisitViaQR = function (qrcode) {
                var client = clientsService.getClientByQrCode(qrcode, $scope.people);
                if (client) {
                    var visit = {};
                    visit = {
                        barber: $scope.currentUser.user,
                        client: client,
                        price: DEFAULT_SETTINGS.defaultPrice,
                        date: new Date(),
                        new : false
                    };
                    $scope.recordVisit(visit);
                    alert("Thank you for visiting Groom Barbers ");
                    $scope.scanning = false;
                } else {
                    alert("No contact found");
                    $scope.stopScan();
                }
            };
            $scope.stopScan = function () {
                $.fn.html5_qrcode_stop();
                $scope.scanning = false;
            };
            ;$scope.init();
        });