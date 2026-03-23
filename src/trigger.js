'use strict';

const { execFile, exec } = require('child_process');
const os = require('os');

const PROMPT = 'process trello tasks';

function triggerWindows() {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinFocus {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
    public static bool ForceFocus(IntPtr target) {
        IntPtr fg = GetForegroundWindow();
        if (fg == target) return true;
        uint pid = 0;
        uint fgThread = GetWindowThreadProcessId(fg, out pid);
        uint myThread = GetCurrentThreadId();
        keybd_event(0x12, 0, 0, UIntPtr.Zero);
        keybd_event(0x12, 0, 2, UIntPtr.Zero);
        if (fgThread != myThread) {
            AttachThreadInput(myThread, fgThread, true);
            ShowWindow(target, 9);
            SetForegroundWindow(target);
            AttachThreadInput(myThread, fgThread, false);
        } else {
            ShowWindow(target, 9);
            SetForegroundWindow(target);
        }
        System.Threading.Thread.Sleep(200);
        return GetForegroundWindow() == target;
    }
}
"@

$p = Get-Process | Where-Object { $_.MainWindowTitle -match 'Cursor' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Host 'NO_WINDOW'; exit 1 }
$hwnd = $p.MainWindowHandle

$ok = [WinFocus]::ForceFocus($hwnd)
if (-not $ok) {
    Start-Sleep -Milliseconds 500
    $ok = [WinFocus]::ForceFocus($hwnd)
}
if (-not $ok) { Write-Host 'NO_FOCUS'; exit 1 }
Start-Sleep -Milliseconds 400

[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 300

[System.Windows.Forms.SendKeys]::SendWait('^l')
Start-Sleep -Milliseconds 2000

[System.Windows.Forms.SendKeys]::SendWait('${PROMPT}')
Start-Sleep -Milliseconds 600

[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Write-Host 'ok'
`.trim();

  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { timeout: 30000 },
      (err, stdout, stderr) => {
        const out = (stdout || '').trim();
        if (err) return reject(new Error(err.message));
        if (out === 'NO_WINDOW') return reject(new Error('Cursor window not found'));
        if (out === 'NO_FOCUS') return reject(new Error('Could not focus Cursor window'));
        resolve(out);
      },
    );
  });
}

function triggerMacOS() {
  const script = `
tell application "Cursor" to activate
delay 0.8
tell application "System Events"
  key code 53
  delay 0.3
  keystroke "l" using command down
  delay 2.0
  keystroke "${PROMPT}"
  delay 0.6
  keystroke return
end tell
`.trim();

  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], { timeout: 30000 }, (err) => {
      if (err) return reject(err);
      resolve('ok');
    });
  });
}

function triggerLinux() {
  const commands = [
    'wmctrl -a Cursor 2>/dev/null || xdotool search --name Cursor windowactivate',
    'sleep 0.8',
    'xdotool key Escape',
    'sleep 0.3',
    'xdotool key ctrl+l',
    'sleep 2.0',
    `xdotool type --delay 12 "${PROMPT}"`,
    'sleep 0.6',
    'xdotool key Return',
  ].join(' && ');

  return new Promise((resolve, reject) => {
    exec(commands, { timeout: 30000 }, (err) => {
      if (err) return reject(err);
      resolve('ok');
    });
  });
}

async function triggerCursorAgent(cardName) {
  const platform = os.platform();
  const fn =
    platform === 'win32'
      ? triggerWindows
      : platform === 'darwin'
        ? triggerMacOS
        : triggerLinux;

  console.log(`[trigger] Activating Cursor Agent for "${cardName}" (${platform})...`);

  const MAX_RETRIES = 2;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await fn();
      console.log('[trigger] Cursor Agent triggered successfully');
      return;
    } catch (err) {
      console.log(`[trigger] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.log('[trigger] All attempts failed — open Cursor and say "process trello tasks" manually');
}

module.exports = { triggerCursorAgent };
