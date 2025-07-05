const DESKTOP_WIDTH = 1200;
const TABLET_WIDTH = 750;

const MAIN_MENUS_WITHOUT_SUBMENU = [
    "home", "books", "about", "contact", "news", "media", "quoting"
];

// ======== Global Vars & Constants ========
let subMenus = {};
let menuItems = [];
let articles = [];
let leftSwiper, rightSwiper, singleSwiper;
let centerCol = document.querySelector('.center-scroll');
let lastLayoutMode = getLayoutMode();
window.isProgrammaticScroll = false;




function updateSubmenuVisibility(mainMenuKey) {
    const submenuSwiper = document.querySelector('.submenu-swiper');
    // console.log('updateSubmenuVisibility:', mainMenuKey);
    // console.log('submenuSwiper:', submenuSwiper);
    if (!submenuSwiper) return;
    if (MAIN_MENUS_WITHOUT_SUBMENU.includes(mainMenuKey) || mainMenuKey === "index.html") {
        submenuSwiper.style.display = "none";
    } else {
        submenuSwiper.style.display = "";
        // If Swiper instance exists, refresh it
        if (window.subMenuSwiper) {
            setTimeout(() => window.subMenuSwiper.update(), 10);
        }
    }
}

// ======== Helpers ========
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
function isTablet() { return window.innerWidth < DESKTOP_WIDTH && window.innerWidth > TABLET_WIDTH; }
function isPhone() { return window.innerWidth <= TABLET_WIDTH; }
function getCenterContent() { return document.querySelector('.center-content'); }

function highlightMainMenu(mainKey) {
    document.querySelectorAll('.main-menu-slide').forEach(el => {
        el.classList.toggle('selected-menu', el.dataset.menu === mainKey);
    });
}

function highlightSubMenu(subKey) {
    document.querySelectorAll('.sub-menu-slide').forEach(el => {
        el.classList.toggle('selected-submenu', el.dataset.key === subKey);
    });
}


function highlightActiveItem(currentHref) {
    const grid = document.querySelector('.archive-grid');
    if (!grid || !grid.classList.contains('item-mode')) return;

    const currentPath = new URL(currentHref, window.location.origin).pathname;
    console.log('[highlightActiveItem] currentPath:', currentPath);

    document.querySelectorAll('.item').forEach((el, index) => {
        const rawHref = el.getAttribute('href');

        if (!rawHref || rawHref === "#") {
            el.classList.remove('active-item');
            el.classList.add('dimmed-item');
            return;
        }

        let itemPath;
        try {
            itemPath = new URL(rawHref, window.location.origin).pathname;
        } catch (e) {
            console.log(`[${index}] ERROR parsing href:`, rawHref);
            el.classList.remove('active-item');
            el.classList.add('dimmed-item');
            return;
        }
        // console.assert(el.classList.contains('dimmed-item') || el.classList.contains('active-item'), `[${index}] Before clean-up:`, el.className);

        const isActive = itemPath === currentPath;
        // console.log(`[${index}] itemPath:`, itemPath, '| isActive:', isActive);

        el.classList.remove('dimmed-item', 'active-item');
        if (isActive) {
            el.classList.remove('dimmed-item');
            el.classList.add('active-item');
            // console.log(`[${index}] ✅ Marked active:`, el.className);

        } else {
            el.classList.add('dimmed-item');
        }
    });
    const activeCount = document.querySelectorAll('.item.active-item').length;
    console.log(`✅ Active items found: ${activeCount}`);

}




function getSpacerSlide(height = 20) {
    return `<div class="swiper-slide spacer-slide" style="height: ${height}px;"></div>`;
}

function getSwiperHTML(items, swiperClass) {
    return `
      <div class="swiper column-swiper ${swiperClass}">
        <div class="swiper-wrapper">
          ${items.map(getHomeItemHTML).join('')}
        </div>
      </div>
    `;
}



function getHomeItemHTML(item) {
    const href = item.href || "#";
    const hasImage = !!item.img;
    const year = item.year || "";
    const otherData = item["other-data"] || "";

    return `
      <a class="item" href="${href}">
        ${hasImage ? `
          <div class="item-image-wrapper">
            <img src="${item.img}" alt="${item.title}" class="item-image" />
          </div>` : ''
        }
        <div class="item-title">${item.title}</div>
        <div class="item-details">
          <span class="item-year-hebrew">${year}</span>
          <span class="item-collection">${otherData}</span>
        </div>
      </a>
    `;
}

