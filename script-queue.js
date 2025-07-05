// ======== Global Vars & Constants ========
let subMenus = {};
let menuItems = [];
let articles = [];
const MAX_VISIBLE = 6;

let leftCol = document.querySelector('.left-scroll');
let rightCol = document.querySelector('.right-scroll');
let leftQueue = [], rightQueue = [], leftWaiting = [], rightWaiting = [], singleQueue = [];
let lastScrollTime = 0;
const SCROLL_THROTTLE = 100;
let homeItems = [], leftHomeQueue = [], rightHomeQueue = [], leftHomeWaiting = [], rightHomeWaiting = [];

// ======== Location/Helpers ========
function getCurrentPath() {
  return window.location.pathname.replace(/^\/+|\/+$/g, '');
}
function getCurrentSection() {
  return getCurrentPath().split('/')[0] || "home";
}
function getCurrentFile() {
  return getCurrentPath().split('/').pop() || "index.html";
}
function isHomePage() {
  return (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html" ||
    !!document.querySelector('.home-archive-grid')
  );
}
function isTablet() { return window.innerWidth <= 900 && window.innerWidth > 600; }
function isPhone() { return window.innerWidth <= 600; }
function getCenterContent() { return document.querySelector('.center-content'); }

// ======== HTML Builders ========
function getItemHTML(article) {
  const otherDataLabel = `<span class="item-collection">${article["other-data"] ? article["other-data"] : ""}</span>`;

  let dimmed = "";
  if (getCurrentFile() !== "index.html" && (!article.href || article.href !== getCurrentFile()))
    dimmed = " dimmed-item";
  return `
    <a class="item${dimmed}" href="${article.href || '#'}">
      <div class="item-title">${article.title}</div>
      <div class="item-details">
        <span class="item-year">${article.year ? article.year : ''}</span>
        ${otherDataLabel}
      </div>
    </a>
  `;
}

function getHomeItemHTML(item) {
  return `
    <div class="home-slot-item"${item.href ? ` data-href="${item.href}"` : ""}>
      <img src="${item.img}" class="home-slot-img" alt="">
      <div class="home-slot-captions">
        <div class="home-slot-caption-main">${item.caption_main}</div>
        <div class="home-slot-caption-sub">${item.caption_sub}</div>
      </div>
    </div>
  `;
}

function isItemPage(pathname) {
  const path = pathname || window.location.pathname;
  const last = path.split('/').pop();
  return (
    /\.html$/.test(last) &&       // ends with .html
    last !== 'index.html'         // but not index.html
  );
}

function updateArchiveGridItemMode() {
  const archiveGrid = document.querySelector('.archive-grid');
  if (!archiveGrid) return;
  if (isItemPage()) {
    archiveGrid.classList.add('item-mode');
  } else {
    archiveGrid.classList.remove('item-mode');
  }
}

// ======== Slot/Column Queues & Rendering ========
function setupQueues() {
  leftQueue = []; rightQueue = []; leftWaiting = []; rightWaiting = [];
  articles.forEach((article, i) => {
    if (i % 2 === 0) {
      (leftQueue.length < MAX_VISIBLE ? leftQueue : leftWaiting).push(article);
    } else {
      (rightQueue.length < MAX_VISIBLE ? rightQueue : rightWaiting).push(article);
    }
  });
}
function setupSingleQueue() { singleQueue = [...articles]; }
function renderQueues() {
  leftCol.innerHTML = ''; rightCol.innerHTML = '';
  leftQueue.forEach(article => leftCol.insertAdjacentHTML('beforeend', getItemHTML(article)));
  rightQueue.forEach(article => rightCol.insertAdjacentHTML('beforeend', getItemHTML(article)));
}


function renderSingleQueueToLeft() {
  leftCol.innerHTML = '';
  const showCount = Math.min(MAX_VISIBLE * 2, singleQueue.length);
  for (let i = 0; i < showCount; i++) {
    const article = singleQueue[i];
    if (article) leftCol.insertAdjacentHTML('beforeend', getItemHTML(article));
  }
}

