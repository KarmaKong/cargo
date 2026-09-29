# CargoIranTruck website

Static website files for CargoIranTruck, published through GitHub Pages at `https://cargoirantruck.com/`.

## Deployment

The `main` branch root is the GitHub Pages publishing source. No build command is required. The repository's `CNAME` file configures `cargoirantruck.com` as the custom domain.

The site supports English at `/en/`, Simplified Chinese at `/zh.html`, and retained Persian pages and the original article archive. The quote form opens a prefilled email to `sales@cargoirantruck.com`; it does not automatically send or store inquiries.

The approved logo, wordmark, favicon, and other brand artwork are included unchanged.

## SEO boundary

CargoIranTruck indexes its destination and service pages plus seven original article topics. Articles copied from the main China–Iran site remain available to visitors, but carry `noindex,follow` and a canonical URL on `chinairantrucks.com` so the two domains do not compete for the same query.

After adding or moving content, regenerate and verify that boundary:

```sh
node scripts/seo-boundary.mjs
node scripts/seo-boundary.mjs --check
```
