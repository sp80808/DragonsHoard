# Contributing to Dragon's Hoard

Thank you for your interest in contributing to Dragon's Hoard! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and constructive in all interactions. We're building a welcoming community.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Provide detailed information**:
   - What happened (actual behavior)
   - What you expected to happen
   - Steps to reproduce
   - Browser and OS
   - Screenshots if applicable

3. **Create an issue** with the bug label

### Suggesting Features

1. **Describe the feature** clearly
2. **Explain the use case** - why would this be helpful?
3. **Note any implementation ideas** you have
4. **Create an issue** with the enhancement label

### Submitting Code Changes

#### Setup

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/DragonsHoard.git
cd DragonsHoard

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name
```

#### Development Workflow

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Code Style Guidelines

- **TypeScript**: Use proper types, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Add comments for complex logic
- **Imports**: Organize at top of file, group by type

#### File Naming Conventions

- Components: `ComponentName.tsx`
- Services: `serviceName.ts`
- Types: `types.ts`
- Constants: `constants.ts`

#### Example: Adding a New Item Type

1. **Update types** (`types.ts`):
```typescript
export enum ItemType {
  // ... existing items
  COOL_NEW_ITEM = 'COOL_NEW_ITEM',
}
```

2. **Add configuration** (`constants.ts`):
```typescript
export const SHOP_ITEMS = [
  // ... existing items
  { 
    id: ItemType.COOL_NEW_ITEM, 
    name: "Cool Item", 
    price: 100, 
    icon: "✨", 
    desc: "Does something cool" 
  },
];
```

3. **Implement logic** (`gameLogic.ts`):
```typescript
const useItem = (state: GameState, item: InventoryItem) => {
  if (item.type === ItemType.COOL_NEW_ITEM) {
    // Apply effect
  }
};
```

4. **Update UI** (`Store.tsx` or relevant component)

5. **Test** in dev server and ensure no regressions

#### Performance Considerations

- Minimize re-renders in components
- Use memoization for expensive calculations
- Keep game logic pure (no side effects in functions)
- Audio should be lazy-loaded

### Commit Messages

Write clear, descriptive commit messages:

```
feat: Add new frost rune type with freeze effect
fix: Resolve grid alignment issue on mobile
docs: Update achievement system documentation
style: Format game constants for consistency
refactor: Simplify tile merge logic
```

Use these prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests

### Pull Request Process

1. **Update documentation** if needed
2. **Test thoroughly** (dev and production builds)
3. **Check for console errors** in dev tools
4. **Submit PR** with:
   - Clear title describing change
   - Description of what changed and why
   - Reference related issues (`fixes #123`)
   - Screenshots for UI changes

5. **Respond to review** feedback promptly

#### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes:
- Tested on desktop/mobile
- Verified achievement unlock
- etc.

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] No new console errors
- [ ] Changes tested locally
- [ ] Documentation updated
```

## Areas for Contribution

### Good Starting Points

- 🎨 **UI/UX Improvements**: Responsive design tweaks, accessibility features
- 📝 **Documentation**: Typos, clarifications, examples
- 🐛 **Bug Fixes**: Browse open issues
- 🎮 **Game Balance**: Tweak difficulty, rates, prices

### More Advanced

- ⚙️ **New Game Systems**: Boss patterns, procedural generation
- 🎬 **Animations**: Tile animations, transitions
- 📊 **Analytics**: Track player behavior, progression
- 🌍 **Internationalization**: Multi-language support

## Development Tips

### Useful Tools

- **DevTools**: Inspect elements, console logs, localStorage
- **Network Tab**: Check asset loading times
- **Vite Dev Tools**: React component inspector

### Testing Checklist

Before submitting a PR:
- [ ] Game starts without errors
- [ ] Can play a complete game
- [ ] All UI interactions work
- [ ] Leaderboard saves/loads
- [ ] Responsive on mobile
- [ ] No console errors or warnings
- [ ] Audio plays correctly
- [ ] Achievements unlock properly

### Common Issues

**Grid not updating?**
- Ensure game state is properly immutable
- Check reducer action handling
- Verify component keys are unique

**Tiles not spawning correctly?**
- Check `spawnTile()` logic
- Verify grid size is correct
- Ensure empty cells detection works

**Styling issues?**
- Tailwind classes are included
- Check for typos in class names
- Verify gradient syntax

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review similar code sections

## Recognition

Contributors will be credited in the README. Thank you for making Dragon's Hoard better!

---

**Happy coding! 🐉**
