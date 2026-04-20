#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run-backfill.sh — Safe backfill launcher with failure alert
#
# Wraps `pnpm backfill:ph` so that if the process exits non-zero, you get
# Windows beeps + a balloon notification immediately — no need to watch a log.
#
# Usage:
#   bash scripts/run-backfill.sh                     # resume from progress file
#   bash scripts/run-backfill.sh --from=2023-01      # specific start month
#
# For ongoing monitoring, also run in a second terminal:
#   bash scripts/watch-backfill.sh
# ─────────────────────────────────────────────────────────────────────────────

alert_failure() {
  local exit_code="$1"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🚨  BACKFILL FAILED (exit $exit_code) — $(date '+%H:%M:%S')"
  echo "  Restart: bash scripts/run-backfill.sh"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  powershell.exe -NonInteractive -Command "
    [console]::beep(440, 800); Start-Sleep -Milliseconds 100
    [console]::beep(330, 800); Start-Sleep -Milliseconds 100
    [console]::beep(220, 1200)

    try {
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      \$icon = [System.Windows.Forms.NotifyIcon]::new()
      \$icon.Icon = [System.Drawing.SystemIcons]::Error
      \$icon.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Error
      \$icon.BalloonTipTitle = '🚨 Backfill Crashed (exit ${exit_code})'
      \$icon.BalloonTipText  = 'Run: bash scripts/run-backfill.sh to restart'
      \$icon.Visible = \$true
      \$icon.ShowBalloonTip(30000)
      Start-Sleep -Seconds 30
      \$icon.Dispose()
    } catch {}
  " 2>/dev/null || printf '\a\a\a'
}

alert_success() {
  echo ""
  echo "  ✅  Backfill completed successfully — $(date '+%H:%M:%S')"
  powershell.exe -NonInteractive -Command "
    [console]::beep(660, 200); Start-Sleep -Milliseconds 80
    [console]::beep(880, 200); Start-Sleep -Milliseconds 80
    [console]::beep(1100, 400)
  " 2>/dev/null || true
}

# Pass any extra args (--from=, --to=, etc.) straight through to the script
EXTRA_ARGS="$*"

echo "  🔄  Starting backfill — $(date '+%H:%M:%S')"
echo "  Args: ${EXTRA_ARGS:-(none — resuming from .backfill-progress.json)}"
echo ""

pnpm backfill:ph $EXTRA_ARGS
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
  alert_failure "$EXIT_CODE"
  exit "$EXIT_CODE"
else
  alert_success
fi
