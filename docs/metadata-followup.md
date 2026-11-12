# Optional metadata follow-up

The Norwegian and English home pages have current page titles and descriptions,
but their social metadata still identifies the old lead article. The optional
script below copies the existing home title and description into the OG/Twitter
fields and sets `og:type` to `website`. On the named diary, gallery and book
routes it fills a missing standard description from the existing OG description.
It leaves artwork, editorial text, canonical URLs, language alternatives, robots
directives and all content outside `<head>` unchanged.

This script is not part of the build and does not publish. Start with a dry run:

```sh
node scripts/normalize-page-metadata.mjs --input-root /path/to/reviewed/public
```

To create private review copies after inspecting the plan, use a separate, empty
output directory. Only changed HTML files are emitted; media and other pages are
not copied. Existing output files are never overwritten.

```sh
node scripts/normalize-page-metadata.mjs --input-root /path/to/reviewed/public --output-root /separate/private/meta-review --write
```

The contributor distribution contains sanitized reading examples. Apply this
head-only transformation to the reviewed production-content candidate when
preparing a release; do not replace production pages with contributor examples.
The existing social cover image is retained and requires a separate artwork
decision if a different homepage cover is wanted.
