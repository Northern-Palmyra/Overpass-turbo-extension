(function (xhr) {

	var XHR = XMLHttpRequest.prototype;

	var open = XHR.open;
	var send = XHR.send;

	XHR.open = function (method, url) {
		this._method = method;
		this._url = url;
		return open.apply(this, arguments);
	};

	XHR.send = function (postData) {
		// if (this._method=="POST"){
		// 	console.log(this.responseURL);
		// }
		//console.log('injected script xhr request:', this._method, this._url, this.getAllResponseHeaders(), postData);
		// https://overpass-api.de/api/interpreter || https://maps.mail.ru/osm/tools/overpass/api/interpreter

			this.addEventListener('load', function () {
				if (
					this.responseURL.match(/^https:\/\/overpass-api\.[^\/]*\/api\/interpreter/) ||
					this.responseURL.match(/^https:\/\/maps.mail\.[^\/]*\/osm\/tools\/overpass\/api\/interpreter/)
				) {
					window.postMessage({ msg: 'catchThis', type: 'xhr', data: this.response }, '*');  // send to content script
				}
			});

			// // Inject [out:json] to query START
			// if (
			// 	this._url.match(/^https:\/\/overpass-api\.[^\/]*\/api\/interpreter/) ||
			// 	this._url.match(/^\/osm\/tools\/overpass\/api\/interpreter/)
			// ) {			
			// 	// Don't use in this version
			// 	var opQuery = decodeURI(arguments[0]);
			// 	var opQueryResult = "";

			// 	const found = opQuery.match(/\[out:json\]/i);
				
			// 	if (found==null) {
					
			// 		opQuery = opQuery.replace(/^data=/i, "");

			// 		if (opQuery[0]=='[') {
			// 			opQueryResult = "data="+"[out:json]" + opQuery;
			// 		} else {
			// 			opQueryResult = "data="+"[out:json];" + opQuery;
			// 		}
					
			// 		arguments[0] = opQueryResult;
					
			// 	}
			// }
			// // Inject [out:json] to query END


		


		return send.apply(this, arguments);
	};
})(XMLHttpRequest);



const { fetch: origFetch } = window;
window.fetch = async (...args) => {
	const response = await origFetch(...args);
	// console.log('injected script fetch request:', args);
	response
		.clone()
		.blob() // maybe json(), text(), blob()
		.then(data => {
			window.postMessage({ type: 'fetch', data: data }, '*'); // send to content script
			//window.postMessage({ type: 'fetch', data: URL.createObjectURL(data) }, '*'); // if a big media file, can createObjectURL before send to content script
		})
		.catch(err => console.error(err));
	return response;
};


function copyToClipboard(lat,lon) {
	// Get the text field
	var copyText = document.createElement("input"); // #npse_input
	copyText.style.display = "none";
	copyText.setAttribute("id", "npse_input");
	copyText.value = lat+", "+lon;
	document.querySelector("body").appendChild(copyText);

	copyText.select();
	copyText.setSelectionRange(0, 99999); // For mobile devices
  
	navigator.clipboard.writeText(copyText.value);

	document.querySelector("body").removeChild(copyText);
  
	// create popup for 3 sec
	var popup = document.createElement("div");
	popup.setAttribute("id", "extsv_popup");
	popup.innerHTML = "<span>Copied to clipboard</span>";
	document.body.appendChild(popup);
	setTimeout(function(){
		document.body.removeChild(popup);
	}, 3000);
} 