# Security

The public developer preview is read-only and is designed to run without production credentials. Its API routes are deliberately disabled. Never put a live key, personal case file, raw manuscript or contact list in an issue, pull request, test fixture or commit.

For a security concern, use GitHub's private vulnerability reporting if the repository makes it available. Otherwise, contact the maintainer privately through an existing verified contact route before sharing sensitive evidence. Do not publish exploit details, credentials or other people's information in a public issue.

Describe the affected version, reproduction steps using synthetic data and the practical impact. Do not test against real accounts or production services without authorization.

The Worker modules need independently configured authentication, storage and service providers before production use. Passing local tests is not a security audit or authorization to enable those services.
