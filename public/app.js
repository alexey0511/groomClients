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
        .controller('ApplicationController', function ($scope, AUTH_EVENTS, DEFAULT_SETTINGS, clientsService, $http, $q, Session, USER_ROLES, AuthService, $rootScope, $cookieStore, $location) {
            $scope.$on(AUTH_EVENTS.notAuthenticated, function () {
                $scope.currentUser = null;
            });
            if ($location.path() !== '/login') {
                $scope.isLoginPage = false;
            } else {
                $scope.isLoginPage = true;
            }
            $scope.findClient = function (id) {
                for (var i = 0, listLength = $scope.people.length; i < listLength; i++) {
                    if (typeof $scope.people[i].id === 'undefined') {
                        $scope.people[i].id = $scope.people[i]._id;
                    }
                    ;
                    if ($scope.people[i].id.toString() === id) {
                        return $scope.people[i];
                    }
                }
                return null;
            }
            $scope.people = [];
            $scope.setPeopleList = function (people) {
                $scope.people = people;
            }
            $scope.currentUser = null;
            $scope.userRoles = USER_ROLES;
            $scope.isAuthorized = AuthService.isAuthorized;
            $scope.setCurrentUser = function (user) {
                $scope.currentUser = user;
                $cookieStore.put('userInfo', user);
                Session.create(1, user.user, user.role);
            };
            if ($cookieStore.get('userInfo')) {
                $scope.setCurrentUser($cookieStore.get('userInfo'));
            }


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
                if (Array.isArray($scope.people && $scope.people.length > 0)) {
                    defer.resolve();
                } else {
                    $http.get('/api/getClients')
                            .success(function (response) {
                                $scope.setPeopleList(response);
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
            $scope.recordVisit = function (visit) {
                console.log(">>", visit);
                var clientIndex = clientsService.findClientIndex(visit.client.id, $scope.people);
                $scope.increaseCount(clientIndex);
                $scope.people[clientIndex].points += visit.price * 100 / 1000;
// redeem right away - use half price haircut
                if ($scope.people[clientIndex].counters.progress === DEFAULT_SETTINGS.numberVisits) {
                    $scope.people[clientIndex].counters.freeVisits += 1;
                    // Invoking immediatelly for now. ToDo: implement invoke on button click;
                    $scope.redeemCoupon(clientIndex);
                    visit.price = Number(visit.price) * 100 / 2 / 100;
                    $scope.people[clientIndex].points -= visit.price;
                }
                if ($scope.people[clientIndex].visits > 1 && $scope.people[clientIndex].new) {
                    $scope.people[clientIndex].new = false;
                }
                $http.post('/api/visits', visit)
                        .success(function () {
                            var clientVisit = JSON.stringify(visit);
                            $scope.people[clientIndex].visits.push(clientVisit);
                            $http.post('/api/clients', $scope.people[clientIndex])
                                    .success(function () {
                                    })
                                    .error(function (err) {
                                        console.log("ERROR OCCURED", err);
                                    });
                        });
            };
            $scope.increaseCount = function (clientIndex) {
//                $scope.verifyCountersNum(clientIndex);
                if (Array.isArray($scope.people) && typeof ($scope.people[clientIndex]) !== 'undefined'
                        && typeof ($scope.people[clientIndex].counters) !== 'undefined') {
                    $scope.people[clientIndex].counters.progress += 1;
                    $scope.people[clientIndex].counters.visits += 1;
                    $scope.people[clientIndex].lastVisit = new Date();
                } else {
                    console.log("Error while adding...");
                }
            };
            $scope.decreaseCount = function (clientIndex) {
                if ($scope.people[clientIndex].counters.progress > 0) {
                    $http.post('/api/removeLatestPurchase', {client: $scope.people[clientIndex]})
                            .success(function () {
                                if ($scope.people[clientIndex].counters.freeVisits > 0
                                        && $scope.people[clientIndex].counters.visits > 0) {
                                    $scope.people[clientIndex].counters.freeVisits -= 1;
                                }
                                if ($scope.people[clientIndex].counters.progress > 0) {
                                    $scope.people[clientIndex].counters.progress -= 1;
                                }
                                if ($scope.people[clientIndex].counters.visits > 0) {
                                    $scope.people[clientIndex].counters.visits -= 1;
                                }
                                // Update record in DB
                                $http.post('/api/clients', $scope.people[clientIndex]);
                            });
                }
            };
            $scope.redeemCoupon = function (clientIndex) {
                if ($scope.people[clientIndex].counters.freeVisits > 0) {
                    $scope.people[clientIndex].counters.progress = 0;
                    $scope.people[clientIndex].counters.freeVisits -= 1;
                    alert(DEFAULT_SETTINGS.winMessage);
                } else {
                    alert("You don't have any discount coupons yet");
                }
            };
            $scope.verifyCountersNum = function (clientIndex) {
                if (!Number($scope.people[clientIndex].counters.progress) || $scope.people[clientIndex].counters.progress === 'NaN')
                {
                    parseInt($scope.people[clientIndex].counters.progress);
                }
                if (!Number($scope.people[clientIndex].counters.visits) || $scope.people[clientIndex].counters.visits === 'NaN')
                {
                    parseInt($scope.people[clientIndex].counters.visits);
                }
                if (!Number($scope.people[clientIndex].counters.freeVisits) || $scope.people[clientIndex].counters.freeVisits === 'NaN')
                {
                    parseInt($scope.people[clientIndex].counters.freeVisits);
                }
            }
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
        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                //                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                $httpProvider.interceptors.push(['$injector', function ($injector) {
                        return $injector.get('authInterceptor');
                    }
                ]);
                $routeProvider.otherwise({redirectTo: '/clients'});
            }])
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
                findClientByQrCode: function (qrcode, scope) {
                    for (var i = 0, l = scope.people.length; i < l; i++) {
                        if (qrcode === scope.people[i].qrcode) {
                            return scope.people[i];
                        }
                    }
                    return false;
                },
                findClientIndex: function (id, people) {
                    for (var i = 0, l = people.length; i < l; i++) {
                        if (id === people[i].id) {
                            return i;
                        }
                    }
                    return 'false';
                },
                saveClients: function () {
                    var url = '/dbservice';
                    if ($rootScope.goals) {
                        var clients_saved = {};
                        clients_saved = $rootScope.people;
                        clients_saved['last_modified'] = new Date().getTime().toString();
                        clients_saved['_id'] = "123456789";
//                        $http.post('https://api.mongolab.com/api/1/databases/better-you/collections/clients?apiKey='
//                                + appConfig.DbId, clients_saved)
//                                .success(function (data, status, headers, config) {
//                                    console.log("Successfully save to remote DB");
//                                })
//                                .error(function (data, status, headers, config) {
//                                    alert(status);
//                                });
                        var data = {"table": "clients",
                            "clients": clients_saved,
                            "method": "POST",
                            "request": "saveClients",
                            "user": $rootScope.globals.currentUser
                        };
                        return $http.post(url, data);
                    } else {
                        console.log("rootScope empty");
                    }
                },
                deleteClients: function (id) {
//                    var url = "https://api.mongolab.com/api/1/databases/better-you/collections/clients" + id + "?apiKey=" + appConfig.DbId;
//                    $http.delete(url);
                    var url = '/dbservice';
                    var data = {"table": "clients",
                        "id": id,
                        "method": "POST",
                        "request": "delete",
                        "user": $rootScope.globals.currentUser
                    };
                    return $http.post(url, data);
                },
                getClients: function () {
//                    var url = appConfig.DbUrl + appConfig.DbPath + "clients/" + "123456789" + "?apiKey=" + appConfig.DbId;
//                    return $http.get(url);
                    var url = '/dbservice';
                    var data = {"table": "clients",
                        "method": "POST",
                        "request": "getAll",
                        "user": $rootScope.globals.currentUser
                    };
                    return $http.post(url, data);
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

