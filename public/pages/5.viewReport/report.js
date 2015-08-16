'use strict';

angular.module('myApp.report', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'user_ROLES', function ($routeProvider, user_ROLES) {
                $routeProvider.when('/report', {
                    templateUrl: 'pages/5.viewReport/report.html',
                    controller: 'ReportController',
                    data: {authorizedRoles: [user_ROLES.user, user_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('ReportController', function ($scope, $http, visitsService, productsService,
                userservice, staffService) {
            $scope.init = function () {
                Date.prototype.getWeekNumber = function () {
                    var d = new Date(+this);
                    d.setHours(0, 0, 0);
                    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
                    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
                };
                $scope.haircutsByuser = [];
                $scope.resetVars();
                $scope.products = productsService.getProducts();
                $scope.users = userservice.getuserList();
                $scope.staffList = staffService.getStaffList();
                $scope.visits = visitsService.getVisits();
                $scope.calcStats($scope.visits);
                $scope.weekdayAll = {monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0};
                $scope.weekdayThisWeek = {monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0};
                $scope.periodAll = {today: 0, week: 0, month: 0, year: 0};
                $scope.staffAll = {Muniah: 0, Kim: 0, Herman: 0, Peter: 0};
                $scope.staffThisWeek = {Muniah: 0, Kim: 0, Herman: 0, Peter: 0};
                $scope.todayStats = {
                    groom1: {cash: 0, eftpos: 0, total: 0, clients: 0},
                    groom2: {cash: 0, eftpos: 0, total: 0, clients: 0}
                };
//                $scope.calcTodayStats();
            };
//            $scope.calcTodayStats = function () {
//                for (var i = 0, l = $scope.visits.length; i < l; i++) {
//                    console.log($scope.visits[i].date);
//                    if ($scope.visits[i].location === 'Tinakori') {
//                        if ($scope.visits[i].payment === 'cash') {
//                            $scope.todayStats.groom1.cash += $scope.visits[i].price;
//                        }
//                        if ($scope.visits[i].payment === 'eftpos') {
//                            $scope.todayStats.groom1.eftpos += $scope.visits[i].price;
//                        }
//                        $scope.todayStats.groom1.total += $scope.visits[i].price;
//                        $scope.todayStats.groom1.clients += 1;
//                    }
//                    if ($scope.visits[i].location === 'Waring Taylor') {
//                        if ($scope.visits[i].payment === 'cash') {
//                            $scope.todayStats.groom1.cash += $scope.visits[i].price;
//                        }
//                        if ($scope.visits[i].payment === 'eftpos') {
//                            $scope.todayStats.groom1.eftpos += $scope.visits[i].price;
//                        }
//                        $scope.todayStats.groom1.total += $scope.visits[i].price;
//                        $scope.todayStats.groom1.clients += 1;
//                    }
//                }
//            };
            $scope.resetVars = function () {
                $scope.today = {};
                $scope.today.date = new Date();
                $scope.today.year = $scope.today.date.getFullYear();
                $scope.today.month = $scope.today.date.getMonth() + 1;
                $scope.today.week = $scope.today.date.getWeekNumber();
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
            // FILTER BY user
            $scope.userChange = function () {
                $scope.haircutsByuser = [];
                if ($scope.selecteduser) {
                    if ($scope.haircutsByBarber && $scope.haircutsByBarber.length > 0) {
                        for (var i = 0, l = $scope.haircutsByBarber.length; i < l; i++) {
                            if ($scope.haircutsByBarber[i].user === $scope.selecteduser) {
                                $scope.haircutsByuser.push($scope.haircutsByBarber[i]);
                            }
                        }
                    } else {
                        for (var i = 0, l = $scope.visits.length; i < l; i++) {
                            if ($scope.visits[i].user === $scope.selecteduser) {
                                $scope.haircutsByuser.push($scope.visits[i]);
                            }
                        }
                    }
                    if ($scope.haircutsByuser.length > 0) {
                        $scope.calcStats($scope.haircutsByuser);
                    } else {
                        $scope.resetVars();
                    }
                } else {
                    $scope.calcStats($scope.visits);
                }
            };
            $scope.barberChange = function () {
                $scope.haircutsByBarber = [];
                if ($scope.selectedBarber) {
                    if ($scope.haircutsByuser && $scope.haircutsByuser.length > 0) {
                        for (var i = 0, l = $scope.haircutsByuser.length; i < l; i++) {
                            if ($scope.haircutsByuser[i].barber.name === $scope.selectedBarber) {
                                $scope.haircutsByBarber.push($scope.haircutsByuser[i]);
                            }
                        }
                    } else {
                        for (var i = 0, l = $scope.visits.length; i < l; i++) {
                            if ($scope.visits[i].barber.name === $scope.selectedBarber) {
                                $scope.haircutsByBarber.push($scope.visits[i]);
                            }
                        }
                    }
                    if ($scope.haircutsByBarber.length > 0) {
                        $scope.calcStats($scope.haircutsByBarber);
                    } else {
                        $scope.resetVars();
                    }
                } else {
                    $scope.calcStats($scope.visits);
                }
            };
            // CALCULATE DATA
            $scope.calcStats = function (list) {
                $scope.resetVars();
                // change list to particular user
                for (var i = 0, l = list.length; i < l; i++) {
                    var date, year, month, week, day;
                    date = new Date(list[i].date);
                    year = date.getFullYear();
                    month = date.getMonth() + 1;
                    week = date.getWeekNumber();
                    day = date.getDate();
                    if ($scope.today.year === year) {
                        $scope.stats.acYear++;
                        $scope.stats.pYear += Number(list[i].product.price);
                        if (list[i].client.counters && list[i].client.counters.visits === 1) {
                            $scope.stats.ncYear++;
                        }
                        if ($scope.today.month === month) {
                            $scope.stats.acMonth++;
                            if (list[i].client.counters && list[i].client.counters.visits === 1) {
                                $scope.stats.ncMonth++;
                            }
                            $scope.stats.pMonth += Number(list[i].product.price);
                            if ($scope.today.week === week) {
                                $scope.stats.acWeek++;
                                if (list[i].client.counters && list[i].client.counters.visits === 1) {
                                    $scope.stats.ncWeek++;
                                }
                                $scope.stats.pWeek += Number(list[i].product.price);

                                if ($scope.today.day === day) {
                                    $scope.stats.acToday++;
                                    if (list[i].client.counters && list[i].client.counters.visits === 1) {
                                        $scope.stats.ncToday++;
                                    }
                                    $scope.stats.pToday += Number(list[i].product.price);
                                }
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