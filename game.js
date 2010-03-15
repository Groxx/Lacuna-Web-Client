YAHOO.namespace("lacuna");

if (typeof YAHOO.lacuna.Game == "undefined" || !YAHOO.lacuna.Game) {
	
(function(){
	var Util = YAHOO.util,
		Lang = YAHOO.lang,
		Cookie = Util.Cookie,
		Dom = Util.Dom,
		Event = Util.Event,
		Lacuna = YAHOO.lacuna;
		
	var Game = {
		AssetUrl : "http://localhost/lacuna/assets/",
		EmpireData : {},
		Styles : {
			HIDDEN : "hidden",
			ALERT : "alert"
		},
		Services : {
			Body : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Body),
			Empire : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Empire),
			Inbox : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Inbox),
			Maps : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Map),
			Species : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Species),
			Stats : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Stats),
			Buildings : {
				Generic : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Buildings.Generic)
			}
		},
		ErrorCodes : {
			1000 : "Name not available",
			1001 : "Invalid password",
			1002 : "Object does not exist",
			1003 : "Too much information",
			1004 : "Password incorrect",
			1005 : "Contains invalid characters",
			1006 : "Authorization denied",
			1007 : "Overspend",
			1008 : "Underspend",
			1009 : "Invalid range"
		},
		View : {
			STAR : "star",
			SYSTEM : "system",
			PLANET : "planet"
		},
		Timeout : 10000,
		HourMS : 3600000, //(60min * 60sec * 1000ms),
		
		Start : function() {	
			var session = Cookie.getSub("lacuna","session");
			if(!session) {
				Lacuna.Game.DoLogin();
			}
			else {
				//Run rest of UI since we're logged in
				Lacuna.Game.GetFullStatus({
					success:Lacuna.Game.Run,
					failure:Lacuna.Game.Failure,
					scope:this
				});
			}
		},
		Failure : function(o){
			alert(o.error.message);
			if(o.error.code == 1006) {
				Lacuna.Game.DoLogin();
			}
		},
		DoLogin : function() {
			document.getElementById("content").innerHTML = "";
			if(!Lacuna.Game.LoginDialog) {
				Lacuna.Game.LoginDialog = new Lacuna.Login();
				Lacuna.Game.LoginDialog.subscribe("onLoginSuccessful",function(oArgs) {
					var now = new Date(),
						result = oArgs.result;
					//remember session
					Cookie.setSub("lacuna", "session", result.session_id, {
						domain: "lacunaexpanse.com",
						expires: now.setHours(now.getHours() + 1)
					});

					//store empire data
					Lacuna.Game.ProcessStatus(result.status);
					//Run rest of UI now that we're logged in
					Lacuna.Game.Run();
				});
			}
			Lacuna.Game.LoginDialog.show();
			Lacuna.Menu.hide();
		},
		Run : function() {
			//create menus (or update if already created)
			Lacuna.Menu.create();
			//set our interval going for resource calcs
			Lacuna.Game.recTime = new Date();
			Lacuna.Game.recInt = setInterval(Lacuna.Game.UpdateResources, 1000);
			//make sure we only subscribe once
			if(!Lacuna.Game._hasRun) {
				//this will be called on the first load and create menu
				Lacuna.MapStar.subscribe("onMapLoaded", function(oResult){
					Lacuna.Game.ProcessStatus(oResult.status);
				});
				Lacuna.MapStar.subscribe("onMapLoadFailed", Lacuna.Game.Failure);
				Lacuna.MapStar.subscribe("onChangeToSystemView", function(starData) {
					Lacuna.MapStar.MapVisible(false);
					Lacuna.Menu.SystemVisible();
					Lacuna.MapSystem.Load(starData.id);
					YAHOO.log(starData, "info", "onChangeToSystemView");
					Cookie.setSub("lacuna","locationId", starData.id,{
						domain: "lacunaexpanse.com"
					});
					Cookie.setSub("lacuna","locationView", Game.View.SYSTEM,{
						domain: "lacunaexpanse.com"
					});
				});
				
				Lacuna.MapSystem.subscribe("onStatusUpdate", function(oStatus){
					Lacuna.Game.ProcessStatus(oStatus);
					Lacuna.Menu.update();
				});
				Lacuna.MapSystem.subscribe("onChangeToPlanetView", function(planetId) {
					Lacuna.MapSystem.MapVisible(false);
					Lacuna.Menu.PlanetVisible();
					Lacuna.MapPlanet.Load(planetId);
					YAHOO.log(planetId, "info", "onChangeToPlanetView");
					Game.SetLocation(planetId, Game.View.PLANET);
				});
				
				
				Lacuna.MapPlanet.subscribe("onMapRpc", function(oResult){
					Lacuna.Game.ProcessStatus(oResult.status);
				});
				Lacuna.MapPlanet.subscribe("onMapRpcFailed", Lacuna.Game.Failure);
				
				Lacuna.Menu.subscribe("onBackClick", function() {
					if(Lacuna.MapSystem.IsVisible()) {
						Lacuna.MapSystem.MapVisible(false);
						Lacuna.MapStar.MapVisible(true);
						Lacuna.Menu.StarVisible(true);
						if(Lacuna.MapStar.locationId) {
							Game.SetLocation("home", Game.View.STAR);
						}
						else {
							Lacuna.MapStar.Load();
						}
					}
					else if(Lacuna.MapPlanet.IsVisible()) {
						Lacuna.MapPlanet.MapVisible(false);
						Lacuna.MapSystem.MapVisible(true);
						Lacuna.Menu.SystemVisible(true);
						if(Lacuna.MapSystem.locationId) {
							Game.SetLocation(Lacuna.MapSystem.locationId, Game.View.SYSTEM);
						}
						else {
							//load system with planet body id if system hasn't been init'd yet
							Lacuna.MapSystem.Load(Lacuna.MapPlanet.locationId, true);
						}
					}
				});
				
				Lacuna.Game._hasRun = true;
				
				Event.on(window, "resize", function (e) {
					//taken from YUI Overlay
					if (YAHOO.env.ua.ie) {
						if (!window.resizeEnd) {
							window.resizeEnd = -1;
						}

						clearTimeout(window.resizeEnd);

						window.resizeEnd = setTimeout(function () {
							Lacuna.Game.Resize(); 
						}, 100);
					} else {
						Lacuna.Game.Resize(); 
					}
				});
			}
			//load the correct screen
			var locationId = Cookie.getSub("lacuna","locationId"),
				locationView = Cookie.getSub("lacuna","locationView");
			if(!locationId) {
				Lacuna.MapStar.Load();
			}
			else {
				switch(locationView) {
					case "system":
						Lacuna.MapStar.MapVisible(false);
						Lacuna.MapPlanet.MapVisible(false);
						Lacuna.Menu.SystemVisible();
						Lacuna.MapSystem.Load(locationId);
						break;
					case "planet":
						Lacuna.MapStar.MapVisible(false);
						Lacuna.MapSystem.MapVisible(false);
						Lacuna.Menu.PlanetVisible();
						Lacuna.MapPlanet.Load(locationId);
						break;
					default:
						Lacuna.MapPlanet.MapVisible(false);
						Lacuna.MapSystem.MapVisible(false);
						Lacuna.MapStar.MapVisible(true);
						Lacuna.Menu.StarVisible(true);
						Lacuna.MapStar.Load();
						break;
				}
			}
		},
		
		ProcessStatus : function(status) {
			if(status && status.empire) {
				var now = new Date();
				//full status
				if(status.empire.home_planet_id) {
					//remember home planet
					Cookie.setSub("lacuna", "homePlanetId", status.empire.home_planet_id, {
						domain: "lacunaexpanse.com",
						expires: now.setHours(now.getHours() + 1)
					});
				}
				//convert to numbers
				status.empire.happiness *= 1;
				status.empire.happiness_hour *= 1;
				status.empire.has_new_messages *= 1;
				for(var pKey in status.empire.planets) {
					if(status.empire.planets.hasOwnProperty(pKey)){
						var planet = status.empire.planets[pKey];
						planet.energy_capacity *= 1;
						planet.energy_hour *= 1;
						planet.energy_stored *= 1;
						planet.food_capacity *= 1;
						planet.food_hour *= 1;
						planet.food_stored *= 1;
						planet.happiness *= 1;
						planet.happiness_hour *= 1;
						planet.ore_capacity *= 1;
						planet.ore_hour *= 1;
						planet.ore_stored *= 1;
						planet.waste_capacity *= 1;
						planet.waste_hour *= 1;
						planet.waste_stored *= 1;
						planet.water_capacity *= 1;
						planet.water_hour *= 1;
						planet.water_stored *= 1;
					}
				}
				//add everything from status empire to game empire
				Lang.augmentObject(Lacuna.Game.EmpireData, status.empire, true);

				Lacuna.Menu.update();
				
				if(status.empire.full_status_update_required == 1) {
					Lacuna.Game.GetFullStatus();
				}
			}
		},	
		GetFullStatus : function(callback) {
			var EmpireServ = Game.Services.Empire,
				session = Cookie.getSub("lacuna","session");
			EmpireServ.get_full_status({session_id:session}, {
				success : function(o) {
					Lacuna.Game.ProcessStatus(o.result);
					if(callback && callback.success) {
						callback.success.call(this);
					}
				},
				failure : function(o) {
					if(callback && callback.failure) {
						callback.failure.call(this, o);
					}
					else {
						YAHOO.log(o);
					}
				},
				timeout:Game.Timeout,
				scope:callback && callback.scope || this
			});
		},
		UpdateResources : function() {
			var ED = Lacuna.Game.EmpireData,
				dt = new Date(),
				diff = dt - Lacuna.Game.recTime,
				ratio = (diff / Lacuna.Game.HourMS),
				updateMenu = true;
				
			Lacuna.Game.recTime = dt;
			
			ED.happiness += ED.happiness_hour * ratio;
			
			for(var pKey in ED.planets) {
				if(ED.planets.hasOwnProperty(pKey)){
					var planet = ED.planets[pKey];
					planet.happiness += planet.happiness_hour * ratio;
					if(planet.energy_stored < planet.energy_capacity){
						planet.energy_stored += planet.energy_hour * ratio;
						if(planet.energy_stored > planet.energy_capacity) {
							planet.energy_stored = planet.energy_capacity;
						}
					}
					if(planet.food_stored < planet.food_capacity){
						planet.food_stored += planet.food_hour * ratio;
						if(planet.food_stored > planet.food_capacity) {
							planet.food_stored = planet.food_capacity;
						}
					}
					if(planet.ore_stored < planet.ore_capacity){
						planet.ore_stored += planet.ore_hour * ratio;
						if(planet.ore_stored > planet.ore_capacity) {
							planet.ore_stored = planet.ore_capacity;
						}
					}
					if(planet.waste_stored < planet.waste_capacity){
						planet.waste_stored += planet.waste_hour * ratio;
						if(planet.waste_stored > planet.waste_capacity) {
							planet.waste_stored = planet.waste_capacity;
						}
					}
					if(planet.water_stored < planet.water_capacity){
						planet.water_stored += planet.water_hour * ratio;
						if(planet.water_stored > planet.water_capacity) {
							planet.water_stored = planet.water_capacity;
						}
					}
				}
			}
			//YAHOO.log([diff, ratio]);
			if(updateMenu) {
				Lacuna.Menu.update();
			}
		},
		GetSize : function() {
			var content = document.getElementById("content"),
				width = content.offsetWidth,
				height = document.documentElement.clientHeight - document.getElementById("header").offsetHeight - document.getElementById("footer").offsetHeight;
			return {w:width,h:height};
		},
		Resize : function() {
			if(Lacuna.MapStar.IsVisible()) {
				Lacuna.MapStar.Resize();
			}
			else if(Lacuna.MapPlanet.IsVisible()) {
				Lacuna.MapPlanet.Resize();
			}
		},
		
		Logout : function() {
			var EmpireServ = Lacuna.Game.Services.Empire,
				session = Cookie.getSub("lacuna","session");
				
			clearTimeout(Lacuna.Game.recInt);
			
			EmpireServ.logout({session_id:session},{
				success : function(o){
					YAHOO.log(o);
			
					Cookie.remove("lacuna",{
						domain: "lacunaexpanse.com"
					});
					
					document.getElementById("content").innerHTML = "";
					Lacuna.Game.DoLogin();
				},
				failure : function(o){
					YAHOO.log(["LOGOUT FAILED: ", o]);
				},
				timeout:Game.Timeout
			});
		},
		
		//Cookie functions
		SetLocation : function(id, view) {
			Cookie.setSub("lacuna","locationId", id,{
				domain: "lacunaexpanse.com"
			});
			Cookie.setSub("lacuna","locationView", view,{
				domain: "lacunaexpanse.com"
			});
		}
	};
	
	YAHOO.lacuna.Game = Game;
})();
YAHOO.register("game", YAHOO.lacuna.Game, {version: "1", build: "0"}); 

}