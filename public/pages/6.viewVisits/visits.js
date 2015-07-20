'use strict';

angular.module('myApp.visits', ['ngRoute'])

        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/visits', {
                    templateUrl: 'pages/6.viewVisits/visits.html',
                    controller: 'VisitsController'
                });
            }])
        .controller('VisitsController', function ($scope, $http) {
            if (!$scope.visits) {
                $http.get('/api/getVisits')
                        .success(function (response) {
                            $scope.visits = response;
                        });
                $scope.dateFrom = new Date();
                $scope.dateTo = new Date();
                $scope.visitsDateFilter = function (visit) {
                    $scope.dateFrom.setHours(0, 0, 0, 0);
                    $scope.dateTo.setHours(23, 59, 59, 999);
                    if (new Date(visit.date) >= $scope.dateFrom && new Date(visit.date) <= $scope.dateTo) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        });