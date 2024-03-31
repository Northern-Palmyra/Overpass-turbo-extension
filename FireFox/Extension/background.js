function browserNameGet() {
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

function browserObjectGet() {
	if (browserNameGet() == "chrome") {
		return chrome;
	}
	
	if (browserNameGet() == "firefox") {
		return browser;
	}

}

var browserObject = browserObjectGet();

browserObject.runtime.onInstalled.addListener(() => {
	browserObject.runtime.openOptionsPage();
	// browser.tabs.create({ url: "http://example.com/firstrun.html" });
});