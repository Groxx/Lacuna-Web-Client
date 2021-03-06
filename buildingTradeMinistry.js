YAHOO.namespace("lacuna.buildings");

if (typeof YAHOO.lacuna.buildings.Trade == "undefined" || !YAHOO.lacuna.buildings.Trade) {
	
(function(){
	var Lang = YAHOO.lang,
		Util = YAHOO.util,
		Dom = Util.Dom,
		Event = Util.Event,
		Sel = Util.Selector,
		Pager = YAHOO.widget.Paginator,
		Lacuna = YAHOO.lacuna,
		Game = Lacuna.Game,
		Lib = Lacuna.Library;

	var Trade = function(result){
		Trade.superclass.constructor.call(this, result);
		
		this.service = Game.Services.Buildings.Trade;
		
		this.availableAcceptText = "Accept";
		this.addTradeText = "Add Trade";
		
		this.shipSize = 50000;
		this.planSize = 10000;
		this.spySize = 350;
		this.glyphSize = 100;
		
		this.createEvent("onLoadResources");
		this.createEvent("onLoadGlyphs");
		this.createEvent("onLoadPlans");
		this.createEvent("onLoadShips");
		this.createEvent("onLoadPrisoners");
		
		this.subscribe("onLoad", function() {
			this.getStoredResources();
			this.mine.subscribe("activeChange", this.getMine, this, true);
			this.avail.subscribe("activeChange", this.getAvailable, this, true);
			this.push.subscribe("activeChange", function(e) {
				if(e.newValue) {
					this.getPushShips();
					
					if(!this.pushTabView) {
						this.pushTabView = new YAHOO.widget.TabView("tradePushTabs");
						this.pushTabView.getTab(1).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getGlyphs();
							}
						},this,true);
						this.pushTabView.getTab(2).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getPlans();
							}
						},this,true);
						this.pushTabView.getTab(3).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getShips();
							}
						},this,true);
						this.pushTabView.getTab(4).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getPrisoners();
							}
						},this,true);
						
						this.pushTabView.selectTab(0);
					}
				}
			},this,true);
			this.add.subscribe("activeChange", function(e) {
				if(e.newValue) {
					this.getAddShips();
					
					if(!this.addTabView) {
						this.addTabView = new YAHOO.widget.TabView("tradeAddTabs");
						this.addTabView.getTab(0).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getStoredResources();
							}
						},this,true);
						this.addTabView.getTab(1).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getGlyphs();
							}
						},this,true);
						this.addTabView.getTab(2).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getPlans();
							}
						},this,true);
						this.addTabView.getTab(3).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getPrisoners();
							}
						},this,true);
						this.addTabView.getTab(4).subscribe("activeChange", function(e) {
							if(e.newValue) {
								this.getShips();
							}
						},this,true);
						
						this.addTabView.selectTab(0);
					}
				}
			},this,true);
		}, this, true);
	};

	Lang.extend(Trade, Lacuna.buildings.Building, {
		destroy : function() {
			if(this.availablePager) {
				this.availablePager.destroy();
			}
			if(this.minePage) {
				this.minePage.destroy();
			}
			if(this.acceptVerify) {
				this.acceptVerify.destroy();
			}
			Trade.superclass.destroy.call(this);
		},
		getChildTabs : function() {
			this.mineTabIndex = 3; //array location plus 1 since Production tab is always first
			return [this._getPushTab(), this._getAvailTab(), this._getMineTab(), this._getAddTab()];
		},
		_getPushTab : function() {
			this.push = new YAHOO.widget.Tab({ label: "Push", content: [
			'<div>',
			'	<div id="tradePushTabs" class="yui-navset">',
			'		<ul class="yui-nav">',
			'			<li><a href="#"><em>Resource</em></a></li>',
			'			<li><a href="#"><em>Glyph</em></a></li>',
			'			<li><a href="#"><em>Plan</em></a></li>',
			'			<li><a href="#"><em>Ship</em></a></li>',
			'			<li><a href="#"><em>Prisoner</em></a></li>',
			'		</ul>',
			'		<div class="yui-content">',
			'			<div>',
			'				<label>Type:</label><select id="tradePushResourceName"></select>&nbsp;<label>Quantity:</label><input type="text" id="tradePushResourceQuantity" /><button id="tradePushResourceAdd">Add</button><span id="tradePushResourceMessage"></span>',
			'			</div>',
			'			<div>',
			'				<label>Name:</label><select id="tradePushGlyphName"></select><button id="tradePushGlyphAdd">Add</button>',
			'			</div>',
			'			<div>',
			'				<label>Name:</label><select id="tradePushPlanName"></select><button id="tradePushPlanAdd">Add</button>',
			'			</div>',
			'			<div>',
			'				<label>Name:</label><select id="tradePushShipName"></select><button id="tradePushShipAdd">Add</button>',
			'			</div>',
			'			<div>',
			'				<label>Name:</label><select id="tradePushPrisonerName"></select><button id="tradePushPrisonerAdd">Add</button>',
			'			</div>',
			'		</div>',
			'	</div>',
			'	<ul>',
			'		<li style="margin-bottom:10px;margin-top:5px;"><ul id="tradePushItems" style="border:1px solid #52ACFF" class="clearafter"><li style="float:left;margin:2px;"><label>Pushing:</label></li></ul></li>',
			'		<li style=""><label>Total Cargo:</label><span id="tradePushCargo">0</span></li>',
			'		<li style="margin-bottom:5px;"><label>To Colony:</label><select id="tradePushColony"></select></li>',
			'		<li style="margin-bottom:5px;"><label>With Ship:</label><select id="tradePushShip"></select></li>',
			'		<li style="margin-bottom:5px;"><label>Stay at Colony:</label><input type="checkbox" id="tradePushStay" /></li>',
			'		<li id="tradePushMessage" class="alert"></li>',
			'		<li><button id="tradePushSend">Send</button></li>',
			'	</ul>',
			'</div>'].join('')});

			this.subscribe("onLoadResources", this.populatePushResourceName, this, true);
			this.subscribe("onLoadGlyphs", this.populatePushGlyphName, this, true);
			this.subscribe("onLoadPlans", this.populatePushPlanName, this, true);
			this.subscribe("onLoadShips", this.populatePushShipName, this, true);
			this.subscribe("onLoadPrisoners", this.populatePushPrisonerName, this, true);
			
			Event.onAvailable("tradePushColony", function(){
				var opt = document.createElement("option"),
					planets = Game.EmpireData.planets,
					cp = Game.GetCurrentPlanet(),
					nOpt;
				for(var pId in planets) {
					if(planets.hasOwnProperty(pId) && pId != cp.id){
						nOpt = opt.cloneNode(false);
						nOpt.value = pId;
						nOpt.innerHTML = planets[pId].name;
						this.appendChild(nOpt);
					}
				}
			});
			Event.on("tradePushColony", "change", this.getPushShips, this, true);
			
			Event.on("tradePushResourceAdd", "click", this.PushAddResource, this, true);
			Event.on("tradePushGlyphAdd", "click", this.PushAddGlyph, this, true);
			Event.on("tradePushPlanAdd", "click", this.PushAddPlan, this, true);
			Event.on("tradePushShipAdd", "click", this.PushAddShip, this, true);
			Event.on("tradePushPrisonerAdd", "click", this.PushAddPrisoner, this, true);
			Event.on("tradePushSend", "click", this.Push, this, true);
			
			return this.push;
		},
		_getAvailTab : function() {
			this.avail = new YAHOO.widget.Tab({ label: "Available Trades", content: ['<div>',
				'	<ul class="tradeHeader tradeInfo clearafter">',
				'		<li class="tradeEmpire">Empire</li>',
				'		<li class="tradeOfferedDate">Offered Date</li>',
				'		<li class="tradeAsking">Asking</li>',
				'		<li class="tradeOffer">Offering</li>',
				'		<li class="tradeAccept"></li>',
				'	</ul>',
				'	<div><div id="tradeAvailableDetails"></div></div>',
				'	<div id="tradeAvailablePaginator"></div>',
				'</div>'].join('')});
			
			return this.avail;
		},
		_getMineTab : function() {
			this.mine = new YAHOO.widget.Tab({ label: "My Trades", content: ['<div>',
				'	<ul class="tradeHeader tradeInfo clearafter">',
				'		<li class="tradeOfferedDate">Offered Date</li>',
				'		<li class="tradeAsking">Asking</li>',
				'		<li class="tradeOffer">Offering</li>',
				'		<li class="tradeAccept"></li>',
				'	</ul>',
				'	<div><div id="tradeMineDetails"></div></div>',
				'	<div id="tradeMinePaginator"></div>',
				'</div>'].join('')});
				
			return this.mine;
		},
		_getAddTab : function() {
			this.add = new YAHOO.widget.Tab({ label: "Add Trade", content: ['<div>',
				'<div style="margin-bottom:5px;">You many only select one thing (glyph, plan, prisoner, resource, ship) to offer</div>',
				'<div id="tradeAddTabs" class="yui-navset">',
				'	<ul class="yui-nav">',
				'		<li><a href="#"><em>Resource</em></a></li>',
				'		<li><a href="#"><em>Glyph</em></a></li>',
				'		<li><a href="#"><em>Plan</em></a></li>',
				'		<li><a href="#"><em>Prisoner</em></a></li>',
				'		<li><a href="#"><em>Ship</em></a></li>',
				'	</ul>',
				'	<div class="yui-content">',
				'		<div>',
				'			<label>Type:</label><select id="tradeAddResourceName"></select>&nbsp;<label>Quantity:</label><input type="text" id="tradeAddResourceQuantity" /></span>',
				'		</div>',
				'		<div>',
				'			<label>Name:</label><select id="tradeAddGlyphName"></select>',
				'		</div>',
				'		<div>',
				'			<label>Name:</label><select id="tradeAddPlanName"></select>',
				'		</div>',
				'		<div>',
				'			<label>Name:</label><select id="tradeAddPrisonerName"></select>',
				'		</div>',
				'		<div>',
				'			<label>Name:</label><select id="tradeAddShipName"></select>',
				'		</div>',
				'	</div>',
				'</div>',
				'<ul style="border:1px solid #52ACFF;">',
				'	<li style="margin: 5px 0;padding:2px;"><label style="font-weight:bold">Asking:</label><select id="tradeAddAskingName"></select>&nbsp;<label>Quantity:</label><input type="text" id="tradeAddAskingQuantity" /></li>',
				'	<li style="margin: 5px 0;padding:2px;"><label>With Ship:</label><select id="tradeAddShip"></select></li>',
				'</ul>',
				'<ul>',
				'	<li id="tradeAddMessage" class="alert"></li>',
				'	<li><button id="tradeAdd">',this.addTradeText,'</button></li>',
				'</ul>',
			'</div>'].join('')});
			
			this.subscribe("onLoadResources", this.populateAddResourceName, this, true);
			this.subscribe("onLoadGlyphs", this.populateAddGlyphName, this, true);
			this.subscribe("onLoadPlans", this.populateAddPlanName, this, true);
			this.subscribe("onLoadPrisoners", this.populateAddPrisonerName, this, true);
			this.subscribe("onLoadShips", this.populateAddShipName, this, true);
			
			Event.onAvailable("tradeAddAskingName", this.populateAddAskingName, this, true);
			Event.on("tradeAdd", "click", this.AddTrade, this, true);
			return this.add;
		},
		
		getGlyphs : function(force) {
			if(force || !this.glyphs) {
				Lacuna.Pulser.Show();
				this.service.get_glyphs({
						session_id: Game.GetSession(""),
						building_id: this.building.id
					},{
					success : function(o){
						YAHOO.log(o, "info", "Trade.getGlyphs.success");
						this.rpcSuccess(o);
						this.glyphs = o.result.glyphs;
						this.fireEvent("onLoadGlyphs");
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.getGlyphs.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		getPlans : function(force) {
			if(force || !this.plans) {
				Lacuna.Pulser.Show();
				this.service.get_plans({
						session_id: Game.GetSession(""),
						building_id: this.building.id
					},{
					success : function(o){
						YAHOO.log(o, "info", "Trade.getPlans.success");
						this.rpcSuccess(o);
						this.plans = o.result.plans;
						this.fireEvent("onLoadPlans");
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.getPlans.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		getPrisoners : function(force) {
			if(force || !this.prisoners) {
				Lacuna.Pulser.Show();
				this.service.get_prisoners({
						session_id: Game.GetSession(""),
						building_id: this.building.id
					},{
					success : function(o){
						YAHOO.log(o, "info", "Trade.getPrisoners.success");
						this.rpcSuccess(o);
						this.prisoners = o.result.prisoners;
						this.fireEvent("onLoadPrisoners");
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.getPrisoners.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		getShips : function(force) {
			if(force || !this.ships) {
				Lacuna.Pulser.Show();
				this.service.get_ships({
						session_id: Game.GetSession(""),
						building_id: this.building.id
					},{
					success : function(o){
						YAHOO.log(o, "info", "Trade.getShips.success");
						this.rpcSuccess(o);
						this.ships = o.result.ships;
						this.fireEvent("onLoadShips");
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.getShips.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		getStoredResources : function(force) {
			if(force || !this.resources) {
				Lacuna.Pulser.Show();
				this.service.get_stored_resources({
						session_id: Game.GetSession(""),
						building_id: this.building.id
					},{
					success : function(o){
						YAHOO.log(o, "info", "Trade.getStoredResources.success");
						this.rpcSuccess(o);
						this.resources = o.result.resources;
						this.fireEvent("onLoadResources");
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.getStoredResources.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		
		//View Available
		_buildAcceptCaptcha : function() {
			var panelId = "tradeAcceptVerify";
			
			var panel = document.createElement("div");
			panel.id = panelId;
			panel.innerHTML = ['<div class="hd">Continue</div>',
				'<div class="bd">',
				'	<div style="margin:5px 0;padding:2px;">',
				'		<div id="tradeAcceptVerifymessage"></div>',
				'		<div id="tradeAcceptVerifycaptcha" style="margin:5px 0;"></div>',
				'		<label for="tradeAcceptVerifyanswer">Answer:</label><input type="text" id="tradeAcceptVerifyanswer" />',
				'	</div><hr />',
				'	<div style="margin:5px 0;padding:2px;"><label>Select Ship to retrieve trade:</label><select id="tradeAcceptVerifyShip"></select></div>',
				'	<div id="tradeAcceptVerifyerror" class="alert" style="text-align:right;"></div>',
				'</div>'].join('');
			document.body.insertBefore(panel, document.body.firstChild);
			
			this.acceptVerify = new YAHOO.widget.Dialog(panelId, {
				constraintoviewport:true,
				visible:false,
				draggable:true,
				effect:Game.GetContainerEffect(),
				modal:true,
				fixedcenter:true,
				close:true,
				width:"400px",
				underlay:false,
				zIndex:10000,
				context:["header","tl","bl"]
			});

			this.acceptVerify.renderEvent.subscribe(function(){
				this.ship = Dom.get("tradeAcceptVerifyShip");
				this.message = Dom.get("tradeAcceptVerifymessage");
				this.captcha = Dom.get("tradeAcceptVerifycaptcha");
				this.answer = Dom.get("tradeAcceptVerifyanswer");
				this.error = Dom.get("tradeAcceptVerifyerror");
			});
			this.acceptVerify.hideEvent.subscribe(function(){
				this.message.innerHTML = "";
				this.captcha.innerHTML = "";
				this.answer.value = "";
			});
			this.acceptVerify.load = function(oSelf) {
				var captcha = oSelf.Self.availableTrades.captcha;
				
				this.cfg.setProperty("buttons", [ { text:"Accept", handler:{fn:oSelf.Self.AvailableAcceptVerified, scope:oSelf} },
					{ text:"Cancel", handler:this.cancel, isDefault:true }]);
				
				this.getShips(oSelf);
				this.message.innerHTML = ['Solve the problem below to accept the trade asking for <span style="font-weight:bold">', oSelf.Trade.ask_description, '</span> and offering <span style="font-weight:bold">', oSelf.Trade.offer_description,'</span>.'].join('');
				this.setCaptcha(captcha.url);
				
				this.show();
			};
			this.acceptVerify.getShips = function(oSelf) {
				Lacuna.Pulser.Show();
				
				oSelf.Self.service.get_trade_ships({
					session_id: Game.GetSession(""),
					building_id: oSelf.Self.building.id,
					target_body_id: oSelf.Trade.body_id.id
				},{
					success : function(o){
						this.rpcSuccess(o);
						
						var elm = Dom.get("tradeAcceptVerifyShip"),
							opt = document.createElement("option"),
							ships = o.result.ships,
							nOpt;
							
						if(elm && ships) {
							var selectedVal = Lib.getSelectedOptionValue(elm);
							elm.options.length = 0;	
							for(var x=0; x < ships.length; x++) {
								var obj = ships[x];
								nOpt = opt.cloneNode(false);
								nOpt.value = obj.id;
								nOpt.innerHTML = [obj.name, ' (', obj.type_human, ' - Hold:', obj.hold_size, ' - Speed:', obj.speed, ')'].join('');
								nOpt.selected = selectedVal == obj.id;
								elm.appendChild(nOpt);
							}
						}
						
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:oSelf.Self
				});
			};
			this.acceptVerify.setCaptcha = function(url) {
				this.captcha.innerHTML = ['<img src="', url, '" alt="Loading captcha.  If it does not appear please cancel the trade and try again." />'].join('');
			};
			this.acceptVerify.setError = function(msg) {
				this.answer.value = "";
				this.error.innerHTML = msg;
				var a = new Util.Anim(this.error, {opacity:{from:1,to:0}}, 4);
				a.onComplete.subscribe(function(){
					this.error.innerHTML = "";
					//Dom.setStyle(this.error, "opacity", 1);
				}, this, true);
				a.animate();
			};
			this.acceptVerify.getAnswer = function() {
				return this.answer.value;
			};
			this.acceptVerify.getSelectedShipId = function() {
				return Lib.getSelectedOptionValue(this.ship);
			};
			this.acceptVerify.render();
			Game.OverlayManager.register(this.acceptVerify);
		},
		getAvailable : function(e) {
			if(e.newValue) {
				Lacuna.Pulser.Show();
				this.service.view_available_trades({session_id:Game.GetSession(),building_id:this.building.id,page_number:1}, {
					success : function(o){
						YAHOO.log(o, "info", "Trade.view_available_trades.success");
						Lacuna.Pulser.Hide();
						this.rpcSuccess(o);
						
						delete o.result.status; //get rid of status after we process it, since it's big
						this.availableTrades = o.result; //store: trades=[], trade_count = 1, page_number=1,  captcha = {guid, url}
						
						this.availablePager = new Pager({
							rowsPerPage : 25,
							totalRecords: o.result.trade_count,
							containers  : 'tradeAvailablePaginator',
							template : "{PreviousPageLink} {PageLinks} {NextPageLink}",
							alwaysVisible : false

						});
						this.availablePager.subscribe('changeRequest',this.AvailableHandlePagination, this, true);
						this.availablePager.render();
						
						this.AvailablePopulate();
					},
					failure : function(o){
						YAHOO.log(o, "error", "Trade.view_available_trades.failure");
						Lacuna.Pulser.Hide();
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		AvailablePopulate : function() {
			var details = Dom.get("tradeAvailableDetails");
			
			if(details) {
				var trades = this.availableTrades.trades,
					ul = document.createElement("ul"),
					li = document.createElement("li");
					
				Event.purgeElement(details);
				details.innerHTML = "";
								
				for(var i=0; i<trades.length; i++) {
					var trade = trades[i],
						nUl = ul.cloneNode(false),
						nLi = li.cloneNode(false);
						
					nUl.Trade = trade;
					Dom.addClass(nUl, "tradeInfo");
					Dom.addClass(nUl, "clearafter");

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeEmpire");
					nLi.innerHTML = trade.empire.name;
					Event.on(nLi, "click", this.EmpireProfile, trade.empire);
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeOfferedDate");
					nLi.innerHTML = Lib.formatServerDateShortTime(trade.date_offered);
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeAsking");
					nLi.innerHTML = trade.ask_description;
					nUl.appendChild(nLi);
					
					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeOffer");
					nLi.innerHTML = trade.offer_description;
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeAction");
					var bbtn = document.createElement("button");
					bbtn.setAttribute("type", "button");
					bbtn.innerHTML = this.availableAcceptText;
					bbtn = nLi.appendChild(bbtn);
					Event.on(bbtn, "click", this.AvailableAccept, {Self:this,Trade:trade,Line:nUl}, true);

					nUl.appendChild(nLi);
								
					details.appendChild(nUl);
					
				}
				
				//wait for tab to display first
				setTimeout(function() {
					if(details.parentNode.clientHeight > 300) {
						Dom.setStyle(details.parentNode,"height","300px");
						Dom.setStyle(details.parentNode,"overflow-y","auto");
					}
				},10);
			}
		},
		AvailableHandlePagination : function(newState) {
			Lacuna.Pulser.Show();
			this.service.view_available_trades({
				session_id:Game.GetSession(),
				building_id:this.building.id,
				page_number:newState.page
			}, {
				success : function(o){
					YAHOO.log(o, "info", "Trade.view_available_trades.success");
					Lacuna.Pulser.Hide();
					this.rpcSuccess(o);
					
					delete o.result.status; //get rid of status after we process it, since it's big
					this.availableTrades = o.result; //store: trades=[], trade_count = 1, page_number=1,  captcha = {guid, url}
					
					this.AvailablePopulate();
				},
				failure : function(o){
					YAHOO.log(o, "error", "Trade.view_available_trades.failure");
					Lacuna.Pulser.Hide();
					this.rpcFailure(o);
				},
				timeout:Game.Timeout,
				scope:this
			});
	 
			// Update the Paginator's state
			this.availablePager.setState(newState);
		},
		AvailableAccept : function() {
			if(!this.Self.acceptVerify) {
				this.Self._buildAcceptCaptcha.call(this.Self);
			}
			
			this.Self.acceptVerify.load(this);
		},
		AvailableAcceptVerified : function() {
			Lacuna.Pulser.Show();
			this.Self.service.accept_trade({
				session_id:Game.GetSession(""),
				building_id:this.Self.building.id,
				trade_id:this.Trade.id,
				captcha_guid:this.Self.availableTrades.captcha.guid,
				captcha_solution:this.Self.acceptVerify.getAnswer(),
				options: {
					ship_id: this.Self.acceptVerify.getSelectedShipId()
				}
			}, {
				success : function(o){
					YAHOO.log(o, "info", "Trade.accept_trade.success");
					this.Self.fireEvent("onMapRpc", o.result);
					this.Self.acceptVerify.hide();
					//force get the new availabe list after accepting so we get a new captcha
					this.Self.getAvailable({newValue:true});
					Lacuna.Pulser.Hide();
				},
				failure : function(o){
					Lacuna.Pulser.Hide();
					YAHOO.log(o, "error", "Trade.accept_trade.failure");
					
					if(o.error.code == 1014) {
						this.Self.availableTrades.captcha = o.error.data;
						this.Self.acceptVerify.setCaptcha(o.error.data.url);
						this.Self.acceptVerify.setError(o.error.message);
					}
					else {					
						this.Self.fireEvent("onMapRpcFailed", o);
					}
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		EmpireProfile : function(e, empire) {
			Lacuna.Info.Empire.Load(empire.id);
		},
		
		//View Mine
		getMine : function(e) {
			if(e.newValue) {
				Lacuna.Pulser.Show();
				this.service.view_my_trades({session_id:Game.GetSession(),building_id:this.building.id,page_number:1}, {
					success : function(o){
						YAHOO.log(o, "info", "Trade.view_my_trades.success");
						Lacuna.Pulser.Hide();
						this.rpcSuccess(o);
						
						delete o.result.status; //get rid of status after we process it, since it's big
						this.mineTrades = o.result; //store: trades=[], trade_count = 1, page_number=1
						
						this.minePage = new Pager({
							rowsPerPage : 25,
							totalRecords: o.result.trade_count,
							containers  : 'tradeMinePaginator',
							template : "{PreviousPageLink} {PageLinks} {NextPageLink}",
							alwaysVisible : false

						});
						this.minePage.subscribe('changeRequest',this.MineHandlePagination, this, true);
						this.minePage.render();
						
						this.MinePopulate();
					},
					failure : function(o){
						YAHOO.log(o, "error", "Trade.view_my_trades.failure");
						Lacuna.Pulser.Hide();
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		MinePopulate : function() {
			var details = Dom.get("tradeMineDetails");
			
			if(details) {
				var trades = this.mineTrades.trades,
					ul = document.createElement("ul"),
					li = document.createElement("li");
					
				Event.purgeElement(details);
				details.innerHTML = "";
								
				for(var i=0; i<trades.length; i++) {
					var trade = trades[i],
						nUl = ul.cloneNode(false),
						nLi = li.cloneNode(false);
						
					nUl.Trade = trade;
					Dom.addClass(nUl, "tradeInfo");
					Dom.addClass(nUl, "clearafter");

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeOfferedDate");
					nLi.innerHTML = Lib.formatServerDate(trade.date_offered);
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeAsking");
					nLi.innerHTML = trade.ask_description;
					nUl.appendChild(nLi);
					
					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeOffer");
					nLi.innerHTML = trade.offer_description;
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"tradeAction");
					var bbtn = document.createElement("button");
					bbtn.setAttribute("type", "button");
					bbtn.innerHTML = "Withdraw";
					bbtn = nLi.appendChild(bbtn);
					Event.on(bbtn, "click", this.MineWithdraw, {Self:this,Trade:trade,Line:nUl}, true);

					nUl.appendChild(nLi);
								
					details.appendChild(nUl);
					
				}
				
				//wait for tab to display first
				setTimeout(function() {
					if(details.parentNode.clientHeight > 300) {
						Dom.setStyle(details.parentNode,"height","300px");
						Dom.setStyle(details.parentNode,"overflow-y","auto");
					}
				},10);
			}
		},
		MineHandlePagination : function(newState) {
			Lacuna.Pulser.Show();
			this.service.view_my_trades({
				session_id:Game.GetSession(),
				building_id:this.building.id,
				page_number:newState.page
			}, {
				success : function(o){
					YAHOO.log(o, "info", "Trade.view_available_trades.success");
					Lacuna.Pulser.Hide();
					this.rpcSuccess(o);
					
					delete o.result.status; //get rid of status after we process it, since it's big
					this.mineTrades = o.result; //store: trades=[], trade_count = 1, page_number=1
					
					this.MinePopulate();
				},
				failure : function(o){
					YAHOO.log(o, "error", "Trade.view_available_trades.failure");
					Lacuna.Pulser.Hide();
					this.rpcFailure(o);
				},
				timeout:Game.Timeout,
				scope:this
			});
	 
			// Update the Paginator's state
			this.minePage.setState(newState);
		},
		MineWithdraw : function() {
			if(confirm(['Are you sure you want to withdraw the trade asking for ', this.Trade.ask_description, ' and offering ', this.Trade.offer_description,'?'].join(''))) {
				Lacuna.Pulser.Show();
				this.Self.service.withdraw_trade({
					session_id:Game.GetSession(""),
					building_id:this.Self.building.id,
					trade_id:this.Trade.id
				}, {
					success : function(o){
						YAHOO.log(o, "info", "Trade.withdraw_trade.success");
						this.Self.fireEvent("onMapRpc", o.result);
						var trades = this.Self.mineTrades.trades;
						for(var i=0; i<trades.length; i++) {
							if(trades[i].id == this.Trade.id) {
								trades.splice(i,1);
								break;
							}
						}
						this.Line.parentNode.removeChild(this.Line);
						Lacuna.Pulser.Hide();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.withdraw_trade.failure");
						
						this.Self.fireEvent("onMapRpcFailed", o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		
		//Add trade
		populateAddResourceName : function() {
			var elm = Dom.get("tradeAddResourceName"),
				opt = document.createElement("option"),
				nOpt, optGroup;
				
			if(elm) {
				elm.options.length = 0;
				elm.innerHTML = "";
				for(var r in Lib.ResourceTypes) {
					if(Lib.ResourceTypes.hasOwnProperty(r)) {
						var resource = Lib.ResourceTypes[r];
						if(Lang.isArray(resource)) {
							optGroup = document.createElement("optgroup");
							optGroup.label = r.titleCaps();
							
							for(var x=0; x < resource.length; x++) {
								var name = resource[x];
								if(this.resources[name]) {
									nOpt = opt.cloneNode(false);
									nOpt.value = name;
									nOpt.innerHTML = [name.titleCaps(), ' (', this.resources[name], ')'].join('');
									optGroup.appendChild(nOpt);
								}
							}
							
							elm.appendChild(optGroup);
						}
						else if(this.resources[r]) {
							nOpt = opt.cloneNode(false);
							nOpt.value = r;
							nOpt.innerHTML = [r.titleCaps(), ' (', this.resources[r], ')'].join('');
							elm.appendChild(nOpt);
						}
					}
				}
			}
		},
		populateAddGlyphName : function() {
			var elm = Dom.get("tradeAddGlyphName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				elm.options.length = 0;
				for(var x=0; x < this.glyphs.length; x++) {
					var obj = this.glyphs[x];
					nOpt = opt.cloneNode(false);
					nOpt.Glyph = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = obj.type.titleCaps();
					elm.appendChild(nOpt);
				}
			}
		},
		populateAddPlanName : function() {
			var elm = Dom.get("tradeAddPlanName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				elm.options.length = 0;	
				for(var x=0; x < this.plans.length; x++) {
					var obj = this.plans[x];
					nOpt = opt.cloneNode(false);
					nOpt.Plan = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name, ' ', obj.level].join('');
					elm.appendChild(nOpt);
				}
			}
		},
		populateAddPrisonerName : function() {
			var elm = Dom.get("tradeAddPrisonerName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				elm.options.length = 0;	
				for(var x=0; x < this.prisoners.length; x++) {
					var obj = this.prisoners[x];
					nOpt = opt.cloneNode(false);
					nOpt.Prisoner = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name, ' (', obj.level, ')'].join('');
					elm.appendChild(nOpt);
				}
			}
		},
		populateAddShipName : function() {
			var elm = Dom.get("tradeAddShipName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				elm.options.length = 0;	
				for(var x=0; x < this.ships.length; x++) {
					var obj = this.ships[x];
					nOpt = opt.cloneNode(false);
					nOpt.Ship = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name, ' (', obj.type_human, ' - Hold:', obj.hold_size, ' - Speed:', obj.speed, ')'].join('');
					elm.appendChild(nOpt);
				}
			}
		},
		populateAddAskingName : function() {
			var elm = Dom.get("tradeAddAskingName"),
				opt = document.createElement("option"),
				nOpt, optGroup;
				
			for(var r in Lib.ResourceTypes) {
				if(Lib.ResourceTypes.hasOwnProperty(r)) {
					var resource = Lib.ResourceTypes[r];
					if(Lang.isArray(resource)) {
						optGroup = document.createElement("optgroup");
						optGroup.label = r.titleCaps();
						
						for(var x=0; x < resource.length; x++) {
							nOpt = opt.cloneNode(false);
							nOpt.value = resource[x];
							nOpt.innerHTML = resource[x].titleCaps();
							optGroup.appendChild(nOpt);
						}
						
						elm.appendChild(optGroup);
					}
					else {
						nOpt = opt.cloneNode(false);
						nOpt.value = r;
						nOpt.innerHTML = r.titleCaps();
						elm.appendChild(nOpt);
					}
				}
			}
		},
		getAddShips : function() {
			Lacuna.Pulser.Show();
			
			this.service.get_trade_ships({
				session_id: Game.GetSession(""),
				building_id: this.building.id
			},{
				success : function(o){
					this.rpcSuccess(o);
					
					var elm = Dom.get("tradeAddShip"),
						opt = document.createElement("option"),
						ships = o.result.ships,
						nOpt;
						
					if(elm && ships) {
						var selectedVal = Lib.getSelectedOptionValue(elm);
						elm.options.length = 0;	
						for(var x=0; x < ships.length; x++) {
							var obj = ships[x];
							nOpt = opt.cloneNode(false);
							nOpt.value = obj.id;
							nOpt.innerHTML = [obj.name, ' (', obj.type_human, ' - Hold:', obj.hold_size, ' - Speed:', obj.speed, ')'].join('');
							nOpt.selected = selectedVal == obj.id;
							elm.appendChild(nOpt);
						}
					}
					
					Lacuna.Pulser.Hide();
				},
				failure : function(o){
					Lacuna.Pulser.Hide();
					this.rpcFailure(o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		AddTrade : function() {
			var qVal = Dom.get("tradeAddAskingQuantity").value*1;
			if(!Lang.isNumber(qVal) || qVal <= 0) {
				Dom.get("tradeAddMessage").innerHTML = "Quantity of asking resource must be a number and greater than 0";
				return;
			}
			else {
				Dom.get("tradeAddMessage").innerHTML = "";
			}
				
			var data = {
				session_id:Game.GetSession(""),
				building_id:this.building.id,
				ask: {
					type:Lib.getSelectedOptionValue("tradeAddAskingName"),
					quantity:qVal
				}
			};
			
			switch(this.addTabView.get("activeIndex")) {
				case 1:
					data.offer = {
						type:"glyph",
						glyph_id:Lib.getSelectedOptionValue("tradeAddGlyphName")
					};
					break;
				case 2:
					data.offer = {
						type:"plan",
						plan_id:Lib.getSelectedOptionValue("tradeAddPlanName")
					};
					break;
				case 3:
					data.offer = {
						type:"prisoner",
						prisoner_id:Lib.getSelectedOptionValue("tradeAddPrisonerName")
					};
					break;
				case 4:
					data.offer = {
						type:"ship",
						ship_id:Lib.getSelectedOptionValue("tradeAddShipName")
					};
					break;
				default:
					var offerQVal = Dom.get("tradeAddResourceQuantity").value*1;
					if(!Lang.isNumber(offerQVal) || offerQVal <= 0) {
						Dom.get("tradeAddMessage").innerHTML = "Quantity of offering resource must be a number and greater than 0";
						return;
					}
					else {
						Dom.get("tradeAddMessage").innerHTML = "";
					}
					data.offer = {
						type:Lib.getSelectedOptionValue("tradeAddResourceName"),
						quantity:offerQVal
					};
					break;
			}
			
			Lacuna.Pulser.Show();
			this.service.add_trade(data, {
				success : function(o){
					YAHOO.log(o, "info", "Trade.add_trade.success");
					this.rpcSuccess(o);
					delete this.glyphs;
					delete this.plans;
					delete this.prisoners;
					delete this.ships;
					delete this.resources;
					Dom.get("tradeAddResourceQuantity").value = "";
					//Dom.get("tradeAddAskingName").selectedIndex = -1;
					Dom.get("tradeAddAskingQuantity").value = "";
					this.fireEvent("onSelectTab", this.mineTabIndex);
					Lacuna.Pulser.Hide();
				},
				failure : function(o){
					Lacuna.Pulser.Hide();
					YAHOO.log(o, "error", "Trade.add_trade.failure");
					
					this.rpcFailure(o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		
		//Push Resources
		populatePushResourceName : function() {
			var elm = Dom.get("tradePushResourceName"),
				opt = document.createElement("option"),
				nOpt, optGroup;
				
			if(elm) {
				var selectedVal = Lib.getSelectedOptionValue(elm);
				elm.options.length = 0;
				elm.innerHTML = "";
				for(var r in Lib.ResourceTypes) {
					if(Lib.ResourceTypes.hasOwnProperty(r)) {
						var resource = Lib.ResourceTypes[r];
						if(Lang.isArray(resource)) {
							optGroup = document.createElement("optgroup");
							optGroup.label = r.titleCaps();
							
							for(var x=0; x < resource.length; x++) {
								var name = resource[x];
								if(this.resources[name]) {
									nOpt = opt.cloneNode(false);
									nOpt.value = name;
									nOpt.innerHTML = [name.titleCaps(), ' (', this.resources[name], ')'].join('');
									nOpt.selected = selectedVal == name;
									optGroup.appendChild(nOpt);
								}
							}
							
							elm.appendChild(optGroup);
						}
						else if(this.resources[r] && resource) {
							nOpt = opt.cloneNode(false);
							nOpt.value = r;
							nOpt.innerHTML = [r.titleCaps(), ' (', this.resources[r], ')'].join('');
							nOpt.selected = selectedVal == r;
							elm.appendChild(nOpt);
						}
					}
				}
			}
		},
		populatePushGlyphName : function() {
			var elm = Dom.get("tradePushGlyphName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				var selectedVal = Lib.getSelectedOptionValue(elm);
				elm.options.length = 0;
				for(var x=0; x < this.glyphs.length; x++) {
					var obj = this.glyphs[x];
					nOpt = opt.cloneNode(false);
					nOpt.Glyph = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = obj.type.titleCaps();
					nOpt.selected = selectedVal == obj.id;
					elm.appendChild(nOpt);
				}
			}
		},
		populatePushPlanName : function() {
			var elm = Dom.get("tradePushPlanName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				var selectedVal = Lib.getSelectedOptionValue(elm);
				elm.options.length = 0;	
				for(var x=0; x < this.plans.length; x++) {
					var obj = this.plans[x];
					nOpt = opt.cloneNode(false);
					nOpt.Plan = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name, ' ', obj.level].join('');
					nOpt.selected = selectedVal == obj.id;
					elm.appendChild(nOpt);
				}
			}
		},
		populatePushShipName : function() {
			var elm = Dom.get("tradePushShipName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				var selectedVal = Lib.getSelectedOptionValue(elm);
				elm.options.length = 0;	
				for(var x=0; x < this.ships.length; x++) {
					var obj = this.ships[x];
					nOpt = opt.cloneNode(false);
					nOpt.Ship = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name].join('');
					nOpt.selected = selectedVal == obj.id;
					elm.appendChild(nOpt);
				}
			}
		},
		populatePushPrisonerName : function() {
			var elm = Dom.get("tradePushPrisonerName"),
				opt = document.createElement("option"),
				nOpt;
				
			if(elm) {
				var selectedVal = Lib.getSelectedOptionValue(elm);
				elm.options.length = 0;	
				for(var x=0; x < this.prisoners.length; x++) {
					var obj = this.prisoners[x];
					nOpt = opt.cloneNode(false);
					nOpt.Prisoner = obj;
					nOpt.value = obj.id;
					nOpt.innerHTML = [obj.name, ' ', obj.level].join('');
					nOpt.selected = selectedVal == obj.id;
					elm.appendChild(nOpt);
				}
			}
		},
		getPushShips : function() {
			Lacuna.Pulser.Show();
			var targetId = Lib.getSelectedOptionValue("tradePushColony");
			
			this.service.get_trade_ships({
				session_id: Game.GetSession(""),
				building_id: this.building.id,
				target_body_id: targetId
			},{
				success : function(o){
					this.rpcSuccess(o);
					
					var elm = Dom.get("tradePushShip"),
						opt = document.createElement("option"),
						ships = o.result.ships,
						nOpt;
						
					if(elm && ships) {
						var selectedVal = Lib.getSelectedOptionValue(elm);
						elm.options.length = 0;	
						for(var x=0; x < ships.length; x++) {
							var obj = ships[x];
							nOpt = opt.cloneNode(false);
							nOpt.value = obj.id;
							nOpt.innerHTML = [obj.name, ' (', obj.type_human, ' - Hold:', obj.hold_size, ' - Estimated Travel Time:', Lib.formatTime(obj.estimated_travel_time), ')'].join('');
							nOpt.selected = selectedVal == obj.id;
							elm.appendChild(nOpt);
						}
					}
					
					Lacuna.Pulser.Hide();
				},
				failure : function(o){
					Lacuna.Pulser.Hide();
					this.rpcFailure(o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		updatePushCargo : function(byVal) {
			var c = Dom.get("tradePushCargo"),
				cv = c.innerHTML*1;
			c.innerHTML = cv + byVal;
		},
		PushAddResource : function(){
			var opt = Lib.getSelectedOption("tradePushResourceName"),
				c = Dom.get("tradePushItems"),
				q = Dom.get("tradePushResourceQuantity");
			if(opt && c && q) {
				var qVal = q.value*1;
				if(!Lang.isNumber(qVal) || qVal <= 0) {
					Dom.get("tradePushResourceMessage").innerHTML = "Quantity of resource must be a number and greater than 0";
					return;
				}
				else {
					Dom.get("tradePushResourceMessage").innerHTML = "";
				}
				
				var item = document.createElement("li"),
					del = item.appendChild(document.createElement("div")),
					content = item.appendChild(document.createElement("div"));
				item.id = "tradeResource-" + opt.value;
				if(Sel.query("#"+item.id, c).length == 0) {
					Dom.addClass(item, "tradeItem");
					Dom.addClass(del, "tradeDelete");
					Event.on(del, "click", function(e){
						var elm = Event.getTarget(e),
							item = elm.parentNode;
						this.updatePushCargo(item.Object.quantity * -1);
						item.parentNode.removeChild(item);
					}, this, true);
					item.Object = {type:opt.value, quantity:qVal};
					content.innerHTML = [opt.value.titleCaps(), ' (', q.value, ')'].join('');
					c.appendChild(item);
					this.updatePushCargo(qVal);
				}
			}
		},
		PushAddGlyph : function(){
			var opt = Lib.getSelectedOption("tradePushGlyphName"),
				c = Dom.get("tradePushItems");
			if(opt && c) {
				var item = document.createElement("li"),
					del = item.appendChild(document.createElement("div")),
					content = item.appendChild(document.createElement("div"));
				item.id = "tradeGlyph-" + opt.value;
				if(Sel.query("#"+item.id, c).length == 0) {
					Dom.addClass(item, "tradeItem");
					Dom.addClass(del, "tradeDelete");
					Event.on(del, "click", function(){ 
						this.updatePushCargo(this.glyphSize*-1);
						item.parentNode.removeChild(item); 
					}, this, true);
					item.Object = {glyph_id:opt.value, type:"glyph"};
					content.innerHTML = opt.innerHTML;
					c.appendChild(item);
					this.updatePushCargo(this.glyphSize);
				}
			}
		},
		PushAddPlan : function(){
			var opt = Lib.getSelectedOption("tradePushPlanName"),
				c = Dom.get("tradePushItems");
			if(opt && c) {
				var item = document.createElement("li"),
					del = item.appendChild(document.createElement("div")),
					content = item.appendChild(document.createElement("div"));
				item.id = "tradePlan-" + opt.value;
				if(Sel.query("#"+item.id, c).length == 0) {
					Dom.addClass(item, "tradeItem");
					Dom.addClass(del, "tradeDelete");
					Event.on(del, "click", function(){ 
						this.updatePushCargo(this.planSize*-1);
						item.parentNode.removeChild(item); 
					}, this, true);
					item.Object = {plan_id:opt.value, type:"plan"};
					content.innerHTML = opt.innerHTML;
					c.appendChild(item);
					this.updatePushCargo(this.planSize);
				}
			}
		},
		PushAddShip : function(){
			var opt = Lib.getSelectedOption("tradePushShipName"),
				c = Dom.get("tradePushItems");
			if(opt && c) {
				var item = document.createElement("li"),
					del = item.appendChild(document.createElement("div")),
					content = item.appendChild(document.createElement("div"));
				item.id = "tradeShip-" + opt.value;
				if(Sel.query("#"+item.id, c).length == 0) {
					Dom.addClass(item, "tradeItem");
					Dom.addClass(del, "tradeDelete");
					Event.on(del, "click", function(){ 
						this.updatePushCargo(this.shipSize*-1);
						item.parentNode.removeChild(item); 
					}, this, true);
					item.Object = {ship_id:opt.value, type:"ship"};
					content.innerHTML = opt.innerHTML;
					c.appendChild(item);
					this.updatePushCargo(this.shipSize);
				}
			}
		},
		PushAddPrisoner : function(){
			var opt = Lib.getSelectedOption("tradePushPrisonerName"),
				c = Dom.get("tradePushItems");
			if(opt && c) {
				var item = document.createElement("li"),
					del = item.appendChild(document.createElement("div")),
					content = item.appendChild(document.createElement("div"));
				item.id = "tradePrisoner-" + opt.value;
				if(Sel.query("#"+item.id, c).length == 0) {
					Dom.addClass(item, "tradeItem");
					Dom.addClass(del, "tradeDelete");
					Event.on(del, "click", function(){ 
						this.updatePushCargo(this.spySize*-1);
						item.parentNode.removeChild(item); 
					}, this, true);
					item.Object = {prisoner_id:opt.value, type:"prisoner"};
					content.innerHTML = opt.innerHTML;
					c.appendChild(item);
					this.updatePushCargo(this.spySize);
				}
			}
		},
		Push : function() {
			var data = {
					session_id: Game.GetSession(""),
					building_id: this.building.id,
					target_id: Lib.getSelectedOptionValue(Dom.get("tradePushColony")),
					options: {
						ship_id: Lib.getSelectedOptionValue(Dom.get("tradePushShip")),
						stay: Dom.get("tradePushStay").checked ? 1 : 0
					}
				},
				lis = Sel.query("li","tradePushItems"),
				items = [],
				hasResources, hasPlans, hasGlyphs;
				
			for(var n=0; n<lis.length; n++) {
				if(lis[n].Object) {
					items[n] = lis[n].Object;
					switch(items[n].type) {
						case "plan":
							hasPlanes = true;
							break;
						case "glyph":
							hasGlyphs = true;
							break;
						default:
							hasResources = true;
							break;
					}
				}
			}
			data.items = items;
			
			if(data.items.length == 0) {
				Dom.get("tradePushMessage").innerHTML = "Must add items to send to colony.";
			}
			else {
				Dom.get("tradePushMessage").innerHTML = "";
				Lacuna.Pulser.Show();
				this.service.push_items(data, {
					success : function(o){
						YAHOO.log(o, "info", "Trade.Push.success");
						this.rpcSuccess(o);
						
						for(var n=0; n<lis.length; n++) {
							if(lis[n].Object) {
								Event.purgeElement(lis[n]);
								lis[n].parentNode.removeChild(lis[n]);
							}
						}
						Dom.get("tradePushResourceQuantity").value = "";
						Dom.get("tradePushCargo").innerHTML = "";
						
						if(hasResources) {
							this.getStoredResources(true);
						}
						if(hasPlans) {
							this.getPlans(true);
						}
						if(hasGlyphs) {
							this.getGlyphs(true);
						}
						
						var msg = Dom.get("tradePushMessage");
						msg.innerHTML = ["Successfully pushed to ", Lib.getSelectedOption(Dom.get("tradePushColony")).innerHTML, '.'].join('');
						Lib.fadeOutElm("tradePushMessage");
						Lacuna.Pulser.Hide();
						//get new ships since we just sent one
						this.getPushShips();
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						YAHOO.log(o, "error", "Trade.Push.failure");
						
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		}
	
	});
	
	Lacuna.buildings.Trade = Trade;

})();
YAHOO.register("trade", YAHOO.lacuna.buildings.Trade, {version: "1", build: "0"}); 

}