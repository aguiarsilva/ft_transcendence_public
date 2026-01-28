import type WebSocket from 'ws';

export type PresenceStatus = 'online' | 'offline';

interface PresenceRecord {
  userId: number;
  status: PresenceStatus;
  lastSeen: number;
  connections: Set<WebSocket>;
}

class PresenceStore {
  private records = new Map<number, PresenceRecord>();
  private OFFLINE_GRACE_MS = 60_000;
  private DISCONNECT_DELAY_MS = 5_000;
  private offlineTimers = new Map<number, NodeJS.Timeout>();

  touch(userId: number, ws?: WebSocket) {
    const now = Date.now();
    let rec = this.records.get(userId);
    if (!rec) {
      rec = { userId, status: 'online', lastSeen: now, connections: new Set() };
      this.records.set(userId, rec);
    }
    rec.lastSeen = now;
    rec.status = 'online';
    if (ws) rec.connections.add(ws);

    const t = this.offlineTimers.get(userId);
    if (t) {
      clearTimeout(t);
      this.offlineTimers.delete(userId);
    }
  }

  heartbeat(userId: number) {
    const rec = this.records.get(userId);
    if (!rec) return;
    rec.lastSeen = Date.now();

    if (rec.connections.size === 0) {
      this.scheduleOffline(userId);
    }
  }

  removeConnection(userId: number, ws: WebSocket) {
    const rec = this.records.get(userId);
    if (!rec) return;
    rec.connections.delete(ws);
    if (rec.connections.size === 0) {
      setTimeout(() => this.scheduleOffline(userId), this.DISCONNECT_DELAY_MS);
    }
  }

  private scheduleOffline(userId: number) {
    const rec = this.records.get(userId);
    if (!rec) return;

    // If user reconnected, do nothing
    if (rec.connections.size > 0) return;

    // Clear previous timer if any
    const prev = this.offlineTimers.get(userId);
    if (prev) clearTimeout(prev);

    const now = Date.now();
    const target = rec.lastSeen + this.OFFLINE_GRACE_MS;
    const delay = Math.max(0, target - now);

    const timer = setTimeout(() => {
      // Final check
      const latest = this.records.get(userId);
      if (!latest) return;
      if (latest.connections.size > 0) return;
      if (Date.now() - latest.lastSeen >= this.OFFLINE_GRACE_MS) {
        latest.status = 'offline';
      }
      this.offlineTimers.delete(userId);
    }, delay);

    this.offlineTimers.set(userId, timer);
  }

  getStatus(userId: number) {
    const rec = this.records.get(userId);
    if (!rec) return { status: 'offline' as PresenceStatus, lastSeen: null as number | null };
    return { status: rec.status, lastSeen: rec.lastSeen };
  }

  getStatuses(userIds: number[]) {
    return userIds.map(id => {
      const { status, lastSeen } = this.getStatus(id);
      return { userId: id, status, lastSeen };
    });
  }
}

export const presenceStore = new PresenceStore();
