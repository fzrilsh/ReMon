(function () {
  'use strict';

  // ─── Sidebar toggle + overlay ───
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // ─── Active sidebar nav link ───
  var currentPath = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.sidebar-nav-link').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var linkPath = href.replace(/\/$/, '');
    if (linkPath && (currentPath === linkPath || currentPath.startsWith(linkPath + '/'))) {
      link.classList.add('active');
    }
  });

  // ─── Toast system ───
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

  // ─── Notification dropdown ───
  var notifToggle = document.getElementById('notifToggle');
  var notifDropdown = document.getElementById('notifDropdown');
  var notifList = document.getElementById('notifList');
  var notifBadge = document.querySelector('.notif-badge');
  var markAllBtn = document.getElementById('notifMarkAllRead');
  var notifOpen = false;

  function renderNotifications(notifications) {
    if (!notifList) return;

    if (!notifications || notifications.length === 0) {
      notifList.innerHTML = '<div class="p-6 text-center text-gsm text-gcore-400">' +
        '<i class="fas fa-bell-slash text-2xl mb-2 block"></i>' +
        '<p>Tidak ada notifikasi</p></div>';
      if (markAllBtn) markAllBtn.style.display = 'none';
      if (notifBadge) notifBadge.style.display = 'none';
      return;
    }

    var html = '';
    notifications.forEach(function (n) {
      var icon = 'fa-bell';
      var color = 'text-gcore-accent';
      if (n.type === 'SPLIT_PAID' || n.type === 'DEBT_SETTLED') {
        icon = 'fa-check-circle'; color = 'text-green-500';
      } else if (n.type === 'SPLIT_DISPUTED' || n.type === 'DEBT_OVERDUE') {
        icon = 'fa-exclamation-circle'; color = 'text-red-500';
      } else if (n.type === 'DEBT_DUE') {
        icon = 'fa-calendar'; color = 'text-yellow-500';
      }
      var link = n.link || '#';
      html += '<a href="' + link + '" class="notif-item flex items-start gap-3 p-3 border-b border-gray-100 no-underline hover:bg-gray-50 transition-colors" data-id="' + n.id + '">' +
        '<span class="' + color + ' shrink-0 mt-0.5"><i class="fas ' + icon + '"></i></span>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-gsm font-semibold text-gcore-900 truncate">' + escapeHtml(n.title) + '</p>' +
          '<p class="text-gxs text-gcore-500 truncate">' + escapeHtml(n.message) + '</p>' +
          '<p class="text-2xs text-gcore-400 mt-0.5">' + timeAgo(n.createdAt) + '</p>' +
        '</div>' +
      '</a>';
    });
    notifList.innerHTML = html;
    if (markAllBtn) markAllBtn.style.display = 'block';
    if (notifBadge) {
      notifBadge.textContent = notifications.length;
      notifBadge.style.display = 'flex';
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var now = new Date();
    var date = new Date(dateStr);
    var diffMs = now - date;
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return diffMin + ' menit lalu';
    var diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return diffHour + ' jam lalu';
    var diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return diffDay + ' hari lalu';
    return date.toLocaleDateString('id-ID');
  }

  function fetchNotifications() {
    fetch('/notifications/unread')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderNotifications(data);
        if (notifOpen && notifDropdown) notifDropdown.classList.remove('hidden');
      })
      .catch(function () {});
  }

  // Toggle dropdown
  if (notifToggle && notifDropdown) {
    notifToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      notifOpen = !notifOpen;
      if (notifOpen) {
        fetchNotifications();
        notifDropdown.classList.remove('hidden');
      } else {
        notifDropdown.classList.add('hidden');
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      var wrap = document.getElementById('notificationWrap');
      if (notifOpen && wrap && !wrap.contains(e.target)) {
        notifOpen = false;
        notifDropdown.classList.add('hidden');
      }
    });

    // Mark single notification as read on click
    notifList.addEventListener('click', function (e) {
      var item = e.target.closest('.notif-item');
      if (item) {
        e.preventDefault();
        var id = item.getAttribute('data-id');
        var link = item.getAttribute('href');
        if (id) {
          fetch('/notifications/' + id + '/read', { method: 'PATCH' })
            .then(function () {
              fetchNotifications();
              if (link && link !== '#') { window.location.href = link; }
            })
            .catch(function () {});
        }
      }
    });
  }

  // Mark all as read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function () {
      fetch('/notifications/read-all', { method: 'PATCH' })
        .then(function () {
          renderNotifications([]);
          if (notifBadge) notifBadge.style.display = 'none';
        })
        .catch(function () {});
    });
  }

  // Poll notifications every 30 seconds
  setInterval(function () {
    fetch('/notifications/unread')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.length > 0 && notifBadge) {
          notifBadge.textContent = data.length;
          notifBadge.style.display = 'flex';
        } else if (notifBadge) {
          notifBadge.style.display = 'none';
        }
      })
      .catch(function () {});
  }, 30000);

  // Initial fetch
  setTimeout(fetchNotifications, 1000);

  // ─── Notification API permission ───
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // ─── Auto-dismiss alerts ───
  document.querySelectorAll('.alert').forEach(function (alert) {
    setTimeout(function () { alert.style.display = 'none'; }, 5000);
  });

  // ─── Service Worker registration ───
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js')
        .then(function (reg) { console.log('SW registered:', reg.scope); })
        .catch(function (err) { console.log('SW failed:', err); });
    });
  }

  // ─── Swipe-to-reveal rows ───
  function initSwipeRows() {
    if (window.innerWidth >= 1025) return;

    var SWIPE_THRESHOLD = 40;
    var REVEAL_DISTANCE = 120;
    var openRow = null;

    function closeRow(row) {
      if (!row) return;
      row.classList.remove('is-open');
      openRow = null;
    }

    function openRow_(row) {
      if (openRow && openRow !== row) closeRow(openRow);
      row.classList.add('is-open');
      openRow = row;
    }

    document.addEventListener('click', function (e) {
      if (openRow && !openRow.contains(e.target)) closeRow(openRow);
    });

    document.querySelectorAll('.swipe-row-wrap').forEach(function (wrap) {
      var startX = 0, startY = 0, isDragging = false, isScrolling = null;

      function onStart(x, y) {
        startX = x; startY = y;
        isDragging = true; isScrolling = null;
      }

      function onMove(x, y, e) {
        if (!isDragging) return;
        var dx = x - startX;
        var dy = y - startY;

        if (isScrolling === null) {
          isScrolling = Math.abs(dy) > Math.abs(dx);
        }
        if (isScrolling) return;

        if (e && e.cancelable) e.preventDefault();

        var content = wrap.querySelector('.swipe-content');
        var actions = wrap.querySelector('.swipe-actions');
        if (!content) return;

        var currentOpen = wrap.classList.contains('is-open');
        var offset = currentOpen ? -REVEAL_DISTANCE + dx : dx;
        offset = Math.max(-REVEAL_DISTANCE, Math.min(0, offset));

        content.style.transition = 'none';
        if (actions) actions.style.transition = 'none';
        content.style.transform = 'translateX(' + offset + 'px)';
        if (actions) actions.style.transform = 'translateX(' + (REVEAL_DISTANCE + offset) + 'px)';
      }

      function onEnd(x) {
        if (!isDragging || isScrolling) { isDragging = false; return; }
        isDragging = false;
        var dx = x - startX;
        var content = wrap.querySelector('.swipe-content');
        var actions = wrap.querySelector('.swipe-actions');

        if (content) { content.style.transition = ''; content.style.transform = ''; }
        if (actions) { actions.style.transition = ''; actions.style.transform = ''; }

        var currentOpen = wrap.classList.contains('is-open');
        if (!currentOpen && dx < -SWIPE_THRESHOLD) {
          openRow_(wrap);
        } else if (currentOpen && dx > SWIPE_THRESHOLD) {
          closeRow(wrap);
        } else if (currentOpen) {
          openRow_(wrap);
        } else {
          closeRow(wrap);
        }
      }

      wrap.addEventListener('touchstart', function (e) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      wrap.addEventListener('touchmove', function (e) {
        onMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }, { passive: false });

      wrap.addEventListener('touchend', function (e) {
        onEnd(e.changedTouches[0].clientX);
      });
    });
  }

  initSwipeRows();

})();

