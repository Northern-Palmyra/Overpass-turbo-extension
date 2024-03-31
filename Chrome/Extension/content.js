
/**
 * content.js - content script for StreetView Extension.
 */
class extsv_class {

	/**
	 * Options object
	 */	
	options = {};

	/**
	 * Class constructor
	 */
    constructor(options) {
		this.options.debug = true;
		this.options = options;
		this.browserObject;
		this.responceDataType;
		this.findedNWR;
		this.osmDomain = location.hostname == 'maps.mail.ru' ? 'mail' : 'opt';
		this.init();
    }

	/*
	 * Logging function
	 */
	logit(...sArgs) {
		if (this.options.debug == true) {
			console.log(...sArgs);
		}
	};

	/**
	 * Init function
	 */
    init() {

		this.browserGet();

        this.manifestData = this.browserObject.runtime.getManifest();

		console.log(`
 _______              __   __         ______         __                            
|    |  |.-----.----.|  |_|  |--.    |   __ \\.---.-.|  |.--------.--.--.----.---.-.
|       ||  _  |   _||   _|     |    |    __/|  _  ||  ||        |  |  |   _|  _  |
|__|____||_____|__|  |____|__|__|    |___|   |___._||__||__|__|__|___  |__| |___._|
 StreetView Extension                                            |_____| v `+this.manifestData.version+`
		`);

		// inject injected script
		var s = document.createElement('script');
		s.src = this.browserObject.runtime.getURL('injected.js');
		s.onload = function () {
			this.remove();
		};
		(document.head || document.documentElement).appendChild(s);
		
		this.addMessageListener();

    };


	/**
	 * Listener function to catch message from inject.js script.
	 */
	addMessageListener() {

		window.addEventListener('message', function(e) {
			if (e.data.length!=0 && e.data.msg == 'catchThis') {
				this.logit('content script received:' , e);
				if (e.data.data.slice(0,5)=="<?xml") {
					this.responceDataType = "XML";
					var parser = new DOMParser();
					this.findedNWR = parser.parseFromString(e.data.data,"text/xml");
				} else {
					this.responceDataType = "JSON";
					this.findedNWR = JSON.parse(e.data.data).elements;
				}
	
				this.opHandler();
				
			};
		}.bind(this));

	};

	

	/**
	 * Function to get browser/chrome object to interact with manifest.json.
	 */
	browserGet() {

		var navName = "";
	
		var ua = navigator.userAgent, tem,
			M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
			navName = M[1];
		if (/trident/i.test(M[1])) {
			tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
			navName = 'IE ' + (tem[1] || '');
		}

		if (navName.toLowerCase() == "chrome") {
			this.browserObject = chrome;
		} else {
			this.browserObject = browser;
		};
	
	};

	/**
	 * @name searchInAPIJSON
	 * @param {string} type 
	 * @param {string} id 
	 * @returns {string, string} lat, lon
	 * @description Search in API (JSON) and return object [lat,lon]. Function is recursive.
	 */
	searchInAPIJSON(type, id) {

		this.logit("Search in API (JSON)");
		this.logit("type: "+type, "id: "+id);
	
		var lat = 0;
		var lon = 0;
	
		for (var i=0;i<this.findedNWR.length;i++) {
			// if popup type and iterate type is equal and popup id equal to iterate id
			if (
				this.findedNWR[i].type.toLowerCase() == type &&
				this.findedNWR[i].id == id
			) {
				this.logit(this.findedNWR[i]);
				// if iterate has geometry
				if (this.findedNWR[i].hasOwnProperty('lat') && this.findedNWR[i].hasOwnProperty('lon')) {
					lat = this.findedNWR[i].lat;
					lon = this.findedNWR[i].lon;
				} else if (
					this.findedNWR[i].hasOwnProperty('bounds') && 
					this.findedNWR[i].bounds.hasOwnProperty('minlat') && 
					this.findedNWR[i].bounds.hasOwnProperty('minlon')
				) {
					[lat, lon] = [this.findedNWR[i].bounds.minlat, this.findedNWR[i].bounds.minlon];
				} else if (this.findedNWR[i].hasOwnProperty('members')) {
					[lat, lon] = this.searchInAPIJSON(this.findedNWR[i].members[0].type, this.findedNWR[i].members[0].ref);
				} else if (this.findedNWR[i].hasOwnProperty('geometry') && this.findedNWR[i].geometry[0].hasOwnProperty('lat')) {
					lat = this.findedNWR[i].geometry[0].lat;
					lon = this.findedNWR[i].geometry[0].lon;
				} else if (this.findedNWR[i].hasOwnProperty('center') && this.findedNWR[i].center.hasOwnProperty('lat')) {
					lat = this.findedNWR[i].center.lat;
					lon = this.findedNWR[i].center.lon;
				} else if (this.findedNWR[i].hasOwnProperty('nodes')) {
					[lat, lon] = this.searchInAPIJSON("node", this.findedNWR[i].nodes[0]);
				}
				break;
			}
		}
	
		return [lat,lon];
	
	};
	
