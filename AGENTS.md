# Kairat Security — Code Review Instructions

## Code Review Rules

This is the production website for Kairat Security.

Prioritize real bugs, regressions, security issues, and production risks.
Do not waste review comments on minor stylistic preferences.

### Always check

- Desktop and mobile layouts.
- Responsive behavior on different screen sizes.
- Elements overflowing outside the viewport.
- Hidden, overlapping, or incorrectly positioned content.
- Navigation, buttons, links, and forms.
- JavaScript errors.
- Missing or broken images, fonts, icons, and other assets.
- Performance regressions.
- Accessibility regressions.

### Animations

- Make sure existing animations still work on desktop and mobile.
- Flag animations that unexpectedly disappear.
- Flag animation changes that make the site slower or cause layout shifts.
- Do not remove existing animations unless the change explicitly requires it.

### SEO

Check that changes do not break:

- page title
- meta description
- canonical URL
- Open Graph metadata
- headings
- image alt text
- robots.txt
- sitemap.xml
- structured data / JSON-LD

Flag changes that could negatively affect search indexing.

### Forms and integrations

Pay special attention to:

- Telegram form submission
- form validation
- spam protection / honeypot
- Cloudflare Pages Functions
- API requests
- error handling

Never expose secrets, tokens, API keys, or private credentials in frontend code.

### Cloudflare

Check compatibility with:

- Cloudflare Pages
- Cloudflare Pages Functions
- _routes.json
- production deployment

Flag anything that could cause the production deployment to fail.

### Production safety

This is a live production website.

Before approving changes, check whether they could break existing functionality.

Prefer backward-compatible changes.

### Do not report

Do not report:

- subjective design preferences
- harmless formatting differences
- minor code-style issues
- intentional changes clearly explained by the pull request

Focus on issues that can actually affect users, SEO, security, performance, or production.
