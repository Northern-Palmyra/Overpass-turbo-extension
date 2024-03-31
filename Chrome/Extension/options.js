const permissionsToRequest = {
	permissions: ["scripting"],
	origins: ["*://*.overpass-turbo.eu/*", "*://maps.mail.ru/osm/tools/overpass/*"],
};

async function requestPermissions() {
	function onResponse(response) {
		if (response) {
			document.body.querySelector("#res").innerHTML = `Permission was granted!<br><br>Now you can use <a href="https://overpass-turbo.eu/" target="_blank">Overpass Turbo</a>!<br><br> Have a nice day!`;
		} else {
			document.body.querySelector("#res").innerHTML = `It's very sad that you didn't give permission. Without this, our extension will not be able to work. If you change your mind, right-click on the extension icon and give permission to interact or click the button below.`;
		}
		return chrome.permissions.getAll();
	}

	const response = await chrome.permissions.request(permissionsToRequest);
	const currentPermissions = await onResponse(response);

	// document.body.querySelector("#res").innerHTML += `Current permissions:` + JSON.stringify(currentPermissions);

}

function browserGet() {
	var navName = "";

	var ua = navigator.userAgent, tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		navName = M[1];
	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		navName = 'IE ' + (tem[1] || '');
	}

	return navName.toLowerCase();
}

var browserObject;


// execute script on page fully loaded
window.addEventListener("load", function() {
	document.body.querySelector("#btnPerms").addEventListener('click', function(){
		requestPermissions();
	});

	if (browserGet() == "chrome") {
		browserObject = chrome;
		this.document.body.querySelector(".firefox_block").style.display = "none";
	} else {
		browserObject = browser;
		this.document.body.querySelector(".chrome_block").style.display = "none";
	}

	
	var manifestData = browserObject.runtime.getManifest();
	document.head.querySelector('title').innerHTML = manifestData.name;
	document.body.querySelector('h1').innerHTML = manifestData.name;


});


