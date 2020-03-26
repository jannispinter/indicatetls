var protocolColorMap = new Map();
protocolColorMap.set('TLSv1.3', '#26de81'); 
protocolColorMap.set('TLSv1.2', '#fbc02d'); 
protocolColorMap.set('TLSv1.1', '#ff0000'); 
protocolColorMap.set('TLSv1', '#ff0000'); 
protocolColorMap.set('SSLv3', '#ff0000');

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
        }
        includesResourcesFromLessSecureHosts(tabInfo, subresourceMap);
    }).catch(error => console.error(error));

    request('tabMainProtocolMap', tabInfo.id).then((reply) => {
        const securityInfo = reply.requested_info;
        const domain = (new URL(tabInfo.url)).host;
        updatePopupSecurityInfo(securityInfo, domain);
    }).catch(error => console.error(error));

}

browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
  .then(tabs => browser.tabs.get(tabs[0].id))
  .then(tab => {
    updatePopup(tab);
  });