function renderDesktopColumns(articles) {
    const leftCol = document.querySelector('.left-scroll');
    const rightCol = document.querySelector('.right-scroll');
    if (!leftCol || !rightCol) return;

    // Split items for visual variety
    const even = articles.filter((_, i) => i % 2 === 0);
    const odd = articles.filter((_, i) => i % 2 !== 0);
    const leftItems = [...odd, ...even];
    const rightItems = [...even, ...odd];

    // Create HTML and triple for infinite scroll
    const leftHTML = leftItems.map(getItemHTML).join('');
    const rightHTML = rightItems.map(getItemHTML).join('');

    leftCol.innerHTML = leftHTML + leftHTML + leftHTML;
    rightCol.innerHTML = rightHTML + rightHTML + rightHTML;

    makeColumnInfiniteScroll(leftCol);
    makeColumnInfiniteScroll(rightCol);

    requestAnimationFrame(() => {
        leftCol.scrollTop = leftCol.scrollHeight / 3;
        rightCol.scrollTop = rightCol.scrollHeight / 3;
    });
}


function setupSectionScrollSync() {
    const left = document.querySelector('.left-scroll');
    const right = document.querySelector('.right-scroll');
    if (!left || !right) return;

    let isSyncing = false;

    function syncReverse(source, target) {
        if (isSyncing) return;
        isSyncing = true;

        const max = target.scrollHeight - target.clientHeight;
        const newScroll = max - source.scrollTop;
        target.scrollTop = newScroll;

        requestAnimationFrame(() => {
            isSyncing = false;
        });
    }

    left.addEventListener('scroll', () => syncReverse(left, right));
    right.addEventListener('scroll', () => syncReverse(right, left));
}

function setupHomeScrollSync() {
    const left = document.querySelector('.left-scroll');
    const center = document.querySelector('.center-scroll');
    const right = document.querySelector('.right-scroll');

    if (!left || !center || !right) return;

    let isSyncing = false;

    function syncByPercent(source, targets, inverseTargets = []) {
        if (isSyncing || window.isProgrammaticScroll) return;
        isSyncing = true;

        const percent = source.scrollTop / (source.scrollHeight - source.clientHeight);

        window.isProgrammaticScroll = true;

        targets.forEach(el => {
            const max = el.scrollHeight - el.clientHeight;
            el.scrollTop = percent * max;
        });

        inverseTargets.forEach(el => {
            const max = el.scrollHeight - el.clientHeight;
            el.scrollTop = max - (percent * max);
        });

        requestAnimationFrame(() => {
            isSyncing = false;
            window.isProgrammaticScroll = false;
        });
    }

    center.addEventListener('scroll', () => {
        syncByPercent(center, [], [left, right]);
    });

    left.addEventListener('scroll', () => {
        syncByPercent(left, [right], [center]);
    });

    right.addEventListener('scroll', () => {
        syncByPercent(right, [left], [center]);
    });
}


// function setupHomeScrollSync() {
//     const left = document.querySelector('.left-scroll');
//     const center = document.querySelector('.center-scroll');
//     const right = document.querySelector('.right-scroll');

//     if (!left || !center || !right) return;

//     let isSyncing = false;

//     function syncReverse(source, targets, inverseTargets = []) {
//         if (isSyncing) return;
//         isSyncing = true;

//         const scrollTop = source.scrollTop;
//         window.isProgrammaticScroll = true;

//         targets.forEach(el => el.scrollTop = scrollTop);
//         inverseTargets.forEach(el => {
//             const max = el.scrollHeight - el.clientHeight;
//             el.scrollTop = max - scrollTop;
//         });


//         requestAnimationFrame(() => {
//             isSyncing = false;
//             window.isProgrammaticScroll = false;
//         });
//     }

//     center.addEventListener('scroll', () => {
//         syncReverse(center, [], [left, right]);
//     });
//     left.addEventListener('scroll', () => {
//         syncReverse(left, [right], [center]);
//     });
//     right.addEventListener('scroll', () => {
//         syncReverse(right, [left], [center]);
//     });
// }

function setupScrollSync() {
    const left = document.querySelector('.left-scroll');
    const center = document.querySelector('.center-scroll');
    const right = document.querySelector('.right-scroll');

    let isSyncing = false;
    function syncReverse(source, targets, inverseTargets = []) {
        if (isSyncing) return;
        isSyncing = true;

        const scrollTop = source.scrollTop;

        // 🟡 Temporarily turn ON the "skip scrollCheck" switch
        window.isProgrammaticScroll = true;

        targets.forEach(el => el.scrollTop = scrollTop);
        inverseTargets.forEach(el => {
            const max = el.scrollHeight - el.clientHeight;
            el.scrollTop = max - scrollTop;
        });

        // 🟢 Turn the switch OFF after one frame
        requestAnimationFrame(() => {
            isSyncing = false;
            window.isProgrammaticScroll = false;
        });
    }
    if (isHomePage()) {
        center.addEventListener('scroll', () => {
            syncReverse(center, [], [left, right]);
        });
    }
    left.addEventListener('scroll', () => {
        syncReverse(left, [right], [center]);
    });

    right.addEventListener('scroll', () => {
        syncReverse(right, [left], [center]);
    });
}

