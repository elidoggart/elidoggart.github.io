# GitHub maintenance reviews

## Current review — 22 October 2026

The existing release safeguards remain sound: active ruleset `24894237` requires an up-to-date successful `validate` check and a PR, blocks deletion and force pushes, and has no bypass actors. Workflows default to read-only tokens; PR approval by Actions is disabled. The Pages environment permits deployments only from `main`. All five existing Actions pins match their current official release tags.

This review addresses missing automation:

| Area | Current behavior |
| --- | --- |
| Browser checks | Every PR and manual validation run exercises Chromium and WebKit on separate runners. One final `validate` result requires successful unit/asset/build checks and both browser jobs. Failed, cancelled or skipped prerequisites cannot produce a successful gate. |
| Mutable portfolio content | Browser checks allow optional photos/videos to be removed through the editor; generic current-content navigation and mobile checks still run. |
| Dependency alerts | Dependabot vulnerability alerts and automatic security-update PRs are enabled. The reviewed lockfile has zero known npm advisories as of this review. |
| Version updates | Dependabot checks npm and Actions every Monday, with three open version PRs per ecosystem, grouped minor/patch updates, and separate major updates. Security PRs are independent. There is no automatic merging. |
| New dependency risk | PR dependency review checks high/critical advisories in runtime, development and unknown scopes. Development scope matters because browser-bundled editor libraries are declared as dev dependencies. |
| Code scanning | CodeQL default setup scans Actions, JavaScript/TypeScript and Python on repository changes and its weekly schedule. |
| Secret protection | Secret scanning and push protection were already enabled and remain enabled. No open secret alerts were reported during this review; this is not a full manual history audit. |
| Private reports | Private vulnerability reporting is enabled, with reporting instructions in `SECURITY.md`. |
| Review information | A concise PR template asks for the problem, resulting behavior, validation and material risks. Current editor/release documentation describes the automatic checks. |

The owner can still publish alone: no additional human approval, app permission, direct-main write or bypass was introduced. Newer nonurgent Playwright/Decap releases should go through their own dependency PRs and browser checks. Exact package versions, lockfile integrity, immutable Actions pins and `npm ci --ignore-scripts` are retained.

The editor now waits through brief `unstable` merge-readiness results within its existing 30-second budget, which accommodates pending advisory checks. It still accepts only `clean`, rejects conflicts/blocked states, and rechecks the exact reviewed SHA before merging. Five regression cases cover transient/permanent instability and final publication rejection.

Initial CodeQL analysis found one `js/bad-code-sanitization` alert in the OAuth helper's origin serialization. Independent review confirmed a false positive: `configured(env)` runs before callback handling and requires each configured origin to equal a parsed HTTPS URL's canonical origin. Paths, queries, credentials and script-like host characters cannot reach the template under that invariant. This matches the [URL Standard's host restrictions](https://url.spec.whatwg.org/#forbidden-host-code-point). A permanent regression rejects 26 malformed-origin configurations before any provider request and accepts six valid controls. The alert is dismissed with that reasoning; no Worker change or deployment is needed. Reassess if origin validation changes.

The automation follows GitHub's guidance for [repository security features](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository), [minimal workflow permissions and pinned Actions](https://docs.github.com/en/actions/reference/security/secure-use), [Dependabot grouping and limits](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), and [dependency review](https://github.com/actions/dependency-review-action/tree/v5.0.0). The [current workflow](../.github/workflows/content-validation.yml) is the source of truth.

## Historical review — 13 October 2026

The following records the earlier configuration; statements about automation being disabled describe that date.

This review supports dependable editing and publishing. It does not add a new publishing service, require another person to approve a solo repository, or expand the editor's GitHub permissions.

| Area | Finding and action |
| --- | --- |
| Main branch | Active ruleset `24894237` requires a PR, up-to-date `validate` from GitHub Actions, and blocks deletion/force pushes. Retained. |
| Human approvals | Zero required reviewers is appropriate for the owner's current workflow. Requiring somebody else would block normal publishing. The editor still confirms publication explicitly. |
| Workflow permissions | Validation/build use `contents: read`; only Pages deployment has `pages: write` and `id-token: write`. No `pull_request_target` execution or broad write token was introduced. Checkout credentials are no longer persisted for later test steps. |
| Action versions | Replaced older Node-runtime Actions with verified official releases pinned to full commit SHAs, with readable version comments. The browser runner uses Ubuntu 24.04 so an automatic runner-image migration does not silently change its rendering environment. |
| Failed checks | Added downloadable screenshots/context for failed UI runs, retained seven days, plus bounded job timeouts. Superseded PR validation runs are cancelled; an active deployment is not cancelled. |
| Publishing versus test examples | Tests previously depended on mutable Nimbus headings and other real content. Editor regression examples now use `tests/fixtures/editor-content.json` and an isolated `.local/browser-dist/` build. Actual portfolio content/assets still receive validation and a separate `dist/` deployment build. A regression verifies the fixture build cannot overwrite it. |
| Dependencies | Exact package versions and lockfile are retained. A fresh `npm audit` on this review date reported zero known vulnerabilities. This is an advisory check, not a security certification. |
| Secrets | A focused tracked-file scan found no common GitHub-token, AWS-access-key or private-key patterns. Inert test credentials are deliberate fixtures. This was not a full history or infrastructure secret audit. |
| Commits and PRs | Keep changes reviewable, summarize the concrete behavior and tests, use normal squash merges and preserve failed-check evidence. Avoid bypassing checks or force-pushing main. |
| Comments | Explain non-obvious constraints: delayed image paint, storage compatibility, exact revision reconciliation and preview races. Avoid comments that merely restate straightforward code. |
| Documentation | Added a useful project README and corrected editor/authentication instructions that still described the completed rollout as pending. Historical setup and review evidence remains labelled as such. |
| Generated files | `node_modules/`, `dist/`, `.local/` and test reports are ignored. The deployment uploads the real build, not the source repository or UI fixture. |
| Cleanup | At inspection, 23 old branch heads exactly matched their merged PR heads. They are optional, recoverable housekeeping, not a source of UI failures. No active draft should be deleted based only on its age or name. |

## Files that should stay

`README.txt` is a published attribution file copied by the build. Legacy HTML/editor routes support existing links. Authentication examples are imported by regression tests. Migration fixtures and earlier review evidence document previous behavior. These files are not dead simply because they are old; broad deletion would create unnecessary risk.

A merged topic branch can be removed after confirming its head still matches the merged PR and no open PR or active draft uses it. GitHub provides [branch deletion and restoration through the PR](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/deleting-and-restoring-branches-in-a-pull-request). Bulk deletion and automatic branch-deletion settings were not enabled during this review.

The workflow changes follow GitHub's [guidance on minimum token permissions and immutable action pins](https://docs.github.com/en/actions/reference/security/secure-use). Pins were resolved from the official Actions repositories; upgrades should continue through reviewed PRs and passing checks. No automatic dependency-PR schedule was enabled.

## Limits

This was a repository and publishing-workflow review. It did not audit Cloudflare account settings, GitHub organization-wide policy, billing, every historical commit, or all transitive upstream code. No secret values were accessed or moved.
