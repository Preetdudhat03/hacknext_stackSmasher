# HackNext Git Collaboration Workflow

This document outlines the safe and conflict-free workflow for all developers working on the `hacknext_stackSmasher` repository. 

To avoid the `unrelated histories` error and breaking code via overwrites, we will use **selective folder synchronization** rather than raw branch merging.

## Branch Roles
1. `main` - The production integration branch. The final build runs from here.
2. `jaineel` - Frontend development branch.
3. `jay` - Backend and ML development branch.

## 1. Frontend Developer (Jaineel) Workflow

You will code strictly on the `jaineel` branch.
1. Make sure you are on your branch: `git checkout jaineel`
2. Do your coding in `voice-biomaker-frontend` or other UI folders.
3. Commit your changes: `git add .` and `git commit -m "Update UI"`
4. Push to GitHub: `git push origin jaineel`

If you need the latest Backend API changes to test with:
1. `git fetch origin`
2. `.\scripts\sync-backend.ps1`
3. This brings the latest backend without causing git tree conflicts. You can commit the backend changes into your branch.

## 2. Backend / ML Developer (Jay) Workflow

You will code strictly on the `jay` branch.
1. Make sure you are on your branch: `git checkout jay`
2. Do your Python / ML coding.
3. Commit your changes: `git add .` and `git commit -m "Update Model"`
4. Push to GitHub: `git push origin jay`

If you need the latest Frontend UI changes to test with:
1. `git fetch origin`
2. `.\scripts\sync-frontend.ps1`
3. This drops Jaineel's latest frontend folder into your workspace safely.

## 3. Integrator (Final Deployment to `main`)

The integrator brings everything together into `main`.
1. `git checkout main`
2. Get the latest from both branches:
   - `.\scripts\sync-frontend.ps1`
   - `.\scripts\sync-backend.ps1`
3. Resolve any port overlapping or `.env` conflicts.
4. `git commit -m "Integrated latest from frontend and backend"`
5. `git push origin main`

---

## ⛔ Safety Rules
- **DO NOT** run `git merge jaineel` or `git merge jay` if it complains about unrelated histories. Use the scripts instead!
- **DO NOT** commit the `node_modules`, `.next`, or `venv` folders. They are already in `.gitignore`, but never force add them.
- If your push is rejected because of a file size, verify you aren't committing a massive `.pkl` model accidentally.
