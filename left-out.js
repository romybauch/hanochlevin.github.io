function setupSyncedSwipers() {
    Swiper.use([Swiper.Mousewheel, Swiper.Controller]);
    if (window.leftSwiper) window.leftSwiper.destroy(true, true);
    if (window.rightSwiper) window.rightSwiper.destroy(true, true);

    window.leftSwiper = new Swiper('.left-items-swiper', {
        direction: 'vertical',
        slidesPerView: 'auto',
        freeMode: {
            enabled: true,
            momentum: true,          // enables momentum after you let go
            momentumRatio: 0.35,     // smaller = more resistance/smooth stop
            // sticky: true,           
        },
        mousewheel: {
            enabled: true,
            sensitivity: 0.4,        // lower is smoother (experiment)
            releaseOnEdges: true
        },
        grabCursor: true,
        simulateTouch: true,
        loop: true,
        wrapperClass: 'left-items-wrapper',     // <-- custom wrapper
        slideClass: 'swiper-slide',

    });
    window.rightSwiper = new Swiper('.right-items-swiper', {
        direction: 'vertical',
        slidesPerView: 'auto',
        freeMode: {
            enabled: true,
            momentum: true,          // enables momentum after you let go
            momentumRatio: 0.35,     // smaller = more resistance/smooth stop
            // sticky: true,             
        },
        mousewheel: {
            enabled: true,
            sensitivity: 0.4,        // lower is smoother (experiment)
            releaseOnEdges: true
        },
        grabCursor: true,
        simulateTouch: true,
        loop: true,
        wrapperClass: 'right-items-wrapper',    // <-- custom wrapper
        slideClass: 'swiper-slide',

    });
    window.leftSwiper.controller.control = window.rightSwiper;
    window.rightSwiper.controller.control = window.leftSwiper;
}

// function handleResponsiveColumns() {
//     if (!articles.length) {
//         document.querySelector('.left-scroll').innerHTML = '';
//         document.querySelector('.right-scroll').innerHTML = '';
//         removeMobileScrollRow(); // if you use a mobile row
//         return;
//     }
//     if (window.innerWidth >= DESKTOP_WIDTH) {
//         removeMobileScrollRow();
//         renderDesktopColumns(articles);
//         if (!isHomePage()) {
//             renderTwoColumnArchive(articles);  // NEW
//         } 
//         // else {
//         //     renderDesktopColumns(articles);    // for home
//         // }
//         // setupSyncedSwipers();
//     } else if (isTablet()) {
//         removeMobileScrollRow();
//         renderTabletColumn(articles);
//         // setupSingleSwiper();
//     } else if (isPhone()) {
//         renderMobileRow(articles);
//         setupMobileSwiper();
//     }
//     setupItemHoverHighlight();

// }



// function getItemHTML(article) {
//     const hasImage = !!article.img;

//     // If the item has an image, show image + title only
//     if (hasImage) {
//         return `
//       <a class="item swiper-slide" href="${article.href || '#'}">
//         <div class="item-image-wrapper">
//           <img src="${article.img}" alt="${article.title}" class="item-image" />
//         </div>
//         <div class="item-title">${article.title}</div>
//       </a>
//     `;
//     }
//     const otherDataLabel = `<span class="item-collection">${article["other-data"] || ""}</span>`;

//     let yearHTML = '';
//     if (article["year-hebrew"]) {
//         yearHTML = `<span class="item-year-hebrew">${article["year-hebrew"]}</span> `;
//     }
//     yearHTML += `<span class="item-year-latin">${article.year || ''}</span>`;

//     const classes = "item swiper-slide" + (
//         getCurrentFile() !== "index.html" && (!article.href || article.href !== getCurrentFile()) ? " dimmed-item" : ""
//     );

//     return `
//       <a class="${classes}" href="${article.href || '#'}">
//         <div class="item-title">${article.title}</div>
//         <div class="item-details">
//           <span class="item-year">${yearHTML}</span>
//           ${otherDataLabel}
//         </div>
//       </a>
//     `;
// }


