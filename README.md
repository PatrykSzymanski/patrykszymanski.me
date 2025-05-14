# Patryk Szymański Portfolio

This is the personal portfolio website for Patryk Szymański, a UX/Product Designer based in Kraków, Poland.

## Technology

This site is built using:

- [Eleventy](https://www.11ty.dev/) - A simpler static site generator
- Custom responsive grid system
- Vanilla JavaScript
- Lottie animations

## Development

### Prerequisites

- Node.js (v14 or newer)
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development Server

Run the development server with:

```
npm run dev
```

This will first clean the output directory, then start a local server at http://localhost:8080 with live reloading, and watch for changes to process JavaScript.

If you only need the server without JavaScript processing:

```
npm run serve
```

### Build

To build the site for production:

```
npm run build
```

This will first clean the output directory, then build the site with Eleventy and bundle JavaScript with Webpack. The built site will be in the `_site` directory.

### Clean

To clean the output directory without building:

```
npm run clean
```

This removes the `_site` directory and all its contents.

## Features

- Responsive design with custom grid system
- Light/dark mode toggle with localStorage persistence
- Case studies with image galleries
- Minimal environmental impact design

## Structure

- `src/` - Source files
  - `_includes/` - Template partials and layouts
  - `css/` - Stylesheets
  - `js/` - JavaScript files
  - `images/` - Image assets
  - `*.njk` - Page templates

## License

© 2023 Patryk Szymański
