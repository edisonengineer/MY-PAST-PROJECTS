/* =========================================================================
   CLIENT PROJECT TRACKER: what clients see at /track/ when they enter their
   project reference.

   PRIVACY: don't edit this example file with real client details.
   1. Copy it to  content/tracker.private.js  (that file is never uploaded
      to GitHub; it's listed in .gitignore).
   2. Add or update your projects there.
   3. Run:  node tools/build-tracker.js
      It writes js/tracker-data.js, where every project is locked
      (encrypted) with its own reference. Nobody can read or list the
      projects without knowing a reference. Upload that file.

   ref       the reference you give the client, e.g. 'NCS-2026-014'.
             Use something hard to guess (add a few random letters).
   stage     0 Brief received · 1 Quote sent · 2 Deposit received
             3 Design in progress · 4 Review & revisions · 5 Delivered
   progress  0–100 (optional, shown as a bar)
   due       'YYYY-MM-DD' (optional)
   updated   'YYYY-MM-DD' date of this update
   note      a short message to the client (optional)
   deposit   'due' shows a "Pay deposit" button, 'paid' shows it as paid, '' hides it
   amountDue amount in KES still to pay (optional number)
   files     link to the delivered files, e.g. a Google Drive folder (optional)
   ========================================================================= */
module.exports = [
    {
        ref: 'DEMO-2026',
        project: 'Bracket assembly & drawings (demo)',
        client: 'Demo client',
        stage: 3,
        progress: 60,
        due: '2026-10-30',
        updated: '2026-10-14',
        note: 'This is a demo. The 3D assembly is done and I am now preparing the 2D manufacturing drawings.',
        deposit: 'paid',
        amountDue: 2250,
        files: ''
    }
];
