# FormForge (Jotform-style Form Builder)

A lightweight no-build web app for building forms in the browser.

## Features

- Add common form field types from a field library.
- Reorder, duplicate, delete, and configure fields.
- Edit labels, helper text, required flags, placeholders, numeric bounds, and options.
- Save your form schema as JSON and load it back later.
- Export a standalone HTML form file.

## Run locally

Because this app uses only static assets, you can open `index.html` directly or run a local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## How to check it

1. Start the local server:

   ```bash
   python -m http.server 8000
   ```

2. Open `http://localhost:8000` in your browser.
3. In **Field Library**, click a few field types to add them.
4. Click fields in the canvas and verify **Field Settings** updates.
5. Use field action buttons to move up/down, duplicate, and delete.
6. Change settings (label, required, options, min/max) and confirm updates in the canvas.
7. Click **Save JSON**, then **Load JSON** and pick the saved file.
8. Click **Export HTML**, open the downloaded file, and confirm the form renders and can submit.

## Quick validation commands

```bash
node --check app.js
python -m http.server --help >/dev/null
```
