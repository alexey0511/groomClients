'use strict';

angular.module('myApp.generateQR', ['ngRoute'])

        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                $routeProvider.when('/generateQR', {
                    templateUrl: 'pages/8.generateQR/generateQR.html',
                    controller: 'GenerateQRController'
                });
            }])
        .controller('GenerateQRController', function ($scope, DEFAULT_SETTINGS) {
            $scope.storeId = DEFAULT_SETTINGS.storeId;
            $scope.startFrom = "100";
            $scope.codes = [];
            $scope.generateCodes = function () {
                for (var i = 0; i < 28; i++) {
                    var a = '';
                    a = "38" + $scope.storeId + $scope.startFrom + i;
                    $scope.codes.push(a);
                }
            };
        }); // end of controller