// function makeColumnInfiniteScroll(column) {
//     if (window.isProgrammaticScroll) return;
//     const original = column.innerHTML;
//     column.innerHTML = original + original + original;
//     // column.style.visibility = 'hidden';
//     const third = column.scrollHeight / 3;
//     requestAnimationFrame(() => {
//         // requestAnimationFrame(() => {
//         column.scrollTop = third;
//         const firstItem = column.querySelector('.item');
//     });

//     const scrollCheck = () => {
//         if (isProgrammaticScroll) return;
//         const max = column.scrollHeight - column.clientHeight;
//         const oneThird = max / 3;
//         const current = column.scrollTop;

//         if (current < oneThird * 0.1) {
//             column.scrollTop = oneThird + current;
//         } else if (current > oneThird * 2.9) {
//             column.scrollTop = current - oneThird;
//         }
//     };

//     column.addEventListener('scroll', scrollCheck);
// }
function makeColumnInfiniteScroll(column) {
    if (!column) return;

    const originalHTML = column.innerHTML;
    column.innerHTML = originalHTML + originalHTML + originalHTML;

    const oneThird = column.scrollHeight / 3;

    requestAnimationFrame(() => {
        column.scrollTop = oneThird;
    });

    column.addEventListener('scroll', () => {
        if (window.isProgrammaticScroll) return;

        const max = column.scrollHeight;
        const current = column.scrollTop;
        const oneThird = max / 3;

        if (current < oneThird * 0.1 || current > oneThird * 2.9) {
            window.isProgrammaticScroll = true;

            requestAnimationFrame(() => {
                column.scrollTop = oneThird + (current % oneThird);
                requestAnimationFrame(() => {
                    window.isProgrammaticScroll = false;
                });
            });
        }
    });
}


function activateHomeMode() {
    fetch('/home.json')
        .then(r => r.json())
        .then(items => {
            const leftCol = document.querySelector('.left-scroll');
            const centerCol = document.querySelector('.center-scroll');
            const rightCol = document.querySelector('.right-scroll');

            if (!leftCol || !centerCol || !rightCol) return;

            const even = items.filter((_, i) => i % 2 === 0);
            const odd = items.filter((_, i) => i % 2 !== 0);

            const leftItems = [...odd, ...even];
            const centerItems = [...items].reverse();
            // const rightItems = [...even, ...odd];
            const rightItems = [...odd, ...even].reverse();

            leftCol.innerHTML = leftItems.map(getHomeItemHTML).join('');
            centerCol.innerHTML = centerItems.map(getHomeItemHTML).join('');
            rightCol.innerHTML = rightItems.map(getHomeItemHTML).join('');

            makeColumnInfiniteScroll(leftCol);
            makeColumnInfiniteScroll(centerCol);
            makeColumnInfiniteScroll(rightCol);

            setupHomeScrollSync();
        });
}


function activateSectionMode(articles) {
    const mode = getLayoutMode();

    resetScrollColumns(mode);

    if (mode === 'desktop') {
        renderDesktopColumns(articles);
        setupSectionScrollSync();
    } else if (mode === 'tablet') {
        renderTabletColumn(articles);
    } else {
        renderMobileRow(articles);
        setupMobileSwiper();
    }

    setupItemHoverHighlight();
    setupMenusWrapperAutoHide();
    highlightActiveItem(window.location.href);
}



// ======== HTML Builders ========
function getItemHTML(article) {
    const mode = getLayoutMode();
    const useSwiper = (mode === 'desktop' || mode === 'phone'); // only desktop & mobile need Swiper
    const hasImage = !!article.img;
    const classes = "item" + (useSwiper ? " swiper-slide" : "");

    if (hasImage) {
        return `
        <a class="${classes}" href="${article.href || '#'}">
          <div class="item-image-wrapper">
            <img src="${article.img}" alt="${article.title}" class="item-image" />
          </div>
          <div class="item-title">${article.title}</div>
        </a>
      `;
    }

    const otherDataLabel = `<span class="item-collection">${article["other-data"] || ""}</span>`;

    let yearHTML = '';
    if (article["year-hebrew"]) {
        yearHTML = `<span class="item-year-hebrew">${article["year-hebrew"]}</span> `;
    }
    yearHTML += `<span class="item-year-latin">${article.year || ''}</span>`;

    return `
      <a class="${classes}" href="${article.href || '#'}">
        <div class="item-title">${article.title}</div>
        <div class="item-details">
          <span class="item-year">${yearHTML}</span>
          ${otherDataLabel}
        </div>
      </a>
    `;
}





