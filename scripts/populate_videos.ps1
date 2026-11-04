# ============================================================
# SmartQEye Coastal — Video Volume Provisioning Script
# Links or copies physical Kerala Police drone footage into
# ../SmartQEye_Costal_Videos and ../Intrusion_detection
# ============================================================

$ErrorActionPreference = "Continue"

$targetVideos = Resolve-Path "..\SmartQEye_Costal_Videos" -ErrorAction SilentlyContinue
if (-not $targetVideos) {
    New-Item -ItemType Directory -Path "..\SmartQEye_Costal_Videos" -Force | Out-Null
    $targetVideos = (Resolve-Path "..\SmartQEye_Costal_Videos").Path
} else {
    $targetVideos = $targetVideos.Path
}

$targetIntrusion = Resolve-Path "..\Intrusion_detection" -ErrorAction SilentlyContinue
if (-not $targetIntrusion) {
    New-Item -ItemType Directory -Path "..\Intrusion_detection" -Force | Out-Null
    $targetIntrusion = (Resolve-Path "..\Intrusion_detection").Path
} else {
    $targetIntrusion = $targetIntrusion.Path
}

Write-Host "==> Target Videos Directory: $targetVideos" -ForegroundColor Cyan
Write-Host "==> Target Intrusion Directory: $targetIntrusion" -ForegroundColor Cyan

function Link-Or-Copy($sourceFile, $destFile) {
    if (-not (Test-Path $sourceFile)) {
        Write-Warning "Source file not found: $sourceFile"
        return
    }
    if (Test-Path $destFile) {
        Remove-Item $destFile -Force
    }
    try {
        New-Item -ItemType HardLink -Path $destFile -Target $sourceFile -Force | Out-Null
        Write-Host "  [LINKED] $(Split-Path $destFile -Leaf) -> $(Split-Path $sourceFile -Leaf)" -ForegroundColor Green
    } catch {
        Copy-Item -Path $sourceFile -Destination $destFile -Force
        Write-Host "  [COPIED] $(Split-Path $destFile -Leaf) -> $(Split-Path $sourceFile -Leaf)" -ForegroundColor Yellow
    }
}

# Source Pools
$ksumDrone       = "D:\POLICE DRONE FOOTAGES\Demo-Video2-KSUM.mp4"
$ksumAnnotated   = "D:\Processed Videos\Demo-Video2-KSUM_annotated.mp4"
$tracking        = "D:\Processed Videos\Tracking.mp4"
$pongala         = "D:\POLICE DRONE FOOTAGES\aattukaal_pongaala.mp4"
$kaloor          = "D:\POLICE DRONE FOOTAGES\Kaloor_Stampede.mp4"
$roadside        = "D:\POLICE DRONE FOOTAGES\roadside.MP4"
$hubFront        = "D:\POLICE DRONE FOOTAGES\hub-front.MP4"
$beachDensity    = "D:\Processed Videos\Zone_segmentation_BeachDensity_estimatioin.mp4"
$infraDetection  = "D:\Processed Videos\final_infrastructure_detection_high_conf1.mp4"
$processed1      = "D:\Processed Videos\processed_video1.mp4"
$demoVideo1      = "D:\POLICE DRONE FOOTAGES\Demo video1.mp4"

# Fallback if any missing
if (-not (Test-Path $ksumDrone)) { $ksumDrone = $ksumAnnotated }

# 1. Flagship Muthalapozhi Breakwater Channel (RGB_7.mp4)
Link-Or-Copy $ksumDrone "$targetVideos\RGB_7.mp4"

# 2. RGB Feeds 1 through 15
$rgbPool = @(
    $demoVideo1,      # RGB_1: Vizhinjam Seaport Optical Patrol
    $beachDensity,    # RGB_2: Kovalam Light House Beach Perimeter
    $hubFront,        # RGB_3: Shanghumugham Shoreline Watch
    $processed1,      # RGB_4: Poovar Estuary Marine Patrol
    $tracking,        # RGB_5: Adimalathura Fishing Harbor Line
    $ksumAnnotated,   # RGB_6: Chowara Cliff High-Angle Watch
    $ksumDrone,       # RGB_7: Muthalapozhi Breakwater Channel (Reserved)
    $infraDetection,  # RGB_8: Neendakara Deep Harbor Outer Approach
    $pongala,         # RGB_9: Alappuzha Pier & Coastline Sweep
    $demoVideo1,      # RGB_10: Kochi Port & Naval Base Perimeter
    $tracking,        # RGB_11: Beypore Deep Harbour Patrol
    $ksumDrone,       # RGB_12: Kannur Azhikkal Estuary Watch
    $hubFront,        # RGB_13: Kasaragod Bekal Coastal Horizon
    $beachDensity,    # RGB_14: Varkala Cliff Top Shoreline Scan
    $roadside         # RGB_15: Thottappally Spillway Marine Sector
)

for ($i = 1; $i -le 15; $i++) {
    if ($i -ne 7) {
        $source = $rgbPool[$i - 1]
        if (-not (Test-Path $source)) { $source = $ksumDrone }
        Link-Or-Copy $source "$targetVideos\RGB_$i.mp4"
    }
}

# 3. Thermal Feeds (Thermal_1 .. Thermal_4)
for ($i = 1; $i -le 4; $i++) {
    Link-Or-Copy $ksumDrone "$targetVideos\Thermal_$i.mp4"
}

# 4. Night Vision Feeds (Night_Vision, Night_Vision_2 .. Night_Vision_5)
Link-Or-Copy $ksumDrone "$targetVideos\Night_Vision.mp4"
for ($i = 2; $i -le 5; $i++) {
    Link-Or-Copy $ksumDrone "$targetVideos\Night_Vision_$i.mp4"
}

# 5. Context Intelligence Scenarios
Link-Or-Copy $ksumDrone "$targetVideos\kerala_coastal_surveillance_v4.mp4"
Link-Or-Copy $ksumDrone "$targetVideos\kerala_coastal_cloudy.mp4"
Link-Or-Copy $ksumDrone "$targetVideos\kerala_coastal_night.mp4"
Link-Or-Copy $ksumDrone "$targetVideos\kerala_coastal_thermal.mp4"

# 6. Specific Analytics Pages
Link-Or-Copy $pongala "$targetVideos\Crowd_Video.mp4"
Link-Or-Copy $kaloor "$targetVideos\Anomaly_detection_video.mp4"
Link-Or-Copy $roadside "$targetVideos\Vehicle1.mp4"
Link-Or-Copy $roadside "$targetVideos\Vehicle2.mp4"
Link-Or-Copy $tracking "$targetVideos\Maritime_detection_video.mp4"
Link-Or-Copy $ksumAnnotated "$targetVideos\Person_RE_ID.mp4"

# 7. Intrusion Detection Folder
Link-Or-Copy $tracking "$targetIntrusion\Intrusion_video.mp4"
Link-Or-Copy $tracking "$targetVideos\Intrusion_video.mp4"

Write-Host "`n==> Provisioning complete! Verifying files in $targetVideos..." -ForegroundColor Cyan
Get-ChildItem -Path $targetVideos | Select-Object Name, Length | Format-Table -AutoSize
