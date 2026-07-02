// sp-init.js — Error capture and loading fallback
// Runs FIRST before all other scripts (see sidepanel.html)

window.__spErrors = [];

// Catch synchronous JS errors
window.onerror = function (msg, src, line, col, err) {
  window.__spErrors.push(msg);
  var body = document.getElementById('sp-body');
  if (body) {
    body.innerHTML =
      '<div style="padding:16px;color:#ff6b6b;font-size:12px;font-family:monospace;word-break:break-all">' +
      '<b>JS ERROR:</b><br>' + msg + '<br><br><b>Source:</b> ' + src + ':' + line +
      '</div>';
  }
  return true;
};

// Catch unhandled Promise rejections (these do NOT trigger window.onerror)
window.addEventListener('unhandledrejection', function (event) {
  var reason = event.reason
    ? (event.reason.message || String(event.reason))
    : 'Unknown promise rejection';
  window.__spErrors.push('Async: ' + reason);
  var body = document.getElementById('sp-body');
  if (body && body.innerHTML.toLowerCase().indexOf('loading') !== -1) {
    body.innerHTML =
      '<div style="padding:16px;color:#ff8c42;font-size:12px;font-family:monospace;word-break:break-all">' +
      '<b>ASYNC ERROR:</b><br>' + reason +
      '</div>';
  }
});

// Safety net: if sp-body still says "loading" after 15 seconds, show error UI
window.__spLoadTimeout = setTimeout(function () {
  var body = document.getElementById('sp-body');
  if (body && body.innerHTML.toLowerCase().indexOf('loading') !== -1) {
    body.innerHTML =
      '<div style="padding:24px 16px;text-align:center;font-family:sans-serif">' +
      '<div style="font-size:28px;margin-bottom:12px">⚠️</div>' +
      '<p style="color:#ff8c42;font-size:13px;font-weight:600;margin-bottom:8px">Initialization Timeout</p>' +
      '<p style="color:#888;font-size:12px;line-height:1.5;margin-bottom:16px">' +
      'The extension could not start in time.<br>' +
      'Errors: ' + (window.__spErrors.join(' | ') || 'none captured') +
      '</p>' +
      '<button onclick="location.reload()" style="background:#e53935;color:#fff;border:none;border-radius:6px;padding:8px 20px;font-size:12px;cursor:pointer;font-weight:600">Retry</button>' +
      '</div>';
  }
}, 15000);
