# Wedding Template

A responsive, editorial-style wedding website template built with semantic HTML, CSS, and vanilla JavaScript.

## Live demo

Production demo:

https://template-01.foreverlove.com.tw/

GitHub Pages mirror:

https://amattsuyolo.github.io/wedding-template/

## Features

- Responsive layouts for desktop and mobile
- Story-led wedding homepage
- Wedding date countdown
- Schedule and venue information
- Responsive image gallery and lightbox
- RSVP and guest-message interface
- Accessible semantic structure and reduced-motion support
- Local fonts and optimized WebP images

## Run locally

Node.js is required for the local preview server.

```bash
npm run dev
```

Then open `http://127.0.0.1:4173/`.

To run the project checks:

```bash
npm run check
```

To create a production build in `dist/`:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project structure

```text
assets/          Fonts and optimized website images
scripts/         Build, verification, and preview utilities
index.html       Page content and semantic structure
styles.css       Layout, visual design, and responsive styles
script.js        Countdown, gallery, forms, and interactions
server.mjs       Local static preview server
```

## Customization

Before using the template for another wedding, replace the example couple names, date, venue, copy, and images. Review the RSVP interface before connecting it to a real form or database.

## Privacy

Do not commit guest responses, contact details, API keys, environment files, or other private wedding data to a public repository. This repository contains presentation code and example content only.

## License

No reuse license has been selected yet. The source is currently published for viewing and reference.
