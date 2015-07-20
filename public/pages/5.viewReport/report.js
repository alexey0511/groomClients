'use strict';

angular.module('myApp.report', ['ngRoute'])

        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/report', {
                    templateUrl: 'pages/5.viewReport/report.html',
                    controller: 'ReportController'
                });
            }])
        .controller('ReportController', function ($scope, $http) {
            $scope.checkUsers();
            $scope.today = {};
            $scope.today.date = new Date();
            $scope.today.year = $scope.today.date.getFullYear();
            $scope.today.month = $scope.today.date.getMonth() + 1;
            $scope.today.day = $scope.today.date.getDate();
            $scope.stats = {};
            $scope.stats.acToday = 0;
            $scope.stats.acWeek = 0;
            $scope.stats.acMonth = 0;
            $scope.stats.acYear = 0;
            $scope.stats.ncToday = 0;
            $scope.stats.ncWeek = 0;
            $scope.stats.ncMonth = 0;
            $scope.stats.ncYear = 0;
            $scope.stats.ocToday = 0;
            $scope.stats.ocWeek = 0;
            $scope.stats.ocMonth = 0;
            $scope.stats.ocYear = 0;
            $scope.stats.pToday = 0;
            $scope.stats.pWeek = 0;
            $scope.stats.pMonth = 0;
            $scope.pYear = 0;

            //LOAD ALL DATA
            $http.get('/api/getVisits')
                    .success(function (response) {
                        $scope.haircuts = response;
                        // query how many clients today
                        $scope.calcStats($scope.haircuts);
                    })
            // FILTER BY USER
            $scope.userChange = function () {
                $scope.haircutsByUser = [];
                for (var i = 0, l = $scope.haircuts.length; i < l; i++) {
                    if ($scope.selectedUser) {
                        if ($scope.haircuts[i].barber === $scope.selectedUser) {
                            $scope.haircutsByUser.push($scope.haircuts[i]);
                        }
                        if ($scope.haircutsByUser.length > 0) {
                            $scope.calcStats($scope.haircutsByUser);
                        } else {
                            $scope.resetStats();
                        }
                    } else {
                        $scope.calcStats($scope.haircuts);
                    }
                }
            };
            // CALCULATE DATA
            $scope.calcStats = function (list) {
                $scope.stats.acToday = 0;
                $scope.stats.acWeek = 0;
                $scope.stats.acMonth = 0;
                $scope.stats.acYear = 0;
                $scope.stats.ncToday = 0;
                $scope.stats.ncWeek = 0;
                $scope.stats.ncMonth = 0;
                $scope.stats.ncYear = 0;
                $scope.stats.ocToday = 0;
                $scope.stats.ocWeek = 0;
                $scope.stats.ocMonth = 0;
                $scope.stats.ocYear = 0;
                $scope.stats.pToday = 0;
                $scope.stats.pWeek = 0;
                $scope.stats.pMonth = 0;
                $scope.stats.pYear = 0;
                // change list to particular user
                for (var i = 0, l = list.length; i < l; i++) {
                    var date = new Date(list[i].date);
                    var year = date.getFullYear();
                    var month = date.getMonth() + 1;
                    var day = date.getDate();
                    if (!list[i].price) {
                        list[i].price = 0;
                    }
                    if ($scope.today.year === year) {
                        $scope.stats.acYear++;
                        $scope.stats.pYear += Number(list[i].price);
                        if (list[i].new === true) {
                            $scope.stats.ncYear++;
                        }
                        if ($scope.today.month === month) {
                            $scope.stats.acMonth++;
                            if (list[i].new === true) {
                                $scope.stats.ncMonth++;
                            }
                            $scope.stats.pMonth += Number(list[i].price);
                            if ($scope.today.day === day) {
                                $scope.stats.acToday++;
                                if (list[i].new === true) {
                                    $scope.stats.ncToday++;
                                }
                                $scope.stats.pToday += Number(list[i].price);
                            }
                        }
                    }
                    $scope.stats.ocToday = $scope.stats.acToday - $scope.stats.ncToday;
                    $scope.stats.ocWeek = $scope.stats.acWeek - $scope.stats.ncWeek;
                    $scope.stats.ocMonth = $scope.stats.acMonth - $scope.stats.ncMonth;
                    $scope.stats.ocYear = $scope.stats.acYear - $scope.stats.ncYear;
                }
                ;
            };
            $scope.resetStats = function() {
                $scope.stats.acToday = 0;
                $scope.stats.acWeek = 0;
                $scope.stats.acMonth = 0;
                $scope.stats.acYear = 0;
                $scope.stats.ncToday = 0;
                $scope.stats.ncWeek = 0;
                $scope.stats.ncMonth = 0;
                $scope.stats.ncYear = 0;
                $scope.stats.ocToday = 0;
                $scope.stats.ocWeek = 0;
                $scope.stats.ocMonth = 0;
                $scope.stats.ocYear = 0;
                $scope.stats.pToday = 0;
                $scope.stats.pWeek = 0;
                $scope.stats.pMonth = 0;
                $scope.stats.pYear = 0;
                
            };
        });