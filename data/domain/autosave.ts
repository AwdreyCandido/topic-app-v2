export type SaveStatus = "saved" | "pending" | "saving" | "error";

export class AutosaveQueue<T> {
  private pending: T | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | undefined;
  private failure: unknown;
  private status: SaveStatus = "saved";
  private listeners = new Set<() => void>();

  constructor(
    private readonly save: (snapshot: T) => Promise<unknown>,
    private readonly delay = 600,
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getStatus = () => this.status;

  private publish(status: SaveStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener());
  }

  schedule(snapshot: T) {
    this.pending = structuredClone(snapshot);
    this.failure = undefined;
    clearTimeout(this.timer);
    this.publish("pending");
    this.timer = setTimeout(() => {
      void this.flush().catch(() => undefined);
    }, this.delay);
  }

  hasPending() {
    return (
      this.pending !== undefined ||
      this.running !== undefined ||
      this.status === "error"
    );
  }

  flush = async (): Promise<void> => {
    clearTimeout(this.timer);
    if (this.running) {
      await this.running;
      if (this.pending !== undefined) return this.flush();
      return;
    }
    if (this.pending === undefined) {
      if (this.failure) throw this.failure;
      return;
    }
    const process = async () => {
      while (this.pending !== undefined) {
        const snapshot = this.pending;
        this.pending = undefined;
        this.publish("saving");
        try {
          await this.save(snapshot);
          this.failure = undefined;
        } catch (error) {
          if (this.pending === undefined) this.pending = snapshot;
          this.failure = error;
          this.publish("error");
          throw error;
        }
      }
      this.publish("saved");
    };
    this.running = process();
    try {
      await this.running;
    } finally {
      this.running = undefined;
    }
  };
}

const activeQueues = new Set<{
  hasPending(): boolean;
  flush(): Promise<void>;
}>();

export function registerAutosave(queue: {
  hasPending(): boolean;
  flush(): Promise<void>;
}) {
  activeQueues.add(queue);
  return () => {
    if (!queue.hasPending()) activeQueues.delete(queue);
    else
      void queue
        .flush()
        .then(() => activeQueues.delete(queue))
        .catch(() => undefined);
  };
}

export const hasPendingSaves = () =>
  [...activeQueues].some((queue) => queue.hasPending());

export async function flushAllSaves() {
  for (const queue of activeQueues) await queue.flush();
}
