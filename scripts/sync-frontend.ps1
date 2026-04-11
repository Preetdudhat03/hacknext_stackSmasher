# sync-frontend.ps1
# This script safely syncs the 'voice-biomaker-frontend' folder from the 'jaineel' branch.
# It does NOT merge git histories, avoiding unrelated history conflicts.

Write-Host "Fetching latest from origin..." -ForegroundColor Cyan
git fetch origin

Write-Host "Restoring 'voice-biomaker-frontend' folder from origin/jaineel..." -ForegroundColor Cyan
# This will overwrite the local frontend folder with the exact state from jaineel's branch
git checkout origin/jaineel -- voice-biomaker-frontend

Write-Host "Sync complete! The changes are now staged." -ForegroundColor Green
Write-Host "You can now commit these changes with:" -ForegroundColor Yellow
Write-Host "  git commit -m `"Synced latest frontend from jaineel`"" -ForegroundColor Yellow
