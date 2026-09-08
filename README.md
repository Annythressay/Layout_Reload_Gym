# RELOAD Gym & Wellness

Eight static HTML pages using the original black/red/white visual system, one shared stylesheet and one shared vanilla JavaScript file. No runtime framework is required.

## Local preview

Run `node server.cjs` from this directory and visit http://127.0.0.1:4173/index.html. All page and asset URLs are relative, so the generated pages also work on static hosts and when opened directly.

## Editing and shared content

- Edit page content in `templates/pages/*.html`, including membership prices and branch copy.
- Edit navigation once in `templates/header.html` and footer links once in `templates/footer.html`.
- Shared SVG symbols and dialogs live in `templates/icons.html` and `templates/dialogs.html`.
- Run `node build.cjs` to regenerate all eight root HTML pages. The script uses only Node's built-in filesystem APIs. It sets unique titles/descriptions and the current navigation state with `aria-current="page"`.
- Edit `assets/css/style.css` for the original shared styles and labeled multipage extensions.
- Edit `assets/js/main.js` for class data, sample member stories and interactions. Page-specific features initialize only when their required elements exist.
- Deployment requires only the eight root HTML pages and `assets/`; templates, scripts, documentation and QA files are development resources.

Do not edit generated root HTML and then rebuild without transferring the edits to the page templates first. Prices are plain HTML in `templates/pages/membership.html` and the generated `membership.html`.

## Content map

| Original homepage section | Current destination |
| --- | --- |
| Hero and Choose Your RELOAD | Home, with branch links to Locations |
| RELOAD at a Glance and Why RELOAD | Compact Home trust area; full sections on About |
| Explore the Gym | Facilities, with larger area descriptions and the original gallery |
| Our Services, Personal Training, Wellness | Services, with dedicated anchors and supporting details |
| Class Schedule | Class Schedule, preserving all seven days and booking notices |
| Membership Pricing | Membership, with all original prices and benefits plus FAQ |
| Real Members / Real Results | Compact Home preview and full About stories |
| Life at RELOAD | Blog, alongside a small set of clearly marked upcoming stories |
| Visit RELOAD | Locations, with women-only and mixed-gender concepts |
| Final CTA, header and footer | Reused across all pages |

Homepage flow: header → hero → branches (including four Explore cards) → statistics and compact Why RELOAD → testimonials → final CTA → footer. No full facilities, services, schedule, pricing, location or social section remains on Home.

Main navigation uses index.html, about.html, facilities.html, services.html, class-schedule.html, membership.html, locations.html and blog.html. JOIN NOW leads to Membership. Branch CTAs lead to `locations.html#reload-women` and `locations.html#reload-main`. Search also navigates between pages.

## Verification

`node qa.cjs` runs the development browser checks using bundled Playwright and Microsoft Edge. QA includes all eight pages at 1440, 1200, 1024, 768 and 390 pixels; local links and anchors; active navigation; images; duplicate IDs; one H1 per page; JavaScript and HTTP errors; mobile navigation; schedule day switching and keyboard controls; testimonials; and cross-page search destinations.

Screenshots and results are in `qa/multipage/`. The original homepage is preserved in `qa/before-refactor/index.html` as migration evidence, not as a deployable page. At 1440px the homepage is 1739px tall versus the original 3178px: about 55% of its former length. At 390px it is about 45% of its former length.

## Remaining placeholders

No new production photographs were introduced. The exact supplied logo remains unchanged. The generated hero, stock photography, member names/reviews, statistics, prices, schedule data, opening hours and social counts still require business approval. Branch addresses are supplied on the Locations page; hotlines, map links, social URLs, videos and articles are pending. Booking, payment and newsletter backends are not connected; preview notices do not claim a completed booking, payment or signup. See `ASSETS.md` for the full image replacement checklist.