// ======== Tablet (1 col swiper) ========
function renderTabletColumn(articles) {
    const leftCol = document.querySelector('.left-scroll');
    if (!leftCol) return;

    // Explicitly remove all old Swiper columns
    leftCol.querySelectorAll('.left-items-swiper').forEach(el => el.remove());

    console.log('[renderTabletColumn] left-scroll children BEFORE:', leftCol.children.length);

    const html = articles.map(getItemHTML).join('');
    leftCol.innerHTML += `
        <div class="left-items-wrapper">
          ${html + html + html}
        </div>
    `;

    console.log('[renderTabletColumn] left-scroll children AFTER:', leftCol.children.length);
    makeColumnInfiniteScroll(leftCol);
}


// function renderMobileRow(articles) {
//     if (window.location.pathname.includes('/about/index.html')) return;
//     if (isHomePage()) return;

//     document.querySelector('.left-scroll').innerHTML = '';
//     document.querySelector('.right-scroll').innerHTML = '';
//     removeMobileScrollRow();

//     // ✅ Wrapper div
//     const wrapper = document.createElement('div');
//     wrapper.className = 'mobile-scroll-wrapper';

//     // ✅ Actual swiper scroll row
//     const mobileRow = document.createElement('div');
//     mobileRow.className = 'mobile-scroll-row swiper mobile-items-swiper';


//     // ✅ Inner wrapper with slide items
//     const slides = articles.map(getItemHTML).join('');
//     mobileRow.innerHTML = `<div class="swiper-wrapper">${slides}</div>`;

//     wrapper.appendChild(mobileRow);
//     document.querySelector('.menus-wrapper').after(wrapper);
// }
function syncMobileRowWithHeader() {
    const menusWrapper  = document.querySelector('.menus-wrapper');
    const mobileWrapper = document.querySelector('.mobile-scroll-wrapper');
    if (!mobileWrapper) return;            // nothing to do
  
    const shouldHide = menusWrapper?.classList.contains('hide-header');
    mobileWrapper.classList.toggle('hide-header', shouldHide);
  }

function renderMobileRow(articles) {
    if (window.location.pathname.includes('/about/index.html')) return;
    if (isHomePage()) return;

    document.querySelector('.left-scroll').innerHTML = '';
    document.querySelector('.right-scroll').innerHTML = '';
    removeMobileScrollRow();

    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-scroll-wrapper';

    const mobileRow = document.createElement('div');
    mobileRow.className = 'mobile-scroll-row swiper mobile-items-swiper';

    const slides = articles.map(getItemHTML).join('');

    // 🟢 Duplicate manually to prevent loop stutter
    const tripleSlides = slides + slides + slides;

    mobileRow.innerHTML = `<div class="swiper-wrapper">${tripleSlides}</div>`;

    wrapper.appendChild(mobileRow);
    document.querySelector('.menus-wrapper').after(wrapper);
    syncMobileRowWithHeader();
}



function setupMobileSwiper() {
    Swiper.use([Swiper.Mousewheel]);
    if (window.mobileSwiper) window.mobileSwiper.destroy(true, true);
    window.mobileSwiper = new Swiper('.mobile-items-swiper', {
        direction: 'horizontal',
        slidesPerView: 'auto',
        freeMode: true,
        loop: true,
        mousewheel: true,
        watchOverflow: true,
        grabCursor: true,
        freeMode: {
            enabled: true,
            momentum: true,          // enables momentum after you let go
            momentumRatio: 0.3,     // smaller = more resistance/smooth stop
            // sticky: true,             
        },
        mousewheel: {
            enabled: true,
            sensitivity: 0.3,        // lower is smoother (experiment)
            releaseOnEdges: true
        },
    });
}

function removeMobileScrollRow() {
    // const row = document.querySelector('.mobile-scroll-row');
    // if (row) row.remove();
    const wrapper = document.querySelector('.mobile-scroll-wrapper');
    if (wrapper) wrapper.remove();
}

// ======== Responsive Handler ========
function resetScrollColumns(mode = getLayoutMode(), previousMode = lastLayoutMode) {
    const left = document.querySelector('.left-scroll');
    const right = document.querySelector('.right-scroll');

    if (window.leftSwiper) {
        window.leftSwiper.destroy(true, true);
        window.leftSwiper = null;
    }
    if (window.rightSwiper) {
        window.rightSwiper.destroy(true, true);
        window.rightSwiper = null;
    }

    if (left) {
        const freshLeft = left.cloneNode(false);
        left.parentNode.replaceChild(freshLeft, left);
    }

    if (right) {
        const freshRight = right.cloneNode(false);
        right.parentNode.replaceChild(freshRight, right);
    }

    removeMobileScrollRow();
}


