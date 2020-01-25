var protocolColorMap = new Map();
protocolColorMap.set('TLSv1.3', '#26de81'); 
protocolColorMap.set('TLSv1.2', '#20bf6b'); 
protocolColorMap.set('TLSv1.1', '#fed330'); 
protocolColorMap.set('TLSv1', '#eb3b5a'); 
protocolColorMap.set('SSLv3', '#eb3b5a');

function request(resource, key) {
    const request = browser.runtime.sendMessage({
        type: 'request',
        resource: resource,
        key: key
    });
    return request;
}

function updatePopup(tabInfo) {
    clearTable();
    request('tabSubresourceProtocolMap', tabInfo.id).then((reply) => {
        var subresourceMap = reply.requested_info;
        for (const[domain, securityInfo] of subresourceMap.entries()) {
            insertTableRow(domain, securityInfo);
            if(domain === (new URL(tabInfo.url)).host) {
                updatePopupPrimaryTab(securityInfo, domain);
            }
        }
        includesResourcesFromLessSecureHosts(tabInfo, subresourceMap);
    }).catch(error => console.error(error));

}

browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
  .then(tabs => browser.tabs.get(tabs[0].id))
  .then(tab => {
    updatePopup(tab);
  });
