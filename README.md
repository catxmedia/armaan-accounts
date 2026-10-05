# Armaan Accounts (Digital Khata)

A simple, fast, modern mobile-first digital Khata designed to track money given to different people and calculate the exact financing cost generated at **17.5% per annum** based on actual elapsed time.

---

## 🌟 Purpose & Features

### 1. **17.5% Financing Cost Engine**
- **Formula:** `Amount × 17.5% × (elapsed time / 1 year)`
- **Precision:** Calculated on exact date and time (not just full days).
- **Sectioned Partial Repayments:** When money is partially repaid, the financing cost on the returned portion stops immediately at that exact timestamp. The financing cost continues only on the remaining outstanding principal.
- **Permanent Freeze on Settlement:** When the balance reaches ₹0, the transaction is marked as **Closed**, the exact final financing cost is frozen permanently, and live calculation stops.
- **Current Daily Cost:** `Current Outstanding × 17.5% ÷ 365`.
- **Today's Cost:** Live calculation of financing cost accumulated since 00:00:00 IST today.

### 2. **Mobile-First Digital Khata UI**
- Designed specifically for smartphone screens with large touch-friendly buttons, clear currency typography (`₹`), and easy-to-use bottom sheets.
- Modern color-coded statuses:
  - 🔵 **Open**: Active transaction with money outstanding.
  - 🟡 **Partially Repaid**: Some money returned, balance remaining.
  - 🔴 **Overdue**: Expected return date has passed with money outstanding.
  - 🟢 **Closed**: Outstanding balance has reached ₹0.

### 3. **Person Account & Independent Transactions**
- Each person has one account card and full khata timeline.
- Multiple transactions for the same person are kept strictly separate and calculated independently.
- When recording a return, you manually enter the returned amount and select which transaction it belongs to.

### 4. **Audit Trail & Edit History**
- If a mistake is made, transactions can be edited while preserving an immutable history of old vs new values, timestamps, and reasons.

### 5. **Reports & Data Backup**
- **Reports:** Person-wise breakdown, monthly totals, and CSV export.
- **Backup:** Export complete data as a JSON file and import anytime with warning safeguards.
- **Offline / Local Storage:** Data persists automatically in the browser's local storage.

---

## 🚀 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser. Open Developer Tools in mobile emulation mode (iPhone / Android) to experience the mobile layout.

### Production Build

```bash
npm run build
```

The output will be generated in the `dist/` directory.

---

## 🌐 Deployment to GitHub & Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit of Armaan Accounts"
git branch -M main
git remote add origin https://github.com/<your-username>/armaan-accounts.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Import your GitHub repository `armaan-accounts`.
3. Framework Preset: **Vite**
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

`vercel.json` is already configured to support client-side single page routing.
