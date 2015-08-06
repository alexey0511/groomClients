'use strict';

angular.module('myApp.manageStaff', ['ngRoute', 'myApp.constants'])

        .config(['$routeProvider', 'USER_ROLES', function ($routeProvider, USER_ROLES) {
                $routeProvider.when('/managestaff', {
                    templateUrl: 'pages/_13.manageBarbers/manageBarbers.html',
                    controller: 'manageStaffController',
                    data: {authorizedRoles: [USER_ROLES.admin]
                    },
                    resolve: {
                        auth: function resolveAuthentication(AuthResolver) {
                            return AuthResolver.resolve();
                        }
                    }
                });
            }])
        .controller('manageStaffController', function ($scope, $http, commonFunctions, staffService, clientsService) {
            $scope.$on('newStaffList', function (event, data) {
                $scope.staffList = data.staffList;
            });

            $scope.init = function () {
                $scope.staffList = staffService.getStaffList();

                $scope.alerts = [];
                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
            };

            $scope.addStaff = function () {
                if ($scope.newStaff && $scope.newStaff.name) {
                    $scope.newStaff.id = commonFunctions.generateGuid();
                    $http.post('/api/staff', $scope.newStaff).then(
                            function () {
                                $scope.staffList.push($scope.newStaff);
                                $scope.newStaff = {};
                            },
                            function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't add the staff members"});
                            });
                }
            };
            $scope.removeStaff = function (id) {
                commonFunctions.adminProof().then(function (response) {
                    if (response) {
                        var staffIndex = clientsService.findClientIndex(id, $scope.staffList);
                        $http.post('/api/deleteUsers', {adminProof: response, user: user[0]})
                                .success(function () {
                                    $scope.staffList.splice(staffIndex, 1);
                                })
                                .error(function () {
                                    $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't delete the staff"});
                                });
                    }
                });
            };
            $scope.init();
        });