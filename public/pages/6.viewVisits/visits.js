'use strict';

angular.module('myApp.visits', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
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
                $routeProvider.when('/visit/:id', {
                    templateUrl: 'pages/6.viewVisits/visit.html',
                    controller: 'SingleVisitController',
                    data: {
                        authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }})
                $routeProvider.when('/deletedVisits', {
                    templateUrl: 'pages/6.viewVisits/deletedVisits.html',
                    controller: 'RestoreDeletedVisitsController',
                    data: {
                        authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }});
            }])
        .controller('SingleVisitController', function ($scope, commonFunctions, visitsService, productsService,
                storeService, staffService, $location, $routeParams, $http, clientsService) {
            $scope.init = function () {
                $scope.products = productsService.getProducts();
                $scope.users = storeService.getStoreList();
                $scope.staffList = staffService.getStaffList();
                $scope.visits = visitsService.getVisits();
                $scope.getVisit();
            };

            $scope.getVisit = function () {
                $scope.visit = $scope.findVisit($routeParams.id);
                if ($scope.visit) {
                    $scope.visit.date = new Date($scope.visit.date);
                } else {
                    commonFunctions.customAlert("Client not found");
                }
            };
            $scope.updateVisit = function () {
                $http.post('/api/visit/' + $scope.visit.id, $scope.visit)
                        .success(function (r) {
                            $location.path("/visits");
                        });
            };
            $scope.removeVisit = function (visitId) {
                commonFunctions.confirmDialog("Are you sure?").then(function () {
                    var visitIndex = clientsService.findClientIndex(visitId, $scope.visits);
                    $http.post('/api/deleteVisit', $scope.visits[visitIndex]).then(
                            function () {
                                $scope.visits.splice(visitIndex, 1);
                                $location.path('/visits');
                            },
                            function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't delete the visit"});
                            });
                });
            };
            $scope.findVisit = function (id) {
                for (var i = 0, listLength = $scope.visits.length; i < listLength; i++) {
                    if (typeof $scope.visits[i].id === 'undefined') {
                        $scope.visits[i].id = $scope.clientList[i]._id;
                    }
                    if ($scope.visits[i].id.toString() === id) {
                        return $scope.visits[i];
                    }
                }
                return null;
            };

            $scope.init();
        })
        .controller('VisitsController', function ($scope, visitsService, $location) {
            $scope.$on('newVisitsList', function (event, data) {
                $scope.visits = data.visitsList;
                if (!$scope.$$phase) {
                    $scope.$apply($scope.visits);
                    $scope.dataLoading = false;
                }
            });

            $scope.init = function () {
                $scope.dateFrom = new Date();
                $scope.dateTo = new Date();

                $scope.visits = visitsService.getVisits();

                $scope.$on('newVisitsList', function (event, data) {
                    $scope.visits = data.visitsList;
                    $scope.dataLoading = false;
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
            $scope.restoreDeletedVisitPage = function () {
                $location.path('/deletedVisits');
            };
            $scope.openVisit = function (id) {
                if ($scope.currentUser.role === 'admin') {
                    $location.path("/visit/" + id);
                }
            };

            $scope.init();
        })
        .controller('RestoreDeletedVisitsController', function ($scope, $location, $http) {
            $scope.init = function () {
                $scope.dateFrom = new Date();
                $scope.dateTo = new Date();
                $scope.dataLoading = true;

                $http.get('/api/getDeletedVisits').then(
                        function (response) {
                            $scope.deletedVisits = response.data;
                            $scope.dataLoading = false;
                        });
            };
            $scope.restoreDeletedVisit = function (visit) {
                $http.post('/api/restoreVisit', visit).then(function () {
                    $scope.visits.push(visit);
                });
                $location.path('/visits');
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
            $scope.goBackToVisitsPage = function () {
                $location.path('/visits');
            }

            $scope.init();
        });