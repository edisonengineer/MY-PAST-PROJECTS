/* =========================================================================
   SITE SETTINGS: the few values you may want to change in one place.
   ========================================================================= */
window.SITE_CONFIG = {
    // Web3Forms access key: form submissions go to the inbox it was created for
    web3formsKey: '94c28a31-66ac-44bd-9097-f69eb0507f85',

    // WhatsApp number in international format, digits only
    whatsapp: '254708639473',

    // Availability shown at the top of the homepage:
    //   'available'  green: "Available for projects & full-time roles"
    //   'limited'    amber: "Limited availability: a few slots left this month"
    //   'booked'     red:   "Fully booked. New projects from <from>" (or a waiting-list message if from is '')
    // text: optional custom message that replaces the default one.
    availability: { status: 'available', from: '', text: '' },

    // Prices are set in Kenyan shillings. Visitors can switch to approximate US dollars.
    // usdRate = how many KES make 1 USD (update it now and then).
    currency: { usdRate: 129, allowUsd: true },

    // Visitor analytics (free): create an account at https://www.goatcounter.com,
    // choose a code (e.g. 'edisonochieng') and put it here. Leave '' to turn analytics off.
    goatcounter: '',

    // Instant reviews: paste the Google Apps Script "Web app URL" (ends in /exec).
    // Set-up steps are at the top of tools/reviews-google-apps-script.gs.
    // When set, reviews visitors submit appear on the site straight away.
    reviewsApi: '',

    // Booking calendar: paste your free Calendly link (e.g. 'https://calendly.com/edisonochieng/30min')
    // or a Google Calendar appointment page link. Leave '' to hide the "Book a call" buttons.
    bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3DPp3v2YcJ-2Jg-kt-_l8oWDqY2_2h1RZg0k0hgOih-VRzaBZTL6fiqArzJz3wKnNnUc2gD_Jx?gv=true',

    // Instagram feed: create a free feed at https://behold.so, connect your Instagram,
    // choose "JSON" and paste the feed URL here (e.g. 'https://feeds.behold.so/AbC123').
    // Leave '' to show a "Follow on Instagram" card instead.
    instagramFeedUrl: 'https://feeds.behold.so/fHxS9fvbggyjvBUKiQMn',
    instagramHandle: 'e_d_i_s_o_n_engineer',

    // Deposit payments. Fill in ONE of the M-Pesa options to show "Pay a deposit".
    payments: {
        mpesaTill: '8438334',     // Buy Goods till number, e.g. '1234567'
        mpesaPaybill: '',         // or Paybill business number, e.g. '247247'
        mpesaAccount: '',         // Paybill account number (leave '' to ask for the client's name)
        mpesaName: 'EDISON OCHIENG', // name the client should see on M-Pesa
        mpesaQr: 'images/payments/mpesa-till-qr.png', // QR from your Lipa na M-Pesa sticker (scan to pay)
        paystackUrl: ''           // optional Paystack payment page link for card / online payment
    },

    // Weekly webinar. Set the day and time (Nairobi time) to show a live countdown.
    webinar: {
        day: '',                  // e.g. 'Saturday'
        time: '',                 // 24-hour time, e.g. '18:00'
        durationMinutes: 60,
        // Past sessions on YouTube: paste the video ID (the part after watch?v=)
        recordings: [
            // { id: 'dQw4w9WgXcQ', title: 'Session 1: AutoCAD interface tour' }
            { id: 'MrBvUttpKN4', title: 'Webinar recording' }
        ]
    },

    // 3D viewer library, only downloaded when someone opens a project's 3D model
    modelViewerSrc: 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'
};
