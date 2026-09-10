# Design: Remove CustomA2UIMessageRenderer.tsx

## Purpose
Remove the unused `CustomA2UIMessageRenderer.tsx` component and its associated `index.ts` file from the frontend codebase.

## Current State
- `CustomA2UIMessageRenderer.tsx` exports a React component for rendering MCP apps activities
- `index.ts` only re-exports this component  
- No other files import from either file (verified via grep search)
- Build system uses Vite with `npm run build` command

## Proposed Changes
1. Delete `src/components/a2ui/CustomA2UIMessageRenderer.tsx`
2. Delete `src/components/a2ui/index.ts`
3. Verify no remaining references exist
4. Run comprehensive checks (typecheck, lint, build)

## Success Criteria
- Both files successfully deleted
- No TypeScript compilation errors
- No linting errors
- Successful production build
- No broken imports or references

## Risk Assessment
Very low risk. The component appears unused based on our search, and we're verifying with full typecheck and build.

## Implementation Steps
1. Remove files using filesystem operations
2. Run `npm run typecheck` to verify no compile errors
3. Run `npm run lint` to check for linting issues
4. Run `npm run build` to ensure successful production build
5. Verify no broken imports by checking build output

## Dependencies
- None. This is an isolated change.

## Testing
- Type checking will catch any import errors
- Build process will verify no runtime dependencies are broken
- Linting will ensure code style consistency