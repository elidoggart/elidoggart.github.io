# Security policy

The current `main` branch and deployed website are maintained. Historical snapshots are retained for reference and regression testing.

## Report a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/elidoggart/elidoggart.github.io/security/advisories/new) for security issues in the website, editor or authentication helper. Include the affected page or file, steps to reproduce, and the potential impact. Keep credentials and personal data out of examples.

Please keep vulnerability details private while a fix is being investigated. Ordinary bugs and feature requests can use public issues.

## Maintenance

CodeQL scans code and workflows. Dependabot monitors vulnerable dependencies and opens update pull requests. Changes go through the required validation check, including unit tests, content validation, a production build, and Chromium/WebKit browser tests. Publication uses the protected main branch and a separate Pages deployment.
