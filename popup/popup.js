var table = document.getElementById('subresource-table');

var protocolColorMap = new Map();
protocolColorMap.set('TLSv1.3', '#81c784'); 
protocolColorMap.set('TLSv1.2', '#aed581'); 
protocolColorMap.set('TLSv1.1', '#dce775'); 
protocolColorMap.set('TLSv1', '#e57373'); 
protocolColorMap.set('SSLv3', '#e57373');

function addCell(row, textNode, cipherSuite) {
    var cell = row.insertCell(-1);
    cell.appendChild(textNode);
    cell.setAttribute('title', cipherSuite);
}

function createLink(text, target) {
    var a = document.createElement('a');
    var linkText = document.createTextNode(text);
    a.appendChild(linkText);
    a.title = text;
    a.href = target;
    return a;
}

function insertTableRow(host, securityInfo) {
    var row = table.insertRow(-1);
    row.setAttribute('bgcolor', protocolColorMap.get(securityInfo.protocolVersion));

    addCell(row, document.createTextNode(host), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.protocolVersion), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.keaGroupName), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.signatureSchemeName), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.hsts ? 'Yes' : 'No'), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.isExtendedValidation ? 'Yes' : 'No'), securityInfo.cipherSuite);

    i18n_test = browser.i18n.getMessage("popupRunTest");
    addCell(row, createLink(i18n_test, 'https://www.ssllabs.com/ssltest/analyze.html?d=' + host), '');
}

function clearTable() {
    while(table.hasChildNodes()) {
        table.removeChild(table.firstChild);
    }
    var i18n_host = browser.i18n.getMessage("popupTitleHost");
    var i18n_protocol = browser.i18n.getMessage("popupTitleProtocol");
    var i18n_kex = browser.i18n.getMessage("popupTitleKeyExchange");
    var i18n_signature = browser.i18n.getMessage("popupTitleSignature");
    var header = '<tr><th>' + i18n_host + '</th><th>' + i18n_protocol + '</th><th>' + i18n_kex + '</th><th>' + i18n_signature + '</th><th>HSTS</th><th>EV</th><th>SSL Labs</th></tr>'; 
    table.innerHTML = header;

}

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
}

function includesResourcesFromLessSecureHosts(tabInfo, subresourceMap) {
    request('tabMainProtocolMap', tabInfo.id).then(reply => {
        const tabMainProtocolMap = reply.requested_info;
        request('versionComparisonMap').then((reply) => {
            const versionComparisonMap = reply.requested_info;
            const mainProtocolVersion = versionComparisonMap.get(tabMainProtocolMap);
            for (const securityInfo of subresourceMap.values()) {
                if (versionComparisonMap.get(securityInfo.protocolVersion) < mainProtocolVersion) {
                    showWarningMessage(tabMainProtocolMap);
                    break;
                }
            }
        }).catch(error => console.error(error));
    }).catch(error => console.error(error));
}

function showWarningMessage(protocolVersion) {
    var localized_text = browser.i18n.getMessage("popupWarningMessage", protocolVersion);
    var warning = document.getElementById('warning');
    var warningText = document.getElementById('warning-text');
    warningText.innerHTML = localized_text;
    warning.style.display = "block"; 
}

browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
  .then(tabs => browser.tabs.get(tabs[0].id))
  .then(tab => {
    updatePopup(tab);
  });
