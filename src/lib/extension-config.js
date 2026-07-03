// =============================================
// ByPass AI - New License System
// License Server: https://by-pass-ai-by-sam.vercel.app
// =============================================

// STEP 1: Lock INTERNAL_LICENSE_MODE permanently to FALSE using a getter.
// No obfuscated code can ever flip this back to true.
(function () {
  try {
    Object.defineProperty(window, 'INTERNAL_LICENSE_MODE', {
      get: function () { return false; },
      set: function () { /* blocked */ },
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    window.INTERNAL_LICENSE_MODE = false;
  }
})();

var INTERNAL_LICENSE_MODE = false;

// STEP 2: License Server URLs — define ALL variable names the obfuscated
// scripts may reference (GRINGOW_API_BASE, POWERKITS_API_BASE, LICENSE_API_BASE)
var LICENSE_SERVER = "https://by-pass-ai-by-sam.vercel.app/api/public/license-verify";
var GRINGOW_API_BASE    = LICENSE_SERVER;
var POWERKITS_API_BASE  = LICENSE_SERVER;
var LICENSE_API_BASE    = LICENSE_SERVER;

window.GRINGOW_API_BASE    = GRINGOW_API_BASE;
window.POWERKITS_API_BASE  = POWERKITS_API_BASE;
window.LICENSE_API_BASE    = LICENSE_API_BASE;

// Declare global API key variables expected by the obfuscated code to prevent ReferenceErrors
var GRINGOW_API_KEY     = "";
var POWERKITS_API_KEY   = "";

window.GRINGOW_API_KEY     = GRINGOW_API_KEY;
window.POWERKITS_API_KEY   = POWERKITS_API_KEY;

function pkNormalizeLicenseKey(key) {
  return String(key || '').trim().toUpperCase();
}

function pkFormatLicenseKey(key) {
  var trimmed = pkNormalizeLicenseKey(key);
  if (trimmed.indexOf('-') !== -1) return trimmed;
  var groups = trimmed.replace(/-/g, '').match(/.{1,4}/g);
  return groups ? groups.join('-') : trimmed;
}

function pkLicenseKeyVariants(key) {
  var trimmed = pkNormalizeLicenseKey(key);
  var formatted = pkFormatLicenseKey(trimmed);
  var noHyphen = trimmed.replace(/-/g, '');
  var out = [trimmed, formatted, noHyphen];
  var seen = {};
  return out.filter(function (v) {
    if (!v || seen[v]) return false;
    seen[v] = true;
    return true;
  });
}

function pkIsBypassLicenseKey(key) {
  return false;
}

function pkMockLicenseSuccess(key) {
  return {};
}

// STEP 3: Patch fetch() to add a 10-second timeout for license API calls.
// This prevents the extension from hanging forever on "Loading..." if the
// license server is slow or unreachable.
(function () {
  var _LICENSE_DOMAIN = 'by-pass-ai-by-sam.vercel.app';
  var _origFetch = window.fetch;
  window.fetch = function (url, opts) {
    var urlStr = String(url || '');
    // Intercept any license verification requests
    if (urlStr.indexOf(_LICENSE_DOMAIN) !== -1 || urlStr.indexOf('license-verify') !== -1) {
      // Force verification requests to hit the user's correct Vercel endpoint
      url = LICENSE_SERVER;
      
      // Get or create device ID asynchronously
      return new Promise(function (resolveId) {
        var fallbackId = 'dev_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['ql_device_id'], function (resObj) {
            var devId = resObj && resObj.ql_device_id;
            if (!devId) {
              devId = fallbackId;
              chrome.storage.local.set({ ql_device_id: devId });
            }
            resolveId(devId);
          });
        } else {
          try {
            var devId = localStorage.getItem('ql_device_id');
            if (!devId) {
              devId = fallbackId;
              localStorage.setItem('ql_device_id', devId);
            }
            resolveId(devId);
          } catch (e) {
            resolveId(fallbackId);
          }
        }
      }).then(function (deviceId) {
        var key = '';
        var bodyObj = {};
        try {
          if (opts && opts.body) {
            bodyObj = JSON.parse(opts.body);
            if (bodyObj) {
              key = bodyObj.license_key || bodyObj.key || bodyObj.licenseKey || '';
            }
          }
        } catch (e) {}

        key = String(key || '').trim().toUpperCase();

        var extensionId = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          extensionId = chrome.runtime.id;
        }

        var requestBody = {
          key: key,
          license_key: key,
          licenseKey: key,
          deviceId: deviceId,
          device_id: deviceId,
          extension_id: extensionId,
          app_name: 'ByPass Ai U'
        };

        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, 10000);
        var fetchOpts = Object.assign({}, opts || {}, {
          method: 'POST',
          headers: Object.assign({}, (opts && opts.headers) || {}, {
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        console.log('[License Interceptor] Calling Vercel API URL:', url);

        return _origFetch(url, fetchOpts).then(function (res) {
          clearTimeout(timer);
          return res.text().then(function (text) {
            console.log('[License Interceptor] HTTP Status:', res.status);
            console.log('[License Interceptor] JSON Response:', text);
            var data = {};
            try { data = JSON.parse(text || '{}'); } catch (e) {}
            var isFound = !!(data && data.success === true && data.valid === true && data.status === 'active');
            console.log('[License Interceptor] Supabase license found:', isFound);
            return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
          });
        }).catch(function (err) {
          clearTimeout(timer);
          console.error('[License Interceptor] Fetch error:', err);
          return new Response(JSON.stringify({ success: false, valid: false, status: 'inactive', reason: 'network_timeout' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      });
    }
    return _origFetch.apply(window, arguments);
  };
})();

// =============================================
// Helper functions expected by sidepanel.js,
// time-license.js, and license-guard.js
// =============================================

window.resolveTeamLicenseKey = function (key) {
  return String(key || '').trim();
};

window.normalizeLicenseUserName = function (name) {
  var n = String(name || '').toLowerCase().trim();
  if (!n || n === 'test_user' || /gringow|powerkits/i.test(n)) return 'user';
  return n;
};

window.powerkitsInternalSessionStorage = function (sessionId, userName) {
  return {
    ql_license_valid: false,
    ql_license_key: '',
    ql_session_id: sessionId || '',
    ql_user_name: window.normalizeLicenseUserName(userName),
    ql_license_status: 'inactive',
    ql_expires_at: null,
    ql_activated_at: new Date().toISOString()
  };
};

window.gringowInternalSessionStorage = window.powerkitsInternalSessionStorage;

window.powerkitsApiHeaders = function (base) {
  return Object.assign({}, base || {}, { 'Content-Type': 'application/json' });
};
window.gringowApiHeaders = window.powerkitsApiHeaders;

// Version/badge helpers
function extensionVersionShort() {
  return typeof EXTENSION_VERSION !== 'undefined' ? String(EXTENSION_VERSION) : '4.0';
}
function extensionFooterBadge() {
  var name = typeof EXTENSION_NAME !== 'undefined' ? String(EXTENSION_NAME) : 'EliteBytes';
  return name + ' v' + extensionVersionShort();
}

// Page local-storage helpers
function pkPageStorageGet(key) {
  try {
    return localStorage.getItem('pk_' + key) || localStorage.getItem('pk_page_' + key) || '';
  } catch (e) { return ''; }
}
function pkPageStorageSet(key, value) {
  try { localStorage.setItem('pk_' + key, value); } catch (e) {}
}

// Parse a UTC expiry value into a timestamp
function pkParseUtcExpiry(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  var s = String(v).trim();
  if (!s) return null;
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  var ts = Date.parse(s);
  return isNaN(ts) ? null : ts;
}

// Resolve human-readable license status
function pkResolveLicenseStatus(data) {
  if (!data) return 'inactive';
  if (data.ql_license_cancelled || data.ql_license_status === 'cancelled') return 'cancelled';
  return data.ql_license_status || 'inactive';
}

// Patch a license data object with derived fields
function pkLicenseStoragePatch(data) {
  if (!data) return {};
  var patch = { ql_license_status: pkResolveLicenseStatus(data) };
  if (Object.prototype.hasOwnProperty.call(data, 'ql_expires_at')) {
    patch.ql_expires_at = data.ql_expires_at || null;
  }
  return patch;
}

// Read plan mode from storage object
function readPlanModeFromStorage(stored) {
  stored = stored || {};
  return !!(stored.ql_plan_mode_pro || stored.ql_plan_pro || stored.ql_is_pro);
}

// Write plan mode to chrome.storage.local
function writePlanModeToStorage(isPro, callback) {
  var obj = { ql_plan_mode_pro: !!isPro };
  chrome.storage.local.set(obj, callback);
}

// Migrate old storage keys to current format and call back with (isPro, hasKey)
function migratePlanModeStorageKeys(callback) {
  var keys = [
    'ql_plan_mode_pro',
    'ql_plan_pro',
    'ql_is_pro',
    'ql_license_valid',
    'ql_license_key',
    'ql_session_id',
    'ql_license_status',
    'ql_expires_at',
    'ql_user_name',
    'ql_bypass_token',
    'ql_activated_at'
  ];
  chrome.storage.local.get(keys, function (stored) {
    var isPro = readPlanModeFromStorage(stored);
    var hasKey = !!(stored.ql_license_valid && stored.ql_license_key);
    if (callback) callback(isPro, hasKey);
  });
}