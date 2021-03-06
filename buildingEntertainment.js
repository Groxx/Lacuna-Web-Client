YAHOO.namespace("lacuna.buildings");

if (typeof YAHOO.lacuna.buildings.Entertainment == "undefined" || !YAHOO.lacuna.buildings.Entertainment) {
	
(function(){
	var Util = YAHOO.util,
		Dom = Util.Dom,
		Event = Util.Event,
		Lacuna = YAHOO.lacuna,
		Game = Lacuna.Game,
		Lib = Lacuna.Library;

	var Entertainment = function(result){
		Entertainment.superclass.constructor.call(this, result);
		
		this.service = Game.Services.Buildings.Entertainment;
		this.lotteryAllVotedMessage = "You have voted as many times as you could today.  Please check back tomorrow for your next chance!";
	};
	
	YAHOO.lang.extend(Entertainment, Lacuna.buildings.Building, {
		getChildTabs : function() {
			return [this._getLotteryTab()];
		},
		_getLotteryTab : function() {
			var tab = new YAHOO.widget.Tab({ label: "Lottery", content: ['<p id="entertainmentLotteryMessage">Welcome to the Lacuna Lottery! Get entered in the Expanse\'s daily lottery for 10 <img src="',Lib.AssetUrl,'ui/s/essentia.png" class="smallEssentia" />. Each link clicked below gives you one extra chance to win! Links will be removed after voting and return tomorrow.</p><div><ul id="entertainmentLotteryList"></ul></div>'].join('')});
			tab.subscribe("activeChange", this.LotteryView, this, true);
			return tab;
		},
		LotteryView : function(e) {
			if(e.newValue) {
				Lacuna.Pulser.Show();
				this.service.get_lottery_voting_options({session_id:Game.GetSession(),building_id:this.building.id}, {
					success : function(o){
						Lacuna.Pulser.Hide();
						this.rpcSuccess(o);
						
						this.LotteryPopulate(o.result.options);
					},
					failure : function(o){
						Lacuna.Pulser.Hide();
						this.rpcFailure(o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		LotteryPopulate : function(options) {
			var details = Dom.get("entertainmentLotteryList");
			if(details) {
				var li = document.createElement("li");
					
				Event.purgeElement(details);
				details.innerHTML = "";
				Dom.setStyle(details.parentNode,"height","");
				Dom.setStyle(details.parentNode,"overflow-y","");
				
				if(options.length == 0) {
					li.innerHTML = this.lotteryAllVotedMessage;
					details.appendChild(li);
				}
				else {
					for(var i=0; i<options.length; i++) {
						var vote = options[i],
							nLi = li.cloneNode(false);
						nLi.innerHTML = ['<a href="',vote.url,'" target="_new">',vote.name,'</a>'].join('');
						Event.on(nLi, "click", this.LotteryVoted, this);
						details.appendChild(nLi);
					}
					//wait for tab to display first
					setTimeout(function() {
						if(details.parentNode.clientHeight > 300) {
							Dom.setStyle(details.parentNode,"height","300px");
							Dom.setStyle(details.parentNode,"overflow-y","auto");
						}
					},10);
				}
			}
		},
		LotteryVoted : function(e, oSelf) {
			var li = Event.getTarget(e);
			if(li) {
				Event.removeListener(li, "click");
				var ul = li.parentNode;
				ul.removeChild(li);
				
				if(ul.children && ul.children.length == 0) {
					ul.innerHTML = ['<li>',this.lotteryAllVotedMessage,'</li>'].join('');
				}
			}
		}
	});
	
	Lacuna.buildings.Entertainment = Entertainment;

})();
YAHOO.register("Entertainment", YAHOO.lacuna.buildings.Entertainment, {version: "1", build: "0"}); 

}