// ======== Home Page Queues & Rendering ========
function setupHomeQueues() {
  leftHomeQueue = []; rightHomeQueue = []; leftHomeWaiting = []; rightHomeWaiting = [];
  homeItems.forEach((item, i) => {
    if (i % 2 === 0) {
      (leftHomeQueue.length < MAX_VISIBLE ? leftHomeQueue : leftHomeWaiting).push(item);
    } else {
      (rightHomeQueue.length < MAX_VISIBLE ? rightHomeQueue : rightHomeWaiting).push(item);
    }
  });
}
function renderHomeQueues() {
  leftCol.innerHTML = ''; rightCol.innerHTML = '';
  leftHomeQueue.forEach(item => leftCol.insertAdjacentHTML('beforeend', getHomeItemHTML(item)));
  rightHomeQueue.forEach(item => rightCol.insertAdjacentHTML('beforeend', getHomeItemHTML(item)));
}
function setupHomeSynchronousScroll() {
  removeAllScrollHandlers();
  function scrollHandler(e) {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_THROTTLE) return;
    lastScrollTime = now;
    if (e.deltaY < 0) {
      e.preventDefault();
      if (leftHomeQueue.length > 0) rightHomeWaiting.push(leftHomeQueue.shift());
      if (rightHomeQueue.length > 0) leftHomeWaiting.push(rightHomeQueue.shift());
      while (leftHomeQueue.length < MAX_VISIBLE && leftHomeWaiting.length > 0) leftHomeQueue.push(leftHomeWaiting.shift());
      while (rightHomeQueue.length < MAX_VISIBLE && rightHomeWaiting.length > 0) rightHomeQueue.push(rightHomeWaiting.shift());
      renderHomeQueues();
      leftCol.scrollTop = 0; rightCol.scrollTop = 0;
    } else { e.preventDefault(); }
  }
  leftCol.addEventListener('wheel', scrollHandler, { passive: false });
  rightCol.addEventListener('wheel', scrollHandler, { passive: false });
}

// ======== Home Page Init ========
function initHomePage() {
  fetch('/home.json')
    .then(r => r.json())
    .then(items => {
      homeItems = items;
      setupHomeQueues();
      renderHomeQueues();
      setupHomeSynchronousScroll();
    });
}

// ======== Remove Scroll Handlers ========
function removeAllScrollHandlers() {
  leftCol.replaceWith(leftCol.cloneNode(true));
  rightCol.replaceWith(rightCol.cloneNode(true));
  leftCol = document.querySelector('.left-scroll');
  rightCol = document.querySelector('.right-scroll');
}

// ======== Mobile Scroll Row (and removal) ========
function renderMobileScrollRow(items) {
  removeMobileScrollRow();
  const container = document.createElement('div');
  container.className = 'mobile-scroll-row';
  document.querySelector('.menus-wrapper').after(container);
  items.forEach(item => {
    container.insertAdjacentHTML('beforeend', getItemHTML(item));
  });
}
function removeMobileScrollRow() {
  const mobileRow = document.querySelector('.mobile-scroll-row');
  if (mobileRow) mobileRow.remove();
}

// ======== Responsive Scroll Handler ========
function handleResponsiveScroll() {
  if (isHomePage()) { initHomePage(); return; }
  if (isPhone()) {
    leftCol.style.display = "none";
    rightCol.style.display = "none";
    renderMobileScrollRow(singleQueue);
  } else if (isTablet()) {
    removeMobileScrollRow();
    leftCol.style.display = "";
    rightCol.style.display = "none";
    setupSingleQueue();
    renderSingleQueueToLeft();
  } else {
    removeMobileScrollRow();
    leftCol.style.display = "";
    rightCol.style.display = "";
    setupQueues();
    renderQueues();
    setupSynchronousScroll();
  }
}

// ======== Desktop Synchronous Scroll ========
function setupSynchronousScroll() {
  removeAllScrollHandlers();
  function scrollHandler(e) {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_THROTTLE) return;
    lastScrollTime = now;
    if (e.deltaY < 0) {
      e.preventDefault();
      if (leftQueue.length > 0) rightWaiting.push(leftQueue.shift());
      if (rightQueue.length > 0) leftWaiting.push(rightQueue.shift());
      while (leftQueue.length < MAX_VISIBLE && leftWaiting.length > 0) leftQueue.push(leftWaiting.shift());
      while (rightQueue.length < MAX_VISIBLE && rightWaiting.length > 0) rightQueue.push(rightWaiting.shift());
      renderQueues();
      leftCol.scrollTop = 0; rightCol.scrollTop = 0;
    } else { e.preventDefault(); }
  }
  leftCol.addEventListener('wheel', scrollHandler, { passive: false });
  rightCol.addEventListener('wheel', scrollHandler, { passive: false });
}



