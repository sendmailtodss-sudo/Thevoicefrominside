# Private forum application and moderation trial

The Norwegian and English `/for-oss-alle-preview/` pages demonstrate the planned
application → identity/role review → moderator decision → community workflow.
They use four fixed fictional identities and no real identifying details. This
trial is for a restricted development preview, not a public membership service.
The two portal pages describe the proposed process and the distinct purposes of
the creative/support and editorial/activist entrances.

Applicants can choose inmate, former inmate, relative or professional roles and
simulate complete or incomplete evidence. No files, ID numbers, BankID details,
real accounts or external identity-provider calls are collected. A second panel
lets the reviewer role-play a moderator: identity review, approval, rejection with
a reason, suspension and reopening for a fresh review. This switch is not a
moderator login and does not verify that the person operating it is authorised.

The trial blocks a pending, rejected or suspended example from opening sample
conversations or adding local replies. Approval requires the evidence and review
steps. Inmate/former-inmate examples use the way-forward room; relatives use the
relatives room. Professional examples need explicit room grants. Reopening a
case clears its approval and requires review again. Starting a replacement
application also revokes the example's access until it has been reviewed.

Once approved, visitors can switch permitted threads, read fictional replies,
write invented text, add a local example reply, retain a per-profile/per-thread
draft, clear it and return to the overview. All state lives in JavaScript memory
only. There is no fetch, browser storage, account, backend, message delivery or
actual publication. Reload/reset clears the trial. The interface asks visitors
not to enter real personal or case information. Without JavaScript the room
explanations remain readable and conversation controls stay disabled.

These client-side gates demonstrate workflow only. All static fixtures are
present in the page/scripts; they are not secure access controls. A real service
requires independent identity verification, server-side sessions/roles and
read/write authorisation, a defined moderator operator, consent and data-handling
rules, retention/deletion and incident procedures, and end-to-end security tests.
No secure chat or end-to-end encryption is implemented or claimed here. A future
KYC provider's terms and data-processing responsibilities must be resolved before
accepting any identity documents or opening membership.

Validation on 11 November 2026 covered the complete applicant/reviewer workflow
in Chromium at 1440 px (Norwegian), 390 px (English) and 390 px with reduced
motion (Norwegian), plus a JavaScript-disabled page. Forced premature review,
approval, room opening and posting were refused; missing evidence, reason and
professional room grants were exercised. Profile-specific drafts, suspension,
reopening, reset/reload, literal HTML text rendering and no network requests
from trial interactions were checked. These checks validate the synthetic
workflow, not production security or identity verification.
