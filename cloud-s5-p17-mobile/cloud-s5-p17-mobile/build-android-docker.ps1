# Script PowerShell pour compiler l'APK Android avec Docker et Java 21

Write-Host "Build Android APK avec Docker (Java 21)..." -ForegroundColor Cyan

# 1. Build de l'image Docker
Write-Host "`nConstruction de l'image Docker..." -ForegroundColor Yellow
docker build -f Dockerfile.android -t ionic-android-builder .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la construction de l'image Docker" -ForegroundColor Red
    exit 1
}

# 2. Compiler l'APK dans le conteneur
Write-Host "`nCompilation de l'APK Android..." -ForegroundColor Yellow
docker run --rm -v "${PWD}/android:/app/android" -v "${PWD}/dist:/app/dist" ionic-android-builder bash -c "cd android && chmod +x gradlew && ./gradlew assembleDebug"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la compilation" -ForegroundColor Red
    exit 1
}

Write-Host "`nAPK compile avec succes!" -ForegroundColor Green
Write-Host "Fichier APK: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
