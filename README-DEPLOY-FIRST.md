# SukuuX Ghana Schools — GitHub Pages repository

Target: https://search.sukuux.com/
Build date: 2026-09-03

## The app is still one file

`index.html` is the complete self-contained, interactive Ghana Schools application. It includes the app code, school records and map data and can run on its own.

The other files are the **SEO publishing layer**. Google requests `robots.txt`, XML sitemaps and crawlable school URLs as separate web addresses, so those resources cannot be folded into the one HTML file. The supporting files do not split or change the interactive application.

## Deploy through GitHub

1. Create an empty GitHub repository.
2. Extract this ZIP, open Git Bash inside the extracted folder, and run:

   `bash deploy-to-github-pages.sh https://github.com/OWNER/REPOSITORY.git`

3. In the repository, open **Settings → Pages** and select **GitHub Actions** as the source.
4. Under **Custom domain**, enter `search.sukuux.com` and save it.
5. At the DNS provider for `sukuux.com`, create a `CNAME` record:
   - Name/host: `search`
   - Target/value: `OWNER.github.io`
6. After DNS resolves and GitHub issues the certificate, enable **Enforce HTTPS**.

The included workflow publishes automatically on every push to `main`. The `.nojekyll` file makes GitHub Pages serve the repository exactly as generated. The included `CNAME` records the intended domain, but the custom domain must still be saved under GitHub Pages settings when using the Actions workflow.

If Git asks for your identity before the first commit, run:

`git config --global user.name "Your Name"`

`git config --global user.email "you@example.com"`

Then rerun the deployment command.

## Google indexing

1. Add or verify the `sukuux.com` Domain property in Google Search Console using DNS verification.
2. Submit `https://search.sukuux.com/sitemap.xml`.
3. Inspect `https://search.sukuux.com/` and request indexing after deployment.
4. Test representative school, district and region URLs using URL Inspection and the Rich Results Test.
5. Confirm that `robots.txt`, all sitemap files and static pages return HTTP 200.

Google can discover URLs through sitemaps, but submission does not guarantee indexing. The package therefore includes crawlable HTML pages and ordinary `<a href>` links rather than relying only on the JavaScript application.

## Included

- One-file interactive mobile-first application at root `index.html`.
- 10,503 crawlable canonical school pages; all 10,795 source directory rows remain in the app.
- 16 regional pages and 261 district pages.
- 43 paginated all-school directory pages.
- Sitemap index plus static, region, district and school sitemaps.
- `robots.txt`, web-app manifest, favicon, OpenSearch and LLM discovery files.
- GitHub Pages Actions workflow, `.nojekyll`, `CNAME`, deployment script, 404 page and security contact.
- Browser-optimized ADM0, ADM1 and ADM2 GeoJSON downloads with provenance.

## Important limitation

Most coordinates represent an approximate locality rather than the exact school campus. Preserve the disclaimer wherever the data is reused.
