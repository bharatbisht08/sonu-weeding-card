/* ==========================================================================
   WEDDING DETAILS — edit this file to update the invitation.
   Everything on the website and in the PDFs reads from here.
   ========================================================================== */
window.WEDDING = {
  groom: { name: 'Sonu Kanojiya', short: 'Sonu', phone: '7982642906', photo: 'assets/images/groom.jpg' },
  bride: { name: 'Kajal', short: 'Kajal', photo: 'assets/images/bride.jpg' },

  father:      { name: 'Shri Kamlesh Kanojiya', short: 'Kamlesh ji', phone: '9560676361' },
  grandfather: { name: 'Late Shri Mishrilal Kanojiya' },
  brothers: ['Vishal Kanojiya', 'Nishant Kanojiya', 'Sumit Kannojiya', 'Sanjay Kanojiya'],

  familyName: 'Kanojiya',
  residence: 'C1/12, Madhu Vihar, Dwarka Sector 3, New Delhi',

  venue: {
    address: 'Khoda Colony, Rajiv Nagar, Ghaziabad, Uttar Pradesh – 201014',
    lat: 28.6294171,
    lng: 77.3375074,
    mapUrl: 'https://www.google.com/maps?q=28.6294171,77.3375074&z=17&hl=en',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&origin=Delhi%2C%20India&destination=28.6294171%2C77.3375074&travelmode=driving',
    // Leaving out the origin makes Google Maps start from the guest's current location.
    myLocationUrl: 'https://www.google.com/maps/dir/?api=1&destination=28.6294171%2C77.3375074&travelmode=driving',
  },

  /* Date & Muhurat — date format YYYY-MM-DD.
     Set null to show "To Be Announced". After any change here, run:  npm run build:pdfs */
  date: '2026-12-09',   // 9 December 2026
  muhurat: null,        // e.g. '7:30 PM' — shows "To Be Announced" while null

  // Shows "॥ Shri Ganeshaya Namah ॥" at the top of the formal invitation. Set to false to hide.
  showInvocation: true,

  // Small credit line at the bottom of the website and every PDF page.
  createdBy: 'Bharat Bisht',
};

/** Phone helper: tel: link with India country code; display stays exactly as provided. */
window.telLink = (phone) => 'tel:+91' + String(phone).replace(/\D/g, '');
