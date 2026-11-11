# Public home entrances

The Norwegian and English home pages now expose the two approved directions:
the art community and prospective forum, and the editorial diary/activism side.
Both have equal card structure and primary links to existing public pages. The
book and legal hub remain directly reachable from the editorial entrance.

The copy reuses the approved portal's two creative introductory sentences,
editorial description, distinction between purposes, separate-room rationale,
national reach and unestablished organisational structure. The status sentence
names the forum specifically, because the art community already has public
pages. No application, identity review, private preview link or open forum is
introduced.

The addition is one bounded section immediately before the original journey
anchor plus one separately scoped stylesheet. The journey, navigation, original
writing and existing metadata are preserved. No service is activated.

For the full production-content candidate, use the anchor patch instead of
copying the contributor home-page fixtures:

```sh
node scripts/apply-public-entrances.mjs --input-root /path/to/reviewed/public --output-root /separate/empty/private-overlay
```

Review the two output home pages and the new stylesheet before the maintainer's
existing integration and release process. The script leaves its input tree
unchanged and refuses output within that tree or a nonempty output directory.
