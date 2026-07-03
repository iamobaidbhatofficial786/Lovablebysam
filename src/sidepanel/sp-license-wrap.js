// sp-license-wrap.js — License verification wrapper
// Loaded AFTER sidepanel.js so our handler wins over obfuscated code.

(function () {
  console.log('[License] sp-license-wrap.js loaded');

  var LICENSE_API = window.LICENSE_API_BASE ||
    'https://by-pass-ai-by-sam.vercel.app/api/public/license-verify';

  function normalizeLicenseKey(key) {
    return String(key || '').trim().toUpperCase();
  }

  function formatLicenseKey(key) {
    return normalizeLicenseKey(key);
  }

  function isSuccessResponse(res) {
    if (!res || typeof res !== 'object') return false;
    return res.success === true && res.valid === true && res.status === 'active';
  }

  function getDeviceId() {
    return new Promise(function (resolve) {
      var fallbackId = 'dev_' + Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['ql_device_id'], function (resObj) {
          var devId = resObj && resObj.ql_device_id;
          if (!devId) {
            devId = fallbackId;
            chrome.storage.local.set({ ql_device_id: devId });
          }
          resolve(devId);
        });
        return;
      }
      try {
        var stored = localStorage.getItem('ql_device_id');
        if (!stored) {
          stored = fallbackId;
          localStorage.setItem('ql_device_id', stored);
        }
        resolve(stored);
      } catch (e) {
        resolve(fallbackId);
      }
    });
  }

  function verifyKeyDirect(key) {
    var normalized = normalizeLicenseKey(key);
    console.log('[License] verifyKeyDirect called for key:', normalized);

    return getDeviceId().then(function (deviceId) {
      var extensionId = '';
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        extensionId = chrome.runtime.id;
      }

      var payload = {
        key: normalized,
        license_key: normalized,
        licenseKey: normalized,
        deviceId: deviceId,
        device_id: deviceId,
        extension_id: extensionId,
        app_name: 'ByPass Ai U'
      };

      return Promise.race([
        fetch(LICENSE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) {
          return r.json().catch(function () { return { success: false, valid: false, status: 'inactive', reason: 'bad_response' }; });
        }),
        new Promise(function (_, reject) {
          setTimeout(function () {
            reject(new Error('Network/Server verification timed out (10s limit).'));
          }, 10000);
        })
      ]);
    });
  }

  // Always use our verifier — never delegate to obfuscated tlValidateKey.
  function verifyLicenseKeyAsync(key) {
    console.log('[License] verifyLicenseKeyAsync called for key:', key);
    return verifyKeyDirect(key);
  }

  try {
    Object.defineProperty(window, 'verifyLicenseKeyAsync', {
      value: verifyLicenseKeyAsync,
      writable: false,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    window.verifyLicenseKeyAsync = verifyLicenseKeyAsync;
  }

  window.normalizeLicenseKey = normalizeLicenseKey;
  window.formatLicenseKey = formatLicenseKey;

  function saveLicenseAndReload(key, res) {
    var licenseData = {
      ql_license_valid: true,
      ql_license_key: normalizeLicenseKey(key),
      ql_session_id: 'session_' + Math.random().toString(36).slice(2, 10),
      ql_user_name: 'Premium User',
      ql_license_status: 'active',
      ql_expires_at: null,
      ql_activated_at: new Date().toISOString(),
      ql_plan_mode_pro: true,
      ql_plan_pro: true,
      ql_is_pro: true
    };

    chrome.storage.local.set(licenseData, function () {
      console.log('[License] Storage updated. Reloading sidepanel in 1.2s...');
      showUISuccess('License Activated Successfully');
      setTimeout(function () { location.reload(); }, 1200);
    });
  }

  function handleActivateClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var input = document.querySelector('.sp-license-gate .sp-input') ||
                document.querySelector('.sp-input') ||
                document.querySelector('.tl-input') ||
                document.querySelector('input[type="text"]') ||
                document.getElementById('license-key');

    if (!input) {
      console.error('[License] Cannot find input element at click time.');
      showUIError('Internal error: input not found. Please reload.');
      return;
    }

    var key = formatLicenseKey(input.value || '');
    console.log('[License] Click detected. Input key:', key);

    if (!key) {
      showUIError('Please enter a license key.');
      return;
    }

    setUILoading(true, 'Checking license\u2026');

    verifyLicenseKeyAsync(key).then(function (res) {
      console.log('[License] Validation response received:', res);
      setUILoading(false);

      if (isSuccessResponse(res)) {
        console.log('[License] Valid activation status. Saving data...');
        saveLicenseAndReload(key, res);
        return;
      }

      var reason = (res && res.reason) || 'invalid';
      console.log('[License] Key check failed. Reason:', reason);
      var friendlyError = 'Invalid License: ' + reason;
      if (reason === 'expired') {
        friendlyError = 'License Expired';
      } else if (reason === 'device_limit' || reason === 'limit') {
        friendlyError = 'Device Limit Reached';
      } else if (reason === 'database_error' || reason === 'server_error' || reason === 'network_timeout') {
        friendlyError = 'Server Error — please try again';
      }
      showUIError(friendlyError);
    }).catch(function (err) {
      console.error('[License] Error occurred:', err);
      setUILoading(false);
      showUIError(err.message || String(err));
    });
  }

  var MARKER = '__licenseClickAttached';

  function tryAttachHandler() {
    var buttons = document.querySelectorAll('.sp-btn-primary, button, input[type="submit"]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn[MARKER]) continue;

      var text = (btn.innerText || btn.textContent || btn.value || '').toLowerCase();
      if (text.indexOf('activate') !== -1 || text.indexOf('license') !== -1) {
        console.log('[License] Found activate button, attaching handler. Text:', text);
        btn[MARKER] = true;
        btn.addEventListener('click', handleActivateClick, true);
      }
    }
  }

  var pollCount = 0;
  var pollMax = 150;
  var pollTimer = setInterval(function () {
    tryAttachHandler();
    pollCount++;
    if (pollCount >= pollMax) clearInterval(pollTimer);
  }, 200);

  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function () { tryAttachHandler(); });
    var body = document.getElementById('sp-body') || document.body;
    observer.observe(body, { childList: true, subtree: true });
  }

  tryAttachHandler();

  function getOrCreateLogElement() {
    var log = document.querySelector('.sp-log');
    if (!log) {
      log = document.createElement('div');
      log.className = 'sp-log';
      var gate = document.querySelector('.sp-license-gate') || document.querySelector('.sp-body');
      if (gate) gate.appendChild(log);
    }
    return log;
  }

  function showUIError(msg) {
    var log = getOrCreateLogElement();
    if (log) {
      log.innerText = msg;
      log.className = 'sp-log sp-log-error';
    }
  }

  function showUISuccess(msg) {
    var log = getOrCreateLogElement();
    if (log) {
      log.innerText = msg;
      log.className = 'sp-log sp-log-success';
    }
  }

  function showUIInfo(msg) {
    var log = getOrCreateLogElement();
    if (log) {
      log.innerText = msg;
      log.className = 'sp-log sp-log-info';
    }
  }

  function setUILoading(isLoading, statusText) {
    var buttons = document.querySelectorAll('.sp-btn-primary, button, input[type="submit"]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var text = (btn.innerText || btn.textContent || btn.value || '').toLowerCase();
      if (text.indexOf('activate') !== -1 || text.indexOf('license') !== -1 ||
          text.indexOf('checking') !== -1 || text.indexOf('activating') !== -1) {
        btn.disabled = isLoading;
        if (isLoading) {
          btn.__originalText = btn.innerHTML;
          btn.innerHTML = statusText || 'Activating...';
          showUIInfo(statusText || 'Activating license, please wait...');
        } else if (btn.__originalText) {
          btn.innerHTML = btn.__originalText;
        } else {
          btn.innerHTML = 'Activate License';
        }
        return;
      }
    }
  }
})();
