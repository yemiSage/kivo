# Kivo extension privacy notes

This describes the behaviour of the unpacked source in this folder, not every deployment of Kivo or a published store listing.

- The extension reads the current page URL/title when you invoke its toolbar/keyboard action, or the page/link target when you choose its right-click action.
- It opens your configured Kivo application's `/save` route in a new tab with that URL and optional page title. That app's authentication, database, preview requests and optional providers then apply.
- It stores one setting locally on the device: `appOrigin`, the Kivo address you choose. It does not sync this setting to your Chrome account.
- It does not collect a continuous browsing history, read full page contents, capture screenshots, run analytics or store Kivo passwords/auth tokens/saved items.
- URL query strings can contain private information or tokens. Only choose to save links you intend to share with your configured app and its backend. Navigation history and infrastructure logs may retain them separately.
- Removing the extension removes its own local settings according to Chrome's behaviour; it does not delete items from Kivo, its backend or browser history.

Self-hosted operators and future publishers must provide their own accurate contact, retention/deletion process and privacy policy. This file is a technical data-flow statement, not a promise of a published service's legal compliance. Report vulnerabilities using the repository's [security policy](../../SECURITY.md), without posting private links or credentials publicly.
