/* =========================================================================
   REVIEWS: real reviews from clients, trainees and collaborators.

   When someone submits a review on the site it arrives in your email
   (via Web3Forms). To publish it, copy the details into a block below.

   Each review:
     name     reviewer's name
     role     role / organisation (optional)
     service  'Engineering Design' | 'Graphic Design' | 'CAD Training' | ...
     rating   1 to 5
     text     the review itself
     date     optional, e.g. 'Sep 2026'
     project  optional project id from js/projects.js: the review is also
              shown on that project's page

   Example (remove the // to use):
   // {
   //     name: 'Jane Wanjiku',
   //     role: 'Operations Lead, Example Ltd',
   //     service: 'Engineering Design',
   //     rating: 5,
   //     text: 'Edison turned our rough sketches into clean manufacturing drawings...',
   //     date: 'Sep 2026'
   // },
   ========================================================================= */
window.REVIEWS = [
    {
        name: 'SDA Church Ngong Road',
        role: 'Camp Meeting Appreciation certificates',
        service: 'Graphic Design',
        rating: 5,
        text: 'Edison designed our Camp Meeting Appreciation certificates for SDA Church Ngong Road, and the quality was exceptional. He captured the solemnity and elegance we needed with precise typography and a crisp, print-ready layout. Delivered right on schedule!',
        project: 'camp-meeting'
    },
    {
        name: 'Mazingira Day organisers',
        role: 'Environmental awareness campaign',
        service: 'Graphic Design',
        rating: 5,
        text: 'Working with Nexus CAD Studio on our Mazingira Day awareness campaign was a seamless experience. Edison turned our core messaging into vibrant, eye-catching posters that really stood out. His attention to detail in Adobe Illustrator is top-notch.',
        project: 'mazingira-day'
    },
    {
        name: 'EV battery project client',
        role: 'Battery pack cooling system',
        service: 'Engineering Design',
        rating: 5,
        text: 'Edison handled the 3D CAD modeling and thermal simulation for our EV battery cooling system. His engineering depth in SolidWorks and Inventor ensured an optimized design ready for fabrication, complete with reliable thermal analysis. Highly recommended for complex engineering projects.',
        project: 'ev-battery-cooling'
    }
];
