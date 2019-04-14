var background = browser.extension.getBackgroundPage();
var table = document.getElementById('subresource-table');

var protocolColorMap = new Map();
protocolColorMap.set('TLSv1.3', '#45ab52'); 
protocolColorMap.set('TLSv1.2', '#56a952;'); 
protocolColorMap.set('TLSv1.1', '#d0b601'); 
protocolColorMap.set('TLSv1', '#d0b601'); 
protocolColorMap.set('SSLv3', '#ff0000');

function insertTableRow(host, securityInfo) {
    var row = table.insertRow(-1);
    row.setAttribute('bgcolor', protocolColorMap.get(securityInfo.protocolVersion));

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);

    cell1.appendChild(document.createTextNode(host));
    cell2.appendChild(document.createTextNode(securityInfo.protocolVersion));
    cell3.appendChild(document.createTextNode(securityInfo.hsts ? 'Yes' : 'No'));
    cell4.appendChild(document.createTextNode(securityInfo.isExtendedValidation ? 'Yes' : 'No'));


    /* Display CipherSuite as tooltip */
    cell1.setAttribute('title', securityInfo.cipherSuite);
    cell2.setAttribute('title', securityInfo.cipherSuite);
    cell3.setAttribute('title', securityInfo.cipherSuite);
    cell4.setAttribute('title', securityInfo.cipherSuite);
}

function clearTable() {
    while(table.hasChildNodes()) {
        table.removeChild(table.firstChild);
    }
    var header = '<tr><th>Host</th><th>Protocol</th><th>HSTS</th><th>EV</th></tr>';
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
