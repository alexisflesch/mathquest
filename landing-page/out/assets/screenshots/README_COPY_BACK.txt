This folder is intended to contain screenshots copied from the static landing page.

Due to binary file handling limitations in this edit session, please run the following commands locally from the repository root to copy the existing images into this directory:

mkdir -p landing-page/next/public/assets/screenshots
cp landing-page/assets/screenshots/* landing-page/next/public/assets/screenshots/

Also copy the favicon if needed:
cp landing-page/assets/favicon.svg landing-page/next/public/assets/favicon.svg

After copying, reload the Next dev server (it should pick up the new static files).
