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
var GRINGOW_API_BASE    = "https://lovablebysam-18gcpvrqc-license-server.vercel.app/api/public/license-verify";
var POWERKITS_API_BASE  = "https://lovablebysam-18gcpvrqc-license-server.vercel.app/api/public/license-verify";
var LICENSE_API_BASE    = "https://lovablebysam-18gcpvrqc-license-server.vercel.app/api/public/license-verify";

window.GRINGOW_API_BASE    = GRINGOW_API_BASE;
window.POWERKITS_API_BASE  = POWERKITS_API_BASE;
window.LICENSE_API_BASE    = LICENSE_API_BASE;

// Declare global API key variables expected by the obfuscated code to prevent ReferenceErrors
var GRINGOW_API_KEY     = "";
var POWERKITS_API_KEY   = "";

window.GRINGOW_API_KEY     = GRINGOW_API_KEY;
window.POWERKITS_API_KEY   = POWERKITS_API_KEY;

// STEP 3: Patch fetch() to add a 10-second timeout for license API calls.
// This prevents the extension from hanging forever on "Loading..." if the
// license server is slow or unreachable.
(function () {
  var _LICENSE_DOMAIN = 'lovablebysam-18gcpvrqc-license-server.vercel.app';
  var _origFetch = window.fetch;
  window.fetch = function (url, opts) {
    var urlStr = String(url || '');
    // Only apply timeout to license server calls
    if (urlStr.indexOf(_LICENSE_DOMAIN) !== -1) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 10000);
      opts = Object.assign({}, opts || {}, { signal: controller.signal });
      return _origFetch.call(this, url, opts).then(function (res) {
        clearTimeout(timer);
        return res;
      }).catch(function (err) {
        clearTimeout(timer);
        // Return a graceful error response so the caller doesn't hang
        return new Response(JSON.stringify({ ok: false, reason: 'network_timeout' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
    return _origFetch.apply(this, arguments);
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