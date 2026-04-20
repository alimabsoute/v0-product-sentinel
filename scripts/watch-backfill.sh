#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# watch-backfill.sh — Prism backfill watchdog
#
# Monitors backfill.log staleness every 60s. Alerts with Windows beeps +
# balloon tip notification if the process stalls or dies.
#
# Usage (run in a separate terminal):
#   bash scripts/watch-backfill.sh
#
# Adjust STALE_THRESHOLD_SECS if your months take longer than 5 min each.
# ─────────────────────────────────────────────────────────────────────────────

LOG_FILE="backfill.log"
PROGRESS_FILE=".backfill-progress.json"
STALE_THRESHOLD_SECS=300   # 5 min without a log write = something's wrong
CHECK_INTERVAL_SECS=60

# ─── Windows alert (beeps + balloon tip) ─────────────────────────────────────
alert() {
  local title="$1"
  local body="$2"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🚨  BACKFILL ALERT — $(date '+%H:%M:%S')"
  echo "  $title"
  echo "  $body"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # 5 urgent beeps + Windows balloon notification
  powershell.exe -NonInteractive -Command "
    \$beeps = 1,880,600, 200,0,1, 880,600, 200,0,1, 880,600, 200,0,1, 1100,800, 200,0,1, 1100,800
    [console]::beep(880, 600); Start-Sleep -Milliseconds 150
    [console]::beep(880, 600); Start-Sleep -Milliseconds 150
    [console]::beep(880, 600); Start-Sleep -Milliseconds 150
    [console]::beep(1100, 900); Start-Sleep -Milliseconds 150
    [console]::beep(1100, 900)

    try {
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      \$icon = [System.Windows.Forms.NotifyIcon]::new()
      \$icon.Icon = [System.Drawing.SystemIcons]::Warning
      \$icon.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Warning
      \$icon.BalloonTipTitle = '🚨 Prism Backfill Alert'
      \$icon.BalloonTipText  = '${body} — Restart: pnpm backfill:ph'
      \$icon.Visible = \$true
      \$icon.ShowBalloonTip(20000)
      Start-Sleep -Seconds 20
      \$icon.Dispose()
    } catch {}
  " 2>/dev/null || printf '\a\a\a\a\a'
}

# ─── Log staleness check (via node — reliable on Windows) ────────────────────
log_age_secs() {
  node --input-type=module <<'EOF' 2>/dev/null
import { statSync } from 'fs'
try {
  const age = Math.round((Date.now() - statSync('backfill.log').mtimeMs) / 1000)
  process.stdout.write(String(age))
} catch { process.stdout.write('99999') }
EOF
}

# ─── Progress summary ────────────────────────────────────────────────────────
progress_summary() {
  node --input-type=module <<'EOF' 2>/dev/null
import { readFileSync } from 'fs'
try {
  const p = JSON.parse(readFileSync('.backfill-progress.json', 'utf-8'))
  const months = (p.completedMonths ?? []).length
  const inserted = p.totalInserted ?? '?'
  process.stdout.write(`${months} months | ${inserted} inserted`)
} catch { process.stdout.write('progress unknown') }
EOF
}

# ─── Main loop ────────────────────────────────────────────────────────────────
echo ""
echo "  👁  Prism Backfill Watchdog"
echo "  Log:       $LOG_FILE"
echo "  Threshold: ${STALE_THRESHOLD_SECS}s without update = alert"
echo "  Interval:  check every ${CHECK_INTERVAL_SECS}s"
echo ""
echo "  Press Ctrl+C to stop watching."
echo ""

ALERTED=false

while true; do
  AGE=$(log_age_secs)
  SUMMARY=$(progress_summary)

  if [ "$AGE" -ge 99999 ]; then
    if [ "$ALERTED" = false ]; then
      alert "Log file missing" "backfill.log not found — is the process still running?"
      ALERTED=true
    fi
  elif [ "$AGE" -gt "$STALE_THRESHOLD_SECS" ]; then
    if [ "$ALERTED" = false ]; then
      alert "Backfill stalled (${AGE}s silent)" "No log output for ${AGE}s. Process likely died."
      ALERTED=true
    fi
  else
    # Reset alert gate once log is fresh again (e.g. after manual restart)
    if [ "$ALERTED" = true ]; then
      echo "  ✅  [$(date '+%H:%M:%S')] Backfill resumed — alert cleared"
      ALERTED=false
    fi
    echo "  ✓  [$(date '+%H:%M:%S')] OK — ${SUMMARY} | log ${AGE}s ago"
  fi

  sleep "$CHECK_INTERVAL_SECS"
done
