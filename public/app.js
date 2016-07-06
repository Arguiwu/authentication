angular.module('myApp',['ui.router'],function(){
	console.log('creating Module...');
})
	.constant('AUTH_EVENTS',{
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	})
	.constant('USER_ROLES',{
		all:'*',
		admin:'admin',
		editor:'editor',
		guest:'guest'
	})
	.controller('LoginController',function($scope,$rootScope,$state,AUTH_EVENTS,AuthService,Session){
		$scope.credentials = {
			username:'',
			password:''
		};
		$scope.login = function(credentials){
			var loginUser = AuthService.login(credentials);
			if(loginUser){
				console.log("LoginController登陆成功！");
				$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
				$scope.setCurrentUser(loginUser);
				Session.create("sessionID",loginUser.userId,loginUser.userRole);
				//放进去Session，应该是放在后台验证成功后的
				$state.go('content');//跳转到内容页面
			}else{
				console.log("登陆失败！");
				$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
			}
		};
	})
	.factory('AuthService',function($http,Session){ //身份认证和授权（访问控制）
		var authService={};
		authService.login = function(credentials){ //登陆去后台检验
			console.log("登陆去后台检验");
			return{
				userId:001,
				username:'lkl',
				userRole:['admin','editor']
			}
		};
		authService.isAuthenticated = function(){ //用户是否登陆
			return !!Session.userId;//等效于 return Session.userId||false
		};
		authService.isAuthorized = function(authorizeRoles){ //用户是否拥有传进来的权限
			return(authService.isAuthenticated()&&Session.userRole.indexOf(authorizeRoles)!== -1)
		};
		return authService;
	})
	.service('Session',function(){	//保存用户的 session 信息
		this.create=function(sessionId,userId,userRole){//创建
		    this.id=sessionId;
		    this.userId=userId;
		    this.userRole=userRole;
		};
		this.destroy=function(){//销毁
		    this.id=null;
		    this.userId=null;
		    this.userRole=null;
		}
	})
	.controller('ApplicationController',function($scope,USER_ROLES,AuthService){
		//应用的根节点的Controller，展示登陆用户信息
		$scope.currentUser=null;//当前用户
		$scope.userRoles= USER_ROLES;//系统的权限
		$scope.isAuthorized=AuthService.isAuthorized;//是否有权限
		$scope.setCurrentUser=function(user){
		    $scope.currentUser=user;
		}
	})
	.config(function($stateProvider,$urlRouterProvider,USER_ROLES){
		$stateProvider.state('index',{
		    url:'/index',
		    templateUrl:'index.html',
		    data:{
		        authorizedRoles: [USER_ROLES.admin]//访问该页面需要的权限
		    }
		}).state('login',{
		    url:'/login',
		    templateUrl:'login.html',
		    data:{
		        authorizedRoles: [USER_ROLES.admin, USER_ROLES.editor]
		    }
		}).state('content',{
		    url:'/content',
		    templateUrl:'content.html',
		    data:{
		        authorizedRoles: [USER_ROLES.admin]
		    }
		})
	})
	.run(function($rootScope,AUTH_EVENTS,AuthService){
		console.log("Running......");
		$rootScope.$on('stateChangeStart',function(event,toState,toParams,fromState,fromParam){
			//监控路由改变
			console.log("监控路由改变....")
			var authorizedRoles=toState.data.authorizedRoles;//路由权限
			if(!AuthService.isAuthorized(authorizedRoles)){
				if(AuthService.isAuthenticated()) {
				    $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
				}else{
				    $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
				}
			}
		})
	})
	.config(function($httpProvider){
		$httpProvider.interceptors.push([
		    '$injector',
		    function($injector){
		        return $injector.get('AuthInterceptor');
		    }
		]);
	})
	.factory('AuthInterceptor',function($rootScope,$q,AUTH_EVENTS){
		//HTTP响应拦截器，还可以搞HTTP请求拦截器
		return{
		    responseError:function(response){//响应出错
		        $rootScope.$broadcast({
		            401: AUTH_EVENTS.notAuthenticated,
		            403: AUTH_EVENTS.notAuthorized,
		            419: AUTH_EVENTS.sessionTimeout,
		            440: AUTH_EVENTS.sessionTimeout
		        },[response.status],response);
		        return $q.reject(response);
		    }
		};
	})
	.directive('loginDialog',function(AUTH_EVENTS){ //登陆框指令
		return{
		    restrict:'AE',
		    template:'<div ng-include="\'login-form.html\'"></div>',
		    link:function(scope){
		        var showDialog=function(){
		            scope.visible=true;//不显示
		        };
		        scope.visible=false;//显示
		        scope.$on(AUTH_EVENTS.notAuthenticated,showDialog);
		        scope.$on(AUTH_EVENTS.sessionTimeout,showDialog);
		    }
		}
	})