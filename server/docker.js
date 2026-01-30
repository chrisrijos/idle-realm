import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getDockerData() {
  const containers = [];

  try {
    // Get containers with more details
    const { stdout: psOut } = await execAsync(
      `docker ps -a --format '{"id":"{{.ID}}","name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}","state":"{{.State}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}","size":"{{.Size}}"}' 2>/dev/null || echo ''`
    );

    for (const line of psOut.trim().split('\n').filter(Boolean)) {
      try {
        const container = JSON.parse(line);

        // Parse uptime from status (e.g., "Up 3 hours")
        const uptimeMatch = container.status.match(/Up\s+(.+?)(?:\s+\(|$)/);
        const uptimeStr = uptimeMatch ? uptimeMatch[1] : '';

        // Parse ports
        const ports = parsePorts(container.ports);

        containers.push({
          id: `docker-${container.id}`,
          containerId: container.id,
          name: container.name,
          type: 'docker-container',
          image: container.image,
          status: container.status,
          running: container.state === 'running',
          ports,
          portsStr: ports.length > 0 ? ports.map(p => p.display).join(', ') : 'none',
          uptimeStr,
          size: container.size || 'N/A',
          cpu: 0,
          mem: 0,
          health: 'unknown',
          restartCount: 0
        });
      } catch (e) {
        // Skip malformed JSON
      }
    }

    // Get health and restart count via inspect (batch for efficiency)
    if (containers.length > 0) {
      try {
        const ids = containers.map(c => c.containerId).join(' ');
        const { stdout: inspectOut } = await execAsync(
          `docker inspect --format '{{.Id}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.RestartCount}}' ${ids} 2>/dev/null || echo ''`
        );

        const inspectMap = {};
        for (const line of inspectOut.trim().split('\n').filter(Boolean)) {
          const [fullId, health, restarts] = line.split('|');
          const shortId = fullId.substring(0, 12);
          inspectMap[shortId] = {
            health: health || 'none',
            restartCount: parseInt(restarts) || 0
          };
        }

        for (const container of containers) {
          const info = inspectMap[container.containerId];
          if (info) {
            container.health = info.health;
            container.restartCount = info.restartCount;
          }
        }
      } catch (e) {}
    }

    // Get stats for running containers (quick, no-stream)
    const runningContainers = containers.filter(c => c.running);
    if (runningContainers.length > 0) {
      try {
        const { stdout: statsOut } = await execAsync(
          `docker stats --no-stream --format '{"id":"{{.ID}}","cpu":"{{.CPUPerc}}","mem":"{{.MemPerc}}","netio":"{{.NetIO}}","blockio":"{{.BlockIO}}"}' 2>/dev/null || echo ''`
        );

        const statsMap = {};
        for (const line of statsOut.trim().split('\n').filter(Boolean)) {
          try {
            const stat = JSON.parse(line);
            statsMap[stat.id] = {
              cpu: parseFloat(stat.cpu) || 0,
              mem: parseFloat(stat.mem) || 0,
              netio: stat.netio || '0B / 0B',
              blockio: stat.blockio || '0B / 0B'
            };
          } catch (e) {}
        }

        // Merge stats
        for (const container of containers) {
          const stats = statsMap[container.containerId];
          if (stats) {
            container.cpu = stats.cpu;
            container.mem = stats.mem;
            container.netio = stats.netio;
            container.blockio = stats.blockio;
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    // Docker not running or not installed - that's ok
  }

  return { containers };
}

function parsePorts(portsStr) {
  if (!portsStr) return [];

  const ports = [];
  // Parse format like "0.0.0.0:8080->80/tcp, 443/tcp"
  const parts = portsStr.split(', ');

  for (const part of parts) {
    const match = part.match(/(?:(\d+\.\d+\.\d+\.\d+):)?(\d+)->(\d+)\/(\w+)/);
    if (match) {
      ports.push({
        host: match[2],
        container: match[3],
        protocol: match[4],
        display: `${match[2]}→${match[3]}`
      });
    } else {
      // Just exposed port without mapping
      const expMatch = part.match(/(\d+)\/(\w+)/);
      if (expMatch) {
        ports.push({
          container: expMatch[1],
          protocol: expMatch[2],
          display: expMatch[1]
        });
      }
    }
  }

  return ports;
}
