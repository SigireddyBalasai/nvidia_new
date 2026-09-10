# Remove CustomA2UIMessageRenderer.tsx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused CustomA2UIMessageRenderer.tsx component and its index.ts file, then verify the build succeeds.

**Architecture:** Simple file deletion with verification steps to ensure no broken dependencies.

**Tech Stack:** TypeScript, Vite, React

## Global Constraints
- Node.js environment
- Vite build system
- TypeScript type checking
- ESLint linting

---

### Task 1: Delete CustomA2UIMessageRenderer.tsx

**Files:**
- Delete: `src/components/a2ui/CustomA2UIMessageRenderer.tsx`

**Interfaces:**
- Consumes: None
- Produces: File removed from filesystem

- [ ] **Step 1: Delete the component file**

```bash
rm src/components/a2ui/CustomA2UIMessageRenderer.tsx
```

- [ ] **Step 2: Verify file is deleted**

```bash
ls -la src/components/a2ui/CustomA2UIMessageRenderer.tsx
```

Expected: File not found error

- [ ] **Step 3: Commit**

```bash
git add src/components/a2ui/CustomA2UIMessageRenderer.tsx
git commit -m "feat: remove unused CustomA2UIMessageRenderer.tsx"
```

### Task 2: Delete index.ts

**Files:**
- Delete: `src/components/a2ui/index.ts`

**Interfaces:**
- Consumes: None
- Produces: File removed from filesystem

- [ ] **Step 1: Delete the index file**

```bash
rm src/components/a2ui/index.ts
```

- [ ] **Step 2: Verify file is deleted**

```bash
ls -la src/components/a2ui/index.ts
```

Expected: File not found error

- [ ] **Step 3: Commit**

```bash
git add src/components/a2ui/index.ts
git commit -m "feat: remove unused a2ui index.ts"
```

### Task 3: Run TypeScript type checking

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: Deleted files from Tasks 1-2
- Produces: Verification that no type errors exist

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 2: Verify no import errors**

Check output for any mentions of missing modules or broken imports.

- [ ] **Step 3: Commit (if needed)**

If typecheck passes, no commit needed. If errors are found, fix them and commit.

### Task 4: Run ESLint linting

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: Deleted files from Tasks 1-2
- Produces: Verification that no linting errors exist

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 2: Verify no linting issues**

Check output for any linting errors related to the removed files.

- [ ] **Step 3: Commit (if needed)**

If lint passes, no commit needed. If errors are found, fix them and commit.

### Task 5: Run production build

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: Deleted files from Tasks 1-2
- Produces: Successful production build

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Verify build output**

Check that the build completes without errors and generates output files.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: verify successful build after removing unused component"
```

## Verification Checklist
- [ ] Both files successfully deleted
- [ ] TypeScript type checking passes
- [ ] ESLint linting passes  
- [ ] Production build succeeds
- [ ] No broken imports or references