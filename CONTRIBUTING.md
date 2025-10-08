# Contributing to Gezira Scheme GIS

First off, thank you for considering contributing to the Gezira Scheme GIS Management System! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/gezira-scheme-gis.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes (see commit guidelines below)
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs. actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case and motivation**
- **Possible implementation** (optional)
- **Alternatives considered** (optional)

### Pull Requests

- Fill in the required template
- Follow the style guidelines
- Include screenshots for UI changes
- Update documentation if needed
- Add tests if applicable

## Development Process

1. **Setup your environment** following the installation guide in README.md
2. **Create a feature branch** from `main`
3. **Make your changes** with clear, focused commits
4. **Test thoroughly** - run existing tests and add new ones
5. **Update documentation** if you've changed APIs or added features
6. **Submit a pull request** with a clear description

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update the README.md with details of changes if needed
3. Add or update tests as appropriate
4. Ensure the test suite passes: `npm test`
5. Make sure your code lints: `npm run lint`
6. Update documentation for any changed functionality
7. Your PR will be reviewed by maintainers
8. Address any feedback or requested changes
9. Once approved, your PR will be merged

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new frontend code
- Follow ES6+ standards
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Max line length: 120 characters
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays

Example:
```typescript
/**
 * Fetches sectors by division
 * @param division - The division name (East, West, North, South)
 * @returns Promise with sector data
 */
export async function getSectorsByDivision(division: string): Promise<SectorData> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow the file structure: `ComponentName/ComponentName.tsx`

Example:
```typescript
interface SectorCardProps {
  sector: Sector;
  onSelect: (id: number) => void;
}

export const SectorCard: React.FC<SectorCardProps> = ({ sector, onSelect }) => {
  // Implementation
};
```

### CSS/Tailwind

- Use Tailwind utility classes when possible
- Keep custom CSS minimal
- Use meaningful class names for custom CSS
- Mobile-first responsive design

### Backend (Node.js/Express)

- Use async/await over callbacks
- Handle errors properly
- Validate inputs
- Use meaningful HTTP status codes
- Add comments for complex logic

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:
```
feat(map): add drawing tools for creating new sectors

fix(auth): resolve JWT token expiration issue

docs(readme): update installation instructions

refactor(api): simplify sector query logic
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Run `npm test` before submitting PR
- Aim for good test coverage

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update API documentation for endpoint changes
- Include code examples where helpful

## Questions?

Feel free to:
- Open an issue for discussion
- Reach out to the maintainers
- Join our community discussions

Thank you for contributing to Gezira Scheme GIS! 🌍🇸🇩