// ======== Load JSON Articles ========
function loadArticlesJson(jsonPath) {
  // Handles null/empty/"null" values and clears items.
  if (!jsonPath || jsonPath === 'null' || jsonPath === '') {
    articles = [];
    handleResponsiveScroll();
    return;
  }
  fetch(jsonPath)
    .then(response => response.json())
    .then(data => {
      articles = data;
      handleResponsiveScroll();
    })
    .catch(err => {
      articles = [];
      handleResponsiveScroll();
    });
}

// ======== Render submenu when main menu changes ========
function renderSubMenu(mainKey) {
  const submenuItems = subMenus[mainKey] || [];
  const subWrapper = document.querySelector('.sub-menu-wrapper');
  subWrapper.innerHTML = '';
  submenuItems.forEach(item => {
    const slide = document.createElement('a');
    slide.href = item.href || '#';
    slide.className = 'sub-menu-slide';
    slide.textContent = item.label;
    if (item.json) slide.dataset.json = item.json;
    slide.dataset.key = item.key;
    subWrapper.appendChild(slide);
  });
}

// ======== Reset Item Mode ========
function resetItemMode() {
  document.querySelector('.archive-grid').classList.remove('item-mode');
  const centerContent = getCenterContent();
  if (centerContent) centerContent.innerHTML = '';
}

function setupInfoGridCollapse() {
  document.querySelectorAll('.item-info-grid .info-label-row').forEach(row => {
    row.addEventListener('click', function () {
      this.closest('.item-info-grid').classList.toggle('collapsed');
      console.log('ROW CLICKED');
    });
  });
}

// ======== Always load correct JSON for any URL ========
function loadInitialArticlesFromUrl(href) {
  let url = href || window.location.pathname;
  let urlParts = url.replace(/^\/+|\/+$/g, '').split('/');
  let mainKey = urlParts[0] || "home";
  let subKey = urlParts[1] || null;
  const menuItem = menuItems.find(item => item.key === mainKey);
  const submenuArr = subMenus[mainKey] || [];
  let submenuItem = null;

  if (submenuArr.length > 0) {
    submenuItem =
      submenuArr.find(x =>
        (x.href && x.href.endsWith(subKey + "/index.html")) ||
        (x.key === subKey)
      ) ||
      submenuArr.find(x => x.key === (menuItem && menuItem.default_submenu)) ||
      submenuArr[0];
  }

  if (submenuItem && submenuItem.json) {
    loadArticlesJson(submenuItem.json);
  } else if (menuItem && menuItem.json) {
    loadArticlesJson(menuItem.json);
  } else {
    loadArticlesJson(null);
  }
}

