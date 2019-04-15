var background = browser.extension.getBackgroundPage();
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

function insertTableRow(host, securityInfo) {
    var row = table.insertRow(-1);
    row.setAttribute('bgcolor', protocolColorMap.get(securityInfo.protocolVersion));

    addCell(row, document.createTextNode(host), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.protocolVersion), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.keaGroupName), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.signatureSchemeName), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.hsts ? 'Yes' : 'No'), securityInfo.cipherSuite);
    addCell(row, document.createTextNode(securityInfo.isExtendedValidation ? 'Yes' : 'No'), securityInfo.cipherSuite);
}

function clearTable() {
    while(table.hasChildNodes()) {
        table.removeChild(table.firstChild);
    }
    var header = '<tr><th>Host</th><th>Protocol</th><th>Key Exchange</th><th>Signature</th><th>HSTS</th><th>EV</th></tr>';
    table.innerHTML = header;

}

function updatePopup(tabInfo) {
    clearTable();
    var subresourceMap = background.tabSubresourceProtocolMap.get(tabInfo.id);
    for (const [domain, securityInfo] of subresourceMap.entries()) {
        insertTableRow(domain, securityInfo);
    }
}


browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
  .then(tabs => browser.tabs.get(tabs[0].id))
  .then(tab => {
    updatePopup(tab);
  });
