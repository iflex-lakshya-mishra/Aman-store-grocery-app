# Google-Only User Login Upgrade TODO

## Status: [ ] In Progress

## Steps (Complete one by one):

1. **[ ] Supabase Setup (User)**: Enable Google OAuth provider. Add `googleId text` column to `users` table (nullable).

2. **[ ] Update src/lib/auth.js**: Enhance `signInWithGoogle` and `normalizeUser` to extract and store `googleId` from `user.identities[0].identity_data.sub`.

3. **[ ] Update src/lib/shopApi.js**: 
   - usersApi: Add `getByGoogleId`, update `getByEmail/upsert` to handle `googleId`.
   - Use `googleId` for lookups if present (primary for Google users).

4. **[ ] Create src/pages/AdminLogin.jsx**: Clone Login.jsx but **email/password only** (no profile fields, no Google button, no toggle/signup).

5. **[ ] Update src/pages/Login.jsx**: **Google-only** - Remove all form fields (email/pass/name/phone/address/location), keep only Google button. Redirect user to `/orders` or `/dashboard`.

6. **[ ] Update src/App.jsx**:
   - Add route `/admin/login` → AdminLogin (public).
   - Update ProtectedRoute: distinguish user vs admin.
   - Add `/dashboard` protected user route if needed (redirect from Navbar?).

7. **[ ] Test User Flow**: Google login → users table upsert with googleId → access /orders (protected).

8. **[ ] Test Admin Flow**: /admin/login email/pass → /admin/*.

9. **[ ] RLS Policies**: Supabase dashboard - users/ords read/write own row (auth.uid or googleId/email match).

10. **[ ] Cleanup**: Remove unused localStorage fallbacks if stable.

**Notes**: Keep admin email/password intact. Frontend UI minimal changes. Backend unused.

Updated on: Step-by-step progress tracked here.