function getLayoutMode() {
    if (window.innerWidth >= DESKTOP_WIDTH) return 'desktop';
    if (window.innerWidth > TABLET_WIDTH) return 'tablet';
    return 'phone';
}

function loadArticlesJson(jsonPath) {
    if (isHomePage()) {
        activateHomeMode();
        return;
    }

    if (!jsonPath || jsonPath === 'null' || jsonPath === '') {
        articles = [];
        activateSectionMode([]);
        return;
    }

    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            articles = data;
            activateSectionMode(data);
        })
        .catch(() => {
            articles = [];
            activateSectionMode([]);
        });
}

// function setupInfoGridCollapse() {
//     document.querySelectorAll('.item-info-grid .collapse-toggle').forEach(row => {
//         row.addEventListener('click', function () {
//             this.closest('.item-info-grid').classList.toggle('collapsed');
//             console.log('ROW CLICKED');
//         });
//     });
// }
function setupInfoGridCollapse() {
    const isMobile = window.innerWidth <= TABLET_WIDTH;

    document.querySelectorAll('.item-info-grid').forEach(grid => {
        // Auto-collapse on mobile
        if (isMobile) {
            grid.classList.add('collapsed');
        }

        // Add listener if not already added
        const toggle = grid.querySelector('.collapse-toggle');
        if (toggle && !toggle.dataset.listenerAdded) {
            toggle.addEventListener('click', function () {
                grid.classList.toggle('collapsed');
            });
            toggle.dataset.listenerAdded = 'true';
        }
    });
}


function setupTocCollapse() {
    if (window.innerWidth > DESKTOP_WIDTH) return;
    const isMobile = window.innerWidth <= TABLET_WIDTH;
    const toggle = document.querySelector('.collapse-toggle-table-content');
    const tocBlock = document.querySelector('.toc-block');

    if (!toggle || !tocBlock) return;
    if (isMobile) {
        tocBlock.classList.add('collapsed');
    }
    toggle.addEventListener('click', function () {
        tocBlock.classList.toggle('collapsed');
        // console.log('TOC toggled. Collapsed:', tocBlock.classList.contains('collapsed'));
    });
}

function renderSubMenu(mainKey) {
    const submenuItems = subMenus[mainKey] || [];
    const subWrapper = document.querySelector('.sub-menu-wrapper');
    if (!subWrapper) return;

    // Only rebuild if the submenu is for a different mainKey
    if (subWrapper.dataset.currentKey === mainKey) return;
    subWrapper.dataset.currentKey = mainKey;

    subWrapper.innerHTML = '';
    submenuItems.forEach(item => {
        const slide = document.createElement('a');
        slide.href = item.href || '#';
        slide.className = 'sub-menu-slide';
        const displayText = item.label || item.key;
        slide.innerHTML = `
            <span class="slide-inner">
                <span class="menu-regular">${displayText}</span>
                <span class="menu-highlight">${displayText}</span>
            </span>
        `;
        if (item.json) slide.dataset.json = item.json;
        slide.dataset.key = item.key;
        subWrapper.appendChild(slide);
    });
}

// function renderSubMenu(mainKey) {
//     const submenuItems = subMenus[mainKey] || [];
//     const subWrapper = document.querySelector('.sub-menu-wrapper');
//     subWrapper.innerHTML = '';
//     submenuItems.forEach(item => {
//         const slide = document.createElement('a');
//         slide.href = item.href || '#';
//         slide.className = 'sub-menu-slide';
//         // Use label if available, otherwise fallback to key
//         const displayText = item.label || item.key;
//         slide.innerHTML = `
//             <span class="slide-inner">
//                 <span class="menu-regular">${displayText}</span>
//                 <span class="menu-highlight">${displayText}</span>
//             </span>
//         `;
//         if (item.json) slide.dataset.json = item.json;
//         slide.dataset.key = item.key;
//         subWrapper.appendChild(slide);
//     });
// }

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
    setTimeout(() => {
        highlightMainMenu(mainKey);
        highlightSubMenu(submenuItem?.key);
    }, 10);
}

