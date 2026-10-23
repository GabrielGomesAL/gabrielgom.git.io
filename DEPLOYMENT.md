# Production hosting

The portfolio uses Sites hosting with managed TLS certificates as of 23 October 2026. The GitHub Pages custom-domain certificate was serving `*.github.io` instead of `gabrielgom.com`.

- Main address: `https://gabrielgom.com/`
- Alternate address: `https://www.gabrielgom.com/`
- Sites project: `appgprj_6adb8c85d9b88191889fba693b0611e5`
- Provider address: `https://gabriel-gomes-portfolio.gabrielrueiro10.chatgpt.site/`
- Public access is enabled; visitors do not need a ChatGPT account.

## DNS

GoDaddy remains the DNS provider. The production records are:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 162.159.143.30 |
| A | @ | 172.66.3.26 |
| CNAME | www | custom-domains.chatgpt.site. |

Retain the `_openai-site-verification` and `_cf-custom-hostname` TXT records for both hostnames. These are public ownership checks. The web host manages certificate issuance and renewal; no local verification script or running PC is needed for serving the portfolio.

## Publishing future updates

This repository retains the portfolio source. Production is deployed from the same public files under `dist/` in the Sites source repository for the project above. Editing or pushing this GitHub repository alone does not update the Sites deployment.

1. Open the existing Sites project and its source repository through the Sites tools. Reuse the project ID above; do not create another Site.
2. Copy the changed public files into the matching paths under `dist/`. Preserve `assets/`, `css/`, `img/`, `js/`, and existing download URLs. Do not copy `.git/`, temporary files, credentials, or the GitHub `CNAME` file into `dist/`.
3. Use the Sites source workflow to commit, push, and package that exact source state. Save the returned commit and archive, then deploy the saved version with the existing public audience.
4. Verify HTTPS, page rendering, and downloads at both production hostnames after deployment.

The GitHub `CNAME` is retained for legacy GitHub Pages redirects. Do not point the production DNS back to the old GitHub Pages IPs unless valid certificates and the intended hosting change have been verified first.