	/**
	 * @name searchInAPIXML
	 * @param {string} type 
	 * @param {string} id 
	 * @returns {string, string} lat, lon
	 * @description Search in API (XML) and return object [lat,lon]. Function is recursive.
	 */
	searchInAPIXML(type, id){
		this.logit("Search in API (XML)");
		this.logit("type: "+type, "id: "+id);
	
		// find clicked node
		var clickedNode = this.findedNWR.querySelector('osm '+type+'[id="'+id+'"]');
		if (typeof clickedNode === 'undefined') {
			return [0,0];
		}
	
		var boundaryChild = clickedNode.querySelector("bounds");
		if (
			boundaryChild!==null &&
			boundaryChild.hasAttribute('minlat') && 
			boundaryChild.hasAttribute('minlon') 
		) {
			return [boundaryChild.getAttribute('maxlat'), boundaryChild.getAttribute('maxlon')];
		}
		
		// if type is relation
		if (type == "relation") {
			var relationChild = clickedNode.querySelector("member");
			var type = relationChild.getAttribute("type");
			var id = relationChild.getAttribute("ref");
			[lat, lon] = this.searchInAPIXML(type, id);
			if (lat!=0 && lon!=0) {
				return [lat,lon];
			}
		}
	
		// if type is way
		if (type == "way") {
	
			var wayChild = clickedNode.querySelector("nd");
			if (wayChild !== null) {
	
				if (wayChild.hasAttribute('lat') && wayChild.hasAttribute('lon')) {
					return [wayChild.getAttribute('lat'), wayChild.getAttribute('lon')];
				}
	
				var type = "node";
				var id = wayChild.getAttribute("ref");
				[lat, lon] = this.searchInAPIXML(type, id);
				if (lat != 0 && lon != 0) {
					return [lat, lon];
				}
			}
		}
	
		// if type is node
		if (type == "node") {
			var node = this.findedNWR.querySelector('osm '+type+'[id="'+id+'"]');
			var lat = node.getAttribute("lat");
			var lon = node.getAttribute("lon");
			return [lat,lon];
		}
	
		return [0,0];
	};
	
	
	/**
	 * @name searchInUIPopUp
	 * @param {Object} wrapper 
	 * @returns {string, string} lat, lon
	 * @description Search in DOM Element and return object [lat,lon]. Not using in this version.
	 */
	searchInUIPopUp(wrapper) {
		var links = wrapper.querySelectorAll("a");
	
		var lat = 0;
		var lon = 0;
	
		for (lk=0;lk<links.length;lk++) {
			if (links[lk].getAttribute('href').match("^geo:")) {
				var latLon = links[lk].getAttribute('href').split(":");
				latLon = latLon[1].split(",");
				lat = latLon[0];
				lon = latLon[1];
			}
		}
	
		return [lat,lon];
	
	};
	
	
	/**
	 * @name makeLinksList
	 * @param {string} lat 
	 * @param {string} lon 
	 * @returns {string}
	 * @description Function male HTML with list of links.
	 */
	makeLinksList(lat,lon) {
	
		var svUrl = '<ul class="extsv_popup_ul">';
	
		if (lat==0&&lon==0) {
			svUrl = `<br><br><strong>Unfortunately, the coordinates of this object were not found =(</strong><br><br><a href="`+this.manifestData.homepage_url+`" target="_blank" data-streetview="true">Send us</a> your request and the approximate coordinates of the map viewport, we will fix this problem soon.`;
		} else {
			var servLinks = [
				
				{addr: "https://www.google.com/maps/@"+lat+","+lon+",120m/data=!3m1!1e3?entry=ttu", title: "Google"},
				{addr: "https://maps.google.com/maps?q=&layer=c&cbll="+lat+","+lon, title: "Google StreetView"},	
				{addr: "https://earth.google.com/web/@"+lat+","+lon+",699.1419278a,15000d,1y,0h,0t,0r", title: "Google Earth"},
				
				{addr: "https://www.instantstreetview.com/@"+lat+","+lon+",242.16h,-2.34p,0z", title: "InstantStreetView"},
				
				{addr: "https://yandex.ru/maps/?l=sat%2Cskl&ll="+lon+"%2C"+lat+"&z=18", title: "Yandex Maps"},
				{addr: "https://yandex.ru/maps/?l=sat%2Cskl%2Cstv%2Csta&ll="+lon+"%2C"+lat+"&panorama%5Bdirection%5D=0%2C0.000000&panorama%5Bfull%5D=true&panorama%5Bpoint%5D="+lon+"%2C"+lat+"&panorama%5Bspan%5D=0%2C60.000000&z=18", title: "Yandex StreetView"},
	
				{addr: "https://www.bing.com/maps?cp="+lat+"~"+lon+"&lvl=19.2&style=h", title: "Bing Maps"},
				{addr: "https://mc.bbbike.org/mc/?lon="+lon+"&lat="+lat+"&zoom=22&num=3&mt0=mapnik-german&mt1=cyclemap&mt2=bing-hybrid", title: "Map Compare"},
				{addr: "https://mapchannels.com/quadviewmaps/map.htm?lat="+lat+"&lng="+lon+"", title: "Map Channels"},
				{addr: "https://data.mapchannels.com/dualmaps8/map.htm?lat="+lat+"&lng="+lon+"", title: "Dual Maps"},
				{addr: "https://satellites.pro/Russia_map#"+lat+","+lon+",18", title: "Satellites Pro"},
			];
	
			for (var i=0;i<servLinks.length;i++) {
				svUrl += '<li><a href="'+servLinks[i].addr+'" target=_blank data-streetview="true">'+servLinks[i].title+'</a></li>';
			}
		}
		svUrl += `<li><img src="`+this.browserObject.runtime.getURL('/images/clipboard.svg')+`" onclick="copyToClipboard(`+lat+`,`+lon+`);" class="extsv_icon_clipboard"> <span class="extsv_copyToClipboard" onclick="copyToClipboard(`+lat+`,`+lon+`);">`+lat+`, `+lon+`</span></li>`;
		svUrl += `<li><hr class="extsv_hr"></li>`;
		svUrl += `<li><a href="`+this.manifestData.homepage_url+`"><img src="`+this.browserObject.runtime.getURL('/images/telegram.svg')+`" class="extsv_icon_tg"></a></li>`;
		svUrl += "</ul>";
	
		return svUrl;
	
	}
	
