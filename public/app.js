'use strict';

angular.module('myApp.constants', [])
        .constant("DEFAULT_SETTINGS", {
            numberVisits: 6,
            winMessage: "HALF PRICE HAIR CUT",
            defaultPrice: "30",
            storeId: '123',
            productExpiration: '42'
        })
        .constant('AUTH_EVENTS', {
            loginSuccess: 'auth-login-success',
            loginFailed: 'auth-login-failed',
            logoutSuccess: 'auth-logout-success',
            sessionTimeout: 'auth-session-timeout',
            notAuthenticated: 'auth-not-authenticated',
            notAuthorized: 'auth-not-authorized'
        })
        .constant('USER_ROLES', {
            all: '*',
            user: 'user',
            admin: 'admin'
        })
        .constant('appConfig', {
            //            DbId: 'FZppyrqd2WJkyAr7bLk0LVGbpD6Mug0L',
            //            DbPath: 'hwhl/collections/',
            DbId: 'FZppyrqd2WJkyAr7bLk0LVGbpD6Mug0L',
            DbPath: 'hwhl_dev/collections/',
            DbUrl: 'https://api.mongolab.com/api/1/databases/',
            MsgSvcWebsite: 'http://api.clickatell.com/http/sendmsg',
            MsgSvcUser: 'alexey0511',
            MsgSvcPwd: 'REHFEfEQEVBPPF',
            MsgSvcApiId: '3513880'
        });

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'myApp.constants',
    'myApp.clients',
    'myApp.sell',
    'myApp.scanClient',
    'myApp.visits',
    'myApp.newclient',
    'myApp.manageProducts',
    'myApp.manageUsers',
    'myApp.manageClients',
    'myApp.generateQR',
    'ngCookies',
    'myApp.report',
    'ui.bootstrap',
    'ja.qr',
    'myApp.version',
    'myApp.Authentication',
    'myApp.txting'
])
        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                //                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $httpProvider.interceptors.push(['$injector', function ($injector) {
                        return $injector.get('authInterceptor');
                    }
                ]);
                $httpProvider.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
                delete $httpProvider.defaults.headers.common['X-Requested-With'];

                $routeProvider.otherwise({redirectTo: '/clients'});
            }])
        .controller('ApplicationController', function ($scope, AUTH_EVENTS, DEFAULT_SETTINGS, commonFunctions, clientsService, $http, $q, Session, USER_ROLES, AuthService, $rootScope, $cookieStore, $location) {
            $scope.init = function () {
                $scope.alerts = [];
                $scope.clientList = [];
                $scope.currentUser = null;

                $scope.closeAlert = function (index) {
                    $scope.alerts.splice(index, 1);
                };
                if ($location.path() !== '/login') {
                    $scope.isLoginPage = false;
                } else {
                    $scope.isLoginPage = true;
                }
                if ($cookieStore.get('userInfo')) {
                    $scope.setCurrentUser($cookieStore.get('userInfo'));
                }
                $scope.$on(AUTH_EVENTS.notAuthenticated, function () {
                    $scope.currentUser = null;
                });
            };

            $scope.findClient = function (id) {
                for (var i = 0, listLength = $scope.clientList.length; i < listLength; i++) {
                    if (typeof $scope.clientList[i].id === 'undefined') {
                        $scope.clientList[i].id = $scope.clientList[i]._id;
                    }
                    ;
                    if ($scope.clientList[i].id.toString() === id) {
                        return $scope.clientList[i];
                    }
                }
                return null;
            }
            $scope.setCurrentUser = function (user) {
                $scope.currentUser = user;
                $cookieStore.put('userInfo', user);
                Session.create(1, user.user, user.role);
            };
            $scope.logout = function () {
                delete $scope.currentUser;
                $cookieStore.remove('userInfo');
                Session.destroy();
            };
            $scope.checkPurchases = function () {
                var defer = $q.defer();
                if (!$scope.visits) {
                    $http.get('/api/getVisits').then(
                            function (response) {
                                $scope.visits = response.data;
                                defer.resolve();
                            },
                            function () {
                                defer.reject();
                            });
                }
                return defer.promise;
            };
            $scope.checkClients = function () {
                var defer = $q.defer();
                if (Array.isArray($scope.clientList && $scope.clientList.length > 0)) {
                    defer.resolve();
                } else {
                    $http.get('/api/getClients')
                            .success(function (clientList) {
                                $scope.clientList = clientList;
                                defer.resolve();
                            })
                            .error(function () {
                                $scope.alerts.push({type: 'danger', msg: "Sorry, couldn't load client list"});
                                defer.reject();
                            });
                }
                return defer.promise;
            };
            $scope.checkUsers = function () {
                var defer = $q.defer();
                if (Array.isArray($scope.users && $scope.users.length > 0)) {
                    defer.resolve();
                } else {
                    $http.get('/api/users')
                            .success(function (response) {
                                $scope.users = response;
                                defer.resolve();
                            })
                            .error(function () {
                                defer.reject();
                            });
                }
                return defer.promise;
            };
            $scope.checkProducts = function () {
                var defer = $q.defer();
                if (Array.isArray($scope.products && $scope.products.length > 0)) {
                    defer.resolve();
                } else {
                    $http.get('/api/products')
                            .success(function (response) {
                                $scope.products = response;
                                defer.resolve();
                            })
                            .error(function () {
                                alert("can't connect to database")
                                defer.reject();
                            });
                }
                return defer.promise;
            };

            $scope.recordVisit = function (visit) {
                var clientIndex = clientsService.findClientIndex(visit.client.id, $scope.clientList);
                $scope.increaseCount(clientIndex);
                $scope.clientList[clientIndex].points += visit.price * 100 / 1000;
// redeem right away - use half price haircut
                if ($scope.clientList[clientIndex].counters.progress === DEFAULT_SETTINGS.numberVisits) {
                    $scope.clientList[clientIndex].counters.freeVisits += 1;
                    // Invoking immediatelly for now. ToDo: implement invoke on button click;
                    $scope.redeemCoupon(clientIndex);
                    visit.price = Number(visit.price) * 100 / 2 / 100;
                    $scope.clientList[clientIndex].points -= visit.price;
                }
                if ($scope.clientList[clientIndex].visits > 1 && $scope.clientList[clientIndex].new) {
                    $scope.clientList[clientIndex].new = false;
                    $scope.clientList[clientIndex].lastVisit = new Date();
                }
                $http.post('/api/visits', visit)
                        .success(function () {
                            var clientVisit = JSON.stringify(visit);
                            $http.post('/api/clients', $scope.clientList[clientIndex])
                                    .success(function () {
                                    })
                                    .error(function (err) {
                                        console.log("ERROR OCCURED", err);
                                    });
                        });
            };
            $scope.increaseCount = function (clientIndex) {
                $scope.verifyCountersNum(clientIndex);
                if (Array.isArray($scope.clientList) && typeof ($scope.clientList[clientIndex]) !== 'undefined'
                        && typeof ($scope.clientList[clientIndex].counters) !== 'undefined') {
                    $scope.clientList[clientIndex].counters.progress += 1;
                    $scope.clientList[clientIndex].counters.visits += 1;
                    $scope.clientList[clientIndex].lastVisit = new Date();
                } else {
                    console.log("Error while adding...");
                }
            };
            $scope.decreaseCount = function (clientIndex) {
                if ($scope.clientList[clientIndex].counters.progress > 0) {
                    $http.post('/api/removeLatestPurchase', {client: $scope.clientList[clientIndex]})
                            .success(function () {
                                if ($scope.clientList[clientIndex].counters.freeVisits > 0
                                        && $scope.clientList[clientIndex].counters.visits > 0) {
                                    $scope.clientList[clientIndex].counters.freeVisits -= 1;
                                }
                                if ($scope.clientList[clientIndex].counters.progress > 0) {
                                    $scope.clientList[clientIndex].counters.progress -= 1;
                                }
                                if ($scope.clientList[clientIndex].counters.visits > 0) {
                                    $scope.clientList[clientIndex].counters.visits -= 1;
                                }
                                // Update record in DB
                                $http.post('/api/clients', $scope.clientList[clientIndex]);
                            });
                }
            };
            $scope.redeemCoupon = function (clientIndex) {
                if ($scope.clientList[clientIndex].counters.freeVisits > 0) {
                    $scope.clientList[clientIndex].counters.progress = 0;
                    $scope.clientList[clientIndex].counters.freeVisits -= 1;
                    commonFunctions.customAlert(DEFAULT_SETTINGS.winMessage);
                } else {
                    commonFunctions.customAlert("You don't have any discount coupons yet");
                }
            };
            $scope.verifyCountersNum = function (clientIndex) {
                if (!Number($scope.clientList[clientIndex].counters.progress) || $scope.clientList[clientIndex].counters.progress === 'NaN')
                {
                    parseInt($scope.clientList[clientIndex].counters.progress);
                }
                if (!Number($scope.clientList[clientIndex].counters.visits) || $scope.clientList[clientIndex].counters.visits === 'NaN')
                {
                    parseInt($scope.clientList[clientIndex].counters.visits);
                }
                if (!Number($scope.clientList[clientIndex].counters.freeVisits) || $scope.clientList[clientIndex].counters.freeVisits === 'NaN')
                {
                    parseInt($scope.clientList[clientIndex].counters.freeVisits);
                }
            }

            $scope.init();
        })
        .service('commonFunctions', function ($modal, $q) {
            return {
                generateGuid: function guid() {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000).toString(16)
                                .substring(1);
                    }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                            s4() + '-' + s4() + s4() + s4();
                },
                confirmDialog: function () {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/ConfirmRemove.html',
                        controller: 'ConfirmRemoveController',
                        size: 'sm'
                    });
                    modalInstance.result.then(function (result) {
                        defer.resolve(result);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                },
                adminProof: function () {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/adminProof.html',
                        controller: 'adminProofController',
                        size: 'sm'
                    });
                    modalInstance.result.then(function (result) {
                        defer.resolve(result);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                },
                customAlert: function (alert) {
                    var defer = $q.defer();
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'pages/partials/customAlert.html',
                        controller: 'customAlertController',
                        size: 'sm',
                        resolve: {
                            alert: function () {
                                return alert;
                            }
                        }
                    });
                    modalInstance.result.then(function (result) {
                        defer.resolve(true);
                    }, function () {
                        defer.reject(false);
                    });
                    return defer.promise;
                }
            };
        })
        .directive('capitalizeFirst', function ($parse) {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, modelCtrl) {
                    var capitalize = function (inputValue) {
                        if (inputValue === undefined) {
                            inputValue = '';
                        }
                        var capitalized = inputValue.charAt(0).toUpperCase() +
                                inputValue.substring(1);
                        if (capitalized !== inputValue) {
                            modelCtrl.$setViewValue(capitalized);
                            modelCtrl.$render();
                        }
                        return capitalized;
                    }
                    modelCtrl.$parsers.push(capitalize);
                    capitalize($parse(attrs.ngModel)(scope)); // capitalize initial value
                }
            };
        })
        .factory('authInterceptor', function ($rootScope, $q, $cookieStore, AUTH_EVENTS, Session) {
            return {
                request: function (config) {
                    config.headers = config.headers || {};
                    if ($cookieStore.get('userToken')) {
                        config.headers.Authorization = 'Bearer ' + $cookieStore.get('userToken');
                    }
                    return config;
                },
                responseError: function (response) {
                    $rootScope.$broadcast({
                        401: AUTH_EVENTS.notAuthenticated,
                        403: AUTH_EVENTS.notAuthorized,
                        419: AUTH_EVENTS.sessionTimeout,
                        440: AUTH_EVENTS.sessionTimeout
                    }[response.status], response);
                    return $q.reject(response);
                    if (response.status === 401) {
                        // handle the case where the user is not authenticated

                    }
                    return response || $q.when(response);
                }
            };
        })
        .factory('AuthService', function ($http, Session, $cookieStore) {
            var authService = {};
            authService.login = function (credentials) {
                return $http
                        .post('/authenticate', credentials)
                        .then(function (res) {
                            res.data.token ?
                                    $cookieStore.put('userToken', res.data.token)
                                    : $cookieStore.remove('userToken');
                            return true;
                        }, function (res) {
                            $cookieStore.remove('userToken');
                            return false;
                        });
            };
            authService.isAuthenticated = function () {
                return !!Session.userId;
            };
            authService.isAuthorized = function (authorizedRoles) {
                if (!Array.isArray(authorizedRoles)) {
                    authorizedRoles = [authorizedRoles];
                }
                return (authService.isAuthenticated() &&
                        authorizedRoles.indexOf(Session.userRole) !== -1);
            };
            authService.logout = function () {

            };
            return authService;
        })
        .service('Session', function () {
            this.create = function (sessionId, userId, userRole) {
                this.id = sessionId;
                this.userId = userId;
                this.userRole = userRole;
            };
            this.destroy = function () {
                this.id = null;
                this.userId = null;
                this.userRole = null;
            };
        })
        .factory('AuthResolver', function ($q, $rootScope, $location) {
            return {
                resolve: function () {
                    var deferred = $q.defer();
                    var unwatch = $rootScope.$watch('$$childHead.currentUser', function (currentUser) {
                        if (angular.isDefined(currentUser) && currentUser) {
                            deferred.resolve(currentUser);
                        } else {
                            deferred.reject();
                            $location.path('/login');
                        }
                        unwatch();
                    });
                    return deferred.promise;
                }
            };
        })
        .factory('clientsService', function clientsService($http) {
            return {
                lastVisitInAnHour: function (client) {
                    if (new Date(client.lastVisit).getFullYear() === new Date().getFullYear()
                            && new Date(client.lastVisit).getMonth() === new Date().getMonth()
                            && new Date(client.lastVisit).getDate() === new Date().getDate()
                            && new Date(client.lastVisit).getHours() === new Date().getHours()) {
                        return true;
                    } else {
                        return false;
                    }
                },
                findClientByQrCode: function (qrcode, clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        console.log(qrcode, clientList[i].qrcode);
                        if (qrcode === clientList[i].qrcode) {
                            return clientList[i];
                        }
                    }
                    return false;
                },
                findClientIndex: function (id, clientList) {
                    for (var i = 0, l = clientList.length; i < l; i++) {
                        if (id === clientList[i].id) {
                            return i;
                        }
                    }
                    return false;
                }
            };
        })

        .run(['$rootScope', 'AUTH_EVENTS', 'AuthService', '$location',
            function ($rootScope, AUTH_EVENTS, AuthService, $location) {

                $rootScope.$on(AUTH_EVENTS.loginFailed, function () {
                    console.log("App Run rootscope: login failed");
                });
                $rootScope.$on('$routeChangeStart', function (event, next) {
                    // redirect to login page if not logged in
                    if (next.data && next.data.authorizedRoles) {
                        var authorizedRoles = next.data.authorizedRoles;
                        if (!AuthService.isAuthorized(authorizedRoles)) {
                            event.preventDefault();
                            if (AuthService.isAuthenticated()) {
                                // user is not allowed
                                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
                            } else {
                                // user is not logged in
                                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                                $location.path('/login');
                            }
                        }
                    }
                });
            }]);

