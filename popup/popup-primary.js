function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab-button");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function updatePopupSecurityInfo(securityInfo, hostname) {
  updateProtocolDetails(securityInfo, hostname);
  updateCertificateDetails(securityInfo);
  updateTranslations();
}

async function updateProtocolDetails(securityInfo, hostname) {
  const textTlsProtocolVersion = document.getElementById('popup-primary-protcol-tls-version');
  textTlsProtocolVersion.textContent = securityInfo.protocolVersion;
  textTlsProtocolVersion.style.color = protocolColorMap.get(securityInfo.protocolVersion);
  if(securityInfo.protocolVersion === 'TLSv1' || securityInfo.protocolVersion === 'SSLv3') {
    setCheckmarkIconRed('popup-primary-icon-protocol');
  } else if (securityInfo.protocolVersion === 'TLSv1.1') {
    setCheckmarkIconYellow('popup-primary-icon-protocol');
  }

  const textCipherSuite = document.getElementById('popup-primary-cipher-suite');
  textCipherSuite.textContent = securityInfo.cipherSuite;
  if (securityInfo.cipherSuite.includes('3DES') || securityInfo.cipherSuite.includes('RC4') || securityInfo.cipherSuite.includes('CBC')) {
    textCipherSuite.style.color = '#eb3b5a';
    setCheckmarkIconRed('popup-primary-icon-cipher-suite');
  }

  const textCipherSuiteAead = document.getElementById('popup-primary-cipher-suite-aead');
  if (securityInfo.cipherSuite.includes('GCM') || securityInfo.cipherSuite.includes('CCM') || securityInfo.cipherSuite.includes('CHACHA20')) {
    textCipherSuiteAead.textContent = browser.i18n.getMessage('yes');
    textCipherSuiteAead.style.color = 'green';
  } else {
    textCipherSuiteAead.textContent = browser.i18n.getMessage('no');
    textCipherSuiteAead.style.color = 'orange';
  }

  const textKeyExchange = document.getElementById('popup-primary-kex');
  if(securityInfo.keaGroupName == undefined && securityInfo.cipherSuite.includes('TLS_RSA_')) {
      textKeyExchange.textContent = 'RSA';
      textKeyExchange.style.color = 'orange';
  } else {
      textKeyExchange.textContent = securityInfo.keaGroupName == undefined ? "N/A" : securityInfo.keaGroupName;
  }

  document.getElementById('popup-primary-signature').textContent = securityInfo.signatureSchemeName == undefined ? "N/A" : securityInfo.signatureSchemeName;
  if(securityInfo.signatureSchemeName != undefined && securityInfo.signatureSchemeName.includes('PKCS1')) {
    document.getElementById('popup-primary-signature').style.color = 'orange';
  }

  document.getElementById('popup-primary-connection-state').textContent = securityInfo.state;
  if(securityInfo.state != 'secure') {
    document.getElementById('popup-primary-connection-state').style.color = '#eb3b5a';
    setCheckmarkIconRed('popup-primary-icon-connection-state');
  }

  const textPFS = document.getElementById('popup-primary-pfs');
  if((securityInfo.keaGroupName != undefined && securityInfo.keaGroupName != 'RSA')
        || (securityInfo.cipherSuite != undefined && (securityInfo.cipherSuite.includes('_DHE_') || securityInfo.cipherSuite.includes('_ECDHE_')))
        || securityInfo.protocolVersion === 'TLSv1.3') {
    textPFS.textContent = browser.i18n.getMessage('yes');
    textPFS.style.color = 'green';
  } else {
    textPFS.textContent = browser.i18n.getMessage('no');
    textPFS.style.color = '#eb3b5a';
    setCheckmarkIconRed('popup-primary-icon-pfs');
  }

  const textHsts = document.getElementById('popup-primary-hsts');
  textHsts.textContent = (securityInfo.hsts ? browser.i18n.getMessage("yes") : browser.i18n.getMessage("no"));
  textHsts.style.color = (securityInfo.hsts ? 'green' : 'black');
  if(!securityInfo.hsts) {
    setCheckmarkIconYellow('popup-primary-icon-hsts');
  }

  const buttonPrimary = document.querySelector('#popup-button-primary');
  buttonPrimary.textContent = hostname;

  const textSSLLabsTestUrl = document.getElementById('popup-ssllabs-test-url');
  textSSLLabsTestUrl.href = 'https://www.ssllabs.com/ssltest/analyze.html?d=' + hostname;

}

