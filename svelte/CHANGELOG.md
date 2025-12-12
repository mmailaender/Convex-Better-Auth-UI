# auth

## 0.4.4

### Patch Changes

- fix: breaking error that happened if Popover.Content contains an {#each} block with reactive data during teardown. e.g. closing OrganizationProfile while viewing Members.

## 0.4.3

### Patch Changes

- fix: return always authState as part of SSR to return correctly authState during unauthenticated state.

## 0.4.2

### Patch Changes

- Small fixed

## 0.4.1

### Patch Changes

- chore: set only password in auth.constants.ts

## 0.4.0

### Minor Changes

- feat: New CLI allwowing to set up auth UI in new projects in ~5 minutes (Before ~15 Minutes)
- feat: Added SSR support for isAuthenticated and isLoading auth states

## 0.3.0

### Minor Changes

- feat: add api-key and device-authorization

## 0.2.1

### Patch Changes

- fix: resolved lint errors

## 0.2.0

### Minor Changes

- feat: add device authorization plugin

## 0.1.2

### Patch Changes

- feat: added api-keys plugin

## 0.1.1

### Patch Changes

- feat: replace active-org placeholder with actual organization slug in URL

## 0.1.0

### Minor Changes

- fix: Upgrade to convex-svelte skip-query to fix effect in teardown errors

## 0.0.17

### Patch Changes

- refactor: invert role query condition and extract UseRolesArgs type definition

## 0.0.16

### Patch Changes

- chore: upgrade to skeleton v4

## 0.0.15

### Patch Changes

- ## Fixes
  - fix: close user profile dialog after account deletion
  - fix: add reset functionality and step validation to SignIn component

## 0.0.14

### Patch Changes

- fix: move profile dialogs to AuthDialogProvider to support multiple OrganizationSwitcher and UserButton instances

## 0.0.13

### Patch Changes

- ## Features
  - Add token to locals and improve organization switcher loading state

  ## Refactors
  - Reorder parallel API queries for consistency with return object

  ## Chore
  - Update dependencies
  - Upgrade @convex-dev/better-auth from 0.8.6 to 0.8.8
  - Upgrade convex-better-auth-svelte to 0.1.1
  - Add dark/light mode banner images to README files

## 0.0.12

### Patch Changes

- ## Features
  - Add SSR (Server-Side Rendering) support for fast initial component load
  - Improve social authentication flow with per-provider submitting state tracking
  - add icons and labels for 27 OAuth providers with tree-shaking support for Account linking

  ## Refactors
  - Rename OrganizationInfo component to GeneralSettings for better clarity
  - Track submitting state per provider in social auth flow to prevent race conditions

## 0.0.11

### Patch Changes

## Features

- Add `setActiveOrganization` mutation to handle session organization assignment
- Add error handling to organization invitation acceptance
- Group invitation failures by error code and display separate toasts per error type

## Fixes

- Resolve overlapping dialogs when revoking invitations
- Consolidate role selection into a single `selectedRole` state variable to prevent desync

## 0.0.10

### Patch Changes

## Refactors

- Move auth constants types to separate file for better code organization

## Chore

- Update dependencies
- Add readme

## 0.0.9

### Patch Changes

- feature: added support for over 20+ social provider from better auth

## 0.0.8

### Patch Changes

- Update to @convex-dev/better-auth@8.6.0

## 0.0.7

### Patch Changes

- This release includes new features around Better Auth, lifecycle flows for users/organizations, DX and type-safety improvements, and several fixes and UI refinements.

  ## Features
  - 05f70b9 (2025-09-18) chore: add changesets for release management
  - d367834 (2025-09-16) feat: add user deletion with organization cleanup and GitHub auth support
  - adf7a46 (2025-09-16) feat: add loading states to organization and user deletion flows
  - ca83f2a (2025-09-16) feat: add loading state and fix member filtering in organization leave flow
  - 54f2aeb (2025-09-15) feat: add callback URL support to password authentication flow
  - 6f29d5e (2025-09-15) feat: integrate betterAuth module and streamline user data schema
  - 85bae51 (2025-09-12) feat: add dialog type for user and organization profile modals
  - fc31707 (2025-09-10) chore: bump version to 0.0.6 and add defaultPaths to build config
  - 90a663b (2025-09-10) feat: enable auth providers based on AUTH_CONSTANTS

  ## Fixes
  - b54ab42 (2025-09-16) fix: include API error status code and status in error messages for better debugging
  - 1013677 (2025-09-15) fix: remove false flag spamming error logs
  - bb7b098 (2025-09-15) fix: add type keyword to Id import for better TypeScript type checking
  - 90a663b (2025-09-10) fix: correct type inference for user session in organization creation flow

  ## Refactors
  - 701a067 (2025-09-17) refactor: remove deprecated betterAuth adapter
  - 9c41af8 (2025-09-17) refactor: move organization deletion logic to dedicated module and add profile image cleanup
  - fa57d14 (2025-09-16) refactor: simplify member avatar rendering with Avatar component
  - 38025cd (2025-09-16) refactor: replace native select elements with Ark UI Select components
  - 55edbd3 (2025-09-16) refactor: update icon imports to use individual paths from @lucide/svelte/icons
  - 10514a3 (2025-09-15) refactor: split getUser into getUserById and getUserByEmail with improved type safety

  ## Chore / Dependencies
  - 05f70b9 (2025-09-18) chore: add changesets for release management
  - 9fb2b9c (2025-09-17) chore: upgrade dependencies including @convex-dev/better-auth and svelte-easy-crop
  - 637db96 (2025-09-15) chore: add return type annotations to user queries and mutations
  - 4a73e2d (2025-09-14) chore: upgrade @convex-dev/better-auth from 0.8.0-alpha.9 to 0.8.0
  - 750de4d (2025-09-11) chore: update convex and auth dependencies to latest versions
  - 22628c3 (2025-09-11) chore: Upgrade to better-auth 1.3.8
  - fc31707 (2025-09-10) chore: bump version to 0.0.6 and add defaultPaths to build config

  ## Style / UI polish
  - 1013677 (2025-09-15) style: adjust padding and width of invite members dialog
  - bc9c1cf (2025-09-15) style: standardize dialog padding and spacing across components
