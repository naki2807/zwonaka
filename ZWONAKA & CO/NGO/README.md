# ZWONAKA & CO (NGO) — Project

## Changelog

### 2026-06-18
- **Added shared JavaScript:** created `js/app.js` to implement interactive UI (accordion, tabs, modal), dynamic search/filter rendering, and client-side form validation + user feedback.
  - **Why:** improves UX and satisfies Part 2 (interactive elements/dynamic content) and Part 4/5 (form validation & processing).
- **Added shared interactive CSS:** updated `css/style.css` with styles for accordion/tabs/modal/lightbox/search results and form error/success messages.
  - **Why:** ensures interactivity is visually clear, responsive, and consistent across pages.
- **Gallery Lightbox support framework:** implemented modal/lightbox behavior in `js/app.js`.
  - **Why:** enables Part 2.3 lightbox functionality when `Gallery.html` thumbnails are wired to the modal.
- **Updated Contact page:** rewrote `Contact Us.html` to include:
  - Google Maps embedded location section (interactive zoom/pan via iframe).
  - **Contact form** (`#contactForm`) with required controls (name, email, phone, subject, message) and validation via `app.js`.
  - **Enquiry form** (`#enquiryForm`) with dropdown topic, radio buttons, checkboxes, notes, and validation.
  - **Mail processing** via `mailto:` after successful validation.
  - **Why:** satisfies Part 2.2 (interactive map), Part 4 + Part 5 requirements (controls, validation, and user response).
- **SEO on Contact page:** added a unique `<title>`, `<meta name="keywords">`, and `<meta name="description">`.
  - **Why:** addresses Part 3 title/meta keywords/meta description requirements.
- **Robots.txt:** added `robots.txt` with `User-agent: *` and `Allow: /`.
  - **Why:** addresses Additional SEO requirement (Part 6).
- **Sitemap.xml:** added `sitemap.xml` listing site pages.
  - **Why:** addresses Additional SEO requirement (Part 6).
- **Added interactive gallery lightbox:** refactored `Gallery.html` into a valid single HTML document and wired thumbnails to the shared modal lightbox.
  - **Why:** satisfies Part 2.3 (responsive gallery lightbox with close actions + desktop/mobile UX).
- **Added dynamic search + filter + accordion:** updated `Services.html` with a JS-driven search/filter experience and an accordion section.
  - **Why:** satisfies Part 2.4 (dynamic content + search) and Part 2.1 (accordion).
- **SEO on Home page:** updated `HOMEPAGE22.html` with unique `<title>` and page meta keywords/description.
  - **Why:** satisfies Part 3 title/meta requirements.


> Note: This changelog records completed steps. Further updates (additional SEO meta updates on remaining pages, performance tweaks, and image alt/name standardisation) should be appended as they are implemented.