function setupSynchronizedSwipers() {
    Swiper.use([Swiper.Mousewheel, Swiper.Controller]);

    // Optional: destroy old Swipers if reinitializing
    if (window.homeSwipers) {
        window.homeSwipers.forEach(swiper => swiper.destroy(true, true));
    }

    // Count slides in each column
    const leftCount = document.querySelectorAll('.left-home-swiper .swiper-slide').length;
    const centerCount = document.querySelectorAll('.center-home-swiper .swiper-slide').length;
    const rightCount = document.querySelectorAll('.right-home-swiper .swiper-slide').length;

    const createSwiper = (selector, count) => new Swiper(selector, {
        direction: 'vertical',
        slidesPerView: 'auto',
        freeMode: {
            enabled: true,
            momentum: true,
            momentumRatio: 0.35
        },
        mousewheel: {
            enabled: true,
            sensitivity: 0.4,
            releaseOnEdges: true
        },
        grabCursor: true,
        simulateTouch: true,
        loop: count >= 4,
    });

    // Initialize 3 swipers
    const leftSwiper = createSwiper('.left-home-swiper', leftCount);
    const centerSwiper = createSwiper('.center-home-swiper', centerCount);
    const rightSwiper = createSwiper('.right-home-swiper', rightCount);

    // Two-direction sync, but avoid circular chain
    leftSwiper.controller.control = centerSwiper;
    centerSwiper.controller.control = rightSwiper;
    // DO NOT do: rightSwiper.controller.control = leftSwiper;

    // Save globally if needed
    window.homeSwipers = [leftSwiper, centerSwiper, rightSwiper];
}




// function makeColumnInfiniteScroll(column) {
//     const original = column.innerHTML;

//     // Repeat content 3 times
//     column.innerHTML = original + original + original;

//     const scrollCheck = () => {
//         const maxScroll = column.scrollHeight - column.clientHeight;
//         const oneThird = maxScroll / 3;
//         const current = column.scrollTop;

//         // Snap back to middle if near top or bottom
//         if (current < oneThird * 0.1) {
//             column.scrollTop = oneThird + current;
//         } else if (current > oneThird * 2.9) {
//             column.scrollTop = current - oneThird;
//         }
//     };

//     column.addEventListener('scroll', scrollCheck);

//     // Start at the middle copy
//     requestAnimationFrame(() => {
//         const maxScroll = column.scrollHeight - column.clientHeight;
//         column.scrollTop = maxScroll / 3;
//     });
// }

// function highlightActiveItem(currentHref) {
//     const grid = document.querySelector('.archive-grid');
//     if (!grid || !grid.classList.contains('item-mode')) return;
//     const currentFile = currentHref.split('/').pop(); // just the filename, like 'hopale.html'

//     document.querySelectorAll('.item').forEach(el => {
//         const itemHref = el.getAttribute('href')?.split('/').pop();
//         const isActive = itemHref === currentFile;

//         el.classList.toggle('dimmed-item', !isActive);
//         el.classList.toggle('active-item', isActive); // optional, for custom styling
//     });
// }

// function initHomePage() {
//     fetch('/home.json')
//         .then(r => r.json())
//         .then(items => {
//             const leftCol = document.querySelector('.left-scroll');
//             const centerCol = document.querySelector('.center-scroll');
//             const rightCol = document.querySelector('.right-scroll');

//             if (!leftCol || !centerCol || !rightCol) return;


//             const even = items.filter((_, i) => i % 2 === 0);
//             const odd = items.filter((_, i) => i % 2 !== 0);
//             const rightItems = [...even, ...odd];
//             const leftItems = [...odd, ...even];
//             const centerItems = [...items].reverse(); // reversed

//             leftCol.innerHTML = leftItems.map(getHomeItemHTML).join('');
//             centerCol.innerHTML = centerItems.map(getHomeItemHTML).join('');
//             rightCol.innerHTML = rightItems.map(getHomeItemHTML).join('');
//             makeColumnInfiniteScroll(leftCol);
//             makeColumnInfiniteScroll(centerCol);
//             makeColumnInfiniteScroll(rightCol);
//             setupScrollSync();
//         });
// }

// function renderTwoColumnArchive(articles) {
//     const leftCol = document.querySelector('.left-scroll');
//     const rightCol = document.querySelector('.right-scroll');
//     if (!leftCol || !rightCol) return;

//     const even = articles.filter((_, i) => i % 2 === 0);
//     const odd = articles.filter((_, i) => i % 2 !== 0);

//     const leftHTML = [...odd, ...even].map(getItemHTML).join('');
//     const rightHTML = [...even, ...odd].map(getItemHTML).join('');

//     leftCol.innerHTML = leftHTML + leftHTML + leftHTML;
//     rightCol.innerHTML = rightHTML + rightHTML + rightHTML;

//     requestAnimationFrame(() => {
//         makeColumnInfiniteScroll(leftCol);
//         makeColumnInfiniteScroll(rightCol);
//         setupTwoColumnReverseScroll();
//     });
//     setupItemHoverHighlight();
// }

// function setupTwoColumnReverseScroll() {
//     const left = document.querySelector('.left-scroll');
//     const right = document.querySelector('.right-scroll');
//     if (!left || !right) return;

//     let isSyncing = false;

//     function syncReverse(source, target) {
//         if (isSyncing) return;
//         isSyncing = true;
//         const max = target.scrollHeight - target.clientHeight;
//         const newScroll = max - source.scrollTop;
//         target.scrollTop = newScroll;
//         requestAnimationFrame(() => isSyncing = false);
//     }

