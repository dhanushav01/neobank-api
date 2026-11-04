/**
 * NeoBank - Dedicated Uniform Application Form Engine & Workbench
 * Powers: /open_account_customer/{applicationNumber} (e.g., APP-2026-595845)
 */

// Ambient Flowing Particle Currents Background Canvas
(function () {
  var cv = document.getElementById('fx');
  if (!cv || typeof cv.getContext !== 'function') return;
  var c = cv.getContext('2d'), P = [], mx = -999, my = -999, W, H;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ||
      document.body.classList.contains('light-theme');
  }

  function spawn(p) {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.s = 0.6 + Math.random() * 1.2;
    p.h = Math.random() < 0.25;
    return p;
  }

  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * d;
    cv.height = H * d;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = isLightTheme() ? '#f5f8fc' : '#04060b';
    c.fillRect(0, 0, W, H);
    P = [];
    var count = W < 700 ? 50 : 110;
    for (var i = 0; i < count; i++) P.push(spawn({}));
  }

  window.addEventListener('resize', size);
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  size();

  (function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var light = isLightTheme();
    c.fillStyle = light ? 'rgba(245, 248, 252, 0.08)' : 'rgba(4, 6, 11, 0.07)';
    c.fillRect(0, 0, W, H);
    c.lineWidth = 1.1;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      var a = Math.sin(p.x * 0.0028 + t * 0.00018) * 2.4 +
        Math.cos(p.y * 0.0035 - t * 0.00014) * 2.4;
      var d = Math.hypot(mx - p.x, my - p.y);
      if (d < 180) a += (1 - d / 180) * 2.5;
      var ox = p.x, oy = p.y;
      p.x += Math.cos(a) * p.s * 1.2;
      p.y += Math.sin(a) * p.s * 1.2;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        spawn(p);
        continue;
      }
      if (light) {
        c.strokeStyle = p.h ? 'rgba(0, 180, 105, 0.5)' : 'rgba(70, 95, 140, 0.16)';
      } else {
        c.strokeStyle = p.h ? 'rgba(0, 245, 155, 0.42)' : 'rgba(190, 215, 255, 0.13)';
      }
      c.beginPath();
      c.moveTo(ox, oy);
      c.lineTo(p.x, p.y);
      c.stroke();
    }
  })(0);
})();

// =================================================================
// BRANCH NETWORK REPOSITORY FOR POPUP SELECTION
// =================================================================
// =================================================================
// GLOBAL BRANCH MODAL CONTROLS & LIFECYCLE
// =================================================================
window.openBranchModal = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  var changeModal = document.getElementById('modal-change-selection');
  if (!changeModal) return;
  changeModal.style.setProperty('display', 'flex', 'important');
  changeModal.classList.add('active');
  if (typeof window.__initModalBranchView === 'function') {
    window.__initModalBranchView();
  }
};

window.closeBranchModal = function () {
  var changeModal = document.getElementById('modal-change-selection');
  if (changeModal) {
    changeModal.style.setProperty('display', 'none', 'important');
    changeModal.classList.remove('active');
  }
};

document.addEventListener('click', function (e) {
  if (e.target && (e.target.id === 'app-change-selection-link' || e.target.closest('#app-change-selection-link'))) {
    if (window.openBranchModal) window.openBranchModal(e);
    return;
  }
  if (e.target && (e.target.id === 'btn-close-change-modal' || e.target.closest('#btn-close-change-modal') ||
                   e.target.id === 'btn-cancel-change-modal' || e.target.closest('#btn-cancel-change-modal'))) {
    if (window.closeBranchModal) window.closeBranchModal();
    return;
  }
});

var BRANCHES = [
  { name: 'Downtown Main Branch', code: 'BR001', city: 'Metropolitan Core' },
  { name: 'Central Digital Branch', code: 'NBK-001', city: 'Online / Global Virtual' },
  { name: 'Mumbai Main Branch', code: 'BOM-001', city: 'Mumbai, Maharashtra' },
  { name: 'Delhi Connaught Place Branch', code: 'DEL-002', city: 'New Delhi' },
  { name: 'Bengaluru Tech Park Branch', code: 'BLR-003', city: 'Bengaluru, Karnataka' },
  { name: 'Hyderabad Cyber City Branch', code: 'HYD-004', city: 'Hyderabad, Telangana' },
  { name: 'Chennai Central Branch', code: 'MAA-005', city: 'Chennai, Tamil Nadu' },
  { name: 'Kolkata Park Street Branch', code: 'CCU-006', city: 'Kolkata, West Bengal' },
  { name: 'Pune Shivaji Nagar Branch', code: 'PNQ-007', city: 'Pune, Maharashtra' },
  { name: 'Ahmedabad Ashram Road Branch', code: 'AMD-008', city: 'Ahmedabad, Gujarat' },
  { name: 'Jaipur Pink City Branch', code: 'JAI-009', city: 'Jaipur, Rajasthan' },
  { name: 'Kochi Marine Drive Branch', code: 'COK-010', city: 'Kochi, Kerala' },
  { name: 'Chandigarh Sector 17 Branch', code: 'IXC-011', city: 'Chandigarh' },
  { name: 'Lucknow Hazratganj Branch', code: 'LKO-012', city: 'Lucknow, Uttar Pradesh' },
  { name: 'Surat Diamond Bourse Branch', code: 'STV-013', city: 'Surat, Gujarat' },
  { name: 'Indore Vijay Nagar Branch', code: 'IDR-014', city: 'Indore, Madhya Pradesh' },
  { name: 'Goa Panaji Coastal Branch', code: 'GOI-015', city: 'Panaji, Goa' },
  { name: 'Nagpur Zero Mile Branch', code: 'NAG-016', city: 'Nagpur, Maharashtra' },
  { name: 'Bhubaneswar Temple City Branch', code: 'BBI-017', city: 'Bhubaneswar, Odisha' },
  { name: 'Coimbatore Avinashi Road Branch', code: 'CJB-018', city: 'Coimbatore, Tamil Nadu' },
  { name: 'Visakhapatnam Beach Road Branch', code: 'VTZ-019', city: 'Visakhapatnam, Andhra Pradesh' },
  { name: 'Bhopal MP Nagar Branch', code: 'BHO-020', city: 'Bhopal, Madhya Pradesh' },
  { name: 'Patna Fraser Road Branch', code: 'PAT-021', city: 'Patna, Bihar' },
  { name: 'London International Desk', code: 'LON-022', city: 'London, United Kingdom' }
];

