/**
 * RELOAD Gym & Wellness – Facilities Area Filter / Tabs
 * Scalable, data-driven facility grouping by location/ward.
 */
(() => {
  'use strict';

  function initFacilitiesAreaFilter() {
    const filterNav = document.querySelector('.facilities-area-filter');
    if (!filterNav) return;

    const tabs = Array.from(filterNav.querySelectorAll('.facilities-area-filter__tab[data-area]'));
    const panels = Array.from(document.querySelectorAll('.facilities-area-panel[data-area-panel]'));
    const locations = Array.from(document.querySelectorAll('.facility-location[data-area]'));

    if (!tabs.length || !panels.length) return;

    // 1. Calculate counts & configure area status dynamically
    tabs.forEach(tab => {
      const area = tab.dataset.area;
      const countEl = tab.querySelector('[data-area-count]');
      const statusEl = tab.querySelector('[data-area-status]');
      const facilityCount = locations.filter(loc => loc.dataset.area === area).length;

      if (facilityCount > 0) {
        if (countEl) {
          countEl.textContent = `(${facilityCount})`;
          countEl.hidden = false;
        }
        if (statusEl) {
          statusEl.hidden = true;
        }
        // If there are real facilities in this panel, ensure coming soon placeholder is hidden
        const panel = panels.find(p => p.dataset.areaPanel === area);
        const comingSoon = panel?.querySelector('.facilities-coming-soon');
        if (comingSoon) {
          comingSoon.hidden = true;
        }
      } else {
        // No facilities yet for this area (e.g. Vũng Tàu - coming soon)
        if (countEl) {
          countEl.hidden = true;
        }
        if (statusEl) {
          statusEl.textContent = '(SẮP RA MẮT)';
          statusEl.hidden = false;
        }
      }
    });

    // 2. Tab switching logic
    function setActiveArea(targetArea, updateHash = false) {
      const targetTab = tabs.find(t => t.dataset.area === targetArea) || tabs[0];
      const selectedArea = targetTab.dataset.area;

      tabs.forEach(tab => {
        const isSelected = tab === targetTab;
        tab.classList.toggle('is-active', isSelected);
        tab.setAttribute('aria-selected', String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
      });

      panels.forEach(panel => {
        const isSelected = panel.dataset.areaPanel === selectedArea;
        panel.classList.toggle('is-active', isSelected);
        if (isSelected) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });

      if (updateHash && window.history && window.history.replaceState) {
        const currentPath = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', `${currentPath}#${selectedArea}`);
      }
    }

    // 3. Tab Click Events
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        setActiveArea(tab.dataset.area, true);
      });
    });

    // 4. Keyboard Navigation (WAI-ARIA Tabs pattern)
    filterNav.addEventListener('keydown', event => {
      const activeElement = document.activeElement;
      const currentIndex = tabs.indexOf(activeElement);
      if (currentIndex === -1) return;

      let nextIndex = null;
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        nextTab.focus();
        setActiveArea(nextTab.dataset.area, true);
      }
    });

    // 5. Intercept internal anchor links (e.g. Hero nav buttons #reload-women, #reload-gym-wellness)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        const targetId = hash.slice(1);
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        // Check if target is inside an area panel
        const parentPanel = targetEl.closest('.facilities-area-panel[data-area-panel]');
        if (parentPanel) {
          const targetArea = parentPanel.dataset.areaPanel;
          setActiveArea(targetArea, false);
        }
      });
    });

    // 6. Handle initial URL hash on page load and hashchange
    function syncFromUrlHash() {
      const hash = window.location.hash.replace('#', '');
      const matchingTab = tabs.find(t => t.dataset.area === hash);
      if (matchingTab) {
        setActiveArea(matchingTab.dataset.area, false);
      } else if (hash === 'reload-women' || hash === 'reload-gym-wellness') {
        setActiveArea('ba-ria', false);
      } else {
        // Default to first tab (Phường Bà Rịa)
        setActiveArea('ba-ria', false);
      }
    }

    window.addEventListener('hashchange', syncFromUrlHash);
    syncFromUrlHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFacilitiesAreaFilter);
  } else {
    initFacilitiesAreaFilter();
  }
})();