// ======== Centralized event delegation for all clicks ========
document.body.addEventListener('click', function (e) {
  // Only main menu, sub menu, or item links
  const link = e.target.closest('.main-menu-slide, .sub-menu-slide, .item');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#') return;
  e.preventDefault();

  // === Highlighting UI ===
  if (link.classList.contains('main-menu-slide')) {
    document.querySelectorAll('.main-menu-slide').forEach(el => el.classList.remove('selected-menu'));
    link.classList.add('selected-menu');
    const mainKey = link.getAttribute('data-menu');
    renderSubMenu(mainKey);
    if (window.subMenuSwiper) window.subMenuSwiper.update();
    // Highlight default or first submenu
    const menuItem = menuItems.find(item => item.key === mainKey);
    const submenuArr = subMenus[mainKey] || [];
    let submenuItem = null;
    if (submenuArr.length > 0) {
      submenuItem =
        submenuArr.find(x => x.key === (menuItem && menuItem.default_submenu)) ||
        submenuArr[0];
      // Wait for submenu slides to be rendered
      setTimeout(() => {
        document.querySelectorAll('.sub-menu-slide').forEach(el => {
          el.classList.toggle('selected-submenu', el.dataset.key === submenuItem.key);
        });
      }, 0);
    }
  }

  if (link.classList.contains('sub-menu-slide')) {
    document.querySelectorAll('.sub-menu-slide').forEach(el => el.classList.remove('selected-submenu'));
    link.classList.add('selected-submenu');
  }

  // Fetch and replace HTML
  fetch(href)
    .then(r => r.text())
    .then(html => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Replace center-content and archive-title
      const newContent = tempDiv.querySelector('.center-content');
      if (newContent && document.querySelector('.center-content')) {
        document.querySelector('.center-content').innerHTML = newContent.innerHTML;
        setupInfoGridCollapse();
      }
     
      // Replace or remove link-title
      const newTitle = tempDiv.querySelector('.archive-title');
      const existingTitle = document.querySelector('.archive-title');
      if (newTitle && existingTitle) {
        existingTitle.textContent = newTitle.textContent;
      }
      const newLinkTitle = tempDiv.querySelector('.link-title');
      let existingLinkTitle = document.querySelector('.link-title');
      if (newLinkTitle) {
        if (existingLinkTitle) {
          existingLinkTitle.outerHTML = newLinkTitle.outerHTML;
        } else if (existingTitle) {
          // Insert after archive-title
          existingTitle.insertAdjacentElement('afterend', newLinkTitle.cloneNode(true));
        }
      } else if (existingLinkTitle) {
        existingLinkTitle.remove();
      }

      // Item mode/dimming
      if (link.classList.contains('item')) {
        document.querySelector('.archive-grid').classList.add('item-mode');
        document.querySelectorAll('.item').forEach(el => el.classList.add('dimmed-item'));
        link.classList.remove('dimmed-item');
      } else {
        document.querySelector('.archive-grid').classList.remove('item-mode');
      }

      // Update browser URL
      window.history.replaceState({}, '', href);

      
      if (window.location.pathname === "/about/index.html") {
        document.body.classList.add("negative-color");
      } else {
        document.body.classList.remove("negative-color");
      }
      
      if (!link.classList.contains('item')) {
        // Figure out the new main/sub menu keys from the href
        let mainKey = href.replace(/^\/+|\/+$/g, '').split('/')[0] || "home";
        let subKey = href.replace(/^\/+|\/+$/g, '').split('/')[1] || null;
        const menuItem = menuItems.find(item => item.key === mainKey);
        const submenuArr = subMenus[mainKey] || [];
        let submenuItem = null;

        if (submenuArr.length > 0) {
          submenuItem =
            submenuArr.find(x =>
              (x.href && x.href.endsWith(subKey + "/index.html")) ||
              (x.key === subKey)
            ) ||
            submenuArr.find(x => x.key === (menuItem && menuItem.default_submenu)) ||
            submenuArr[0];
        }

        if (submenuItem && submenuItem.json) {
          loadArticlesJson(submenuItem.json);
        } else if (menuItem && menuItem.json) {
          loadArticlesJson(menuItem.json);
        } else {
          loadArticlesJson(null);
        }
      }

      // Rerun layout logic if needed
      setupMenusWrapperAutoHide();
      handleResponsiveScroll();
      setupRunningTextTOC();
      updateArchiveGridItemMode();
      if (isItemPage()) {
        document.querySelectorAll('.item').forEach(el => el.classList.add('dimmed-item'));
        const currentFile = getCurrentFile();
        const selectedItem = Array.from(document.querySelectorAll('.item')).find(item =>
          (item.getAttribute('href') || '').split('/').pop() === currentFile
        );
        if (selectedItem) selectedItem.classList.remove('dimmed-item');
      }
    });
  return;
}
);

// ======== Auto-hide/show menus-wrapper on scroll direction in .center-content (or .running-text) ========
function setupMenusWrapperAutoHide() {
  const menusWrapper = document.querySelector('.menus-wrapper');
  let scrollEl = document.querySelector('.running-text') || document.querySelector('.running-book') || getCenterContent();
  let lastScrollTop = 0, ticking = false;
  if (!menusWrapper || !scrollEl) return;
  scrollEl.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        const st = scrollEl.scrollTop;
        if (st > lastScrollTop + 10) {
          menusWrapper.classList.add('hide-header');
        } else if (st < lastScrollTop - 10 || st < 20) {
          menusWrapper.classList.remove('hide-header');
        }
        lastScrollTop = st <= 0 ? 0 : st;
        ticking = false;
      });
      ticking = true;
    }
  });
}



