# Fix Mobile Search Issue

## Status: In Progress

### Step 1: Create MobileSearchPage.jsx [✅ DONE]
Full-screen search input page for mobile at `/search`.

### Step 2: Update App.jsx routes [✅ DONE]
- `/search` → MobileSearchPage
- `/search-results` → SearchResultsPage

### Step 3: Fix BottomNav.jsx [✅ DONE]
Change Search link from `/search?q=` to `/search`

### Step 4: Update SearchBar.jsx [✅ DONE]
Navigate to `/search-results?q=` on submit

### Step 5: Update SearchResultsPage.jsx [✅ DONE]
Already handles searchParams.get('q') correctly - minimal changes needed

### Step 6: Test & Complete [✅ READY]
- cd aman-store && npm run dev
- Test mobile bottom nav → search input → type → results
- Test desktop navbar search works unchanged

**No UI changes - fixes routing only.**
