'use strict';

angular.module('myApp.report', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/report', {
                    templateUrl: 'pages/5.viewReport/report.html',
                    controller: 'ReportController',
                    data: {authorizedRoles: [USER_ROLES.user, USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('ReportController', function ($scope, $http) {
            $scope.init = function () {
                $scope.haircutsByUser = [];

                $scope.resetVars();
                $scope.checkUsers();
                $scope.checkStaffList();
                $scope.checkPurchases().then(
                        function () {
                            $scope.calcStats($scope.visits);
                        }, function () {
                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load list of purchases"});
                });
            };

            $scope.resetVars = function () {
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
                $scope.stats.pYear = 0;
            };

            // FILTER BY USER
            $scope.userChange = function () {
                $scope.haircutsByUser = [];
                for (var i = 0, l = $scope.visits.length; i < l; i++) {
                    if ($scope.selectedUser) {
                        if ($scope.visits[i].barber === $scope.selectedUser) {
                            $scope.haircutsByUser.push($scope.visits[i]);
                        }
                        if ($scope.haircutsByUser.length > 0) {
                            $scope.calcStats($scope.haircutsByUser);
                        } else {
                            $scope.resetVars();
                        }
                    } else {
                        $scope.calcStats($scope.visits);
                    }
                }
            };
            $scope.barberChange = function () {
                $scope.haircutsByBarber = [];
                for (var i = 0, l = $scope.visits.length; i < l; i++) {
                    if ($scope.selectedBarber) {
                        if ($scope.visits[i].barber === $scope.selectedBarber) {
                            $scope.haircutsByBarber.push($scope.visits[i]);
                        }
                        if ($scope.haircutsByBarber.length > 0) {
                            $scope.calcStats($scope.haircutsByBarber);
                        } else {
                            $scope.resetVars();
                        }
                    } else {
                        $scope.calcStats($scope.visits);
                    }
                }
            };
            // CALCULATE DATA
            $scope.calcStats = function (list) {
                $scope.resetVars();
                // change list to particular user
                for (var i = 0, l = list.length; i < l; i++) {
                    var date, year, month, day;
                    date = new Date(list[i].date);
                    year = date.getFullYear();
                    month = date.getMonth() + 1;
                    day = date.getDate();
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
            };
            $scope.init();
        });