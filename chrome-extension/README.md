# SEO Alt Text Assistant

This folder contains the local-loadable Manifest V3 extension for the Alt Text Generator SaaS.

## Main Files

- `manifest.json`: extension metadata and popup entry point
- `popup.html`: popup interface
- `popup.js`: popup logic, API requests, history, usage limit
- `content.js`: extracts current page title, meta description, and image clues
- `styles.css`: dark popup styling

## Production API

The extension is configured to call:

`https://alt-text-q6lg8jonb-ersil.vercel.app/api/generate`

## Local Loading

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this `chrome-extension` folder

## Store Prep Notes

- Add real PNG icons inside `icons/` before publishing
- Review the store copy in `store-description.txt`
- Review the submission checklist in `store-checklist.txt`
- Confirm privacy and support details before Chrome Web Store submission