// ======== Menu Logic (auto highlight and auto load) ========
fetch('/mainmenu.json')
  .then(response => response.json())
  .then(mainMenuArr => {
    menuItems = mainMenuArr;
    fetch('/submenus.json')
      .then(response => response.json())
      .then(subMenusData => {
        subMenus = subMenusData;

        // ===== Render main menu =====
        const mainMenuKey = getCurrentSection() || "home";
        const wrapper = document.querySelector('.main-menu-wrapper');
        wrapper.innerHTML = '';
        menuItems.forEach(item => {
          const slide = document.createElement('a');
          slide.className = 'main-menu-slide';
          slide.setAttribute('data-menu', item.key);
          if (item.href) slide.href = item.href;
          slide.innerHTML = `<span class="slide-inner">${item.label}</span>`;
          if (item.key === mainMenuKey) slide.classList.add('selected-menu');
          wrapper.appendChild(slide);
        });

        // ===== Render submenus =====
        renderSubMenu(mainMenuKey);

        // ====== Always load correct JSON for current URL ======
        loadInitialArticlesFromUrl();

        // ===== Init Swipers =====
        Swiper.use([Swiper.Mousewheel]);
        window.mainMenuSwiper = new Swiper('.menu-swiper', {
          slidesPerView: 'auto',
          spaceBetween: 100,
          loop: menuItems.length > 2,
          slideClass: 'main-menu-slide',
          grabCursor: true,
          simulateTouch: true,
          freeMode: true,
          breakpoints: {
            600: { spaceBetween: 100 },
            300: { spaceBetween: 60 }
          }
        });
        window.subMenuSwiper = new Swiper('.submenu-swiper', {
          slidesPerView: 'auto',
          spaceBetween: 100,
          loop: (subMenus[mainMenuKey] || []).length > 2,
          slideClass: 'sub-menu-slide',
          grabCursor: true,
          simulateTouch: true,
          freeMode: true,
          breakpoints: {
            600: { spaceBetween: 100 },
            300: { spaceBetween: 60 }
          }
        });

        // ===== Home page: initial rendering =====
        if (isHomePage()) { initHomePage(); }
      });
  });

// ======== Mousewheel scroll for menus ========
document.querySelector('.menu-swiper').addEventListener('wheel', function (e) {
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    this.scrollLeft += e.deltaY;
    e.preventDefault();
  }
}, { passive: false });

document.querySelector('.submenu-swiper').addEventListener('wheel', function (e) {
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    this.scrollLeft += e.deltaY;
    e.preventDefault();
  }
}, { passive: false });

// ======== Auto-hide/show menus-wrapper on scroll direction in .center-content (or .running-text) ========
setupMenusWrapperAutoHide();

// ======== Responsive Resize ========
window.addEventListener('resize', handleResponsiveScroll);
handleResponsiveScroll();
setupMenusWrapperAutoHide();

// Ensure collapse is set up on direct page loads
window.addEventListener('DOMContentLoaded', () => {
  setupInfoGridCollapse();
});

window.addEventListener('DOMContentLoaded', updateArchiveGridItemMode);


function setupRunningTextTOC() {
  // Check if this page has a running text TOC
  const tocItems = document.querySelectorAll('.toc-item');
  const runningTextMain = document.querySelector('.running-text');
  if (!tocItems.length || !runningTextMain) return;

  // Click to scroll
  tocItems.forEach(item => {
    item.addEventListener('click', function () {
      const id = this.dataset.target;
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Highlight logic
  const sceneAnchors = Array.from(document.querySelectorAll('span[id^="scene-"]'));
  function updateTOCHighlight() {
    let closestIdx = 0;
    let minDiff = Infinity;
    sceneAnchors.forEach((anchor, i) => {
      const rect = anchor.getBoundingClientRect();
      const diff = Math.abs(rect.top - 130); // adjust for your header
      if (diff < minDiff && rect.top < window.innerHeight) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    tocItems.forEach((item, i) => {
      item.classList.toggle('highlight', i === closestIdx);
    });
  }

  // Listen for scrolls (container or window)
  runningTextMain.addEventListener('scroll', updateTOCHighlight);

  // Initial highlight
  updateTOCHighlight();
}

// Call this after you dynamically inject hopale.html's content!
setupRunningTextTOC();

