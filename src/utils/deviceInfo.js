// src/utils/deviceInfo.js
// Utility per rilevare informazioni sul dispositivo dell'utente

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Rileva OS
  let os = 'Sconosciuto';
  let osVersion = '';
  
  if (/Windows NT 10/.test(ua)) {
    os = 'Windows';
    osVersion = '10/11';
  } else if (/Windows NT 6.3/.test(ua)) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    os = 'iOS';
    const match = ua.match(/OS (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (/Mac OS X/.test(ua)) {
    os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (/Android/.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android (\d+\.?\d*)/);
    if (match) osVersion = match[1];
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  } else if (/CrOS/.test(ua)) {
    os = 'Chrome OS';
  }
  
  // Rileva browser
  let browser = 'Sconosciuto';
  let browserVersion = '';
  
  if (/Edg\//.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Opera|OPR/.test(ua)) {
    browser = 'Opera';
  }
  
  // Rileva tipo dispositivo
  let deviceType = 'Desktop';
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    deviceType = 'Mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    deviceType = 'Tablet';
  }
  
  // Rileva se è PWA/Standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
  
  // Rileva modello dispositivo (approssimativo)
  let deviceModel = '';
  if (/iPhone/.test(ua)) {
    deviceModel = 'iPhone';
  } else if (/iPad/.test(ua)) {
    deviceModel = 'iPad';
  } else if (/Samsung|SM-/.test(ua)) {
    deviceModel = 'Samsung';
  } else if (/Pixel/.test(ua)) {
    deviceModel = 'Google Pixel';
  } else if (/Huawei|HUAWEI/.test(ua)) {
    deviceModel = 'Huawei';
  } else if (/Xiaomi|Redmi|POCO/.test(ua)) {
    deviceModel = 'Xiaomi';
  } else if (/OPPO/.test(ua)) {
    deviceModel = 'OPPO';
  } else if (/OnePlus/.test(ua)) {
    deviceModel = 'OnePlus';
  }
  
  return {
    os,
    osVersion,
    browser,
    browserVersion,
    deviceType,
    deviceModel,
    isStandalone,
    // Stringa riassuntiva
    summary: `${deviceModel ? deviceModel + ' - ' : ''}${os}${osVersion ? ' ' + osVersion : ''} (${browser}${browserVersion ? ' ' + browserVersion : ''})`,
    // Stringa breve per visualizzazione
    short: `${deviceType === 'Mobile' ? '📱' : deviceType === 'Tablet' ? '📱' : '💻'} ${os} - ${browser}`,
    raw: ua.substring(0, 200) // Primi 200 caratteri dello UA per debug
  };
}

// Formatta la stringa per visualizzazione
export function formatDeviceInfo(deviceInfo) {
  if (!deviceInfo) return 'N/D';
  
  if (typeof deviceInfo === 'string') {
    return deviceInfo; // Legacy: era salvata come stringa
  }
  
  const { deviceType, os, osVersion, browser, deviceModel, isStandalone } = deviceInfo;
  
  const icon = deviceType === 'Mobile' ? '📱' : deviceType === 'Tablet' ? '📱' : '💻';
  const pwa = isStandalone ? ' (App)' : '';
  const model = deviceModel ? `${deviceModel} - ` : '';
  
  return `${icon} ${model}${os}${osVersion ? ' ' + osVersion : ''} • ${browser}${pwa}`;
}
