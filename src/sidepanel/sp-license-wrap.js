// sp-license-wrap.js — License verification timeout wrapper
// Runs AFTER time-license.js but BEFORE sidepanel.js

(function () {
  var _origVerify = window.verifyLicenseKeyAsync;

  window.verifyLicenseKeyAsync = function (key) {
    // 8-second hard timeout — resolves with an "inactive" result
    var timeoutPromise = new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          ok: false,
          reason: 'timeout',
          ql_license_valid: false,
          ql_license_status: 'inactive'
        });
      }, 8000);
    });

    var realPromise = (_origVerify && typeof _origVerify === 'function')
      ? _origVerify(key)
      : timeoutPromise;

    return Promise.race([realPromise, timeoutPromise]);
  };
})();
