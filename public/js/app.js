(function () {
  'use strict';

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.toggle('open');
      }
    });
  }

  // Toast system
  window.showToast = function (message, type) {
    type = type || 'info';
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    var msgSpan = document.createElement('span');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;
    var closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function () { toast.remove(); });
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) { toast.remove(); }
    }, 5000);
  };

  // Notification polling (untuk phase 3 nanti)
  var notifBell = document.getElementById('notificationBell');
  if (notifBell) {
    function pollNotifications() {
      fetch('/ReMon/notifications/unread')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.length > 0) {
            var badge = notifBell.querySelector('.navbar-badge');
            if (badge) { badge.textContent = data.length; }
          }
        })
        .catch(function () {});
    }
    setInterval(pollNotifications, 30000);
  }

  // Notification API permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Auto-dismiss alerts
  document.querySelectorAll('.alert').forEach(function (alert) {
    setTimeout(function () { alert.style.display = 'none'; }, 5000);
  });
})();