// ======== Centralized event delegation for all clicks ========
document.body.addEventListener('click', function (e) {
    const tocItem = e.target.closest('.toc-item');
    if (tocItem) {
        const targetId = tocItem.dataset.target;
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return; // prevent further handling!
    }

    const link = e.target.closest('.main-menu-slide, .sub-menu-slide, .item, .internal-link');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (link.classList.contains('item')) {
        // Dim all items
        document.querySelectorAll('.item').forEach(el => el.classList.add('dimmed-item'));
        // Highlight only the clicked one
        link.classList.remove('dimmed-item');
    }
    //  FORCE RELOAD if switching between home <-> other layout
    const isHomeTarget = href === '/' || href === '/index.html';
    const isCurrentlyHome = isHomePage(); // you already have this function
    if (isHomeTarget !== isCurrentlyHome) {
        window.location.href = href; // full reload
        return;
    }
    e.preventDefault();

    // === Highlighting UI ===
    // if (link.classList.contains('main-menu-slide')) {
    //     highlightMainMenu(link.dataset.menu);

    //     const mainKey = link.getAttribute('data-menu');
    //     renderSubMenu(mainKey);
    //     updateSubmenuVisibility(mainKey);
    //     if (window.subMenuSwiper) window.subMenuSwiper.update();
    //     // Highlight default or first submenu
    //     const menuItem = menuItems.find(item => item.key === mainKey);
    //     const submenuArr = subMenus[mainKey] || [];
    //     let submenuItem = null;
    //     if (submenuArr.length > 0) {
    //         submenuItem =
    //             submenuArr.find(x => x.key === (menuItem && menuItem.default_submenu)) ||
    //             submenuArr[0];
    //         setTimeout(() => {
    //             highlightSubMenu(submenuItem?.key);
    //         }, 10);
    //     }
    // }
    if (link.classList.contains('main-menu-slide')) {
        const mainKey = link.getAttribute('data-menu');
    
        // 🟡 Only continue if it's a new section
        if (mainKey !== getCurrentSection()) {
            const subIndex = window.subMenuSwiper?.activeIndex || 0;
    
            renderSubMenu(mainKey);                     // rebuilds submenu items
            updateSubmenuVisibility(mainKey);           // shows/hides submenu area
            if (window.subMenuSwiper) {
                window.subMenuSwiper.update();          // update layout
                window.subMenuSwiper.slideTo(subIndex, 0); // restore scroll position
            }
        }
    
        highlightMainMenu(mainKey);
    
        const menuItem = menuItems.find(item => item.key === mainKey);
        const submenuArr = subMenus[mainKey] || [];
        let submenuItem = null;
        if (submenuArr.length > 0) {
            submenuItem =
                submenuArr.find(x => x.key === (menuItem && menuItem.default_submenu)) ||
                submenuArr[0];
            setTimeout(() => {
                highlightSubMenu(submenuItem?.key);
            }, 10);
        }
    }
    
    if (link.classList.contains('sub-menu-slide')) {
        document.querySelectorAll('.sub-menu-slide').forEach(el => el.classList.remove('selected-submenu'));
        // link.classList.add('selected-submenu');
        highlightSubMenu(link.dataset.key);

    }

    // Fetch and replace HTML
    fetch(href)
        .then(r => r.text())
        .then(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const isEnglishPage = href.includes('/abroad/production-abroad/') || href.includes('/abroad/running-abroad/');
            document.body.classList.toggle('english-page', isEnglishPage);
            const isAboutPage = href.includes('/about/index.html');
            if (isAboutPage) document.body.classList.add("negative-color");

            // Replace center-content and archive-title
            const newContent = tempDiv.querySelector('.center-content');
            if (newContent && document.querySelector('.center-content')) {
                document.querySelector('.center-content').innerHTML = newContent.innerHTML;
                setupInfoGridCollapse();
                setupTocCollapse();
            }
            setupRunningTextTOC();
            setupMenusWrapperAutoHide();

            setupItemHoverHighlight();

            const newTitleBar = tempDiv.querySelector('.archive-title-bar');
            const existingTitleBar = document.querySelector('.archive-title-bar');
            if (newTitleBar && existingTitleBar) {
                existingTitleBar.innerHTML = newTitleBar.innerHTML;
            }

            // === ITEM MODE HANDLING ===
            const archiveGrid = document.querySelector('.archive-grid');
            const hasInfoGrid = newContent && newContent.querySelector('.item-info-grid');
            const hasItemMarker = newContent && newContent.querySelector('.item-marker');
            const isCalendarItem = link.classList.contains('calendar-item-link');
            const isItemURL = !href.endsWith('/index.html') && !href.endsWith('/');
            const isItemPage = hasInfoGrid || hasItemMarker || isCalendarItem || isItemURL;

            if (isItemPage) {
                archiveGrid?.classList.add('item-mode');
                setTimeout(() => {
                    highlightActiveItem(window.location.href);
                }, 10);
            } else {
                archiveGrid?.classList.remove('item-mode');
            }

            if (!link.classList.contains('item')) {
                loadInitialArticlesFromUrl(href);
            }
            if (href === '/index.html' || href === '/') {
                // initHomePage();
                activateHomeMode();
                return;
            }
            // const isEnglishPage = href.includes('/abroad/production-abroad/') || href.includes('/abroad/running-abroad/');

            const isCurrentlyEnglish = document.body.classList.contains('english-page');
            if (!isCurrentlyEnglish) {
                window.location.href = href;
                return;
            }
            // handleResponsiveColumns();
            setTimeout(() => {
                highlightActiveItem(window.location.href);
            }, 10);

        });
    return;
});

