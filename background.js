var versionIconMap = new Map();
versionIconMap.set('TLSv1.3', 'icons/tlsv13.png'); 
versionIconMap.set('TLSv1.2', 'icons/tlsv12.png'); 
versionIconMap.set('TLSv1.1', 'icons/tlsv11.png'); 
versionIconMap.set('TLSv1', 'icons/tlsv10.png'); 
versionIconMap.set('SSLv3', 'icons/sslv3.png'); /* no longer supported */
versionIconMap.set('unknown', 'icons/tlsunknown.png');

var versionIconWarningMap = new Map();
versionIconWarningMap.set('TLSv1.3', 'icons/tlsv13_warning.png'); 
versionIconWarningMap.set('TLSv1.2', 'icons/tlsv12_warning.png'); 
versionIconWarningMap.set('TLSv1.1', 'icons/tlsv11_warning.png'); 
versionIconWarningMap.set('TLSv1', 'icons/tlsv10_warning.png'); 
versionIconWarningMap.set('SSLv3', 'icons/sslv3_warning.png'); /* no longer supported */
versionIconWarningMap.set('unknown', 'icons/tlsunknown.png');

var versionComparisonMap = new Map();
versionComparisonMap.set('TLSv1.3', 13); 
versionComparisonMap.set('TLSv1.2', 12); 
versionComparisonMap.set('TLSv1.1', 11); 
versionComparisonMap.set('TLSv1', 10); 
versionComparisonMap.set('SSLv3', 3); 
versionComparisonMap.set('unknown', 0);

var tabMainProtocolMap = new Map();
var tabSubresourceProtocolMap = new Map();

async function updateIcon(tabId, protocolVersion, warning) {
    if (warning) {
        browser.pageAction.setIcon({
            tabId: tabId, path: versionIconWarningMap.get(protocolVersion)
        });
    } else {
        browser.pageAction.setIcon({
            tabId: tabId, path: versionIconMap.get(protocolVersion)
        }); 
    }
    browser.pageAction.setTitle({tabId: tabId, title: protocolVersion});
    browser.pageAction.setPopup({tabId: tabId, popup: "/popup/popup.html"});
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
        var host = (new URL(details.url)).host;


        let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{});
        if (typeof securityInfo === "undefined") {
            return;
        }

        /* set the icon correctly */
        if (details.type === 'main_frame') {
            tabMainProtocolMap.set(details.tabId, securityInfo.protocolVersion);
            await updateIcon(details.tabId, securityInfo.protocolVersion, false);
        } else {
            cached_version = tabMainProtocolMap.get(details.tabId);
            if (typeof cached_version !== "undefined") {
                await updateIcon(details.tabId, cached_version, false);
            }
        }


        var subresourceMap = getSubresourceMap(details.tabId);
        subresourceMap.set(host, securityInfo);
        tabSubresourceProtocolMap.set(details.tabId, subresourceMap);

        var mainProtocolVersion = versionComparisonMap.get(tabMainProtocolMap.get(details.tabId));
        for (const securityInfo of subresourceMap.values()) {
            if (versionComparisonMap.get(securityInfo.protocolVersion) < mainProtocolVersion) {
                await updateIcon(details.tabId, tabMainProtocolMap.get(details.tabId), true);
                break;
            }
        }

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
