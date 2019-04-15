var versionIconMap = new Map();
versionIconMap.set('TLSv1.3', 'icons/tlsv13.png'); 
versionIconMap.set('TLSv1.2', 'icons/tlsv12.png'); 
versionIconMap.set('TLSv1.1', 'icons/tlsv11.png'); 
versionIconMap.set('TLSv1', 'icons/tlsv10.png'); 
versionIconMap.set('SSLv3', 'icons/sslv3.png'); /* no longer supported */
versionIconMap.set('unknown', 'icons/tlsunknown.png');


var tabMainProtocolMap = new Map();
var tabSubresourceProtocolMap = new Map();

async function updateIcon(tabId, protocolVersion) {
    browser.pageAction.setIcon({
        tabId: tabId, path: versionIconMap.get(protocolVersion)
    });
    browser.pageAction.setTitle({tabId: tabId, title: protocolVersion});
    browser.pageAction.setPopup({tabId: tabId, popup: "/popup/popup.html"});
}


function getDomain(url) {
    url = url.replace(/(https?:\/\/)?(www.)?/i, '');

    if (url.indexOf('/') !== -1) {
        return url.split('/')[0];
    }

    return url;
}


function getSubresourceMap(tabId) {
    /* fill table for subresources*/	
    if (!tabSubresourceProtocolMap.has(tabId)) {
        tabSubresourceProtocolMap.set(tabId, new Map());
    }
    var subresourceMap = tabSubresourceProtocolMap.get(tabId);
    return subresourceMap;
}

async function processSecurityInfo(details) {

    try {
	    var host = getDomain(details.url);


        let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{});
        if (typeof securityInfo === "undefined") {
            return;
        }

        /* set the icon correctly */
        if (details.type === 'main_frame') {
            tabMainProtocolMap.set(details.tabId, securityInfo.protocolVersion);
            await updateIcon(details.tabId, securityInfo.protocolVersion);
        } else {
            cached_version = tabMainProtocolMap.get(details.tabId);
			if (typeof cached_version !== "undefined") {
              await updateIcon(details.tabId, cached_version);
			}
        }

        var subresourceMap = getSubresourceMap(details.tabId);
        subresourceMap.set(host, securityInfo);
        tabSubresourceProtocolMap.set(details.tabId, subresourceMap);

    } catch(error) {
        console.error(error);
    }
}

function handleNavigation(details) {
    /* we are about to load a new page, delete old data */
    tabSubresourceProtocolMap.set(details.tabId, new Map());
}

browser.webRequest.onHeadersReceived.addListener(processSecurityInfo,
    {urls: ["https://*/*"]}, ["blocking", "responseHeaders"]
);

browser.pageAction.onClicked.addListener((tab) => {
 /* future */
});


var filter = {  url: [{schemes: ["https"]} ]};
browser.webNavigation.onBeforeNavigate.addListener(handleNavigation, filter);