function updateTitleGroupDisplay() {
    const expanded = document.querySelector('.title-expanded');
    const collapsed = document.querySelector('.title-collapsed');
    const menusWrapper = document.querySelector('.menus-wrapper');

    if (!expanded || !collapsed || !menusWrapper) return;

    const isHidden = menusWrapper.classList.contains('hide-header');
    expanded.style.display = isHidden ? 'none' : 'flex';
    collapsed.style.display = isHidden ? 'flex' : 'none';
}

function setupMenusWrapperAutoHide() {
    const menusWrapper = document.querySelector('.menus-wrapper');
    const tocCol = document.querySelector('.running-text-table-content');
    const realCol = document.querySelector('.toc-block');
    const mobileWrapper = document.querySelector('.mobile-scroll-wrapper');
    let scrollEl = document.querySelector('.running-text') || document.querySelector('.running-book') || getCenterContent();
    let lastScrollTop = 0, ticking = false;
    if (!menusWrapper || !scrollEl) return;
    scrollEl.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                const st = scrollEl.scrollTop;
                if (st > lastScrollTop + 10) {
                    menusWrapper.classList.add('hide-header');
                    updateTitleGroupDisplay();
                    if (tocCol) {
                        tocCol.classList.add('toc-floating');
                        if (isPhone()) document.querySelector('.running-text')?.classList.add('without-mobile-scroll');
                    }
                    if (realCol) {
                        realCol.classList.add('toc-floating');
                        if (isPhone()) document.querySelector('.running-text')?.classList.add('without-mobile-scroll');
                    }
                    if (mobileWrapper && isPhone()) {
                        console.log('[HIDE] trying to hide mobile wrapper', mobileWrapper);
                        mobileWrapper.classList.add('hide-header');
                    }
                } else if (st < lastScrollTop - 10 || st < 20) {
                    menusWrapper.classList.remove('hide-header');
                    updateTitleGroupDisplay();
                    if (tocCol) {
                        tocCol.classList.remove('toc-floating');
                        if (isPhone()) document.querySelector('.running-text')?.classList.remove('without-mobile-scroll');
                    }
                    if (realCol) {
                        realCol.classList.remove('toc-floating');
                        if (isPhone()) document.querySelector('.running-text')?.classList.remove('without-mobile-scroll');
                    }
                    if (mobileWrapper && isPhone()) {
                        console.log('[SHOW] restoring mobile wrapper', mobileWrapper);
                        mobileWrapper.classList.remove('hide-header');
                    }
                }
                lastScrollTop = st <= 0 ? 0 : st;
                ticking = false;
            });
            ticking = true;
        }
    });
}


setupMenusWrapperAutoHide();

// ======== Main menu/submenu fetch + Swiper ========
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
                    // slide.innerHTML = `<span class="slide-inner">${item.label}</span>`;
                    slide.innerHTML = `
  <span class="slide-inner">
    <span class="menu-regular">${item.label}</span>
    <span class="menu-highlight">${item.label}</span>
  </span>
`;
                    // if (item.key === mainMenuKey) slide.classList.add('selected-menu');
                    wrapper.appendChild(slide);
                });

                // ===== Render submenus =====
                renderSubMenu(mainMenuKey);
                updateSubmenuVisibility(mainMenuKey);
                highlightMainMenu(mainMenuKey);
                // ====== Always load correct JSON for current URL ======
                loadInitialArticlesFromUrl();

                // ===== Init Swipers =====
                Swiper.use([Swiper.Mousewheel]);
                if (!window.mainMenuSwiper) {

                    window.mainMenuSwiper = new Swiper('.menu-swiper', {
                        slidesPerView: 'auto',
                        spaceBetween: 110,
                        loop: menuItems.length > 2,
                        slideClass: 'main-menu-slide',
                        grabCursor: true,
                        simulateTouch: true,
                        freeMode: true,
                        mousewheel: {
                            forceToAxis: true,      // use only vertical wheel for horizontal strip
                            releaseOnEdges: true,   // when you hit either end, bubble wheel to page
                          },
                        breakpoints: {
                            0: { spaceBetween: 70 },     // applies to all widths initially
                            1200: { spaceBetween: 110 }   // overrides at desktop
                        }
                    });
                }
                if (!window.subMenuSwiper) {
                    window.subMenuSwiper = new Swiper('.submenu-swiper', {
                        slidesPerView: 'auto',
                        // direction: 'horizontal',
                        // spaceBetween: 100,
                        loop: (subMenus[mainMenuKey] || []).length > 2,
                        slideClass: 'sub-menu-slide',
                        grabCursor: true,
                        simulateTouch: true,
                        freeMode: true,
                        breakpoints: {
                            0: { spaceBetween: 70 },     // applies to all widths initially
                            1200: { spaceBetween: 110 }   // overrides at desktop
                        }
                    });
                }
                // if (isHomePage()) { initHomePage(); }
                if (isHomePage()) { activateHomeMode(); }

            });
    });

