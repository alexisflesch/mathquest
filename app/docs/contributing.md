# Contribution Guide for AI Agents and Human Collaborators

This project is developed primarily by AI agents under human guidance. To ensure high quality, maintainability, and security, all contributors (AI or human) must follow these guidelines:

## General Principles
- **DRY (Don't Repeat Yourself):** Always check for existing utilities, components, or logic before writing new code. Reuse and refactor where possible.
- **Documentation First:** Every code change must be reflected in the relevant documentation file(s) before or alongside the code update.
- **Type Safety:** Use TypeScript for all new code. Avoid `any` types unless absolutely necessary and justified in comments.
- **Small Files:** Keep files under 500 lines where possible. **Script files (including handlers, services, and utilities) should be kept as short and focused as possible—preferably under 300 lines.** If a file grows too large, split it into smaller modules. Large files increase the risk of AI hallucination and reduce maintainability.
- **Commenting:** Every file should have a header comment explaining its purpose. Complex logic should be well-commented.

## Workflow for AI Agents
1. **Read and Understand Existing Docs:** Before making changes, review the relevant documentation and code.
2. **Propose Changes:** Clearly describe the intended change and its impact in the PR or agent log.
3. **Update Documentation:** Update all affected docs (API, backend, sockets, types, etc.) as part of the change.
4. **Testing:** Add or update tests to cover new or changed logic. Run all tests before submitting.
5. **Code Review:** All changes must be reviewed by another agent or a human overseer before merging.
6. **Security:** Always consider security implications (see [Security Practices](./security.md)).

## Workflow for Human Collaborators
- Follow the same process as AI agents.
- Provide feedback and guidance to agents as needed.
- Review and approve PRs with a focus on clarity, maintainability, and security.

## Communication
- Use clear, descriptive commit messages and PR descriptions.
- Document any architectural or design decisions in the appropriate doc.

## When in Doubt
- If you are unsure about a change, ask for review or guidance before proceeding.
- Prefer clarity and maintainability over cleverness.

---

By following these guidelines, we ensure that MathQuest remains robust, secure, and easy to maintain as an AI-driven project.
