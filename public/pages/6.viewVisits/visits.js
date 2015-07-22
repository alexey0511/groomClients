'use strict';

angular.module('myApp.visits', ['ngRoute','myApp.constants'])

        .config(['$routeProvider','USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/visits', {
                    templateUrl: 'pages/6.viewVisits/visits.html',
                    controller: 'VisitsController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('VisitsController', function ($scope, $http) {
            $scope.init = function () {
                $scope.dateFrom = new Date();
                $scope.dateTo = new Date();

                $scope.checkPurchases().then(null,
                        function () {
                            $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load list of purchases"});
                        });
            };

            $scope.visitsDateFilter = function (visit) {
                $scope.dateFrom.setHours(0, 0, 0, 0);
                $scope.dateTo.setHours(23, 59, 59, 999);
                if (new Date(visit.date) >= $scope.dateFrom && new Date(visit.date) <= $scope.dateTo) {
                    return true;
                } else {
                    return false;
                }
            };

            $scope.init();
        });