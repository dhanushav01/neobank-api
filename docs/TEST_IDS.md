# NeoBank Test ID Catalog (`data-testid`)

All test IDs strictly adhere to the kebab-case `area-element-type` specification and use `-button` (never `-btn`).

## Landing Page (`home.html`)

### Global Header & Accessibility Navigation
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `home-demo-notice` | `<div>` | Top regulatory demo sandbox warning |
| `home-nav-brand-link` | `<a>` | NeoBank home brand identity link |
| `home-nav-controls` | `<div>` | Container for header accessibility and theme controls |
| `home-nav-theme-button` | `<button>` | Dark and Light theme toggle button |
| `home-nav-zoom-controls` | `<div>` | Page zoom controls (minus, reset 100%, plus) |
| `home-nav-lang-container` | `<div>` | Custom searchable language dropdown container |
| `home-nav-translate-element` | `<div>` | Background Google Translate engine element |

### Hero Chapter
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `home-hero-section` | `<section>` | Full-bleed monolith hero section |
| `home-hero-title` | `<h1>` | Kinetic display typography title ("Your money, moving.") |
| `home-hero-subtitle` | `<p>` | Contextual lede paragraph |
| `home-hero-explore-button` | `<a>` | Primary explore button smoothly scrolling to `#start` starting pathways |
| `home-hero-card` | `<div>` | 3D interactive titanium debit card scene container |
| `home-hero-balance-text` | `<strong>` | Animated live balance counter element |

### Pinned Scroll Stage
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `home-stage-section` | `<section>` | Pinned 380vh scroll storytelling stage |
| `home-stage-open-chapter` | `<div>` | Chapter 1: "Open it online." |
| `home-stage-move-chapter` | `<div>` | Chapter 2: "Move it anywhere." |
| `home-stage-freeze-chapter` | `<div>` | Chapter 3: "Freeze it in a tap." |
| `home-stage-sent-text` | `<div>` | Dynamic transfer notification pill ("Sent to Maya R.: $240.00") |
| `home-stage-balance-text` | `<strong>` | Stage card dynamic balance display |

### CTA Chapter ("Where are you starting?")
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `home-cta-section` | `<section>` | Pathways navigation section |
| `home-cta-open-account-link` | `<a>` | Row 1: "New here" with mint hover wipe |
| `home-cta-signin-link` | `<a>` | Row 2: "Already a customer" |
| `home-cta-track-link` | `<a>` | Row 3: "Mid-application" |

### Footer
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `home-footer-notice` | `<footer>` | Sandbox environment and FDIC disclaimer notice |


## Open Account Start Page (`open_account_customer.html`)

### Global Header & Accessibility Navigation
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `openstart-demo-notice` | `<div>` | Regulatory sandbox disclaimer banner |
| `openstart-nav-brand-link` | `<a>` | NeoBank home link |
| `openstart-nav-controls` | `<div>` | Container for theme toggle, zoom controls, and language dropdown |
| `openstart-nav-theme-button` | `<button>` | Dark and Light theme toggle button |
| `openstart-nav-zoom-controls` | `<div>` | Page zoom controls (minus, reset 100%, plus) |
| `openstart-nav-lang-container` | `<div>` | Custom searchable multi-language dropdown mount target |
| `openstart-nav-translate-element` | `<div>` | Background translation engine element |
| `openstart-nav-track-link` | `<a>` | Fast direct link to track existing application |
| `openstart-nav-signin-link` | `<a>` | Direct link to online banking login portal |

### Hero Chapter
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `openstart-hero-section` | `<section>` | Full-bleed kinetic hero monolith |
| `openstart-hero-title` | `<h1>` | Syne display typography ("Open your bank account in minutes.") |
| `openstart-hero-start-button` | `<a>` | Primary action button smoothly scrolling to `#start` |
| `openstart-hero-resume-button` | `<a>` | Ghost action button navigating to `/existing_application` |

### Pinned Scroll Storytelling Stage
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `openstart-stage-section` | `<section>` | Pinned 420vh scroll stage container |
| `openstart-stage-details-chapter` | `<div>` | Chapter 1: "Tell us who you are." |
| `openstart-stage-id-chapter` | `<div>` | Chapter 2: "Show us your ID." |
| `openstart-stage-card-chapter` | `<div>` | Chapter 3: "Pick your card." |
| `openstart-stage-sign-chapter` | `<div>` | Chapter 4: "Sign on screen." |
| `openstart-stage-review-chapter` | `<div>` | Chapter 5: "We review, you’re in." |
| `openstart-pane-details` | `<div>` | Animated personal details line items |
| `openstart-pane-id` | `<div>` | Encrypted document upload drop animation |
| `openstart-pane-card` | `<div>` | 3D mini rotating Titanium debit card |
| `openstart-pane-sign` | `<div>` | Animated dynamic SVG signature drawing |
| `openstart-pane-review` | `<div>` | Application review stages indicator |

### Account & Branch Selection Section (`#start`)
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `start-pick-section` | `<section>` | Main interactive onboarding selection section |
| `start-category-everyday` | `<div>` | Category 1: Everyday / Transactional accordion |
| `start-category-everyday-button` | `<button>` | Everyday category accordion expand button |
| `start-account-savings-button` | `<button>` | Subtype 1: High-yield savings with handy document checklist |
| `start-account-checking-button` | `<button>` | Subtype 2: Current / checking account |
| `start-account-salary-button` | `<button>` | Subtype 3: Corporate salary account |
| `start-category-longterm` | `<div>` | Category 2: Long-Term / Investment accordion |
| `start-category-longterm-button` | `<button>` | Long-Term category accordion expand button |
| `start-account-fixed-deposit-button` | `<button>` | Subtype 4: Fixed / term deposit |
| `start-account-money-market-button` | `<button>` | Subtype 5: Money market / recurring deposit |
| `start-category-specialized` | `<div>` | Category 3: Specialized / Cross-Border accordion |
| `start-category-specialized-button` | `<button>` | Specialized category accordion expand button |
| `start-account-nri-expat-button` | `<button>` | Subtype 6: NRI / foreign expat global account |
| `start-account-student-button` | `<button>` | Subtype 7: Student / youth advantage |
| `start-account-pension-button` | `<button>` | Subtype 8: Pension savings account |
| `start-requirements-panel` | `<div>` | Dynamic panel revealing eligibility facts, requirements, and required documents |
| `start-branch-step` | `<div>` | Home branch selection container |
| `start-branch-input` | `<input>` | Real-time searchable branch filter input |
| `start-branch-pagination` | `<div>` | Word-based pagination bar (One -> Six) with previous/next controls |
| `start-eligibility-step` | `<div>` | Eligibility confirmation container |
| `start-eligibility-checkbox` | `<input>` | Custom confirmation checkbox for bank rules & documents |
| `start-summary-text` | `<p>` | Live contextual status update summary bar |
| `start-continue-button` | `<button>` | Continue button triggering typewriter loader |

### Footer
| Test ID | HTML Element | Description / Purpose |
| :--- | :--- | :--- |
| `openstart-footer-notice` | `<footer>` | Regulatory demo sandbox and insurance notice |