//     left.addEventListener('scroll', () => syncReverse(left, right));
//     right.addEventListener('scroll', () => syncReverse(right, left));
// }


// ======== Swiper Column Rendering ========
// function renderDesktopColumns(articles) {
//     const htmlLeft = articles.map(getItemHTML).join('');
//     const htmlRight = articles.slice().reverse().map(getItemHTML).join('');
//     console.log('[renderDesktopColumns] called');


//     document.querySelector('.left-scroll').innerHTML = `
//       <div class="swiper column-swiper left-items-swiper">
//         <div class="left-items-wrapper">
//           ${htmlLeft}
//         </div>
//       </div>
//     `;
//     document.querySelector('.right-scroll').innerHTML = `
//       <div class="swiper column-swiper right-items-swiper">
//         <div class="right-items-wrapper">
//           ${htmlRight}
//         </div>
//       </div>
//     `;
//     makeColumnInfiniteScroll(leftCol);
//     makeColumnInfiniteScroll(rightCol);

//     requestAnimationFrame(() => {
//         leftCol.scrollTop = leftCol.scrollHeight / 3;
//         rightCol.scrollTop = rightCol.scrollHeight / 3;
//     });
// }


// ======== Mobile (horizontal row) ========
// function renderMobileRow(articles) {
//     document.querySelector('.left-scroll').innerHTML = '';
//     document.querySelector('.right-scroll').innerHTML = '';
//     removeMobileScrollRow();
//     const mobileRow = document.createElement('div');
//     mobileRow.className = 'mobile-scroll-row swiper mobile-items-swiper';
//     mobileRow.innerHTML = `<div class="swiper-wrapper">${articles.map(getItemHTML).join('')}</div>`;
//     document.querySelector('.menus-wrapper').after(mobileRow);
// }

// function renderColumnsForCurrentArticles() {
//     const mode = getLayoutMode();
//     resetScrollColumns(mode);

//     if (mode === 'desktop') {
//         renderDesktopColumns(articles);
//         if (!isHomePage()) {
//             renderTwoColumnArchive(articles);
//         }
//     } else if (mode === 'tablet') {
//         renderTabletColumn(articles);
//     } else {
//         renderMobileRow(articles);
//         setupMobileSwiper();
//     }

//     setupItemHoverHighlight();
//     setupMenusWrapperAutoHide();
//     highlightActiveItem(window.location.href);
// }

// function handleResponsiveColumns() {
//     const mode = getLayoutMode();
//     resetScrollColumns(mode);
//     lastLayoutMode = mode;
//     renderColumnsForCurrentArticles();
// }

// function handleResponsiveColumns() {
//     const mode = getLayoutMode();
//     resetScrollColumns(mode);
//     lastLayoutMode = mode;

//     if (mode === 'desktop') {
//         renderDesktopColumns(articles);
//         if (!isHomePage()) {
//             renderTwoColumnArchive(articles);
//         }
//     } else if (mode === 'tablet') {
//         renderTabletColumn(articles);
//     } else {
//         renderMobileRow(articles);
//         setupMobileSwiper();
//     }

//     setupItemHoverHighlight();
//     setupMenusWrapperAutoHide();
//     highlightActiveItem(window.location.href);
// }

// ======== Load JSON Articles ========
// function loadArticlesJson(jsonPath) {
//     if (!jsonPath || jsonPath === 'null' || jsonPath === '') {
//         articles = [];
//         // handleResponsiveColumns();
//         renderColumnsForCurrentArticles()
//         lastLayoutMode = getLayoutMode();
//         return;
//     }
//     fetch(jsonPath)
//         .then(response => response.json())
//         .then(data => {
//             articles = data;
//             // handleResponsiveColumns();
//             renderColumnsForCurrentArticles();
//             lastLayoutMode = getLayoutMode();
//             // highlightActiveItem(window.location.href);

//         })
//         .catch(err => {
//             articles = [];
//             // handleResponsiveColumns();
//             renderColumnsForCurrentArticles();
//             lastLayoutMode = getLayoutMode();
//         });
// }



// document.addEventListener("click", function (e) {
//     const icon = e.target.closest('.search-icon');
//     const container = document.querySelector('.search-container');
//     const closeBtn = e.target.closest('.search-close');

//     // Toggle open on search icon click
//     if (icon) {
//         container.classList.add('active');
//         return;
//     }

//     // Close on X click
//     if (closeBtn) {
//         container.classList.remove('active');
//         return;
//     }

//     // Close if clicking outside the container
//     if (container && !container.contains(e.target)) {
//         container.classList.remove('active');
//     }
// });