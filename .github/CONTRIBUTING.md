# Contributing to LandForm

Thank you for your interest in contributing! By participating, you agree to uphold our standards and policies.

## Table of Contents
1. [How to Contribute](#how-to-contribute)
2. [Development Workflow](#development-workflow)
3. [Code Style](#code-style)
4. [Testing](#testing)
5. [Documentation](#documentation)
6. [Pull Request Process](#pull-request-process)
7. [Legal and IP](#legal-and-ip)

---

## How to Contribute
1. **Fork** the repository.
2. **Clone** your fork: `git clone https://github.com/your-username/landform.git`
3. **Install** dependencies: `npm install` or `yarn install`.
4. **Create** a feature branch: `git checkout -b feat/awesome-feature`.
5. **Develop** your feature or bug fix, adhering to code style.
6. **Run** tests and linters locally.
7. **Commit** with descriptive messages: `git commit -m "feat: add new wallet connector"`.
8. **Push** to your fork: `git push origin feat/awesome-feature`.
9. **Open** a Pull Request against the main repo’s `main` branch.

## Development Workflow
- We follow GitHub Flow. All feature branches must be branched off `main`.
- Keep branches focused: one feature or fix per branch.
- Rebase or merge from `main` regularly to avoid conflicts.

## Code Style
- **Frontend (LandForm DApp)**:
  - Use ESLint with the shared config (`npm run lint`).
  - Use Prettier for formatting (`npm run format`).
  - Follow React best practices and Tailwind conventions.
- **Smart Contracts**:
  - Use Solidity v0.8.x and OpenZeppelin libraries.
  - Run `npx hardhat lint` (if configured) and follow Hardhat Style Guide.

## Testing
- **Frontend**: write unit and integration tests using Jest and React Testing Library.
- **Contracts**: write tests with Mocha/Chai under Hardhat.
- Run all tests: `npm test`.
- Ensure coverage remains above 80%.

## Documentation
- Document public functions, components, and hooks.
- Update `README.md` with new features or breaking changes.
- For major features, add examples or code snippets.

## Pull Request Process
- PRs should reference related issues (use `Closes #123`).
- Include screenshots or recordings for UI changes.
- Request reviews from at least two maintainers.
- Once approved and CI passes, a maintainer will merge.

## Legal and IP
By contributing, you certify that:
- Your contribution is your original work or you have the right to submit it.
- You grant LandForm Team a perpetual, royalty-free license to use your contribution under MIT.
- You have read and agree to the project’s `LICENSE.md` and `INTELLECTUAL_PROPERTY.md`.