	/**
	 * @name parseInfoFromPopup
	 * @param {Object} wrapper 
	 * @returns {string, string} [type, id]
	 * @description Function parse info from popup.
	 */
	parseInfoFromPopup(wrapper) {
		if (this.osmDomain=="mail") {
			var type = wrapper.querySelector('h4').childNodes[0].textContent.toLowerCase().trim();
			var id = wrapper.querySelector('h4').childNodes[1].textContent.trim();
		} else {
			var type = wrapper.querySelector('h4').childNodes[0].textContent.toLowerCase().trim();
			var id = wrapper.querySelector('h4').childNodes[2].textContent.trim();
		}
	
		return [type, id];
	};
	
	
	/**
	 * @name makeAction
	 * @returns {boolean}
	 * @description Function make some magic while pin clicked.
	 */
	makeAction() {
	
		var wrapper = document.querySelector(".leaflet-popup-content");
		if (wrapper==null) {
			return false;
		}
	
		// if already have links in popup
		if (wrapper.querySelector("a[data-streetview]")) {
			return false;
		}
	
		var lat = 0;
		var lon = 0;
	
		// don't use it in this version
		// [lat, lon] = this.searchInUIPopUp(wrapper);
		
		// if no geo in popup, search in API responce
		if (lat===0&&lon===0) {
	
			var [type, id] = this.parseInfoFromPopup(wrapper);
	
			if (this.responceDataType=="JSON") {
				[lat, lon] = this.searchInAPIJSON(type, id);
			} else {
				[lat, lon] = this.searchInAPIXML(type, id);
			}
		}
	
		var svUrl = this.makeLinksList(lat,lon);
	
		wrapper.insertAdjacentHTML("beforeend", svUrl);
	
		return true;
	};
	
	
	/**
	 * @name opHandler
	 * @description Обработчик события нажатия на кнопку
	 */
	opHandler() {
	
		// не срабатывает до отрисовки
		document.querySelector('#map').addEventListener('mousedown', function(e) {
			if (e.target.nodeName=="path") {
				setTimeout(function() {
					this.makeAction();
				}.bind(this), 500);
			}
		}.bind(this));
	
	
	}


};

/**
 * @name extsv_class
 * @constructor extsv_class
 * @param {boolean} [options.debug=false] - Включить отладочную информацию
 */
if (typeof window.extsv == "undefined") {
	window.extsv = new extsv_class({
		debug: false
	});
};