setupMenusWrapperAutoHide();
updateTitleGroupDisplay();

// Ensure collapse is set up on direct page loads
window.addEventListener('DOMContentLoaded', () => {
    setupInfoGridCollapse();
    setupTocCollapse();
});

function setupRunningTextTOC() {
    const tocItems = document.querySelectorAll('.toc-item');
    const runningTextMain = document.querySelector('.running-text');
    if (!tocItems.length || !runningTextMain) return;

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

    runningTextMain.addEventListener('scroll', updateTOCHighlight);
    window.addEventListener('scroll', updateTOCHighlight); // For extra robustness
    updateTOCHighlight();
}
// Call the TOC setup function
setupRunningTextTOC();

window.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector('.archive-grid');
    const content = document.querySelector('.center-content');
    const hasInfoGrid = content && content.querySelector('.item-info-grid');
    const hasItemMarker = content && content.querySelector('.item-marker');
    const isItemURL = getCurrentFile() !== 'index.html';

    if (grid && (hasInfoGrid || hasItemMarker || isItemURL)) {
        setTimeout(() => {
            grid.classList.add('item-mode');
            highlightActiveItem(window.location.href);
        }, 10);
    }
});

document.addEventListener("click", function (e) {
    const icon = e.target.closest('.search-icon');
    const container = document.querySelector('.search-container');
    const closeBtn = e.target.closest('.search-close');
    const archiveGrid = document.querySelector('.archive-grid');

    const isTablet = window.innerWidth <= DESKTOP_WIDTH && window.innerWidth > TABLET_WIDTH;
    const isMobile = window.innerWidth <= TABLET_WIDTH;

    // Find all title-group elements (collapsed, expanded, or generic)
    const titleGroups = document.querySelectorAll('.title-group');

    if (icon) {
        container.classList.add('active');

        if (isMobile || isTablet) {
            titleGroups.forEach(el => el.classList.add('hidden'));
        }

        return;
    }

    if (closeBtn || (container && !container.contains(e.target))) {
        
        setTimeout(() => {
            titleGroups.forEach(el => el.classList.remove('hidden'));
        }, 20);
        container.classList.remove('active');

        return;
    }
});




function setupItemHoverHighlight() {
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (!document.querySelector('.archive-grid').classList.contains('item-mode')) return;

            // dim all
            document.querySelectorAll('.item').forEach(el => el.classList.add('dimmed-item'));
            item.classList.remove('dimmed-item');
        });

        item.addEventListener('mouseleave', () => {
            if (!document.querySelector('.archive-grid').classList.contains('item-mode')) return;

            // reset to active state
            const currentHref = window.location.pathname.split('/').pop();
            highlightActiveItem(window.location.href);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const imageBox = document.querySelector('.center-top-image');
    const toggle = imageBox?.querySelector('.image-toggle-label');
    if (imageBox && toggle) {
        toggle.addEventListener('click', () => {
            imageBox.classList.toggle('collapsed');
        });
    }
});

window.addEventListener('resize', () => {
    const currentMode = getLayoutMode();
    if (currentMode !== lastLayoutMode) {
        lastLayoutMode = currentMode;
        if (isHomePage()) {
            activateHomeMode();
        } else {
            activateSectionMode(articles);
            setupInfoGridCollapse();
            setupTocCollapse();
        }
        // highlightActiveItem(window.location.href);
        syncMobileRowWithHeader();
    }
});

document.addEventListener('click', function (e) {
    const el = e.target.closest('.hanokh-levin');
    if (el) {
        e.preventDefault();
        window.location.href = "/index.html";
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth <= DESKTOP_WIDTH) {
        setupTocCollapse();
    }
});