import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getTmuxData() {
  const sessions = [];
  const panes = [];

  try {
    // Get sessions with more details
    const { stdout: sessionOut } = await execAsync(
      "tmux list-sessions -F '#{session_name}|#{session_attached}|#{session_activity}|#{session_created}|#{session_windows}' 2>/dev/null || echo ''"
    );

    const now = Math.floor(Date.now() / 1000);

    for (const line of sessionOut.trim().split('\n').filter(Boolean)) {
      const [name, attached, activity, created, windows] = line.split('|');
      const createdTs = parseInt(created) || now;
      const uptime = now - createdTs;

      sessions.push({
        id: `tmux-session-${name}`,
        name,
        type: 'tmux-session',
        attached: attached === '1',
        activity: parseInt(activity) || 0,
        active: attached === '1',
        created: createdTs,
        uptime,
        uptimeStr: formatUptime(uptime),
        windowCount: parseInt(windows) || 1
      });
    }

    // Get panes with more details
    const { stdout: paneOut } = await execAsync(
      "tmux list-panes -a -F '#{session_name}|#{pane_id}|#{pane_current_command}|#{pane_active}|#{pane_pid}|#{pane_current_path}|#{pane_width}|#{pane_height}|#{pane_dead}|#{window_name}' 2>/dev/null || echo ''"
    );

    for (const line of paneOut.trim().split('\n').filter(Boolean)) {
      const [session, id, command, active, pid, path, width, height, dead, windowName] = line.split('|');
      panes.push({
        id: `tmux-pane-${id}`,
        session,
        paneId: id,
        type: 'tmux-pane',
        command: command || 'shell',
        active: active === '1',
        pid: parseInt(pid) || 0,
        path: path || '~',
        dimensions: `${width}x${height}`,
        dead: dead === '1',
        windowName: windowName || ''
      });
    }
  } catch (err) {
    // tmux not running or not installed - that's ok
  }

  return { sessions, panes };
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
