# sync-backend.ps1
# This script safely syncs backend and ML files from the 'jay' branch.
# It does NOT merge git histories, avoiding unrelated history conflicts.

Write-Host "Fetching latest from origin..." -ForegroundColor Cyan
git fetch origin

Write-Host "Restoring 'voice-biomarker-backend', 'src', and 'api.py' from origin/jay..." -ForegroundColor Cyan
git checkout origin/jay -- voice-biomarker-backend src api.py record_and_predict.py model.py feature_extractor.py train.py data_loader.py predict.py demo.py requirements.txt

Write-Host "Sync complete! The changes are now staged." -ForegroundColor Green
Write-Host "You can now commit these changes with:" -ForegroundColor Yellow
Write-Host "  git commit -m `"Synced latest backend/ML from jay`"" -ForegroundColor Yellow
