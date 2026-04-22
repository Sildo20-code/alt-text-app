# Chrome Extension MVP

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

- Replace placeholder icons inside `icons/` before publishing
- Review name, description, screenshots, and privacy details before submitting to the Chrome Web Store
