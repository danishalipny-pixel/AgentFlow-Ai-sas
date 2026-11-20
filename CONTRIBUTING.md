# Contributing to AGENTFLOW AI

We welcome contributions to AGENTFLOW AI. Please follow these guidelines to ensure code quality, security, and architectural consistency.

---

## Code of Conduct

- Be respectful and constructive in all communication.
- Prioritize user data security, tenant isolation, and responsible AI safety.

---

## Development Workflow

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Install Dependencies & Build Shared Packages**:
   ```bash
   npm install
   npm run build:shared
   ```
4. **Follow Architecture Rules**:
   - Every tenant-scoped model and query must enforce `organizationId`.
   - Never expose API secrets or private credentials to client code.
   - All tool execution must remain strictly sandboxed (no arbitrary shell execution on host).
   - Use Zod schemas from `@agentflow/shared` for input validation.
5. **Run Automated Tests**:
   - Backend API tests: `npm --prefix apps/api test`
   - Python AI tests: `cd apps/ai-service && python -m pytest tests/test_graph.py`
6. **Verify Production Builds**:
   - Ensure `npm run build` succeeds with zero TypeScript errors.
7. **Submit a Pull Request**: Provide a clear summary of changes and test results.

---

## Security Vulnerability Reporting

If you identify a security issue, please email `security@agentflow.ai` or submit a private security advisory rather than opening a public issue.
