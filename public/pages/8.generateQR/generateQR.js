'use strict';

angular.module('myApp.generateQR', ['ngRoute','myApp.constants'])

        .config(['$routeProvider','USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/generateQR', {
                    templateUrl: 'pages/8.generateQR/generateQR.html',
                    controller: 'GenerateQRController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('GenerateQRController', function ($scope, DEFAULT_SETTINGS) {
            $scope.init = function() {
            $scope.storeId = DEFAULT_SETTINGS.storeId;
            $scope.startFrom = "100";
            $scope.codes = [];
            };
            
            $scope.generateCodes = function () {
                for (var i = 0; i < 28; i++) {
                    var a = '';
                    a = "38" + $scope.storeId + $scope.startFrom + i;
                    $scope.codes.push(a);
                }
            };
            $scope.init();
        }); // end of controller
