# Security Policy

We appreciate efforts to make Solana Age Verify more secure.

## Reporting a Vulnerability

Please report security vulnerabilities to **security@ageverify.live**. Include a clear description and steps to reproduce if possible. Do not disclose details publicly until we have had a chance to address the issue.

## Bug Bounty

We do not currently offer a formal bug bounty. We may acknowledge responsible disclosure at our discretion. Details about the security issue must not be provided to third parties before a fix has been introduced and verified. You may not exploit the issue without our explicit consent.

## Scope

- **In scope:** The Age Registry Solana program (`age_registry`), SDK verification flows, and Oracle/Gatekeeper signing logic.
- **Out of scope:** General website issues, non-critical infrastructure. For those, you may still email security@ageverify.live with "Other Vulnerability" in the subject line.

## Dependency Security

We actively monitor and manage dependency vulnerabilities:

- **Vulnerability Tracking:** See [docs/DEPENDENCY_VULNERABILITIES.md](docs/DEPENDENCY_VULNERABILITIES.md) for detailed assessments of all known issues
- **Automated Scanning:** GitHub Dependabot alerts enabled for security advisories
- **Mitigation Strategy:** pnpm overrides enforce secure versions for transitive dependencies (see [package.json](package.json))
- **Review Cadence:** Quarterly security audits and dependency updates

**Current Status:** All production-critical vulnerabilities mitigated. Remaining issues are documented as accepted risks (no patches available) or deferred non-critical upgrades.

## References

- Program and fee invariants: [docs/specs/IMMUTABLES.md](docs/specs/IMMUTABLES.md)
- Transaction flows: [docs/specs/TRANSACTION_FLOWS.md](docs/specs/TRANSACTION_FLOWS.md)
- Dependency vulnerabilities: [docs/DEPENDENCY_VULNERABILITIES.md](docs/DEPENDENCY_VULNERABILITIES.md)
