# Open-Source Libraries - Quick Reference Card

**Print this for quick lookup during development**

---

## Phase 2 Stack (Install Now)

```bash
npm install framer-motion @tanstack/react-query confetti @sentry/react
```

---

## Library Comparison

| Library | Size | Effort | Impact | Use Case |
|---------|------|--------|--------|----------|
| **Framer Motion** | 40KB | 1/5 | HIGH | Animations |
| **React Query** | 35KB | 2/5 | MEDIUM | Data caching |
| **Confetti** | 3KB | 1/5 | MEDIUM | Celebrations |
| **Sentry** | 60KB | 1/5 | MEDIUM | Error tracking |
| React Spring | 25KB | 2/5 | MEDIUM | Physics animations |
| Zustand | 2KB | 2/5 | HIGH | State management |
| Supabase | 50KB | 3/5 | HIGH | Backend |
| Socket.io | 45KB | 3/5 | HIGH | Real-time |

---

## Framer Motion Cheat Sheet

### Basic Animation
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.5 }}
/>
```

### Spring Physics
```typescript
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### Stagger Children
```typescript
variants={{
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}}
```

### Hover Effect
```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

---

## React Query Cheat Sheet

### Basic Query
```typescript
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: async () => { /* fetch */ },
  staleTime: 1000 * 60 * 5
});
```

### Mutation
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* post */ },
  onSuccess: () => { /* refetch */ }
});
```

---

## Confetti Cheat Sheet

### Basic Confetti
```typescript
import confetti from 'confetti';

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});
```

---

## Sentry Cheat Sheet

### Initialize
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampleRate: 1.0
});
```

### Wrap App
```typescript
export default Sentry.withProfiler(App);
```

---

## Implementation Checklist

### Week 1
- [ ] Install Phase 2 stack
- [ ] Update ComboCounter
- [ ] Add stagger to DailyChallengesPanel
- [ ] Enhance StatsModal
- [ ] Set up Sentry

### Week 2
- [ ] Add confetti effects
- [ ] Implement React Query
- [ ] Test on mobile
- [ ] Performance check
- [ ] Deploy

### Week 3-4
- [ ] Polish animations
- [ ] User testing
- [ ] Bug fixes
- [ ] Release v1.1

---

## Performance Tips

1. **Use `will-change`**
```typescript
style={{ willChange: "transform, opacity" }}
```

2. **Reduce Motion**
```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

3. **Lazy Load**
```typescript
const [isVisible, setIsVisible] = useState(false);
useEffect(() => {
  setTimeout(() => setIsVisible(true), 100);
}, []);
```

---

## Bundle Size Targets

| Phase | Target | Current | Status |
|-------|--------|---------|--------|
| Phase 1 | 237KB | 237KB | ✅ |
| Phase 2 | <160KB gzip | ~150KB | ✅ |
| Phase 3 | <170KB gzip | ~175KB | ✅ |
| Phase 4 | <200KB gzip | ~200KB | ✅ |

---

## Common Issues & Solutions

### Framer Motion
**Issue**: Animations not smooth  
**Solution**: Use `type: "spring"` instead of `ease`

**Issue**: Performance lag  
**Solution**: Use `will-change` CSS property

### React Query
**Issue**: Data not updating  
**Solution**: Check `staleTime` and `cacheTime`

**Issue**: Too many requests  
**Solution**: Increase `staleTime` value

### Confetti
**Issue**: Confetti not showing  
**Solution**: Check z-index and pointer-events

### Sentry
**Issue**: Events not tracking  
**Solution**: Check DSN and `tracesSampleRate`

---

## Documentation Links

| Library | Docs | GitHub |
|---------|------|--------|
| Framer Motion | https://www.framer.com/motion/ | github.com/framer/motion |
| React Query | https://tanstack.com/query | github.com/TanStack/query |
| Confetti | https://github.com/kirilv/confetti-js | github.com/kirilv/confetti-js |
| Sentry | https://docs.sentry.io/ | github.com/getsentry/sentry-javascript |
| React Spring | https://www.react-spring.dev/ | github.com/pmndrs/react-spring |
| Zustand | https://github.com/pmndrs/zustand | github.com/pmndrs/zustand |
| Supabase | https://supabase.com/docs | github.com/supabase/supabase |
| Socket.io | https://socket.io/docs/ | github.com/socketio/socket.io |

---

## Quick Commands

### Install Phase 2
```bash
npm install framer-motion @tanstack/react-query confetti @sentry/react
```

### Install Phase 3
```bash
npm install react-spring
```

### Install Phase 4
```bash
npm install @supabase/supabase-js socket.io-client
```

### Check Bundle Size
```bash
npm run build
# Check dist/ folder size
```

### Analyze Bundle
```bash
npm install -g webpack-bundle-analyzer
# Add to build script
```

---

## Timeline

| Phase | Duration | Libraries | Status |
|-------|----------|-----------|--------|
| Phase 2 | 2-3 weeks | Framer Motion, React Query, Confetti, Sentry | 🔴 NOW |
| Phase 3 | 2-3 weeks | React Spring | 🟡 SOON |
| Phase 4 | 4-5 weeks | Supabase, Socket.io | 🟢 LATER |

---

## Success Metrics

- [ ] Animations smooth (60fps)
- [ ] Bundle size < 160KB gzipped
- [ ] Mobile performance good
- [ ] Error tracking working
- [ ] No console errors
- [ ] User engagement up
- [ ] Crash rate down

---

## Support

- **Framer Motion**: Discord community
- **React Query**: GitHub discussions
- **Sentry**: Support portal
- **Socket.io**: GitHub issues

---

**Last Updated**: December 8, 2025  
**Status**: Ready for Implementation
