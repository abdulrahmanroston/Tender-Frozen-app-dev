// Navigation configuration
const navConfig = {
  pages: [
    { id: 'orders', name: 'Orders', icon: 'fas fa-shopping-cart', url: 'https://tenderfrozen.com/admin-app/', relativePath: '' },
    { id: 'Warehouses', name: 'Warehouses', icon: 'fas fa-box', url: 'https://tenderfrozen.com/admin-app/warehouses.html', relativePath: 'warehouses.html' },
    { id: 'pos', name: 'POS', icon: 'fas fa-cash-register', url: 'https://tenderfrozen.com/admin-app/pos.html', relativePath: 'pos.html' },
    { id: 'accounting', name: 'Accounting', icon: 'fas fa-calculator', url: 'https://tenderfrozen.com/admin-app/acc.html', relativePath: 'acc.html' },
  ],
  menuTitle: 'Frozen Dashboard',
};

function getRelativePath() {
  let path = window.location.pathname;
  path = path.replace(/^\/+|\/+$/g, '');
  const basePath = 'admin-app';
  if (path === basePath || path === '') {
    return '';
  }
  if (path.startsWith(basePath + '/')) {
    return path.substring(basePath.length + 1);
  }
  return '';
}

// Register Service Worker - بسيط جدًا
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin-app/sw.js', { scope: '/admin-app/' })
      .then(reg => {
        console.log('✅ Service Worker registered');
        
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New version available');
                showUpdateNotification();
              }
            });
          }
        });
      })
      .catch(err => console.log('❌ Service Worker registration failed:', err));
  });
}

let deferredPrompt;

function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (!isAppInstalled()) {
    showInstallButton();
  }
});

function showInstallButton() {
  let installBtn = document.getElementById('pwa-install-btn');
  if (!installBtn) {
    installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(installBtn);
    
    installBtn.addEventListener('click', installApp);
  }
}

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ App installed');
        showToast('App installed successfully!', 'success', 'fas fa-check-circle');
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.remove();
      }
      deferredPrompt = null;
    });
  }
}

function showUpdateNotification() {
  let updateBtn = document.getElementById('pwa-update-btn');
  if (!updateBtn) {
    updateBtn = document.createElement('button');
    updateBtn.id = 'pwa-update-btn';
    updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Available';
    updateBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 600;
      animation: pulse 2s infinite;
    `;
    document.body.appendChild(updateBtn);
    
    updateBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

function createNavigation() {
  let container = document.getElementById('tf-navigation');
  if (!container) {
    container = document.createElement('div');
    container.id = 'tf-navigation';
    document.body.appendChild(container);
  }
  
  container.innerHTML = '';
  
  const fab = document.createElement('div');
  fab.className = 'tf-nav-fab';
  fab.id = 'tf-nav-fab';
  fab.innerHTML = '<i class="fas fa-bars"></i>';
  
  const modal = document.createElement('div');
  modal.className = 'tf-nav-modal';
  modal.id = 'tf-nav-modal';
  
  const menu = document.createElement('div');
  menu.className = 'tf-nav-menu';
  
  const title = document.createElement('h2');
  title.textContent = navConfig.menuTitle;
  menu.appendChild(title);
  
  const ul = document.createElement('ul');
  ul.className = 'tf-nav-list';
  const currentRelativePath = getRelativePath();
  
  navConfig.pages.forEach(page => {
    const li = document.createElement('li');
    li.className = 'tf-nav-item';
    li.setAttribute('data-page', page.id);
    li.innerHTML = `<i class="${page.icon}"></i> ${page.name}`;
    
    if (currentRelativePath === page.relativePath) {
      li.classList.add('active');
    }
    
    li.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPage(page.id, page.relativePath, page.url);
    });
    ul.appendChild(li);
  });
  menu.appendChild(ul);
  
  modal.appendChild(menu);
  container.appendChild(fab);
  container.appendChild(modal);
  
  let toast = document.getElementById('tf-nav-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'tf-nav-toast';
    toast.id = 'tf-nav-toast';
    document.body.appendChild(toast);
  }
  
  fab.addEventListener('click', () => {
    modal.classList.toggle('active');
    fab.classList.toggle('active');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      fab.classList.remove('active');
    }
  });
}

function navigateToPage(pageId, relativePath, url) {
  const currentRelativePath = getRelativePath();
  const page = navConfig.pages.find(p => p.id === pageId);
  if (!page) return;
  
  if (currentRelativePath === relativePath) {
    showToast('Already on this page', 'error', 'fas fa-info-circle');
    return;
  }
  
  showToast(`Loading ${page.name}...`, 'success', 'fas fa-spinner fa-spin');
  
  // Navigate مباشرة
  window.location.href = url;
  
  const modal = document.getElementById('tf-nav-modal');
  const fab = document.getElementById('tf-nav-fab');
  if (modal && fab) {
    modal.classList.remove('active');
    fab.classList.remove('active');
  }
}

function showToast(message, type, iconClass) {
  const toast = document.getElementById('tf-nav-toast');
  if (!toast) return;
  
  toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
  toast.className = `tf-nav-toast ${type}`;
  toast.style.display = 'flex';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  createNavigation();
});
