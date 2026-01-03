# Performance Testing & Responsive Design Guide

## Part 1: Lighthouse Performance Testing

### Step-by-Step Instructions

#### 1. Open Your Application
1. Start your frontend development server:
   ```bash
   cd micro-intern-frontend
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:5173` (or your deployed URL)

#### 2. Open Chrome DevTools
- **Method 1:** Press `F12` on your keyboard
- **Method 2:** Right-click on the page → Select "Inspect"
- **Method 3:** Press `Ctrl + Shift + I` (Windows/Linux) or `Cmd + Option + I` (Mac)

#### 3. Navigate to Lighthouse Tab
1. In DevTools, look for the tabs at the top: Elements, Console, Sources, Network, etc.
2. Click on the **"Lighthouse"** tab
3. If you don't see it, click the `>>` icon to see more tabs

#### 4. Configure Lighthouse Settings
1. **Categories to test:** Check all boxes:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - ✅ Progressive Web App (optional)

2. **Device:** Select one of:
   - **Desktop** (for PC testing)
   - **Mobile** (for mobile device simulation)

3. **Mode:** Select "Navigation" (default)

#### 5. Generate Report
1. Click the **"Analyze page load"** button (or "Generate report")
2. Wait for the analysis to complete (usually 30-60 seconds)
3. The report will appear showing scores for each category

#### 6. Take Screenshots
1. **Full Report Screenshot:**
   - Scroll to see all scores at the top
   - Press `Windows + Shift + S` (Windows) or `Cmd + Shift + 4` (Mac) to take screenshot
   - Or use browser screenshot: Right-click → "Capture node screenshot"

2. **Network Analysis Screenshot:**
   - In the Lighthouse report, scroll down to find "Network" or "Network Requests" section
   - Take screenshot showing:
     - Total requests
     - Total size
     - Load time
     - Resource breakdown

#### 7. Test Multiple Pages
Repeat the process for:
- Login page (`/login`)
- Student Dashboard (`/dashboard/student`)
- Browse Jobs page (`/dashboard/student/browse`)
- Employer Dashboard (`/dashboard/employer`)
- Admin Dashboard (`/dashboard/admin`)

---

## Part 2: Mobile Responsiveness Testing

### Step-by-Step Instructions

#### 1. Open Chrome DevTools
- Press `F12` or `Ctrl + Shift + I`

#### 2. Enable Device Toolbar
- **Method 1:** Press `Ctrl + Shift + M` (Windows/Linux) or `Cmd + Shift + M` (Mac)
- **Method 2:** Click the device icon in the DevTools toolbar (📱 icon)

#### 3. Select Device Preset
Click the device dropdown and select:
- **Mobile:** iPhone 12 Pro, iPhone SE, Samsung Galaxy S20
- **Tablet:** iPad Air, iPad Pro
- **Desktop:** Responsive (custom size)

#### 4. Test Different Viewports

**Mobile (320px - 768px):**
1. Select "iPhone 12 Pro" (390 x 844)
2. Navigate through pages:
   - Login page
   - Dashboard
   - Browse jobs
   - Profile
3. Take screenshots of each page

**Tablet (768px - 1024px):**
1. Select "iPad Air" (820 x 1180)
2. Test the same pages
3. Verify layout adapts properly

**Desktop (1024px+):**
1. Select "Responsive" and set width to 1920px
2. Test all pages
3. Verify full layout is visible

#### 5. Test Responsive Breakpoints
Manually adjust width to test:
- **320px** (smallest mobile)
- **768px** (tablet start)
- **1024px** (desktop start)
- **1920px** (large desktop)

#### 6. Take Screenshots
For each viewport size, capture:
1. Login page
2. Dashboard (Student/Employer/Admin)
3. Browse jobs page
4. Profile page
5. Messages/Chat page

---

## Part 3: Network Analysis

### Using Chrome DevTools Network Tab

#### 1. Open Network Tab
1. Open DevTools (`F12`)
2. Click **"Network"** tab

#### 2. Clear Previous Requests
- Click the 🚫 icon to clear network log

#### 3. Reload Page
- Press `Ctrl + R` (or `Cmd + R` on Mac)
- Or click the refresh button

#### 4. Analyze Network Requests
Look for:
- **Total requests:** Number of files loaded
- **Total size:** Combined size of all resources
- **Load time:** Time to load page
- **Waterfall chart:** Shows loading sequence

