// Simple global refresh bus to coordinate forced updates after state-changing txs
// No external deps; works in browser and SSR-safe fallbacks

type Listener = (reason?: string) => void;

class RefreshBus {
  private listeners: Set<Listener> = new Set();

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  off(listener: Listener) {
    this.listeners.delete(listener);
  }

  emit(reason?: string) {
    for (const l of Array.from(this.listeners)) {
      try { l(reason); } catch { /* noop */ }
    }
  }
}

const bus = new RefreshBus();

export function onGlobalRefresh(listener: Listener) {
  return bus.on(listener);
}

export function triggerGlobalRefresh(reason?: string) {
  bus.emit(reason);
}
