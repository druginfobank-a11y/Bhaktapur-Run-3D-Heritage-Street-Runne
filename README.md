# Bhaktapur Run: 3D Heritage Street Runner

A 3D endless and landmark-route runner action game set in the historic brick streets and pagoda squares of Bhaktapur, Nepal. Powered by Three.js PBR graphics and live OpenStreetMap route synchronization.

---

## 🚀 Deploying to Vercel

This application is built with **Vite**, **React**, **Tailwind CSS**, and **Three.js**. It is fully prepared for zero-configuration deployment on [Vercel](https://vercel.com).

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push or import this repository to **GitHub / GitLab / Bitbucket**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Add New > Project**.
3. Select your repository.
4. Vercel will automatically detect **Vite**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**.

---

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI locally (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Run the deployment command from the project root directory:
   ```bash
   vercel
   ```
4. To deploy to production directly:
   ```bash
   vercel --prod
   ```

---

## 🛠️ Local Development & Testing Production Build

### Run Dev Server
```bash
npm run dev
```

### Test Production Build
```bash
npm run build
npm run preview
```

---

## ⚡ Configuration Files Included

- **`vercel.json`**: Pre-configured with SPA route rewrites (`/(.*) -> /index.html`) so refreshing on any route works seamlessly.
- **`vite.config.ts`**: Configured for optimized asset bundling and path aliases (`@/*`).
