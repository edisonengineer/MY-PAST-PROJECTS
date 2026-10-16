/* =========================================================================
   Live data from the Google Sheet (js/config.js → reviewsApi):
   reviews + Settings tab (availability, webinar, announcement), fetched once
   per page and shared. Pages work normally if the sheet can't be reached.
   window.LiveData: a Promise of { reviews: [], settings: {} | null }
   ========================================================================= */
(function () {
    'use strict';
    const api = (window.SITE_CONFIG || {}).reviewsApi;
    const KEY = 'live-data-v1';
    const MAX_AGE = 60 * 1000; // re-ask the sheet at most once a minute per visitor

    function fromSession() {
        try {
            const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
            return c && Date.now() - c.t < MAX_AGE ? c.d : null;
        } catch (e) { return null; }
    }

    window.LiveData = new Promise((resolve) => {
        const empty = { reviews: [], settings: null };
        if (!api) return resolve(empty);
        const cached = fromSession();
        if (cached) return resolve(cached);
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl && setTimeout(() => ctrl.abort(), 15000);
        fetch(api + (api.includes('?') ? '&' : '?') + 'action=site', ctrl ? { signal: ctrl.signal } : {})
            .then((r) => r.json())
            .then((data) => {
                // Older script versions answer with just the list of reviews
                const d = Array.isArray(data) ? { reviews: data, settings: null }
                    : { reviews: Array.isArray(data && data.reviews) ? data.reviews : [], settings: (data && data.settings) || null };
                try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* private mode */ }
                resolve(d);
            })
            .catch(() => resolve(empty))
            .finally(() => { if (timer) clearTimeout(timer); });
    });
})();
