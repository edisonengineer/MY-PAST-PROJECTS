/* Generated from the Google Sheet (Pricing, Certificates, Courses, Recordings and Settings tabs)
   by tools/sync-from-sheet.js: edit the sheet, not this file. A list missing here keeps the website's built-in one. */
(function (d) {
    if (d.packages) window.PACKAGES = d.packages;
    if (d.certificates) window.CERTIFICATES = d.certificates;
    if (d.recordings && window.SITE_CONFIG) (window.SITE_CONFIG.webinar = window.SITE_CONFIG.webinar || {}).recordings = d.recordings;
    if (window.TRAINING) {
        if (d.courses) window.TRAINING.courses = d.courses;
        if (d.training) { window.TRAINING.nextIntake = d.training.intake; if (d.training.price) window.TRAINING.price = d.training.price; }
    }
})({});
