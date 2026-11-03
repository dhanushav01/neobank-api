(function(){
  var $ = function(s, r) { return (r || document).querySelector(s); };
  var $$ = function(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Global branches dictionary
  var BRANCHES = [
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
    { name: 'London International Desk', code: 'LON-022', city: 'London, UK' }
  ];

  var MINS = { SAVINGS: 1000, CHECKING: 500, SALARY: 0, FIXED_DEPOSIT: 10000, MONEY_MARKET: 5000, NRI_EXPAT: 5000, STUDENT: 0, PENSION: 0, BSBDA: 0, OTHER: 0 };
  var NAMES = { SAVINGS: 'High-yield savings', CHECKING: 'Current / checking', SALARY: 'Corporate salary', FIXED_DEPOSIT: 'Fixed / term deposit', MONEY_MARKET: 'Money market / recurring', PENSION: 'Pension savings', NRI_EXPAT: 'NRI / foreign expat', STUDENT: 'Student / youth', BSBDA: 'Basic savings (BSBDA)', OTHER: 'Other' };
  var DESCS = {
    SAVINGS: 'Everyday digital savings with competitive interest and zero maintenance fees.',
    CHECKING: 'Full-featured checking for daily transactions, transfers, and debit payments.',
    SALARY: 'Corporate payroll account with zero minimum balance and premium lifestyle perks.',
    FIXED_DEPOSIT: 'High-yield locked term deposit with flexible tenures and guaranteed returns.',
    MONEY_MARKET: 'Liquid interest-bearing account with partial withdrawal and high yields.',
    NRI_EXPAT: 'Seamless cross-border banking with zero FX surcharge on foreign inward remittances.',
    STUDENT: 'Zero-fee youth account tailored for university students with exclusive student rewards.',
    PENSION: 'Senior citizen and pension account with priority doorstep banking assistance.'
  };

  // State
  var S = { appType: 'NEW', accCategory: 'NORMAL', form60: 'NO', acctType: 'SAVINGS', branchName: 'Mumbai Main Branch', branchCode: 'BOM-001' };
  var page = 0, view = 'form', num = '';

  // Theme support
  var currentTheme = 'dark';
  try {
    currentTheme = localStorage.getItem('nb_theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  } catch(e){}

  function applyTheme(th) {
    currentTheme = th;
    document.documentElement.setAttribute('data-theme', th);
    if (th === 'light') {
      document.body.classList.add('light-theme');
      $('#theme-icon').textContent = '☀️';
      $('#theme-text').textContent = 'Light';
    } else {
      document.body.classList.remove('light-theme');
      $('#theme-icon').textContent = '🌙';
      $('#theme-text').textContent = 'Dark';
    }
    try { localStorage.setItem('nb_theme', th); } catch(e){}
    if (window._reinitCanvas) window._reinitCanvas();
  }
  applyTheme(currentTheme);

  $('#theme-btn').onclick = function() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  // Zoom support
  var currentZoom = 100;
  try { currentZoom = parseInt(localStorage.getItem('nb_zoom') || '100', 10); } catch(e){}
  function applyZoom(z) {
    currentZoom = Math.min(130, Math.max(80, z));
    document.body.style.zoom = (currentZoom / 100);
    $('#zoom-lbl').textContent = currentZoom + '%';
    try { localStorage.setItem('nb_zoom', String(currentZoom)); } catch(e){}
  }
  applyZoom(currentZoom);
  $('#zoom-out-btn').onclick = function() { applyZoom(currentZoom - 10); };
  $('#zoom-in-btn').onclick = function() { applyZoom(currentZoom + 10); };

  // Toast
  function toast(m) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function(){ t.classList.remove('on'); }, 2400);
  }

  // Slug & Required Asterisk helper
  var slug = function(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); };
  var req = function(r){ return r ? '<i class="req" aria-hidden="true">*</i>' : ''; };

  /* Field builders */
  function bx(k,l,len,kind,r,o){
    o = o || {};
    var min = kind === 'N' ? len : 1, i, h = '';
    for (i = 0; i < len; i++) {
      h += '<input maxlength="1" inputmode="' + (kind === 'N' ? 'numeric' : 'text') + '" autocomplete="off" aria-label="' + l + ' character ' + (i+1) + '">';
    }
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="bxs" data-k="' + k + '" data-l="' + l + '" data-len="' + len + '" data-kind="' + kind + '" data-min="' + min + '"' + (o.sep ? ' data-sep' : '') + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-boxes">' + h + '</div></div>';
  }
  function dt(k,l,r){
    return bx(k,l,8,'N',r,{sep:1}).replace('</span>','<small style="color:var(--ti)"> DD MM YYYY</small></span>');
  }
  function rd(k,l,opts,r,cl){
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="pills" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' role="radiogroup" data-testid="app-' + k + '-options">' +
      opts.map(function(o){
        var a = Array.isArray(o) ? o : [o,o];
        return '<button type="button" class="pill" role="radio" data-v="' + a[0] + '" data-testid="app-' + k + '-' + slug(a[0]) + '-option">' + a[1] + '</button>';
      }).join('') + '</div></div>';
  }
  function ch(k,l,opts,r){
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><div class="pills" data-k="' + k + '" data-l="' + l + '" data-multi' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-options">' +
      opts.map(function(o){
        var a = Array.isArray(o) ? o : [o,o];
        return '<button type="button" class="pill" role="checkbox" data-v="' + a[0] + '" data-testid="app-' + k + '-' + slug(a[0]) + '-option">' + a[1] + '</button>';
      }).join('') + '</div></div>';
  }
  function tx(k,l,r,t){
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><input class="inp" type="' + (t||'text') + '" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-input"></div>';
  }
  function sl(k,l,opts,r){
    return '<div class="f"><span class="lb">' + l + req(r) + '</span><select class="sel" data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-select"><option value=""></option>' +
      opts.map(function(o){ return '<option>' + o + '</option>'; }).join('') + '</select></div>';
  }
  function fl(k,l,hint,r,cd){
    return '<label class="slot' + (cd ? ' cond off' : '') + '"' + (cd ? ' data-c="' + cd + '"' : '') + ' data-slot data-k="' + k + '" data-l="' + l + '"' + (r ? ' data-r' : '') + ' data-testid="app-' + k + '-slot">' +
      '<input type="file" accept=".pdf,.jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml,application/pdf" hidden><b>' + l + req(r) + '</b><span>' + hint + '</span><em>Choose a file</em><i class="pb"></i></label>';
  }
  function cd(c,h){ return '<div class="cond off" data-c="' + c + '">' + h + '</div>'; }

  var YN = ['YES','NO'], PFX = ['Mr.','Mrs.','Ms.','Dr.','Prof.','Other'];
  var OVD = [['PASSPORT','Passport'],['VOTER_ID','Voter ID'],['DRIVING_LICENSE','Driving licence'],['AADHAAR','Aadhaar'],['NREGA','NREGA job card'],['NPR','NPR letter'],['OTHER','Other OVD'],['SALARY_PROOF','Salary proof'],['STUDENT_PROOF','Student proof'],['PENSION_PROOF','Pension proof'],['NRI_PROOF','NRI proof'],['FUNDS_PROOF','Source of funds proof']];
  var today = new Date().toLocaleDateString('en-GB');

  var PAGES = [
    {h:'Tell us about yourself.',t:'Page 1: CIF & CKYC',s:[
     ['Form header & branch information','<div class="row"><div class="f"><span class="lb">Date</span><span class="fixed">' + today + '</span></div><div class="f"><span class="lb">Branch</span><span class="fixed" id="form-branch-display">Mumbai Main Branch (BOM-001)</span></div></div>' + bx('ckyc','CKYC number (if you have one)',14,'N',0) + bx('cif','CIF number (if you have one)',10,'N',0) + rd('appType','Application type',[['NEW','New account']],1) + rd('accCategory','Account category',[['NORMAL','Normal'],['SMALL','Small'],['MINOR','Minor'],['STAFF','Staff']],1)],
     ['1. Personal details (same as ID proof)',rd('namePrefix','Title',PFX,1) + bx('firstName','First name',20,'A',1) + bx('middleName','Middle name',20,'A',0) + bx('lastName','Last name',20,'A',1) + bx('prevName','Previous name, if any',20,'A',0) + dt('dob','Date of birth',1) + rd('gender','Gender',[['MALE','Male'],['FEMALE','Female'],['TRANSGENDER','Transgender']],1) + rd('marital','Marital status',[['MARRIED','Married'],['UNMARRIED','Unmarried'],['OTHERS','Others']],1) + rd('nationality','Nationality',[['IN','Indian'],['OTHERS','Others']],1) + bx('father','Father’s name',20,'A',1) + bx('mother','Mother’s name',20,'A',1) + bx('spouse','Spouse’s name, if married',20,'A',0) + cd('accCategory=MINOR',rd('guardianPrefix','Guardian title',PFX,1) + bx('guardian','Guardian’s name',20,'A',1) + rd('guardianRel','Guardian is',['Father','Mother','Legal Guardian'],1)) + rd('religion','Religion',['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Others'],1) + rd('category','Category',['General','OBC','SC','ST'],1) + rd('disability','Do you have a disability?',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + cd('disability=YES',ch('assist','Assistance you would like',['Braille Passbook','Talking ATM','Wheelchair Access','Doorstep Banking','Large Print'],0) + fl('disabCert','Disability certificate','PDF, JPG or PNG',0)) + rd('edu','Education',['Below SSC','SSC/HSC','Graduate','Post Graduate','Professional'],1)],
     ['2. Occupation & financial profile',rd('emp','Employment status',[['EMPLOYED','Employed'],['PRIVATE_SECTOR','Private sector'],['BUSINESS','Business'],['SELF_EMPLOYED','Self-employed'],['RETIRED','Retired'],['HOUSEWIFE','Homemaker'],['STUDENT','Student'],['OTHERS','Others']],1) + '<div class="row">' + tx('employer','Employer or business name',0) + tx('university','University or institution (students)',0) + '</div>' + rd('income','Annual income',['Below 1 Lakh','1-5 Lakh','5-10 Lakh','10-25 Lakh','Above 25 Lakh'],1) + rd('funds','Source of funds',['Salary','Business Income','Agriculture','Investments','Inheritance / Family','Professional Fees'],1)],
     ['3. Identification & tax information',cd('form60=NO',bx('pan','PAN',10,'X',1)) + rd('form60','Do you file Form 60 instead of PAN?',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + cd('form60=YES',fl('form60Doc','Form 60 document','PDF, JPG or PNG',1)) + bx('aadhaar','Aadhaar number',12,'N',1) + rd('pep','Politically exposed person?',[['NA','Not applicable'],['PEP','I am a PEP'],['RELATED','Related to a PEP']],1)],
     ['4. Contact details',bx('mobile','Mobile number',10,'N',1) + bx('altMobile','Alternate mobile',10,'N',0) + '<div class="row">' + tx('emailUser','Email (before the @)',1) + sl('emailDomain','Email domain',['gmail.com','yahoo.com','outlook.com','icloud.com'],1) + '</div>']]},
    {h:'Prove who you are.',t:'Page 2: KYC & OVD',s:[
     ['5. Proof of identity / address (OVD)',ch('ovd','Choose the documents you will upload',OVD,1) + '<div class="slots">' + OVD.map(function(o){return fl('ovd'+o[0],o[1],'PDF, JPG or PNG',1,'ovd='+o[0]);}).join('') + '</div><p class="hint">Supported formats: PDF, JPG, PNG, and SVG. Encrypted locally.</p>'],
     ['6. Address details',rd('addrType','Address type',[['RESIDENTIAL_BUSINESS','Residential and business'],['RESIDENTIAL','Residential'],['BUSINESS','Business'],['REGISTERED_OFFICE','Registered office']],1) + '<div class="row">' + tx('house','House or flat number',1) + tx('street','Street',1) + tx('landmark','Landmark',0) + tx('city','City',1) + tx('district','District',1) + tx('state','State',1) + '</div>' + bx('pincode','PIN code',6,'N',1) + rd('corrSame','Is your correspondence address the same?',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + cd('corrSame=NO',bx('corrPincode','Correspondence PIN code',6,'N',1) + tx('corrAddr','Correspondence address',1)) + ch('deemed','Deemed proof of address (optional)',[['UTILITY','Utility bill'],['PROPERTY_TAX','Property tax receipt'],['PENSION_ORDER','Pension order'],['GOVT_ACCOMMODATION','Govt. accommodation letter'],['LEAVE_LICENSE','Leave and licence']],0)],
     ['7. Applicant photograph & verification signature','<div class="row">' + fl('photo','Passport-size photograph','Plain background',1) + '<div class="f"><span class="lb">Signature' + req(1) + '</span><div class="sigw" data-k="signature" data-l="Signature" data-r data-testid="app-signature-pad"><canvas id="sig"></canvas><button type="button" class="ghost sm" id="sigclr" data-testid="app-signature-clear-button">Clear</button><p id="sigp">Draw your signature here</p></div></div></div>']]},
    {h:'Shape your account.',t:'Page 3: Account Form',s:[
     ['1. Type of account requested',rd('acctType','Account type',Object.keys(NAMES).map(function(k){return [k,NAMES[k]];}),1)],
     ['2. Mode of operation',rd('mode','Mode of operation',[['SELF_SINGLE','Self / single'],['EITHER_SURVIVOR','Either or survivor'],['FORMER_SURVIVOR','Former or survivor'],['JOINTLY','Jointly'],['MINOR_GUARDIAN','Minor with guardian']],1) + cd('mode=JOINTLY',tx('jointCount','Number of joint holders',1,'number'))],
     ['3. Services & channels required',rd('svcCheque','Cheque book',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + rd('svcDebit','Debit card',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + cd('svcDebit=YES',rd('cardScheme','Card scheme',[['RUPAY','RuPay'],['VISA','Visa'],['MASTERCARD','Mastercard']],1) + rd('cardFormat','Card format',[['BOTH','Both'],['VIRTUAL','Virtual'],['METAL','Metal']],1) + bx('cardName','Name on card',19,'A',1)) + rd('svcNet','Net banking',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + rd('svcMob','Mobile banking',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + rd('svcSms','SMS alerts',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1) + rd('svcStmt','E-statement',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1)],
     ['4. Fixed / recurring deposit instructions (only if applicable)',cd('acctType=FIXED_DEPOSIT|MONEY_MARKET',rd('fdPayout','Interest payout',['Monthly','Quarterly','On Maturity'],1) + rd('fdMaturity','On maturity',['Auto Renew','Credit to A/C'],1)) + '<p class="hint" id="fdn">Not needed for the account you chose.</p>'],
     ['5. Initial deposit / payment details','<div class="row"><div class="f"><span class="lb">Initial deposit (₹)' + req(1) + '</span><input class="inp" type="number" id="dep" min="0" data-testid="app-deposit-input"><p class="hint" id="dephint"></p></div><div class="f"><span class="lb">Amount in words</span><span class="fixed" id="words" style="display:block">—</span></div></div>' + rd('payMode','Payment mode',['Cash','Cheque / DD','Transfer from Existing Account'],1) + '<div class="f"><span class="lb">Online banking login password' + req(1) + '</span><input class="inp" type="password" id="pw" autocomplete="new-password" data-testid="app-password-input"><div class="meter"><i id="pwm"></i></div><p class="hint">At least 8 characters.</p></div>'],
     ['6. Joint applicant details (if joint account)',cd('mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR',bx('jName','Joint holder’s name',20,'A',1) + dt('jDob','Joint holder’s date of birth',1) + sl('jRel','Relationship',['Spouse','Parent','Child','Sibling','Other'],1)) + '<p class="hint" id="jn">Only needed for joint modes of operation.</p>']]},
    {h:'Sign off.',t:'Page 4: Declarations',s:[
     ['1. Nomination details',rd('nomination','Nomination',[['REGISTER','Register a nominee'],['DECLINE','Decline nomination']],1) + cd('nomination=REGISTER',rd('nomPrefix','Nominee title',PFX,1) + bx('nomName','Nominee’s name',20,'A',1) + sl('nomRel','Relationship',['Spouse','Parent','Child','Sibling','Other'],1) + rd('nomPassbook','Print nominee on passbook',YN.map(function(x){return [x,x==='YES'?'Yes':'No'];}),1))],
     ['2. FATCA / CRS declaration',rd('fatca','Tax residency',[['INDIA_ONLY','India only'],['OUTSIDE_INDIA','Outside India as well']],1) + cd('fatca=OUTSIDE_INDIA','<div class="row">' + tx('taxCountry','Country of tax residence',1) + tx('tin','Tax identification number',1) + '</div>')],
     ['3. Final declaration & signatures','<label class="chk" data-k="decl" data-l="Declaration" data-r data-testid="app-declaration-checkbox"><input type="checkbox" id="declc"><i><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></i><span>I declare that the information I have given is true and complete, and I understand that my account is opened only after the bank approves my application. The signature I drew on Page 2 is mine.<i class="req">*</i></span></label><p class="hint">Date: ' + today + '</p>']]}
  ];

  /* DOM Builders */
  $('#pages').innerHTML = PAGES.map(function(p,i){
    return '<div class="pg" data-pg="' + i + '"><div class="shead"><span>NeoBank · Uniform account opening form</span><span>Page ' + (i+1) + ' of 4</span></div>' +
      p.s.map(function(s,j){
        var sc = /Joint applicant/.test(s[0]) ? ' cond off" data-c="mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR' : '';
        return '<section class="card sec' + sc + '" data-sec="' + i + '-' + j + '" data-testid="app-section-' + slug(s[0]) + '"><h2>' + s[0] + '</h2><span class="stamp">COMPLETE</span>' + s[1] + '</section>';
      }).join('') + '</div>';
  }).join('');

  // Tabs: ONLY 4 pages (Requirement 7: Remove "View all 4 pages")
  $('#tabs').innerHTML = PAGES.map(function(p,i){
    return '<button type="button" class="tab" data-tab="' + i + '" data-testid="app-tab-page-' + (i+1) + '-button">' + p.t + '</button>';
  }).join('');

  // Draft Autosave & Restore (Requirement 2)
  var sv;
  function saved() {
    var s = $('#save');
    if (s) {
      s.classList.add('busy');
      s.querySelector('em').textContent = 'Saving…';
      clearTimeout(sv);
      sv = setTimeout(function(){
        s.classList.remove('busy');
        s.querySelector('em').textContent = 'Draft saved';
      }, 700);
    }
    if (num) {
      try {
        localStorage.setItem('nb_draft_' + num, JSON.stringify(S));
      } catch(e){}
    }
  }

  function act(e) { return !e.closest('.cond.off'); }
  function reqs(root) { return $$((root||'') + ' [data-r]').filter(act); }
  function val(e) {
    var v = S[e.dataset.k];
    if (e.classList.contains('bxs')) return !!v && v.length >= +e.dataset.min;
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
  }

  function cond() {
    $$('.cond').forEach(function(c){
      var p = c.dataset.c.split('='), vs = p[1].split('|'), v = S[p[0]];
      var on = Array.isArray(v) ? v.some(function(x){ return vs.indexOf(x) > -1; }) : vs.indexOf(v) > -1;
      c.classList.toggle('off', !on);
    });
    var fdn = $('#fdn');
    if (fdn) {
      var acctCond = $('[data-c^="acctType"]');
      fdn.hidden = acctCond ? !acctCond.classList.contains('off') : false;
    }
    var jn = $('#jn');
    if (jn) {
      var modeCond = $('[data-c^="mode=JOINTLY|"]');
      jn.hidden = modeCond ? !modeCond.classList.contains('off') : false;
    }
  }

  // Update progress tracking (Requirement 7: Clean dual percentage progress)
  function update() {
    cond();
    var all = reqs(), n = all.filter(val).length, p = all.length ? Math.round(n / all.length * 100) : 0;
    $('#pct').textContent = p + '%';
    $('#rv').style.strokeDashoffset = 176 - (176 * p / 100);

    $$('.sec').forEach(function(s){
      var r = reqs('.sec[data-sec="' + s.dataset.sec + '"]');
      s.classList.toggle('ok', r.length > 0 && r.every(val));
    });

    // Current page progress metric
    var pageReqs = reqs('.pg.on');
    var pageDone = pageReqs.filter(val).length;
    var pageTotal = pageReqs.length;
    var pagePct = pageTotal ? Math.round(pageDone / pageTotal * 100) : 100;
    
    $('#pg-name-lbl').textContent = 'Page ' + (page + 1) + ' of 4';
    $('#pg-pct-lbl').textContent = pagePct + '%';
    $('#pgm').style.width = pagePct + '%';
    $('#pg-items-lbl').textContent = pageDone + ' of ' + pageTotal + ' items completed';

    var left = pageReqs.filter(function(e){ return !val(e); }).length;
    if (view === 'form') {
      $('#left').textContent = left ? left + ' required ' + (left === 1 ? 'item' : 'items') + ' left on this page' : 'This page is complete';
    }

    $('#acn').textContent = NAMES[S.acctType] || S.acctType;
    $('#acm').textContent = 'Minimum deposit ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';
    var acbEl = $('#acb');
    if (acbEl) acbEl.textContent = S.branchName + ' (' + S.branchCode + ')';
    var formBr = $('#form-branch-display');
    if (formBr) formBr.textContent = S.branchName + ' (' + S.branchCode + ')';
  }

  function steps(n) {
    $$('#steps li').forEach(function(l,i){
      l.className = (i + 1 < n) ? 'fin' : (i + 1 === n ? 'cur' : '');
    });
  }

  function done(el, cls) {
    el.addEventListener('animationend', function f(e){
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
          done(old, function(){ old.classList.remove('on','out','outb'); });
        }
      }
      nw.classList.add('on');
      if (!reduce) {
        nw.classList.add(dir > 0 ? 'in' : 'inb');
        done(nw, function(){ nw.classList.remove('in','inb'); });
      }
    }

    $('#title').textContent = PAGES[i].h;
    steps(2);
    $$('.tab[data-tab]').forEach(function(t){
      t.classList.toggle('on', +t.dataset.tab === i);
    });
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

    $('#rev').innerHTML = PAGES.map(function(p, i){
      var secs = $$('.pg[data-pg="' + i + '"] .sec').filter(act).map(function(s){
        var rows = $$('[data-k]', s).filter(act).map(function(e){
          var v = S[e.dataset.k];
          if (v === true) v = 'Provided';
          if (Array.isArray(v)) v = v.join(', ');
          if (e.dataset.k === 'pw' || e.id === 'pw') v = '••••••••';
          return '<div><dt>' + e.dataset.l + '</dt><dd>' + (v ? String(v).replace(/</g,'&lt;') : 'Not provided') + '</dd></div>';
        }).join('');
        return rows ? '<h4>' + s.querySelector('h2').textContent + '</h4><dl>' + rows + '</dl>' : '';
      }).join('');
      return '<section class="card"><h3>' + p.t + '<button class="ghost sm" data-edit="' + i + '" data-testid="app-edit-page-' + (i+1) + '-button">Edit</button></h3>' + secs + '</section>';
    }).join('');

    $('#left').textContent = 'Last look before you submit.';
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  function finish() {
    view = 'done';
    $('#rev').hidden = true;
    $('#done').hidden = false;
    $('#bar').hidden = true;
    steps(5);
    $('#title').textContent = 'Application submitted.';
    $('#no2').textContent = num;
    try {
      var appPayload = {
        applicationNumber: num,
        accountType: S.acctType || 'SAVINGS',
        branchName: S.branchName,
        branchCode: S.branchCode,
        formData: S,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      };
      localStorage.setItem('nb_app_' + num, JSON.stringify(appPayload));
      fetch('/api/v1/onboarding/apply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(appPayload)
      }).catch(function(){});
    } catch(e){}
    scrollTo({ top: 0, behavior: 'auto' });
  }

  function bad(list) {
    list.forEach(function(e){
      e.classList.add('bad');
      setTimeout(function(){ e.classList.remove('bad'); }, 2600);
    });
    var f = list[0], c = f.closest('.sec');
    (c || f).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (c) {
      c.classList.remove('shake');
      void c.offsetWidth;
      c.classList.add('shake');
    }
  }

  $('#next').onclick = function() {
    if (view === 'form') {
      var m = reqs('.pg.on').filter(function(e){ return !val(e); });
      if (m.length) {
        bad(m);
        toast('Please complete the highlighted mandatory items');
        return;
      }
      page < 3 ? show(page + 1, 1) : review();
    } else if (view === 'review') {
      var a = reqs().filter(function(e){ return !val(e); });
      if (a.length) {
        toast('Some items are missing');
        return;
      }
      finish();
    }
  };

  $('#back').onclick = function() {
    if (view === 'review') show(3, -1);
    else if (page > 0) show(page - 1, -1);
  };

  // Delegated interactions: Radio pills, Checkboxes, Tabs, "Other" inputs (Requirement 4)
  function pick(g, v) {
    var k = g.dataset.k;
    var isOther = /^(other|others)$/i.test(v);

    if (g.hasAttribute('data-multi')) {
      var a = S[k] || [], ix = a.indexOf(v);
      ix > -1 ? a.splice(ix, 1) : a.push(v);
      S[k] = a.slice();
    } else {
      S[k] = v;
    }
    paint(g);

    // Requirement 4: If user clicks "Other" / "Others", show inline input with check (✓) and cancel (✕)
    var otherWrap = $('#other-wrap-' + k);
    if (isOther) {
      if (!otherWrap) {
        otherWrap = document.createElement('div');
        otherWrap.id = 'other-wrap-' + k;
        otherWrap.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:10px;width:100%;animation:popModal .25s ease;';
        otherWrap.innerHTML = '<input class="inp" type="text" placeholder="Please specify ' + (g.dataset.l || 'other') + '..." style="flex:1;height:40px;font-size:0.88rem;" id="other-input-' + k + '">' +
          '<button type="button" class="btn sm" id="other-save-' + k + '" title="Save custom specification" style="padding:6px 14px;border-radius:10px;">✓</button>' +
          '<button type="button" class="ghost sm" id="other-cancel-' + k + '" title="Cancel" style="padding:6px 12px;border-radius:10px;">✕</button>';
        g.parentNode.appendChild(otherWrap);

        $('#other-save-' + k).onclick = function(ev) {
          ev.stopPropagation();
          var customVal = ($('#other-input-' + k).value || '').trim();
          if (customVal) {
            S[k] = customVal;
            toast('Custom value saved: ' + customVal);
          }
          otherWrap.style.display = 'none';
          saved();
          update();
        };

        $('#other-cancel-' + k).onclick = function(ev) {
          ev.stopPropagation();
          otherWrap.style.display = 'none';
          S[k] = '';
          paint(g);
          saved();
          update();
        };
      } else {
        otherWrap.style.display = 'flex';
      }
      var inp = $('#other-input-' + k);
      if (inp) {
        inp.value = (S[k] && S[k] !== v) ? S[k] : '';
        inp.focus();
      }
    } else if (otherWrap) {
      otherWrap.style.display = 'none';
    }
  }

  function paint(g) {
    var v = S[g.dataset.k];
    $$('.pill', g).forEach(function(p){
      var isOtherBtn = /^(other|others)$/i.test(p.dataset.v);
      var on = Array.isArray(v) ? v.indexOf(p.dataset.v) > -1 : (v === p.dataset.v || (isOtherBtn && !!v && !$$('.pill', g).some(function(otherP){ return !/^(other|others)$/i.test(otherP.dataset.v) && otherP.dataset.v === v; })));
      p.classList.toggle('on', !!on);
      p.setAttribute('aria-checked', !!on);
    });
  }

  document.addEventListener('click', function(e){
    var t = e.target, x;
    if (x = t.closest('[data-tab]')) {
      show(+x.dataset.tab);
      return;
    }
    if (x = t.closest('[data-edit]')) {
      show(+x.dataset.edit, -1);
      return;
    }
    if (x = t.closest('.pill')) {
      pick(x.parentNode, x.dataset.v);
      saved();
      update();
      return;
    }
  });

  // Box inputs
  function collect(g) {
    var s = $$('input', g).map(function(i){ return i.value || ' '; }).join('').replace(/\s+$/, '');
    S[g.dataset.k] = s;
    saved();
    update();
  }
  function clean(g, v) {
    var k = g.dataset.kind;
    return k === 'N' ? v.replace(/\D/g, '') : k === 'A' ? v.replace(/[^A-Za-z ]/g, '').toUpperCase() : v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  function setBoxes(g, str) {
    str = clean(g, str || '');
    $$('input', g).forEach(function(i, n){ i.value = str[n] || ''; });
    collect(g);
  }

  document.addEventListener('input', function(e){
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
      var valNum = +t.value, m = MINS[S.acctType] || 0;
      S.deposit = (t.value !== '' && valNum >= m) ? valNum : '';
      $('#dephint').className = 'hint' + (t.value !== '' && valNum < m ? ' err' : '');
      $('#dephint').textContent = t.value !== '' && valNum < m ? 'The minimum deposit for this account is ₹ ' + m.toLocaleString('en-IN') + '.00.' : 'Minimum deposit: ₹ ' + m.toLocaleString('en-IN') + '.00';
      $('#words').textContent = valNum > 0 ? 'Rupees ' + words(valNum) + ' only' : '—';
    } else if (t.id === 'pw') {
      var v = t.value, sc = (v.length > 7) + (/[A-Z]/.test(v) && /[a-z]/.test(v)) + (/\d/.test(v)) + (/[^A-Za-z0-9]/.test(v));
      $('#pwm').style.width = (v ? Math.max(1, sc) * 25 : 0) + '%';
      S.pw = v.length >= 8 ? v : '';
    } else if (t.dataset && t.dataset.k && !t.closest('.slot')) {
      S[t.dataset.k] = t.value;
    }
    saved();
    update();
  });

  document.addEventListener('change', function(e){
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

  document.addEventListener('keydown', function(e){
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

  document.addEventListener('paste', function(e){
    var t = e.target, g = t.closest && t.closest('.bxs');
    if (!g) return;
    e.preventDefault();
    var v = clean(g, (e.clipboardData || window.clipboardData).getData('text'));
    var is = $$('input', g), s = is.indexOf(t);
    v.split('').forEach(function(c, n){ if (is[s + n]) is[s + n].value = c; });
    collect(g);
  });

  function autoCard() {
    var g = $('[data-k="cardName"]'), f = S.firstName || '', l = S.lastName || '';
    if (g && (f || l)) {
      var full = (f + ' ' + l).trim().slice(0, 19);
      $$('input', g).forEach(function(i, n){ i.value = full[n] || ''; });
      S.cardName = full;
    }
  }

  function words(n) {
    var o = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    var t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function b(x){ return x < 20 ? o[x] : t[Math.floor(x/10)] + (x%10 ? ' ' + o[x%10] : ''); }
    function h(x){ return (x > 99 ? o[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' ' : '') : '') + (x%100 ? b(x%100) : ''); }
    var r = [], c = Math.floor(n/1e7), l = Math.floor(n%1e7/1e5), th = Math.floor(n%1e5/1e3), rest = n%1e3;
    if (c) r.push(h(c) + ' Crore');
    if (l) r.push(b(l) + ' Lakh');
    if (th) r.push(b(th) + ' Thousand');
    if (rest) r.push(h(rest));
    return r.join(' ');
  }

  // File Upload with Validation (Requirement 5: PDF, JPG, PNG, SVG only)
  function attach(s, name, file) {
    s.classList.add('on');
    var em = s.querySelector('em');
    em.textContent = 'Encrypting…';
    setTimeout(function(){
      em.textContent = name + ' · encrypted';
    }, reduce ? 0 : 900);
    S[s.dataset.k] = name;
    if (file && s.dataset.k === 'photo' && /^image/.test(file.type)) {
      var r = new FileReader();
      r.onload = function(){
        var im = s.querySelector('img') || s.appendChild(document.createElement('img'));
        im.src = r.result;
        im.alt = 'Your photograph';
      };
      r.readAsDataURL(file);
    }
    saved();
    update();
  }

  $$('.slot').forEach(function(s){
    var inp = s.querySelector('input');
    inp.onchange = function() {
      var file = this.files[0];
      if (!file) return;
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      var allowed = ['pdf', 'jpg', 'jpeg', 'png', 'svg'];
      var allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowed.includes(ext) && !allowedMimes.includes(file.type)) {
        toast('Validation error: only PDF, JPG, PNG, or SVG are permitted');
        this.value = '';
        s.classList.add('bad');
        setTimeout(function(){ s.classList.remove('bad'); }, 2600);
        return;
      }
      attach(s, file.name, file);
    };
  });

  // Signature Canvas
  var cv = $('#sig'), cx = cv ? cv.getContext('2d') : null, dr = false, has = false;
  function fit() {
    if (!cv) return;
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
  if (cv) {
    cv.onpointerdown = function(e) {
      dr = true;
      cv.setPointerCapture(e.pointerId);
      var p = pt(e);
      cx.beginPath();
      cx.moveTo(p[0], p[1]);
      $('#sigp').style.opacity = 0;
    };
    cv.onpointermove = function(e) {
      if (!dr) return;
      var p = pt(e);
      cx.lineTo(p[0], p[1]);
      cx.stroke();
      has = true;
    };
    cv.onpointerup = function() {
      dr = false;
      if (has) {
        S.signature = 'Signed';
        saved();
        update();
      }
    };
    $('#sigclr').onclick = function() {
      has = false;
      cx.clearRect(0, 0, cv.width, cv.height);
      S.signature = '';
      $('#sigp').style.opacity = 1;
      update();
    };
  }

  // Tilt on Account Card
  var ac = $('#acct');
  if (ac && !reduce && matchMedia('(hover:hover)').matches) {
    ac.addEventListener('pointermove', function(e){
      var r = ac.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ac.style.transform = 'perspective(700px) rotateY(' + (x * 16) + 'deg) rotateX(' + (-y * 16) + 'deg)';
    });
    ac.addEventListener('pointerleave', function(){ ac.style.transform = ''; });
  }

  // Particle Canvas Background
  var c = $('#fx').getContext('2d'), P = [], mx = -999, my = -999, W, H;
  function sp(p) {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.s = .6 + Math.random() * 1.1;
    p.h = Math.random() < .2;
    return p;
  }
  function sz() {
    var d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    $('#fx').width = W * d;
    $('#fx').height = H * d;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = currentTheme === 'light' ? '#f5f8fc' : '#04060b';
    c.fillRect(0, 0, W, H);
    P = [];
    for (var i = 0; i < (W < 700 ? 40 : 90); i++) P.push(sp({}));
  }
  window._reinitCanvas = sz;
  addEventListener('resize', sz);
  sz();
  addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; }, { passive: true });
  (function f(t){
    requestAnimationFrame(f);
    if (document.hidden) return;
    c.fillStyle = currentTheme === 'light' ? 'rgba(245,248,252,.12)' : 'rgba(4,6,11,.09)';
    c.fillRect(0, 0, W, H);
    P.forEach(function(p){
      var a = Math.sin(p.x * .0028 + t * .00016) * 2.4 + Math.cos(p.y * .0035 - t * .00013) * 2.4;
      var d = Math.hypot(mx - p.x, my - p.y);
      if (d < 160) a += (1 - d / 160) * 2.2;
      var ox = p.x, oy = p.y;
      p.x += Math.cos(a) * p.s * 1.2;
      p.y += Math.sin(a) * p.s * 1.2;
      if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) { sp(p); return; }
      c.strokeStyle = p.h ? (currentTheme === 'light' ? 'rgba(0,180,100,.5)' : 'rgba(0,245,155,.4)') : (currentTheme === 'light' ? 'rgba(70,90,140,.18)' : 'rgba(190,215,255,.12)');
      c.beginPath();
      c.moveTo(ox, oy);
      c.lineTo(p.x, p.y);
      c.stroke();
    });
  })(0);

  // In-place Change Modal (Requirement 3)
  var changeBtn = $('#change-acct-btn');
  var changeModal = $('#change-modal');
  var modalAcctSel = $('#modal-acct-select');
  var modalBranchSel = $('#modal-branch-select');

  if (changeBtn && changeModal) {
    // Populate modal selects
    modalAcctSel.innerHTML = Object.keys(NAMES).map(function(k){
      return '<option value="' + k + '">' + NAMES[k] + ' (Min ₹' + (MINS[k]||0).toLocaleString('en-IN') + ')</option>';
    }).join('');
    modalBranchSel.innerHTML = BRANCHES.map(function(b, idx){
      return '<option value="' + idx + '">' + b.name + ' (' + b.code + ' - ' + b.city + ')</option>';
    }).join('');

    changeBtn.onclick = function() {
      modalAcctSel.value = S.acctType || 'SAVINGS';
      var foundBrIdx = BRANCHES.findIndex(function(b){ return b.code === S.branchCode; });
      modalBranchSel.value = foundBrIdx > -1 ? foundBrIdx : 0;
      changeModal.style.display = 'flex';
    };

    $('#modal-close-btn').onclick = $('#modal-cancel-btn').onclick = function() {
      changeModal.style.display = 'none';
    };

    $('#modal-save-btn').onclick = function() {
      S.acctType = modalAcctSel.value;
      var chosenBr = BRANCHES[modalBranchSel.value] || BRANCHES[0];
      S.branchName = chosenBr.name;
      S.branchCode = chosenBr.code;

      $('#acn').textContent = NAMES[S.acctType] || S.acctType;
      $('#acb').textContent = S.branchName + ' (' + S.branchCode + ')';
      $('#acm').textContent = 'Minimum deposit ₹ ' + (MINS[S.acctType] || 0).toLocaleString('en-IN') + '.00';
      var formBr = $('#form-branch-display');
      if (formBr) formBr.textContent = S.branchName + ' (' + S.branchCode + ')';

      changeModal.style.display = 'none';
      saved();
      update();
      toast('Account type & branch updated without regenerating reference number');
    };
  }

  // Restore draft state from localStorage (Requirement 2)
  function restoreDraftData() {
    if (!num) return;
    try {
      var raw = localStorage.getItem('nb_draft_' + num);
      if (raw) {
        var d = JSON.parse(raw);
        for (var k in d) { S[k] = d[k]; }
      }
    } catch(e){}

    // Restore DOM inputs from S
    $$('[data-k]').forEach(function(el){
      var k = el.dataset.k;
      if (S[k] !== undefined) {
        if (el.classList.contains('bxs')) {
          setBoxes(el, S[k]);
        } else if (el.classList.contains('pills')) {
          paint(el);
        } else if (el.matches('select')) {
          el.value = S[k];
        } else if (el.matches('input.inp')) {
          el.value = S[k];
        } else if (el.classList.contains('slot')) {
          el.classList.add('on');
          var em = el.querySelector('em');
          if (em) em.textContent = S[k] + ' · saved';
        }
      }
    });

    if (S.signature && cv) {
      has = true;
      $('#sigp').style.opacity = 0;
      cx.beginPath();
      cx.moveTo(30, 90);
      cx.bezierCurveTo(60, 20, 90, 20, 100, 90);
      cx.bezierCurveTo(110, 130, 150, 40, 190, 70);
      cx.bezierCurveTo(215, 90, 240, 60, 270, 80);
      cx.stroke();
    }

    if (S.deposit && $('#dep')) {
      $('#dep').value = S.deposit;
      $('#words').textContent = 'Rupees ' + words(S.deposit) + ' only';
    }
    if (S.pw && $('#pw')) {
      $('#pw').value = S.pw;
      $('#pwm').style.width = '100%';
    }
    if ($('#declc')) $('#declc').checked = !!S.decl;
  }

  // Initialize Uniform Application Form (Step 2)
  function initApplicationForm(appNumber) {
    num = appNumber;
    window.currentApplicationNumber = num;
    try { localStorage.setItem('nb_app_ref', num); } catch(e){}

    $('#start-screen').style.display = 'none';
    $('#app-main-wrap').style.display = 'block';
    $('#bar').style.display = 'flex';

    // Application Reference Number Decipher Effect
    var el = $('#appno');
    if (el) {
      if (reduce) {
        el.textContent = num;
      } else {
        var n = 0, c = '0123456789';
        var iv = setInterval(function(){
          n++;
          el.textContent = num.split('').map(function(ch, i){
            return (i >= 9 && i >= (n / 2 + 3)) ? c[Math.floor(Math.random() * 10)] : ch;
          }).join('');
          if (n > 26) {
            clearInterval(iv);
            el.textContent = num;
          }
        }, 45);
      }
    }

    $('#copy').onclick = function() {
      try {
        navigator.clipboard.writeText(num).then(function(){ toast('Reference copied: ' + num); }, function(){ toast(num); });
      } catch(e) { toast(num); }
    };

    restoreDraftData();
    $$('.pg')[0].classList.add('on');
    show(0, 1);
  }

  // Initialize Step 1 Start Selection Screen (Requirement 1)
  function initStartScreen() {
    $('#start-screen').style.display = 'block';
    $('#app-main-wrap').style.display = 'none';
    $('#bar').style.display = 'none';

    var selectedType = 'SAVINGS';
    var selectedBranch = BRANCHES[0];

    // Populate Category Grid
    var catGrid = $('#cat-grid');
    catGrid.innerHTML = Object.keys(NAMES).map(function(k){
      return '<div class="cat-card' + (k === selectedType ? ' selected' : '') + '" data-type="' + k + '">' +
        '<b>' + NAMES[k] + '</b>' +
        '<span>' + (DESCS[k] || 'Complete digital account opening.') + '</span>' +
        '<em>Min deposit ₹ ' + (MINS[k]||0).toLocaleString('en-IN') + '.00</em>' +
      '</div>';
    }).join('');

    catGrid.onclick = function(e) {
      var card = e.target.closest('.cat-card');
      if (!card) return;
      $$('.cat-card', catGrid).forEach(function(c){ c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedType = card.dataset.type;
    };

    // Populate Branch Grid
    var brGrid = $('#branch-grid');
    brGrid.innerHTML = BRANCHES.map(function(b, idx){
      return '<div class="branch-card' + (idx === 0 ? ' selected' : '') + '" data-idx="' + idx + '">' +
        '<b>' + b.name + '</b>' +
        '<small>' + b.code + ' · ' + b.city + '</small>' +
      '</div>';
    }).join('');

    brGrid.onclick = function(e) {
      var card = e.target.closest('.branch-card');
      if (!card) return;
      $$('.branch-card', brGrid).forEach(function(c){ c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedBranch = BRANCHES[+card.dataset.idx];
    };

    // Continue to application button
    $('#start-continue-btn').onclick = function() {
      var genNum = 'APP-2026-' + (100000 + Math.floor(Math.random() * 899999));
      S.acctType = selectedType;
      S.branchName = selectedBranch.name;
      S.branchCode = selectedBranch.code;

      try {
        localStorage.setItem('nb_draft_' + genNum, JSON.stringify(S));
      } catch(e){}

      // Transition URL to /open_account_customer/APP-2026-XXXXXX cleanly
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '/open_account_customer/' + genNum);
      }
      initApplicationForm(genNum);
    };
  }

  // Routing inspection on load (Requirement 1)
  var pathApp = (location.pathname.match(/APP-[0-9A-Za-z-]+/) || [])[0];
  var qApp = (new URLSearchParams(location.search).get('app') || new URLSearchParams(location.search).get('resume') || '');

  if (pathApp || qApp) {
    initApplicationForm(pathApp || qApp);
  } else {
    initStartScreen();
  }

})();