#### 5. Filter Requests
Use filters to see:
- **JS:** JavaScript files
- **CSS:** Stylesheet files
- **Img:** Images
- **XHR/Fetch:** API calls

#### 6. Take Screenshot
- Capture the network tab showing:
  - Request list
  - Sizes
  - Load times
  - Waterfall visualization

---

## Part 4: Responsive Design Implementation Checklist

### Current Responsive Features to Verify

#### 1. Navigation Menu
- [ ] Mobile: Hamburger menu (collapsed)
- [ ] Tablet: Sidebar or top nav
- [ ] Desktop: Full navigation bar

#### 2. Dashboard Cards
- [ ] Mobile: Single column layout
- [ ] Tablet: 2 columns
- [ ] Desktop: 3-4 columns

#### 3. Job Cards
- [ ] Mobile: Full width cards
- [ ] Tablet: 2 cards per row
- [ ] Desktop: 3 cards per row

#### 4. Forms
- [ ] Mobile: Full width inputs
- [ ] Tablet: 2-column layout where appropriate
- [ ] Desktop: Multi-column forms

#### 5. Tables
- [ ] Mobile: Horizontal scroll or card view
- [ ] Tablet: Scrollable table
- [ ] Desktop: Full table display

#### 6. Chat Interface
- [ ] Mobile: Full screen chat
- [ ] Tablet: Side-by-side layout
- [ ] Desktop: Full chat interface

---

## Part 5: Quick Testing Checklist

### Before Taking Screenshots

- [ ] Frontend server is running
- [ ] Backend server is running
- [ ] Database is connected
- [ ] You're logged in (for protected pages)
- [ ] Browser cache is cleared (Ctrl + Shift + Delete)

### Pages to Test

**Public Pages:**
- [ ] Login page
- [ ] Signup page
- [ ] Forgot password page

**Student Pages:**
- [ ] Dashboard
- [ ] Browse jobs
- [ ] Applications
- [ ] Messages
- [ ] Profile
- [ ] Portfolio
- [ ] Payments
- [ ] Certificates

**Employer Pages:**
- [ ] Dashboard
- [ ] Post job
- [ ] My jobs
- [ ] Applications
- [ ] Messages
- [ ] Profile
- [ ] Payments

**Admin Pages:**
- [ ] Dashboard
- [ ] Students
- [ ] Employers
- [ ] Anomalies
- [ ] All tasks
- [ ] All chats

---

## Part 6: Common Issues & Solutions

### Issue: Lighthouse scores are low
**Solutions:**
- Enable code splitting
- Optimize images (compress, use WebP)
- Minimize JavaScript bundles
- Use lazy loading for images
- Enable browser caching

### Issue: Mobile layout breaks
**Solutions:**
- Check CSS media queries
- Verify viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Test with actual device if possible
- Use flexbox/grid for responsive layouts

### Issue: Network requests are slow
**Solutions:**
- Check API response times
- Enable compression (gzip)
- Use CDN for static assets
- Implement request caching
- Optimize database queries

---

## Part 7: Screenshot Organization

### Recommended Folder Structure
```
screenshots/
├── lighthouse/
│   ├── login-desktop.png
│   ├── login-mobile.png
│   ├── dashboard-desktop.png
│   └── network-analysis.png
├── mobile/
│   ├── login-iphone12.png
│   ├── dashboard-iphone12.png
│   └── browse-jobs-iphone12.png
├── tablet/
│   ├── login-ipad.png
│   └── dashboard-ipad.png
└── desktop/
    ├── login-1920px.png
    └── dashboard-1920px.png
```

---

## Quick Reference Commands

### Chrome DevTools Shortcuts
- `F12` - Open/Close DevTools
- `Ctrl + Shift + M` - Toggle device toolbar
- `Ctrl + Shift + I` - Open DevTools
- `Ctrl + R` - Reload page
- `Ctrl + Shift + Delete` - Clear cache

### Testing URLs
- Local: `http://localhost:5173`
- Deployed: [Your deployed URL]

---

## Next Steps

1. **Run Lighthouse tests** on all major pages
2. **Test responsive design** on mobile, tablet, desktop
3. **Take screenshots** following the guide above
4. **Document issues** found during testing
5. **Fix any responsive issues** before final submission

Good luck with your testing! 🚀



