var versionIconMap = new Map();
versionIconMap.set('TLSv1.3', 'icons/tlsv13.png'); 
versionIconMap.set('TLSv1.2', 'icons/tlsv12.png'); 
versionIconMap.set('TLSv1.1', 'icons/tlsv11.png'); 
versionIconMap.set('TLSv1', 'icons/tlsv10.png'); 
versionIconMap.set('unknown', 'icons/tlsunknown.png');

var versionIconWarningMap = new Map();
versionIconWarningMap.set('TLSv1.3', 'icons/tlsv13_warning.png'); 
versionIconWarningMap.set('TLSv1.2', 'icons/tlsv12_warning.png'); 
versionIconWarningMap.set('TLSv1.1', 'icons/tlsv11_warning.png'); 
versionIconWarningMap.set('TLSv1', 'icons/tlsv10_warning.png'); 

var versionComparisonMap = new Map();
versionComparisonMap.set('TLSv1.3', 13); 
versionComparisonMap.set('TLSv1.2', 12); 
versionComparisonMap.set('TLSv1.1', 11); 
versionComparisonMap.set('TLSv1', 10); 
versionComparisonMap.set('unknown', 0);

var tabMainProtocolMap = new Map();
var tabMainDowngradedMap = new Map();
var tabSubresourceProtocolMap = new Map();

async function detectTheme() {
    var themeInfo = await browser.theme.getCurrent();
    if (themeInfo.colors && themeInfo.colors.icons === "rgb(249, 249, 250, 0.7)") {
        versionIconMap.set('TLSv1.3', 'icons/tlsv13_dark.png');
        versionIconWarningMap.set('TLSv1.3', 'icons/tlsv13_dark_warning.png'); 
    } else {
        versionIconMap.set('TLSv1.3', 'icons/tlsv13.png');
        versionIconWarningMap.set('TLSv1.3', 'icons/tlsv13_warning.png'); 
    }
}

detectTheme();


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

async function loadSavedSecurityInfoAndUpdateIcon(details) {
    securityInfo = tabMainProtocolMap.get(details.tabId);
    cached_version = securityInfo !== "undefined" ? securityInfo.protocolVersion : undefined;
    if (typeof cached_version !== "undefined" && cached_version !== "unknown") {
        if (tabMainDowngradedMap.has(details.tabId)) {
            await updateIcon(details.tabId, cached_version, tabMainDowngradedMap.get(details.tabId));
        } else {
            await updateIcon(details.tabId, cached_version, false);
        }
    }
}

function getSubresourceMap(tabId) {
    if (!tabSubresourceProtocolMap.has(tabId)) {
        tabSubresourceProtocolMap.set(tabId, new Map());
    }
    var subresourceMap = tabSubresourceProtocolMap.get(tabId);
    return subresourceMap;
}

async function processSecurityInfo(details) {
    try {
        const securityInfo = await browser.webRequest.getSecurityInfo(details.requestId,{});
        if (typeof securityInfo === "undefined") {
            return;
        }

        // save the security info for the current tab and update the page action icon
        if (details.type === 'main_frame') {
            tabMainProtocolMap.set(details.tabId, securityInfo);
            tabMainDowngradedMap.set(details.tabId, false);
            await updateIcon(details.tabId, securityInfo.protocolVersion, false);
        }

        // save the security info for third party hosts that were loaded within
        // the current tab
        const host = (new URL(details.url)).host;
        var subresourceMap = getSubresourceMap(details.tabId);
        subresourceMap.set(host, securityInfo);
        tabSubresourceProtocolMap.set(details.tabId, subresourceMap);

        var mainProtocolVersion = versionComparisonMap.get(tabMainProtocolMap.get(details.tabId).protocolVersion);
        for (const securityInfo of subresourceMap.values()) {
            if (versionComparisonMap.get(securityInfo.protocolVersion) < mainProtocolVersion) {
                tabMainDowngradedMap.set(details.tabId, true);
                await updateIcon(details.tabId, tabMainProtocolMap.get(details.tabId).protocolVersion, true);
                break;
            }
        }

    } catch(error) {
        console.error(error);
    }
}

// clear security info when navigating to a different URL
function handleNavigation(details) {
    tabSubresourceProtocolMap.set(details.tabId, new Map());
}

// extension internal event handling to pass information from
// background to page action ("foreground")
function handleMessage(request, sender, sendResponse) {
    var response;
    try {
        switch (request.type) {
            case 'request':
                const is_undefined = typeof request.key === 'undefined';
                if (request.resource === 'tabSubresourceProtocolMap') {
                    response = {
                        requested_info: is_undefined ? tabSubresourceProtocolMap : tabSubresourceProtocolMap.get(request.key)
                    };
                } else if (request.resource === 'tabMainProtocolMap') {
                    response = {
                        requested_info: is_undefined ? tabMainProtocolMap : tabMainProtocolMap.get(request.key)
                    };
                } else if (request.resource === 'versionComparisonMap') {
                    response = {
                        requested_info: is_undefined ? versionComparisonMap : versionComparisonMap.get(request.key)
                    };
                } else {
                    response = new Error(browser.i18n.getMessage('invalidResourceRequest'));
                }
                break;
            default:
                response = new Error(browser.i18n.getMessage('invalidMessageRequest'));
        }
    } catch (error) {
        response = error;
    }
    sendResponse(response);
}


browser.webRequest.onHeadersReceived.addListener(processSecurityInfo,
    {urls: ["https://*/*"]}, ["blocking", "responseHeaders"]
);

browser.webRequest.onCompleted.addListener(loadSavedSecurityInfoAndUpdateIcon,
    {urls: ["https://*/*"]}
);

browser.webNavigation.onBeforeNavigate.addListener(handleNavigation,
    {url: [{schemes: ["https"]} ]}
);

browser.runtime.onMessage.addListener(handleMessage);

browser.theme.onUpdated.addListener(detectTheme);