async function updateCertificateDetails(securityInfo) {
  const serverCertificate = securityInfo.certificates[0];

  const textCertificateTrusted = document.getElementById('popup-primary-certificate-trusted');
  textCertificateTrusted.textContent = (securityInfo.isUntrusted ? browser.i18n.getMessage("no") : browser.i18n.getMessage("yes"));
  textCertificateTrusted.style.color = (securityInfo.isUntrusted ? '#eb3b5a' : 'black');

  const textCertificateEV = document.getElementById('popup-primary-certificate-ev');
  textCertificateEV.textContent = (securityInfo.isExtendedValidation ? ' (Extended Validation)' : '');
  textCertificateEV.style.color = (securityInfo.isExtendedValidation ? 'green' : 'black');

  const textCertificateIssuer = document.getElementById('popup-primary-certificate-issuer');
  serverCertificate.issuer.split(',').forEach(function (splittedIssuer) {
    if (splittedIssuer.startsWith('O=')) {
      issuer = splittedIssuer.replace('O=', '');
      textCertificateIssuer.textContent = issuer;
    }
  });

  const textCertificateCommonName = document.getElementById('popup-primary-certificate-cn');
  serverCertificate.subject.split(',').forEach(function (splittedIssuer) {
    if (splittedIssuer.startsWith('CN=')) {
      cn = splittedIssuer.replace('CN=', '');
      textCertificateCommonName.textContent = cn;
    }
  });

  const textCertificateSerial = document.getElementById('popup-primary-certificate-serial');
  textCertificateSerial.textContent = serverCertificate.serialNumber;

/*  const textCertificateKeyLength = document.getElementById('popup-primary-certificate-keylength');
  textCertificateKeyLength.textContent = "RSA 4096 bit";*/

  const textCertificateValidFrom = document.getElementById('popup-primary-certificate-valid-from');
  const textCertificateExpires = document.getElementById('popup-primary-certificate-expires');
  const textCertificateDaysRemaining = document.getElementById('popup-primary-certificate-days-remaining');
  textCertificateValidFrom.textContent = new Date(serverCertificate.validity.start).toLocaleDateString();
  textCertificateExpires.textContent = new Date(serverCertificate.validity.end).toLocaleDateString();
 
  const daysRemaining = Math.floor((new Date(serverCertificate.validity.end).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  textCertificateDaysRemaining.textContent =  browser.i18n.getMessage("popupPrimaryDaysRemaining", daysRemaining);
  if (daysRemaining < 30) {
    textCertificateDaysRemaining.style.color ='#eb3b5a';
  }

  const textCertificateFingerprintFirstLine = document.getElementById('popup-primary-certificate-fingerprint-first-line');
  const textCertificateFingerprintSecondLine = document.getElementById('popup-primary-certificate-fingerprint-second-line');
  const textCertificateFingerprintCrtShUrl = document.getElementById('popup-primary-certificate-fingerprint-crt-sh-url');
  textCertificateFingerprintFirstLine.textContent = serverCertificate.fingerprint.sha256.substr(0,48);
  textCertificateFingerprintSecondLine.textContent = serverCertificate.fingerprint.sha256.substr(48);
  textCertificateFingerprintCrtShUrl.href = "https://crt.sh/?q=" + serverCertificate.fingerprint.sha256;
}


async function updateTranslations() {
    var translationElementMap = new Map();
    translationElementMap.set("popupTitleResources", "popup-button-resources-text");
    translationElementMap.set("popupPrimaryProtocol", "popup-primary-title-tls-protocol");
    translationElementMap.set("popupPrimaryConnectionState", "popup-primary-title-connection-state");
    translationElementMap.set("popupPrimaryCipherSuite", "popup-primary-title-cipher-suite");
    translationElementMap.set("popupPrimaryKeyExchange", "popup-primary-title-key-exchange");
    translationElementMap.set("popupPrimarySignatureSchema", "popup-primary-title-signature-schema");
    translationElementMap.set("popupPrimaryPfs", "popup-primary-title-pfs");
    translationElementMap.set("popupPrimaryHsts", "popup-primary-title-hsts");
    translationElementMap.set("popupPrimaryCertificate", "popup-primary-title-certificate");
    translationElementMap.set("popupPrimaryTrusted", "popup-primary-title-certificate-trusted");
    translationElementMap.set("popupPrimaryCommonName", "popup-primary-title-certificate-cn");
    translationElementMap.set("popupPrimaryIssuer", "popup-primary-title-certificate-issuer");
    translationElementMap.set("popupPrimarySerial", "popup-primary-title-certificate-serial");
    translationElementMap.set("popupPrimaryValidity", "popup-primary-title-certificate-validity");
    //translationElementMap.set("popupPrimaryKey", "popup-primary-title-certificate-key");
    translationElementMap.set("popupPrimaryFingerprint", "popup-primary-title-certificate-fingerprint");
    translationElementMap.set("popupPrimaryRunSslLabsTest", "popup-ssllabs-test-url");
    translationElementMap.set("popupPrimaryRunSslLabsTestSuffix", "popup-primary-ssllabs-suffix");

    translationElementMap.forEach(function (value, key, map) {
      const message = browser.i18n.getMessage(key);
      document.getElementById(value).textContent = message;
    });
   
}

async function setCheckmarkIconRed(iconId) {
    const icon = document.querySelector('#' + iconId);
    icon.src = '../icons/checkmark_red.png';
}

async function setCheckmarkIconYellow(iconId) {
    const icon = document.querySelector('#' + iconId);
    icon.src = '../icons/checkmark_yellow.png';
}

/* Action listeners */
const buttonPrimary = document.querySelector('#popup-button-primary');
const buttonResources = document.querySelector('#popup-button-resources');

window.addEventListener('load', (event) => {
  buttonPrimary.click();
});

buttonPrimary.addEventListener('click', () => {
  openTab(event, 'primary')
});

buttonResources.addEventListener('click', () => {
  openTab(event, 'resources')
});