// =================================================================
// MAIN UNIFORM APPLICATION FORM ENGINE
// =================================================================
window.initUniformApplicationForm = function (appNum, accType, accLabel, branchName, branchCode) {
  var $ = function (s, r) { return (r || document).querySelector(s) };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) };

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = {
    appType: 'NEW',
    accCategory: 'NORMAL',
    form60: 'NO',
    acctType: accType || 'SAVINGS',
    branchName: branchName || 'Mumbai Main Branch',
    branchCode: branchCode || 'BOM-001'
  };
  var page = 0;
  var view = 'form';

  var MINS = {
    SAVINGS: 1000,
    CHECKING: 500,
    SALARY: 0,
    FIXED_DEPOSIT: 10000,
    MONEY_MARKET: 5000,
    NRI_EXPAT: 5000,
    STUDENT: 0,
    PENSION: 0,
    BSBDA: 0,
    OTHER: 0
  };

  var NAMES = {
    SAVINGS: 'High-yield savings',
    CHECKING: 'Current / checking',
    SALARY: 'Corporate salary',
    FIXED_DEPOSIT: 'Fixed / term deposit',
    MONEY_MARKET: 'Money market / recurring',
    PENSION: 'Pension savings',
    NRI_EXPAT: 'NRI / foreign expat',
    STUDENT: 'Student / youth',
    BSBDA: 'Basic savings (BSBDA)',
    OTHER: 'Other'
  };

  var slug = function (s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  var req = function (r) {
    return r ? ' <span class="mand-star req" aria-hidden="true">*</span>' : '';
  };

  /* Helper to detect other value */
  function isOtherVal(v) {
    return /^(OTHER|OTHERS|Other|Others)$/i.test(String(v || '').trim());
  }

  /* Field builders */
  function bx(k, l, len, kind, r, o) {
    o = o || {};
    var min = kind === 'N' ? len : 1, i, h = '';
    for (i = 0; i < len; i++) {
      h += '<input maxlength="1" inputmode="' + (kind === 'N' ? 'numeric' : 'text') + '" autocomplete="off" aria-label="' + l + ' character ' + (i + 1) + '">';
    }
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="bxs" data-k="' + k + '" data-l="' + l + '" data-len="' + len + '" data-kind="' + kind + '" data-min="' + min + '"' + (o.sep ? ' data-sep' : '') + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-boxes">' + h + '</div></div>';
  }

  function dt(k, l, r) {
    var inputs = '';
    for (var i = 0; i < 8; i++) {
      inputs += '<input maxlength="1" inputmode="numeric" autocomplete="off" aria-label="' + l + ' character ' + (i + 1) + '">';
    }
    return '<div class="f"><span class="lb">' + l + req(r) + '<small style="color:var(--ti);margin-left:6px;font-weight:normal;"> DD MM YYYY</small></span><div class="bxs" data-k="' + k + '" data-l="' + l + '" data-len="8" data-kind="N" data-min="8" data-sep' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-boxes">' + inputs + '</div></div>';
  }

  function rd(k, l, opts, r) {
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="pills" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' role="radiogroup" data-testid="app-' + k + '-options">' + opts.map(function (o) {
      var a = Array.isArray(o) ? o : [o, o];
      return '<button type="button" class="pill" role="radio" data-v="' + a[0] + '" data-testid="app-' + k + '-' + slug(a[0]) + '-option">' + a[1] + '</button>';
    }).join('') + '</div></div>';
  }

  function ch(k, l, opts, r) {
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="pills" data-k="' + k + '" data-l="' + l + '" data-multi' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-options">' + opts.map(function (o) {
      var a = Array.isArray(o) ? o : [o, o];
      return '<button type="button" class="pill" role="checkbox" data-v="' + a[0] + '" data-testid="app-' + k + '-' + slug(a[0]) + '-option">' + a[1] + '</button>';
    }).join('') + '</div></div>';
  }

  function tx(k, l, a3, a4, a5) {
    var placeholder = '', r = 0, type = 'text';
    if (typeof a3 === 'string' && (typeof a4 === 'number' || typeof a4 === 'boolean')) {
      placeholder = a3;
      r = a4 ? 1 : 0;
      type = a5 || 'text';
    } else {
      r = a3 ? 1 : 0;
      type = a4 || 'text';
    }
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><input class="inp" type="' + type + '" placeholder="' + placeholder + '" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-input"></div>';
  }

  function sl(k, l, opts, r) {
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><select class="sel" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-select"><option value=""></option>' + opts.map(function (o) {
      return '<option>' + o + '</option>';
    }).join('') + '</select></div>';
  }

  function fl(k, l, hint, r, cd) {
    return '<label class="slot' + (cd ? ' cond off' : '') + '"' + (cd ? ' data-c="' + cd + '"' : '') + ' data-slot data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-slot"><input type="file" hidden><b>' + l + req(r) + '</b><span>' + hint + '</span><em>Choose a file</em><i class="pb"></i></label>';
  }

  function cd(c, h) {
    return '<div class="cond off" data-c="' + c + '">' + h + '</div>';
  }

  var YN = ['YES', 'NO'], PFX = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Other'];
  var OVD = [
    ['PASSPORT', 'Passport'],
    ['VOTER_ID', 'Voter ID'],
    ['DRIVING_LICENSE', 'Driving licence'],
    ['AADHAAR', 'Aadhaar'],
    ['NREGA', 'NREGA job card'],
    ['NPR', 'NPR letter'],
    ['OTHER', 'Other OVD'],
    ['SALARY_PROOF', 'Salary proof'],
    ['STUDENT_PROOF', 'Student proof'],
    ['PENSION_PROOF', 'Pension proof'],
    ['NRI_PROOF', 'NRI proof'],
    ['FUNDS_PROOF', 'Source of funds proof']
  ];

  var today = new Date().toLocaleDateString('en-GB');

  var PAGES = [
    {
      h: 'Tell us about yourself.', t: 'Page 1: CIF & CKYC', s: [
        ['Form header & branch information', '<div class="row"><div class="f"><span class="lb">Date</span><span class="fixed">' + today + '</span></div><div class="f"><span class="lb">Branch</span><span class="fixed" id="form-branch-display">' + (branchName || 'Mumbai Main Branch') + ' (' + (branchCode || 'BOM-001') + ')</span></div></div>' + bx('ckyc', 'CKYC number (if you have one)', 14, 'N', 0) + bx('cif', 'CIF number (if you have one)', 10, 'N', 0) + rd('appType', 'Application type', [['NEW', 'New account']], 1) + rd('accCategory', 'Account category', [['NORMAL', 'Normal'], ['SMALL', 'Small'], ['MINOR', 'Minor'], ['STAFF', 'Staff']], 1)],
        ['1. Personal details (same as ID proof)', rd('namePrefix', 'Title', PFX, 1) + bx('firstName', 'First name', 20, 'A', 1) + bx('middleName', 'Middle name', 20, 'A', 0) + bx('lastName', 'Last name', 20, 'A', 1) + bx('prevName', 'Previous name, if any', 20, 'A', 0) + dt('dob', 'Date of birth', 1) + rd('gender', 'Gender', [['MALE', 'Male'], ['FEMALE', 'Female'], ['TRANSGENDER', 'Transgender']], 1) + rd('marital', 'Marital status', [['MARRIED', 'Married'], ['UNMARRIED', 'Unmarried'], ['OTHERS', 'Others']], 1) + rd('nationality', 'Nationality', [['IN', 'Indian'], ['OTHERS', 'Others']], 1) + bx('father', 'Father’s name', 20, 'A', 1) + bx('mother', 'Mother’s name', 20, 'A', 1) + bx('spouse', 'Spouse’s name, if married', 20, 'A', 0) + cd('accCategory=MINOR', rd('guardianPrefix', 'Guardian title', PFX, 1) + bx('guardian', 'Guardian’s name', 20, 'A', 1) + rd('guardianRel', 'Guardian is', ['Father', 'Mother', 'Legal Guardian'], 1)) + rd('religion', 'Religion', ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Others'], 1) + rd('category', 'Category', ['General', 'OBC', 'SC', 'ST'], 1) + rd('disability', 'Do you have a disability?', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + cd('disability=YES', ch('assist', 'Assistance you would like', ['Braille Passbook', 'Talking ATM', 'Wheelchair Access', 'Doorstep Banking', 'Large Print'], 0) + fl('disabCert', 'Disability certificate', 'PDF, JPG or PNG', 0)) + rd('edu', 'Education', ['Below SSC', 'SSC/HSC', 'Graduate', 'Post Graduate', 'Professional'], 1)],
        ['2. Occupation & financial profile', rd('emp', 'Employment status', [['EMPLOYED', 'Employed'], ['PRIVATE_SECTOR', 'Private sector'], ['BUSINESS', 'Business'], ['SELF_EMPLOYED', 'Self-employed'], ['RETIRED', 'Retired'], ['HOUSEWIFE', 'Homemaker'], ['STUDENT', 'Student'], ['OTHERS', 'Others']], 1) + '<div class="row">' + tx('employer', 'Employer or business name', 0) + tx('university', 'University or institution (students)', 0) + '</div>' + rd('income', 'Annual income', ['Below 1 Lakh', '1-5 Lakh', '5-10 Lakh', '10-25 Lakh', 'Above 25 Lakh'], 1) + rd('funds', 'Source of funds', ['Salary', 'Business Income', 'Agriculture', 'Investments', 'Inheritance / Family', 'Professional Fees'], 1)],
        ['3. Identification & tax information', cd('form60=NO', bx('pan', 'PAN', 10, 'X', 1)) + rd('form60', 'Do you file Form 60 instead of PAN?', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + cd('form60=YES', fl('form60Doc', 'Form 60 document', 'PDF, JPG or PNG', 1)) + bx('aadhaar', 'Aadhaar number', 12, 'N', 1) + rd('pep', 'Politically exposed person?', [['NA', 'Not applicable'], ['PEP', 'I am a PEP'], ['RELATED', 'Related to a PEP']], 1)],
        ['4. Contact details', bx('mobile', 'Mobile number', 10, 'N', 1) + bx('altMobile', 'Alternate mobile', 10, 'N', 0) + '<div class="row">' + tx('emailUser', 'Email (before the @)', 1) + sl('emailDomain', 'Email domain', ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'], 1) + '</div>']
      ]
    },
    {
      h: 'Prove who you are.', t: 'Page 2: KYC & OVD', s: [
        ['5. Proof of identity / address (OVD)', ch('ovd', 'Choose the documents you will upload', OVD, 1) + '<div class="slots">' + OVD.map(function (o) { return fl('ovd' + o[0], o[1], 'PDF, JPG or PNG', 1, 'ovd=' + o[0]) }).join('') + '</div><p class="hint">Files are encrypted when you upload them. In this preview they never leave your device.</p>'],
        ['6. Address details', rd('addrType', 'Address type', [['RESIDENTIAL_BUSINESS', 'Residential and business'], ['RESIDENTIAL', 'Residential'], ['BUSINESS', 'Business'], ['REGISTERED_OFFICE', 'Registered office']], 1) + '<div class="row">' + tx('house', 'House or flat number', 1) + tx('street', 'Street', 1) + tx('landmark', 'Landmark', 0) + tx('city', 'City', 1) + tx('district', 'District', 1) + tx('state', 'State', 1) + '</div>' + bx('pincode', 'PIN code', 6, 'N', 1) + rd('corrSame', 'Is your correspondence address the same?', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + cd('corrSame=NO', bx('corrPincode', 'Correspondence PIN code', 6, 'N', 1) + tx('corrAddr', 'Correspondence address', 1)) + ch('deemed', 'Deemed proof of address (optional)', [['UTILITY', 'Utility bill'], ['PROPERTY_TAX', 'Property tax receipt'], ['PENSION_ORDER', 'Pension order'], ['GOVT_ACCOMMODATION', 'Govt. accommodation letter'], ['LEAVE_LICENSE', 'Leave and licence']], 0)],
        ['7. Applicant photograph & verification signature', '<div class="row">' + fl('photo', 'Passport-size photograph', 'Plain background', 1) + '<div class="f"><span class="lb">Signature' + req(1) + '</span><div class="sigw" data-k="signature" data-l="Signature" data-r data-testid="app-signature-pad"><canvas id="sig"></canvas><button type="button" class="ghost sm" id="sigclr" data-testid="app-signature-clear-button">Clear</button><p id="sigp">Draw your signature here</p></div></div></div>']
      ]
    },
    {
      h: 'Shape your account.', t: 'Page 3: Account Form', s: [
        ['1. Type of account requested', rd('acctType', 'Account type', Object.keys(NAMES).map(function (k) { return [k, NAMES[k]] }), 1)],
        ['2. Mode of operation', rd('mode', 'Mode of operation', [['SELF_SINGLE', 'Self / single'], ['EITHER_SURVIVOR', 'Either or survivor'], ['FORMER_SURVIVOR', 'Former or survivor'], ['JOINTLY', 'Jointly'], ['MINOR_GUARDIAN', 'Minor with guardian']], 1) + cd('mode=JOINTLY', tx('jointCount', 'Number of joint holders', 1, 'number'))],
        ['3. Services & channels required', rd('svcCheque', 'Cheque book', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + rd('svcDebit', 'Debit card', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + cd('svcDebit=YES', rd('cardScheme', 'Card scheme', [['RUPAY', 'RuPay'], ['VISA', 'Visa'], ['MASTERCARD', 'Mastercard']], 1) + rd('cardFormat', 'Card format', [['BOTH', 'Both'], ['VIRTUAL', 'Virtual'], ['METAL', 'Metal']], 1) + bx('cardName', 'Name on card', 19, 'A', 1)) + rd('svcNet', 'Net banking', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + rd('svcMob', 'Mobile banking', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + rd('svcSms', 'SMS alerts', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1) + rd('svcStmt', 'E-statement', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1)],
        ['4. Fixed / recurring deposit instructions (only if applicable)', cd('acctType=FIXED_DEPOSIT|MONEY_MARKET', rd('fdPayout', 'Interest payout', ['Monthly', 'Quarterly', 'On Maturity'], 1) + rd('fdMaturity', 'On maturity', ['Auto Renew', 'Credit to A/C'], 1)) + '<p class="hint" id="fdn">Not needed for the account you chose.</p>'],
        ['5. Initial deposit / payment details', '<div class="row"><div class="f"><span class="lb">Initial deposit (₹)' + req(1) + '</span><input class="inp" type="number" id="dep" data-k="deposit" data-l="Initial deposit" data-r min="0" data-testid="app-deposit-input"><p class="hint" id="dephint"></p></div><div class="f"><span class="lb">Amount in words</span><span class="fixed" id="words" style="display:block">—</span></div></div>' + rd('payMode', 'Payment mode', ['Cash', 'Cheque / DD', 'Transfer from Existing Account'], 1) + '<div class="f"><span class="lb">Online banking login password' + req(1) + '</span><input class="inp" type="password" id="pw" data-k="pw" data-l="Online banking login password" data-r autocomplete="new-password" data-testid="app-password-input"><div class="meter"><i id="pwm"></i></div><p class="hint">At least 8 characters.</p></div>'],
        ['6. Joint applicant details (if joint account)', cd('mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR', bx('jName', 'Joint holder’s name', 20, 'A', 1) + dt('jDob', 'Joint holder’s date of birth', 1) + sl('jRel', 'Relationship', ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'], 1)) + '<p class="hint" id="jn">Only needed for joint modes of operation.</p>']
      ]
    },
    {
      h: 'Sign off.', t: 'Page 4: Declarations', s: [
        ['1. Nomination details', rd('nomination', 'Nomination', [['REGISTER', 'Register a nominee'], ['DECLINE', 'Decline nomination']], 1) + cd('nomination=REGISTER', rd('nomPrefix', 'Nominee title', PFX, 1) + bx('nomName', 'Nominee’s name', 20, 'A', 1) + sl('nomRel', 'Relationship', ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'], 1) + rd('nomPassbook', 'Print nominee on passbook', YN.map(function (x) { return [x, x === 'YES' ? 'Yes' : 'No'] }), 1))],
        ['2. FATCA / CRS declaration', rd('fatca', 'Tax residency', [['INDIA_ONLY', 'India only'], ['OUTSIDE_INDIA', 'Outside India as well']], 1) + cd('fatca=OUTSIDE_INDIA', '<div class="row">' + tx('taxCountry', 'Country of tax residence', 1) + tx('tin', 'Tax identification number', 1) + '</div>')],
        ['3. Final declaration & signatures', '<label class="chk" data-k="decl" data-l="Declaration" data-r data-testid="app-declaration-checkbox"><input type="checkbox" id="declc"><i><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></i><span>I declare that the information I have given is true and complete, and I understand that my account is opened only after the bank approves my application. The signature I drew on Page 2 is mine.' + req(1) + '</span></label><p class="hint">Date: ' + today + '</p>']
      ]
    }
  ];

  /* Render Pages & Tabs */
  $('#pages').innerHTML = PAGES.map(function (p, i) {
    return '<div class="pg" data-pg="' + i + '"><div class="shead"><span>NeoBank · Uniform account opening form</span><span>Page ' + (i + 1) + ' of 4</span></div>' + p.s.map(function (s, j) {
      var sc = /Joint applicant/.test(s[0]) ? ' cond off" data-c="mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR' : '';
      return '<section class="card sec' + sc + '" data-sec="' + i + '-' + j + '" data-testid="app-section-' + slug(s[0]) + '"><h2>' + s[0] + '</h2><span class="stamp">COMPLETE</span>' + s[1] + '</section>';
    }).join('') + '</div>';
  }).join('');

  $('#tabs').innerHTML = PAGES.map(function (p, i) {
    return '<button class="tab" data-tab="' + i + '" data-testid="app-tab-page-' + (i + 1) + '-button">' + p.t + '</button>';
  }).join('');

  function toast(m) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  // REAL DRAFT STORAGE: Writes to localStorage and syncs with backend
  var num = appNum || ('APP-2026-' + (100000 + Math.floor(Math.random() * 899999)));

  function persistDraft() {
    try {
      if (!num) return;
      localStorage.setItem('nb_draft_' + num, JSON.stringify(S));
      localStorage.setItem('nb_app_draft', JSON.stringify(S));
      localStorage.setItem('neobank_last_submitted_app', num);
    } catch (e) {
      console.warn('Failed to persist draft:', e);
    }
  }

  var syncDraftTimer;
  function syncDraftToBackend() {
    clearTimeout(syncDraftTimer);
    syncDraftTimer = setTimeout(function () {
      try {
        var draftPayload = {
          applicationNumber: num,
          accountType: S.acctType || 'SAVINGS',
          branchName: S.branchName || 'Mumbai Main Branch',
          branchCode: S.branchCode || 'BOM-001',
          applicant: {
            firstName: S.firstName || '',
            lastName: S.lastName || '',
            email: (S.emailUser ? (S.emailUser + '@' + (S.emailDomain || 'gmail.com')) : ''),
            phone: S.mobile || ''
          },
          formData: S
        };
        fetch('/onboarding/save-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftPayload)
        }).catch(function (e) {
          console.warn('Draft backend sync notice:', e);
        });
      } catch (_) {}
    }, 600);
  }

  var sv;
  function saved() {
    persistDraft();
    syncDraftToBackend();
    var s = $('#save');
    if (!s) return;
    s.classList.add('busy');
    var em = s.querySelector('em');
    if (em) em.textContent = 'Saving…';
    clearTimeout(sv);
    sv = setTimeout(function () {
      s.classList.remove('busy');
      if (em) em.textContent = 'Draft saved';
    }, 600);
  }

  function act(e) {
    return e && e.closest ? !e.closest('.cond.off') : true;
  }

  function reqs(root) {
    return $$((root || '') + ' [data-r]').filter(act);
  }

  function val(e) {
    if (!e) return false;
    var k = e.dataset ? e.dataset.k : null;
    var v = k ? S[k] : undefined;
    if (e.classList && e.classList.contains('bxs')) return !!v && v.length >= +e.dataset.min;
    if (Array.isArray(v)) return v.length > 0;
    if (k === 'deposit' || e.id === 'dep') {
      var depVal = S.deposit !== undefined ? S.deposit : (e.value || '');
      var n = +depVal, m = MINS[S.acctType] || 0;
      return depVal !== '' && !isNaN(n) && n >= m;
    }
    if (k === 'pw' || e.id === 'pw') {
      var pwVal = S.pw !== undefined ? S.pw : (e.value || '');
      return !!pwVal && String(pwVal).length >= 8;
    }
    if (k === 'signature') return !!S.signature;
    if (k === 'decl' || e.id === 'declc') return !!S.decl;
    return !!v;
  }

  function cond() {
    $$('.cond').forEach(function (c) {
      if (!c.dataset || !c.dataset.c || c.dataset.c.indexOf('=') === -1) return;
      var p = c.dataset.c.split('='), vs = p[1].split('|'), v = S[p[0]],
        on = Array.isArray(v) ? v.some(function (x) { return vs.indexOf(x) > -1; }) : vs.indexOf(v) > -1;
      c.classList.toggle('off', !on);
    });

    var fdn = $('#fdn');
    if (fdn) {
      var acctCond = $('[data-c^="acctType"]');
      fdn.hidden = !(acctCond && acctCond.classList.contains('off'));
    }
    var jn = $('#jn');
    if (jn) {
      var modeCond = $('[data-c^="mode=JOINTLY|"]');
      jn.hidden = !(modeCond && modeCond.classList.contains('off'));
    }
  }

  function nav() {
    var h = '';
    $$('.pg.on:not(.out):not(.outb) .sec').filter(act).forEach(function (s) {
      h += '<a data-sec="' + s.dataset.sec + '" data-testid="app-nav-' + slug(s.querySelector('h2').textContent) + '-link"><i></i>' + s.querySelector('h2').textContent.replace(/^\d\.\s/, '').replace(/\s\(.*/, '') + '</a>';
    });
    var secnav = $('#secnav');
    if (secnav) secnav.innerHTML = h;
  }

  function pctOf(i) {
    var r = reqs('.pg[data-pg="' + i + '"]');
    return r.length ? Math.round(r.filter(val).length / r.length * 100) : 0;
  }

  function update() {
    cond();
    var all = reqs(), n = all.filter(val).length, p = all.length ? Math.round(n / all.length * 100) : 0;
    var pctEl = $('#pct');
    if (pctEl) pctEl.textContent = p + '%';
    var rvEl = $('#rv');
    if (rvEl) rvEl.style.strokeDashoffset = 176 - 176 * p / 100;

    // SECTION COMPLETION: State 1 (Mandatory Done) vs State 2 (Full Complete)
    $$('.sec').forEach(function (s) {
      var mandatoryList = reqs('.sec[data-sec="' + s.dataset.sec + '"]');
      var allList = $$('[data-k]', s).filter(act);

      var isMandatoryComplete = mandatoryList.length > 0 && mandatoryList.every(val);
      var isFullyComplete = allList.length > 0 && allList.every(val);

      var stamp = s.querySelector('.stamp');
      if (stamp) {
        if (isFullyComplete) {
          s.classList.remove('mand-ok');
          s.classList.add('ok');
          stamp.textContent = 'COMPLETE';
          stamp.className = 'stamp full';
        } else if (isMandatoryComplete) {
          s.classList.add('ok');
          s.classList.add('mand-ok');
          stamp.textContent = 'REQUIRED MET';
          stamp.className = 'stamp mand';
        } else {
          s.classList.remove('ok');
          s.classList.remove('mand-ok');
          stamp.className = 'stamp';
        }
      }
    });

    nav();
    $$('#secnav a').forEach(function (a) {
      var targetSec = $('.sec[data-sec="' + a.dataset.sec + '"]');
      a.classList.toggle('ok', targetSec ? targetSec.classList.contains('ok') : false);
    });

    // Remove bad outline dynamically when valid
    $$('.bad').forEach(function (el) {
      if (val(el)) {
        el.classList.remove('bad');
        if (el.classList.contains('bxs')) {
          $$('input', el).forEach(function (i) { i.classList.remove('bad'); });
        }
      }
    });

    var left = reqs('.pg.on:not(.out):not(.outb)').filter(function (e) { return !val(e); }).length;
    if (view === 'form') {
      var leftEl = $('#left');
      if (leftEl) leftEl.textContent = left ? left + ' required ' + (left === 1 ? 'item' : 'items') + ' left on this page' : 'This page is complete';
    }

    var acnEl = $('#acn');
    if (acnEl) acnEl.textContent = NAMES[S.acctType] || '';
    var acmEl = $('#acm');
    if (acmEl) acmEl.textContent = 'Minimum deposit ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';
    var acbEl = $('#acb');
    if (acbEl) acbEl.textContent = S.branchName + (S.branchCode ? ' (' + S.branchCode + ')' : '');
  }

  /* 3D Page Turn */
  function steps(n) {
    $$('#steps li').forEach(function (l, i) {
      l.className = i + 1 < n ? 'fin' : i + 1 === n ? 'cur' : '';
    });
  }

  function done(el, cls) {
    el.addEventListener('animationend', function f(e) {
      if (e.target !== el) return;
      el.removeEventListener('animationend', f);
      cls();
    });
  }

  function show(i, dir) {
    var old = $('.pg.on'), nw = $$('.pg')[i];
    dir = dir || (i >= page ? 1 : -1);
    page = i;
    view = 'form';
    $('#rev').hidden = true;
    $('#pages').hidden = false;

    if (old !== nw) {
      if (old) {
        if (reduce) old.classList.remove('on');
        else {
          old.classList.add(dir > 0 ? 'out' : 'outb');
          done(old, function () { old.classList.remove('on', 'out', 'outb'); update(); });
        }
      }
      nw.classList.add('on');
      if (!reduce) {
        nw.classList.add(dir > 0 ? 'in' : 'inb');
        done(nw, function () { nw.classList.remove('in', 'inb'); });
      }
    }

    $('#title').textContent = PAGES[i].h;
    steps(2);
    $$('.tab[data-tab]').forEach(function (t) { t.classList.toggle('on', +t.dataset.tab === i); });
    $('#tabs').hidden = false;
    $('#back').style.visibility = i ? 'visible' : 'hidden';
    $('#next').textContent = i < 3 ? 'Continue' : 'Review application';
    $('#bar').hidden = false;

    update();
    fit();
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  function review() {
    view = 'review';
    $('#pages').hidden = true;
    $('#rev').hidden = false;
    $('#tabs').hidden = true;
    steps(3);
    $('#title').textContent = 'Check everything.';
    $('#next').textContent = 'Submit application';
    var secnav = $('#secnav');
    if (secnav) secnav.innerHTML = '';

    $('#rev').innerHTML = PAGES.map(function (p, i) {
      var secs = $$('.pg[data-pg="' + i + '"] .sec').filter(act).map(function (s) {
        var rows = $$('[data-k]', s).filter(act).map(function (e) {
          var v = S[e.dataset.k];
          if (v === true) v = 'Provided';
          if (Array.isArray(v)) v = v.join(', ');
          if (e.dataset.k === 'pw' || e.id === 'pw') v = '••••••••';
          return '<div><dt>' + e.dataset.l + '</dt><dd>' + (v ? String(v).replace(/</g, '&lt;') : 'Not provided') + '</dd></div>';
        }).join('');
        return rows ? '<h4>' + s.querySelector('h2').textContent + '</h4><dl>' + rows + '</dl>' : '';
      }).join('');
      return '<section class="card"><h3>' + p.t + '<button class="ghost sm" data-edit="' + i + '" data-testid="app-edit-page-' + (i + 1) + '-button">Edit</button></h3>' + secs + '</section>';
    }).join('');

    $('#left').textContent = 'Last look before you submit.';
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  async function finish() {
    view = 'done';
    $('#bar').hidden = true;
    $('#rev').hidden = true;
    $('#done').hidden = false;
    steps(4);
    $('#title').textContent = 'All set.';
    $('#tabs').hidden = true;
    $('#no2').textContent = num;
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });

    var addrLine1 = [S.house, S.street, S.landmark].filter(Boolean).join(', ') || '123 Marine Drive';
    if (addrLine1.length < 3) addrLine1 = 'Flat 101, Main Road';

    var rawPhone = (S.mobile || '9876543210').replace(/\D/g, '');
    if (rawPhone.length < 10) rawPhone = '9876543210';

    var empStatus = 'EMPLOYED';
    if (S.emp === 'SELF_EMPLOYED' || S.emp === 'BUSINESS') empStatus = 'SELF_EMPLOYED';
    else if (S.emp === 'STUDENT') empStatus = 'STUDENT';
    else if (S.emp === 'RETIRED') empStatus = 'RETIRED';
    else if (S.emp === 'HOUSEWIFE') empStatus = 'UNEMPLOYED';

    var submitPayload = {
      applicationNumber: num,
      accountType: S.acctType || 'SAVINGS',
      currency: 'USD',
      branchName: S.branchName || 'Mumbai Main Branch',
      branchCode: S.branchCode || 'BOM-001',
      applicant: {
        firstName: S.firstName || 'Alexander',
        lastName: S.lastName || 'Vance',
        dob: (S.dob && S.dob.length === 8 ? (S.dob.slice(4) + '-' + S.dob.slice(2, 4) + '-' + S.dob.slice(0, 2)) : '1994-05-12'),
        phone: rawPhone,
        address: {
          line1: addrLine1,
          city: S.city || 'Mumbai',
          state: S.state || 'Maharashtra',
          postalCode: (S.pincode && S.pincode.length >= 3) ? S.pincode : '400001',
          country: 'IN'
        }
      },
      email: (S.emailUser ? (S.emailUser + '@' + (S.emailDomain || 'gmail.com')) : 'alexander.vance@example.com').toLowerCase(),
      password: S.pw || 'DemoPassword@2026',
      taxId: S.pan || 'ABCDE1234F',
      employment: {
        status: empStatus,
        employer: S.employer || (empStatus === 'SELF_EMPLOYED' ? 'Self Business' : 'Company Ltd'),
        annualIncome: 50000.0
      },
      initialDeposit: Math.max(parseFloat(S.deposit || S.dep) || 0, (MINS[S.acctType] || 100)),
      identityDocument: {
        type: 'PASSPORT',
        number: S.aadhaar || '987654321012',
        issuingCountry: 'IN'
      },
      addressProof: {
        type: 'UTILITY_BILL',
        number: S.pincode || '400001',
        issuingCountry: 'IN'
      },
      agreedToTerms: true,
      cardScheme: S.cardScheme || 'RUPAY',
      cardFormat: S.cardFormat || 'BOTH',
      formData: S
    };

    try {
      var apps = JSON.parse(localStorage.getItem('neobank_applications') || '{}');
      apps[num] = {
        applicationNumber: num,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        accountType: S.acctType,
        branchName: S.branchName,
        applicant: submitPayload.applicant,
        formData: S
      };
      localStorage.setItem('neobank_applications', JSON.stringify(apps));
      localStorage.setItem('neobank_last_submitted_app', num);

      var res = await fetch('/onboarding/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
      });
      if (res.ok) {
        var resData = await res.json();
        if (resData && resData.applicationNumber) {
          num = resData.applicationNumber;
          $('#no2').textContent = num;
          apps[num] = Object.assign({}, apps[num], resData);
          localStorage.setItem('neobank_applications', JSON.stringify(apps));
          localStorage.setItem('neobank_last_submitted_app', num);
        }
      } else {
        console.warn('Backend API submission sync status:', res.status);
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  }

  function bad(list) {
    list.forEach(function (e) {
      e.classList.add('bad');
      if (e.classList.contains('bxs')) {
        $$('input', e).forEach(function (i) { i.classList.add('bad'); });
      }
    });
    var f = list[0], c = f.closest('.sec');
    (c || f).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (c) {
      c.classList.remove('shake');
      void c.offsetWidth;
      c.classList.add('shake');
    }
  }

  /* Pending missing fields modal */
  function showPendingFieldsModal(missingList) {
    var modal = $('#modal-pending-fields');
    var listContainer = $('#modal-pending-list');
    var subTitle = $('#modal-pending-sub');
    if (!modal || !listContainer) {
      bad(missingList);
      toast('Please complete the highlighted mandatory fields.');
      return;
    }

    var count = missingList.length;
    if (subTitle) {
      subTitle.textContent = count + ' mandatory ' + (count === 1 ? 'field is' : 'fields are') + ' pending before you can submit.';
    }

    var groups = {};
    missingList.forEach(function (el) {
      var pgEl = el.closest('.pg');
      var pIdx = pgEl ? +pgEl.dataset.pg : 0;
      if (!groups[pIdx]) groups[pIdx] = [];
      groups[pIdx].push(el);
    });

    var html = '';
    Object.keys(groups).sort(function (a, b) { return +a - +b; }).forEach(function (pIdx) {
      var pNum = +pIdx;
      var pageInfo = PAGES[pNum];
      var pageTitle = pageInfo ? pageInfo.t : ('Page ' + (pNum + 1));
      var fields = groups[pNum];

      html += '<div class="pending-page-group">';
      html += '<div class="pending-page-title"><b>' + pageTitle + '</b><span class="pending-page-count">' + fields.length + ' pending</span></div>';
      html += '<ul class="pending-fields-list">';
      fields.forEach(function (f) {
        var label = f.dataset.l || (f.querySelector && f.querySelector('.lb') ? f.querySelector('.lb').textContent.replace(/\*/g, '').trim() : f.id || 'Required field');
        var k = f.dataset.k || f.id || '';
        html += '<li><button type="button" class="pending-field-btn" data-jump-pg="' + pNum + '" data-jump-k="' + k + '"><span class="pending-name">' + label + '</span><span class="pending-action">Fill this →</span></button></li>';
      });
      html += '</ul></div>';
    });

    listContainer.innerHTML = html;
    modal.style.display = 'flex';

    function closeAndHighlight(targetPg, targetK) {
      modal.style.display = 'none';
      missingList.forEach(function (el) {
        el.classList.add('bad');
        if (el.classList.contains('bxs')) {
          $$('input', el).forEach(function (i) { i.classList.add('bad'); });
        }
      });
      var pToOpen = typeof targetPg === 'number' ? targetPg : (missingList[0].closest('.pg') ? +missingList[0].closest('.pg').dataset.pg : 0);
      show(pToOpen, 1);
      setTimeout(function () {
        var targetEl = targetK ? $('[data-k="' + targetK + '"]') : null;
        if (!targetEl || !targetEl.classList.contains('bad')) {
          targetEl = $('.pg.on .bad');
        }
        if (targetEl) {
          var card = targetEl.closest('.sec') || targetEl;
          card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          if (card.classList) {
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');
          }
          var firstInp = targetEl.querySelector ? (targetEl.querySelector('input:not([hidden])') || targetEl.querySelector('select')) : null;
          if (firstInp) firstInp.focus();
        }
      }, 150);
    }

    var btnClose = $('#btn-close-pending-modal');
    if (btnClose) btnClose.onclick = function () { closeAndHighlight(); };
    var btnCancel = $('#btn-cancel-pending-modal');
    if (btnCancel) btnCancel.onclick = function () { closeAndHighlight(); };
    var btnFix = $('#btn-fix-pending-modal');
    if (btnFix) btnFix.onclick = function () { closeAndHighlight(); };

    $$('.pending-field-btn', listContainer).forEach(function (btn) {
      btn.onclick = function () {
        closeAndHighlight(+btn.dataset.jumpPg, btn.dataset.jumpK);
      };
    });
  }

  $('#next').onclick = function () {
    if (view === 'form') {
      page < 3 ? show(page + 1, 1) : review();
    } else if (view === 'review') {
      var missing = reqs().filter(function (e) { return !val(e); });
      if (missing.length > 0) {
        showPendingFieldsModal(missing);
        return;
      }
      finish();
    }
  };

  $('#back').onclick = function () {
    view === 'review' ? show(3, -1) : page > 0 && show(page - 1, -1);
  };

  /* 3D all-pages fan */
  var fr = $('#fr');
  if (fr) {
    fr.innerHTML = PAGES.map(function (p, i) {
      return '<button type="button" class="tile" style="--i:' + i + '" data-go="' + i + '" data-testid="app-fan-page-' + (i + 1) + '-button"><div><b>' + (i + 1) + '</b><br><span>' + p.t.replace(/^Page \d:\s*/, '') + '</span></div><em class="pc"></em></button>';
    }).join('');
  }

  var allBtn = $('#all');
  if (allBtn) {
    allBtn.onclick = function () {
      $$('.pc').forEach(function (e, i) { e.textContent = pctOf(i) + '% done'; });
      var fan = $('#fan');
      if (fan) fan.hidden = false;
    };
  }
  var fanx = $('#fanx');
  if (fanx) {
    fanx.onclick = function () {
      var fan = $('#fan');
      if (fan) fan.hidden = true;
    };
  }

  // =================================================================
  // PILLS SELECTION & "OTHER" SPECIFICATION ENGINE
  // =================================================================
  function closeOtherBox(g) {
    if (!g) return;
    var b = g.querySelector('.other-inline-box');
    if (b) b.remove();
  }

  function showOtherBox(g, initialVal) {
    closeOtherBox(g);
    var k = g.dataset.k;
    var b = document.createElement('div');
    b.className = 'other-inline-box';
    b.dataset.k = k;

    var existingVal = (typeof initialVal === 'string' && initialVal) ? initialVal :
                      (S[k + '_other'] || (typeof S[k] === 'string' && !isOtherVal(S[k]) ? S[k] : ''));
    if (isOtherVal(existingVal)) existingVal = '';

    b.innerHTML = '<input type="text" class="inp other-inp" placeholder="Please specify..." value="' +
      (existingVal ? String(existingVal).replace(/"/g, '&quot;') : '') +
      '" style="flex:1;height:42px;padding:0 14px;border-radius:10px;border:1px solid rgba(0,245,155,0.4);background:rgba(4,6,11,0.9);color:#e6eef8;" />' +
      '<button type="button" class="other-btn ok save-btn other-btn-ok" title="Confirm specification" aria-label="Confirm">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#04060b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>' +
      '</button>' +
      '<button type="button" class="other-btn cancel other-btn-cancel" title="Cancel and deselect" aria-label="Cancel">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff5252" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>' +
      '</button>';

    g.appendChild(b);
    var inp = b.querySelector('input');
    var okBtn = b.querySelector('.other-btn-ok');
    var cancelBtn = b.querySelector('.other-btn-cancel');

    setTimeout(function () { if (inp) inp.focus(); }, 60);

    function confirmOther() {
      var rawText = (inp ? inp.value : '').trim();
      var otherPill = $$('.pill', g).find(function (p) { return isOtherVal(p.dataset.v); });
      if (rawText) {
        S[k] = rawText;
        S[k + '_other'] = rawText;

        if (otherPill) {
          if (!otherPill.dataset.origText) otherPill.dataset.origText = otherPill.textContent || 'Other';
          otherPill.textContent = rawText;
          // Set full tooltip so hovering reveals entire text (even for 1000+ chars)
          otherPill.setAttribute('title', rawText);
        }
        closeOtherBox(g);
        toast('Specified: ' + (rawText.length > 25 ? rawText.slice(0, 22) + '...' : rawText));
      } else {
        closeOtherBox(g);
        if (otherPill) {
          if (otherPill.dataset.origText) otherPill.textContent = otherPill.dataset.origText;
          otherPill.removeAttribute('title');
        }
        delete S[k];
        delete S[k + '_other'];
      }
      paint(g);
      saved();
      update();
    }

    function dismissOther() {
      closeOtherBox(g);
      var otherPill = $$('.pill', g).find(function (p) { return isOtherVal(p.dataset.v); });
      if (otherPill && !S[k + '_other']) {
        if (otherPill.dataset.origText) otherPill.textContent = otherPill.dataset.origText;
        otherPill.removeAttribute('title');
      }
      paint(g);
      saved();
      update();
    }

    if (okBtn) okBtn.onclick = function (e) { if (e) e.stopPropagation(); confirmOther(); };
    if (cancelBtn) cancelBtn.onclick = function (e) { if (e) e.stopPropagation(); dismissOther(); };
    if (inp) {
      inp.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); confirmOther(); }
        else if (e.key === 'Escape') { e.preventDefault(); dismissOther(); }
      };
    }
  }

  function pick(g, v) {
    var k = g.dataset.k;
    var isMulti = !!(g && g.hasAttribute && g.hasAttribute('data-multi'));

    if (isMulti) {
      var a = S[k] || [];
      if (!Array.isArray(a)) a = [a];
      if (isOtherVal(v)) {
        if (S[k + '_other']) {
          delete S[k + '_other'];
          closeOtherBox(g);
          var ix = a.indexOf(v);
          if (ix > -1) a.splice(ix, 1);
          S[k] = a.slice();
        } else {
          showOtherBox(g, '');
        }
      } else {
        var ix = a.indexOf(v);
        if (ix > -1) a.splice(ix, 1);
        else a.push(v);
        S[k] = a.slice();
      }
    } else {
      // Single Choice (Radio Group e.g. Title, Gender, Marital Status)
      if (isOtherVal(v)) {
        // User clicked "Other"
        showOtherBox(g, S[k + '_other'] || '');
      } else {
        // User clicked a standard option (e.g. Mr., Mrs., Dr.)
        closeOtherBox(g);
        delete S[k + '_other'];
        S[k] = v;

        // Reset the "Other" pill back to its default label & remove tooltip
        var otherPill = $$('.pill', g).find(function (p) { return isOtherVal(p.dataset.v); });
        if (otherPill) {
          if (otherPill.dataset.origText) otherPill.textContent = otherPill.dataset.origText;
          otherPill.removeAttribute('title');
        }
      }
    }
    paint(g);
  }

  // FIXED PAINT: In single-choice mode, exactly ONE option pill is active.
  function paint(g) {
    var k = g.dataset.k;
    var v = S[k];
    var isMulti = !!(g && g.hasAttribute && g.hasAttribute('data-multi'));
    var pills = $$('.pill', g);

    pills.forEach(function (p) {
      var pv = p.dataset.v;
      var isOtherPill = isOtherVal(pv);
      var on = false;

      if (isMulti) {
        var arr = Array.isArray(v) ? v : (v ? [v] : []);
        if (isOtherPill) {
          on = arr.some(function (x) { return isOtherVal(x); }) || !!S[k + '_other'];
        } else {
          on = arr.indexOf(pv) > -1;
        }
      } else {
        // Strict single-choice
        if (isOtherPill) {
          on = isOtherVal(v) || (!!v && !!S[k + '_other'] && v === S[k + '_other']);
        } else {
          on = (v === pv) && !S[k + '_other'];
        }
      }

      p.classList.toggle('on', !!on);
      p.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target, x;
    if (t.closest('.other-inline-box')) return;
    if (x = t.closest('[data-tab]')) { show(+x.dataset.tab); return; }
    if (x = t.closest('[data-go]')) { var fan = $('#fan'); if (fan) fan.hidden = true; show(+x.dataset.go); return; }
    if (x = t.closest('[data-edit]')) { show(+x.dataset.edit, -1); return; }
    if (x = t.closest('#secnav a')) {
      var secEl = $('.sec[data-sec="' + x.dataset.sec + '"]');
      if (secEl) secEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (x = t.closest('.pill')) {
      pick(x.parentNode, x.dataset.v);
      saved();
      update();
      return;
    }
  });

  /* Box Inputs */
  function collect(g) {
    var s = $$('input', g).map(function (i) { return i.value || ' '; }).join('').replace(/\s+$/, '');
    S[g.dataset.k] = s;
    saved();
    update();
  }

  function clean(g, v) {
    var k = g.dataset.kind;
    return k === 'N' ? v.replace(/\D/g, '') : k === 'A' ? v.replace(/[^A-Za-z ]/g, '').toUpperCase() : v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  function setBoxes(g, str) {
    str = clean(g, str);
    $$('input', g).forEach(function (i, n) { i.value = str[n] || ''; });
    collect(g);
  }

  document.addEventListener('input', function (e) {
    var t = e.target, g = t.closest('.bxs');

    if (g) {
      t.value = clean(g, t.value).slice(-1);
      if (t.value) {
        t.classList.remove('pop');
        void t.offsetWidth;
        t.classList.add('pop');
        var n = t.nextElementSibling;
        if (n) n.focus();
      }
      collect(g);
      if (/^(firstName|lastName)$/.test(g.dataset.k) && !S.cardName) autoCard();
      return;
    }

    if (t.id === 'dep') {
      var n = +t.value, m = MINS[S.acctType] || 0;
      S.deposit = t.value !== '' && n >= m ? n : '';
      var hint = $('#dephint');
      if (hint) {
        hint.className = 'hint' + (t.value !== '' && n < m ? ' err' : '');
        hint.textContent = t.value !== '' && n < m ? 'The minimum deposit for this account is ₹ ' + m.toLocaleString('en-IN') + '.00.' : 'Minimum deposit: ₹ ' + m.toLocaleString('en-IN') + '.00';
      }
      updateDepositWords(n);
    } else if (t.id === 'pw') {
      var v = t.value, sc = (v.length > 7) + (/[A-Z]/.test(v) && /[a-z]/.test(v)) + (/\d/.test(v)) + (/[^A-Za-z0-9]/.test(v));
      var pwm = $('#pwm');
      if (pwm) pwm.style.width = (v ? Math.max(1, sc) * 25 : 0) + '%';
      S.pw = v.length >= 8 ? v : '';
    } else if (t.dataset && t.dataset.k && !t.closest('.slot')) {
      S[t.dataset.k] = t.value;
    }

    saved();
    update();
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'declc') {
      S.decl = t.checked;
      saved();
      update();
    } else if (t.matches('select[data-k]')) {
      S[t.dataset.k] = t.value;
      saved();
      update();
    }
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target, g = t.closest && t.closest('.bxs');
    if (!g) return;

    if (e.key === 'Backspace' && !t.value) {
      var p = t.previousElementSibling;
      if (p) { p.value = ''; p.focus(); collect(g); }
    } else if (e.key === 'ArrowLeft' && t.previousElementSibling) {
      t.previousElementSibling.focus();
    } else if (e.key === 'ArrowRight' && t.nextElementSibling) {
      t.nextElementSibling.focus();
    }
  });

  document.addEventListener('paste', function (e) {
    var t = e.target, g = t.closest && t.closest('.bxs');
    if (!g) return;
    e.preventDefault();
    var v = clean(g, (e.clipboardData || window.clipboardData).getData('text')),
      is = $$('input', g), s = is.indexOf(t);
    v.split('').forEach(function (c, n) { if (is[s + n]) is[s + n].value = c; });
    collect(g);
  });

  function autoCard() {
    var g = $('[data-k="cardName"]'), f = S.firstName || '', l = S.lastName || '';
    if (g && (f || l)) {
      var full = ((f + ' ' + l).trim().slice(0, 19)).toUpperCase();
      $$('input', g).forEach(function (i, n) { i.value = full[n] || ''; });
      S.cardName = full;
      collect(g);
    }
  }

  function numberToWordsINR(num) {
    if (num === null || num === undefined || isNaN(num) || num <= 0) return '—';
    num = Math.floor(Number(num));
    if (num === 0) return 'Zero Rupees only';

    var units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertBelowThousand(n) {
      var s = '';
      if (n >= 100) {
        s += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        s += tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
      } else if (n > 0) {
        s += units[n];
      }
      return s.trim();
    }

    function convertRecursive(n) {
      if (n === 0) return '';
      if (n < 1000) return convertBelowThousand(n);
      if (n < 100000) {
        var th = Math.floor(n / 1000);
        var rem = n % 1000;
        return (convertBelowThousand(th) + ' Thousand ' + (rem ? convertBelowThousand(rem) : '')).trim();
      }
      if (n < 10000000) {
        var l = Math.floor(n / 100000);
        var remL = n % 100000;
        return (convertBelowThousand(l) + ' Lakh ' + (remL ? convertRecursive(remL) : '')).trim();
      }
      // Recursive Crores handles 100 Crore, 1,000 Crore, 1 Lakh Crore, etc. seamlessly
      var c = Math.floor(n / 10000000);
      var remC = n % 10000000;
      return (convertRecursive(c) + ' Crore ' + (remC ? convertRecursive(remC) : '')).trim();
    }

    var w = convertRecursive(num);
    var unit = (num === 1) ? 'Rupee only' : 'Rupees only';
    return w + ' ' + unit;
  }
  function words(n) { return numberToWordsINR(n); }
  function updateDepositWords(n) {
    var wordsEl = $('#words');
    if (!wordsEl) return;
    n = parseFloat(n);
    if (isNaN(n) || n <= 0) {
      wordsEl.textContent = '—';
      return;
    }
    // Optimistic fast format
    wordsEl.textContent = numberToWordsINR(n);
    // Asynchronous backend num2words library sync
    fetch('/onboarding/num2words?number=' + encodeURIComponent(n) + '&mode=currency')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.words && wordsEl) {
          wordsEl.textContent = data.words;
        }
      })
      .catch(function () {});
  }


  /* File upload attachment */
  function attach(s, name, file) {
    s.classList.add('on');
    var em = s.querySelector('em');
    if (em) {
      em.textContent = 'Encrypting…';
      setTimeout(function () { em.textContent = name + ' · encrypted'; }, reduce ? 0 : 1100);
    }
    S[s.dataset.k] = name;

    if (file && s.dataset.k === 'photo' && /^image/.test(file.type)) {
      var r = new FileReader();
      r.onload = function () {
        var im = s.querySelector('img') || s.appendChild(document.createElement('img'));
        im.src = r.result;
        im.alt = 'Your photograph';
      };
      r.readAsDataURL(file);
    }
    saved();
    update();
  }

  $$('.slot').forEach(function (s) {
    var inp = s.querySelector('input');
    if (inp) {
      inp.onchange = function () {
        if (this.files[0]) {
          var f = this.files[0];
          var valid = ['.pdf', '.jpg', '.jpeg', '.png', '.svg'];
          var ext = '.' + f.name.split('.').pop().toLowerCase();
          if (valid.indexOf(ext) === -1) {
            toast('Supported file formats: PDF, JPG, PNG, SVG');
            this.value = '';
            return;
          }
          attach(s, f.name, f);
        }
      };
    }
  });

  /* Signature Pad */
  var cv = $('#sig'), cx = (cv && typeof cv.getContext === 'function') ? cv.getContext('2d') : null, dr = false, has = false;

  function fit() {
    if (!cv || !cx) return;
    var r = cv.getBoundingClientRect();
    if (r.width > 0 && !has) {
      var d = Math.min(devicePixelRatio || 1, 2);
      cv.width = r.width * d;
      cv.height = r.height * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      cx.strokeStyle = '#00f59b';
      cx.lineWidth = 2.6;
      cx.lineCap = 'round';
      cx.lineJoin = 'round';
    }
  }

  function pt(e) {
    var r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  if (cv && cx) {
    cv.onpointerdown = function (e) {
      dr = true;
      cv.setPointerCapture(e.pointerId);
      var p = pt(e);
      cx.beginPath();
      cx.moveTo(p[0], p[1]);
      var sigp = $('#sigp');
      if (sigp) sigp.style.opacity = 0;
    };
    cv.onpointermove = function (e) {
      if (!dr) return;
      var p = pt(e);
      cx.lineTo(p[0], p[1]);
      cx.stroke();
      has = true;
    };
    cv.onpointerup = function () {
      dr = false;
      if (has) {
        S.signature = 'Signed';
        saved();
        update();
      }
    };
    var sigclr = $('#sigclr');
    if (sigclr) {
      sigclr.onclick = function () {
        has = false;
        cx.clearRect(0, 0, cv.width, cv.height);
        S.signature = '';
        var sigp = $('#sigp');
        if (sigp) sigp.style.opacity = 1;
        saved();
        update();
      };
    }
  }

  /* Fill Sample Data Button */
  var sampleBtn = $('#sample');
  if (sampleBtn) {
    sampleBtn.onclick = function () {
      for (var pass = 0; pass < 4; pass++) {
        cond();
        $$('[data-k]').filter(act).forEach(function (e) {
          if (val(e)) return;
          if (e.classList.contains('bxs')) {
            var k = e.dataset.kind, L = +e.dataset.len;
            var sampleVal = 'SAMPLE';
            if (k === 'N') {
              sampleVal = (e.dataset.k === 'dob' || e.dataset.k === 'jDob' ? '12051994' : (e.dataset.k === 'pincode' || e.dataset.k === 'corrPincode' ? '400001' : '9876501234567890'.slice(0, L)));
            } else if (e.dataset.k === 'pan') {
              sampleVal = 'ABCDE1234F';
            } else if (e.dataset.k === 'firstName') {
              sampleVal = 'ALEXANDER';
            } else if (e.dataset.k === 'middleName') {
              sampleVal = 'VICTOR';
            } else if (e.dataset.k === 'lastName') {
              sampleVal = 'VANCE';
            } else if (e.dataset.k === 'father') {
              sampleVal = 'ARTHUR VANCE';
            } else if (e.dataset.k === 'mother') {
              sampleVal = 'ELEANOR VANCE';
            } else if (e.dataset.k === 'cardName') {
              sampleVal = 'ALEXANDER VANCE';
            } else if (e.dataset.k === 'jName') {
              sampleVal = 'VICTORIA VANCE';
            } else if (e.dataset.k === 'nomName') {
              sampleVal = 'SARAH VANCE';
            } else if (e.dataset.k === 'guardian') {
              sampleVal = 'ARTHUR VANCE';
            }
            setBoxes(e, sampleVal);
          } else if (e.classList.contains('pills')) {
            var p = $('.pill', e);
            if (p) pick(e, p.dataset.v);
          } else if (e.matches('select')) {
            e.selectedIndex = 1;
            S[e.dataset.k] = e.value;
          } else if (e.matches('input.inp') && e.type !== 'file') {
            if (e.dataset.k === 'firstName') e.value = 'Alexander';
            else if (e.dataset.k === 'lastName') e.value = 'Vance';
            else if (e.dataset.k === 'middleName') e.value = 'Victor';
            else if (e.dataset.k === 'father') e.value = 'Arthur Vance';
            else if (e.dataset.k === 'mother') e.value = 'Eleanor Vance';
            else if (e.dataset.k === 'emailUser') e.value = 'alexander.vance';
            else if (e.dataset.k === 'house') e.value = '42A Skyline Tower';
            else if (e.dataset.k === 'street') e.value = 'Marine Drive';
            else if (e.dataset.k === 'city') e.value = 'Mumbai';
            else if (e.dataset.k === 'district') e.value = 'Mumbai City';
            else if (e.dataset.k === 'state') e.value = 'Maharashtra';
            else if (e.dataset.k === 'corrAddr') e.value = 'Same as permanent residence';
            else if (e.dataset.k === 'cardName') e.value = 'ALEXANDER VANCE';
            else if (e.dataset.k === 'jName') e.value = 'Victoria Vance';
            else if (e.dataset.k === 'nomName') e.value = 'Sarah Vance';
            else if (e.dataset.k === 'nomAddr') e.value = '42A Skyline Tower, Marine Drive, Mumbai';
            else e.value = e.type === 'number' ? '2' : 'Sample Data';
            S[e.dataset.k] = e.value;
          } else if (e.matches('.slot')) {
            attach(e, 'sample_verified.pdf');
          } else if (e.classList.contains('sigw')) {
            fit();
            has = true;
            if (cx) {
              cx.beginPath();
              cx.moveTo(30, 110);
              cx.bezierCurveTo(60, 20, 90, 20, 100, 90);
              cx.bezierCurveTo(110, 130, 150, 40, 190, 70);
              cx.bezierCurveTo(215, 90, 240, 60, 270, 80);
              cx.stroke();
            }
            S.signature = 'Signed';
          } else if (e.id === 'declc' || e.dataset.k === 'decl') {
            var declc = $('#declc');
            if (declc) declc.checked = true;
            S.decl = true;
          }
        });
        var dep = $('#dep');
        if (dep) {
          dep.value = Math.max(MINS[S.acctType] || 0, 1000);
          dep.dispatchEvent(new Event('input', { bubbles: true }));
        }
        var pw = $('#pw');
        if (pw) {
          pw.value = 'Sample@1234';
          pw.dispatchEvent(new Event('input', { bubbles: true }));
        }
        update();
      }
      update();
      saved();
      toast('Sample data filled. Press Continue.');
    };
  }

  /* Reference Copy Button */
  var appnoEl = $('#appno');
  if (appnoEl) appnoEl.textContent = num;

  var copyBtn = $('#copy');
  if (copyBtn) {
    var copyResetTimer = null;
    copyBtn.onclick = function () {
      function markCopied() {
        toast('Reference Copied: ' + num);
        copyBtn.textContent = 'Copied';
        clearTimeout(copyResetTimer);
        copyResetTimer = setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(markCopied, markCopied);
      } else {
        markCopied();
      }
    };
  }

  /* 3D Tilt on Account Card */
  var ac = $('#acct');
  if (ac && !reduce && matchMedia('(hover:hover)').matches) {
    ac.addEventListener('pointermove', function (e) {
      var r = ac.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      ac.style.transform = 'perspective(700px) rotateY(' + (x * 16) + 'deg) rotateX(' + (-y * 16) + 'deg)';
    });
    ac.addEventListener('pointerleave', function () {
      ac.style.transform = '';
    });
  }

  // =================================================================
  // CHANGE ACCOUNT & BRANCH MODAL WITH AUTOCOMPLETE SEARCH & PAGINATION
  // (Identical to Step 1 open_account_customer Component)
  // =================================================================
  var changeLink = $('#app-change-selection-link');
  var changeModal = $('#modal-change-selection');
  var branchSearchInput = $('#modal-branch-search');
  var branchListContainer = $('#modal-branch-list');
  var accSelect = $('#modal-select-account');
  var branchSelectedTag = $('#modal-branch-selected-tag');
  var modalPagination = $('#modal-branch-pagination');
  var modalWordsWrap = $('#modalBranchPageWords');
  var modalPrevBtn = $('#modalPrevBranchPage');
  var modalNextBtn = $('#modalNextBranchPage');

  var modalBranchPage = 0;
  var MODAL_PAGE_SIZE = 8;
  var NUMBER_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

  var tempSelectedBranch = {
    code: S.branchCode || 'BOM-001',
    name: S.branchName || 'Mumbai Main Branch'
  };

  function updateModalBranchTag() {
    if (!branchSelectedTag) return;
    if (tempSelectedBranch && tempSelectedBranch.name) {
      branchSelectedTag.style.display = 'inline-flex';
      branchSelectedTag.innerHTML = '<span style="font-weight:600;">Selected:</span> <strong>' + tempSelectedBranch.name + ' (' + tempSelectedBranch.code + ')</strong>';
    } else {
      branchSelectedTag.style.display = 'none';
    }
  }

  function getFilteredModalBranches() {
    var query = (branchSearchInput ? branchSearchInput.value : '').toLowerCase().trim();
    return BRANCHES.filter(function (b) {
      return !query || b.name.toLowerCase().indexOf(query) > -1 ||
        b.code.toLowerCase().indexOf(query) > -1 ||
        b.city.toLowerCase().indexOf(query) > -1;
    });
  }

  function renderModalBranchPage() {
    if (!branchListContainer) return;
    var filtered = getFilteredModalBranches();
    var totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE));
    if (modalBranchPage >= totalPages) modalBranchPage = totalPages - 1;
    if (modalBranchPage < 0) modalBranchPage = 0;

    var startIdx = modalBranchPage * MODAL_PAGE_SIZE;
    var pageBranches = filtered.slice(startIdx, startIdx + MODAL_PAGE_SIZE);

    branchListContainer.innerHTML = '';
    if (pageBranches.length === 0) {
      var query = branchSearchInput ? branchSearchInput.value.trim() : '';
      branchListContainer.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--ti);font-size:0.9rem;">No branches match "' + query + '"</div>';
    } else {
      pageBranches.forEach(function (b) {
        var isSel = (b.code === tempSelectedBranch.code);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'br' + (isSel ? ' selected' : '');
        btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
        btn.innerHTML = '<b>' + b.name + '</b><span>' + b.code + ' • ' + b.city + '</span>';
        btn.onclick = function () {
          tempSelectedBranch = { code: b.code, name: b.name };
          $$('.br', branchListContainer).forEach(function (c) {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('selected');
          btn.setAttribute('aria-pressed', 'true');
          updateModalBranchTag();
        };
        branchListContainer.appendChild(btn);
      });
    }

    // Render word pagination
    if (modalPagination && modalWordsWrap) {
      if (totalPages <= 1) {
        modalPagination.style.display = 'none';
      } else {
        modalPagination.style.display = 'flex';
        if (modalPrevBtn) modalPrevBtn.disabled = (modalBranchPage === 0);
        if (modalNextBtn) modalNextBtn.disabled = (modalBranchPage >= totalPages - 1);

        modalWordsWrap.innerHTML = '';
        for (var i = 0; i < totalPages; i++) {
          (function (pageIdx) {
            var word = NUMBER_WORDS[pageIdx] || ('Page ' + (pageIdx + 1));
            var wBtn = document.createElement('button');
            wBtn.type = 'button';
            wBtn.className = 'page-word-btn' + (pageIdx === modalBranchPage ? ' active' : '');
            wBtn.textContent = word;
            wBtn.onclick = function () {
              modalBranchPage = pageIdx;
              renderModalBranchPage();
            };
            modalWordsWrap.appendChild(wBtn);
          })(i);
        }
      }
    }
  }

  if (modalPrevBtn) {
    modalPrevBtn.onclick = function () {
      if (modalBranchPage > 0) {
        modalBranchPage--;
        renderModalBranchPage();
      }
    };
  }
  if (modalNextBtn) {
    modalNextBtn.onclick = function () {
      var filtered = getFilteredModalBranches();
      var totalPages = Math.ceil(filtered.length / MODAL_PAGE_SIZE);
      if (modalBranchPage < totalPages - 1) {
        modalBranchPage++;
        renderModalBranchPage();
      }
    };
  }

  window.__initModalBranchView = function () {
    if (!changeModal) changeModal = $('#modal-change-selection');
    if (!changeModal) return;
    changeModal.style.setProperty('display', 'flex', 'important');
    changeModal.style.setProperty('z-index', '999999999', 'important');
    changeModal.classList.add('active');

    if (accSelect && S.acctType) accSelect.value = S.acctType;
    tempSelectedBranch = {
      code: S.branchCode || 'BOM-001',
      name: S.branchName || 'Mumbai Main Branch'
    };
    if (branchSearchInput) branchSearchInput.value = '';
    modalBranchPage = 0;
    updateModalBranchTag();
    renderModalBranchPage();
    setTimeout(function () { if (branchSearchInput && typeof branchSearchInput.focus === 'function') branchSearchInput.focus(); }, 80);
  };

  window.openBranchModal = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    window.__initModalBranchView();
  };

  window.closeBranchModal = function () {
    if (!changeModal) changeModal = $('#modal-change-selection');
    if (changeModal) {
      changeModal.style.setProperty('display', 'none', 'important');
      changeModal.classList.remove('active');
    }
  };

  if (changeLink) {
    changeLink.onclick = window.openBranchModal;
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#app-change-selection-link')) {
      window.openBranchModal(e);
      return;
    }
    if (e.target.closest('#btn-close-change-modal') || e.target.closest('#btn-cancel-change-modal')) {
      window.closeBranchModal();
      return;
    }
  });

  if (branchSearchInput) {
    branchSearchInput.oninput = function () {
      modalBranchPage = 0;
      renderModalBranchPage();
    };
  }

  var closeBtn = $('#btn-close-change-modal');
  if (closeBtn) closeBtn.onclick = window.closeBranchModal;
  var cancelBtn = $('#btn-cancel-change-modal');
  if (cancelBtn) cancelBtn.onclick = window.closeBranchModal;

  var saveChangeBtn = $('#btn-save-change-modal');
  if (saveChangeBtn) {
    saveChangeBtn.onclick = function () {
      if (accSelect && accSelect.value) {
        S.acctType = accSelect.value;
        var acctGroup = $('[data-k="acctType"]');
        if (acctGroup) {
          paint(acctGroup);
        }
      }
      if (tempSelectedBranch && tempSelectedBranch.code) {
        S.branchCode = tempSelectedBranch.code;
        S.branchName = tempSelectedBranch.name;
      }
      // Update in Page 1 Form header
      var formBranchEl = $('#form-branch-display');
      if (formBranchEl) {
        formBranchEl.textContent = S.branchName + ' (' + S.branchCode + ')';
      }
      // Update in sticky left rail card
      var acbEl = $('#acb');
      if (acbEl) acbEl.textContent = S.branchName + ' (' + S.branchCode + ')';
      var acnEl = $('#acn');
      if (acnEl) acnEl.textContent = NAMES[S.acctType] || '';
      var acmEl = $('#acm');
      if (acmEl) acmEl.textContent = 'Minimum deposit ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';

      var dephint = $('#dephint');
      if (dephint) {
        dephint.textContent = 'Minimum deposit: ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';
      }

      update();
      saved();
      window.closeBranchModal();
      toast('Branch updated to: ' + S.branchName + ' (' + S.branchCode + ')');
    };
  }

  // =================================================================
  // DRAFT RESTORATION FROM DATABASE FIRST, THEN LOCALSTORAGE
  // =================================================================
  function populateFormFields() {
    $$('input.inp').forEach(function (inp) {
      if (S[inp.dataset.k] !== undefined) inp.value = S[inp.dataset.k];
    });
    $$('select.sel').forEach(function (sel) {
      if (S[sel.dataset.k] !== undefined) sel.value = S[sel.dataset.k];
    });
    $$('.bxs').forEach(function (g) {
      var k = g.dataset.k;
      var v = S[k] || '';
      if (v) {
        var inputs = $$('input', g);
        for (var i = 0; i < inputs.length; i++) {
          inputs[i].value = v[i] || '';
        }
      }
    });
    $$('.pills').forEach(function (g) {
      var k = g.dataset.k;
      if (S[k + '_other']) {
        var otherPill = $$('.pill', g).find(function (p) { return isOtherVal(p.dataset.v); });
        if (otherPill) {
          if (!otherPill.dataset.origText) otherPill.dataset.origText = otherPill.textContent;
          otherPill.textContent = 'Other: ' + S[k + '_other'];
          otherPill.setAttribute('title', S[k + '_other']);
        }
      }
      paint(g);
    });
    if (S.decl && $('#declc')) {
      $('#declc').checked = true;
    }
    if (S.deposit !== undefined && $('#dep')) {
      $('#dep').value = S.deposit;
      var depN = +S.deposit;
      updateDepositWords(depN);
    }
    if (S.pw && $('#pw')) {
      $('#pw').value = S.pw;
    }
    if (S.signature && $('#sigp')) {
      $('#sigp').style.opacity = 0;
      has = true;
    }
    $$('.slot').forEach(function (s) {
      var k = s.dataset.k;
      if (S[k]) {
        s.classList.add('on');
        var em = s.querySelector('em');
        if (em) em.textContent = S[k] + ' · encrypted';
      }
    });
    var formBranchEl = $('#form-branch-display');
    if (formBranchEl && S.branchName) {
      formBranchEl.textContent = S.branchName + ' (' + (S.branchCode || 'BOM-001') + ')';
    }
    var dephint = $('#dephint');
    if (dephint) {
      dephint.textContent = 'Minimum deposit: ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';
    }
  }

  // Load from Database
  (async function restoreDraft() {
    var loadedFromDb = false;
    try {
      var res = await fetch('/onboarding/draft/' + encodeURIComponent(num));
      if (res.ok) {
        var dbDraft = await res.json();
        if (dbDraft) {
          if (dbDraft.formData && Object.keys(dbDraft.formData).length > 0) {
            Object.assign(S, dbDraft.formData);
            loadedFromDb = true;
          }
          if (dbDraft.accountType) S.acctType = dbDraft.accountType;
          if (dbDraft.branchName) S.branchName = dbDraft.branchName;
          if (dbDraft.branchCode) S.branchCode = dbDraft.branchCode;
          if (dbDraft.applicant) {
            if (dbDraft.applicant.firstName && !S.firstName) S.firstName = dbDraft.applicant.firstName;
            if (dbDraft.applicant.lastName && !S.lastName) S.lastName = dbDraft.applicant.lastName;
          }
          loadedFromDb = true;
        }
      }
    } catch (e) {
      console.warn('Could not read draft from DB:', e);
    }

    if (!loadedFromDb) {
      try {
        var rawDraft = localStorage.getItem('nb_draft_' + num) || localStorage.getItem('nb_app_draft');
        if (rawDraft) {
          var parsed = JSON.parse(rawDraft);
          Object.assign(S, parsed);
        }
      } catch (e) {}
    }

    // Keep local cache synchronized with the authoritative draft state
    try {
      localStorage.setItem('nb_draft_' + num, JSON.stringify(S));
    } catch (_) {}

    // Populate DOM and update summary card
    populateFormFields();
    update();
  })();

  // Initial activation
  $$('.pg')[0].classList.add('on');
  show(0, 1);
};

// =================================================================
// BOOTSTRAP DEDICATED APPLICATION FORM ON LOAD
// =================================================================
function bootDedicatedApplicationForm() {
  var path = window.location.pathname;
  var params = new URLSearchParams(window.location.search);
  var appMatch = path.match(/APP-[0-9A-Za-z-]+/) || [params.get('app') || params.get('application') || params.get('id') || ''];
  var appNum = (appMatch && appMatch[0]) ? appMatch[0] : '';
  if (!appNum) {
    appNum = 'APP-2026-' + Math.floor(100000 + Math.random() * 900000);
  }

  var accType = params.get('type') || 'SAVINGS';
  var branchCode = params.get('branch') || 'BOM-001';
  var branchName = params.get('branchName') || 'Mumbai Main Branch';

  var appnoEl = document.getElementById('appno');
  if (appnoEl) appnoEl.textContent = appNum;

  // Clean URL: strictly show /open_account_customer/APP-2026-XXXXXX without query params
  try {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/open_account_customer/' + appNum);
    }
  } catch (_) {}

  if (typeof window.initUniformApplicationForm === 'function') {
    window.initUniformApplicationForm(appNum, accType, '', branchName, branchCode);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootDedicatedApplicationForm);
} else {
  bootDedicatedApplicationForm();
}
