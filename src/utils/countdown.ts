export interface CountdownConfig {
  /** Duration of the animation in milliseconds */
  duration?: string;
  /** Threshold for intersection observer */
  threshold?: string;
  /** Callback that fires when countdown starts */
  onStart?: () => void;
  /** Callback that fires when countdown completes */
  onEnd?: () => void;
  /** Whether to reset on re-entry */
  reset?: 'true' | 'false';
}

export class Countdown {
  private rAF: number | null = null;
  private startTime: number | null = null;
  private remaining: number;
  private paused = true;
  private observer: IntersectionObserver | null = null;
  private frameVal: number;
  private readonly shouldReset: boolean;

  private defaults: CountdownConfig = {
    duration: '1000',
    threshold: '0',
    reset: 'false',
  };

  constructor(
    private countdownElement: HTMLElement,
    private eventDate: Date,
    private options: CountdownConfig = {}
  ) {
    this.options = {
      ...this.defaults,
      ...options,
    };

    this.shouldReset = this.options.reset === 'true';
    this.frameVal = this.getTotalSeconds();
    this.remaining = this.frameVal;

    this.setupIntersectionObserver();
  }

  private getTotalSeconds(): number {
    const now = new Date();
    return Math.max(0, Math.floor((this.eventDate.getTime() - now.getTime()) / 1000));
  }

  private formatNumber(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private setupIntersectionObserver(): void {
    const threshold = Number(this.options.threshold) / 100;

    this.observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (this.shouldReset || !this.startTime) {
            this.resetAnimation();
            this.paused = false;
            this.startAnimation();
          } else if (this.paused) {
            this.pauseResume();
          }
        } else {
          if (!this.paused) {
            this.pauseResume();
          }
        }
      },
      {
        threshold,
        rootMargin: '0px',
      }
    );

    this.observer.observe(this.countdownElement);
  }

  public start(): void {
    this.startAnimation();
  }

  private startAnimation(): void {
    if (this.rAF) return;

    this.paused = false;
    this.countdownElement.setAttribute('aria-busy', 'true');
    this.options.onStart?.();

    this.rAF = requestAnimationFrame(this.handleCountdownAnimation);
  }

  private handleCountdownAnimation = (timestamp: number): void => {
    if (!this.startTime) {
      this.startTime = timestamp;
      this.frameVal = this.getTotalSeconds();
    }

    const progress = timestamp - this.startTime;
    this.remaining = Math.max(0, this.frameVal - Math.floor(progress / 1000));

    // Convert to hours, minutes, seconds
    const hours = Math.floor(this.remaining / 3600);
    const minutes = Math.floor((this.remaining % 3600) / 60);
    const seconds = this.remaining % 60;

    // Update countdown display with formatted time
    const timeString = `${this.formatNumber(hours)} h : ${this.formatNumber(minutes)} m : ${this.formatNumber(seconds)} s`;
    this.countdownElement.textContent = timeString;

    if (this.remaining > 0) {
      this.rAF = requestAnimationFrame(this.handleCountdownAnimation);
    } else {
      this.countdownElement.setAttribute('aria-busy', 'false');
      this.options.onEnd?.();
      this.stop();
    }
  };

  public stop(): void {
    if (this.rAF) {
      cancelAnimationFrame(this.rAF);
      this.rAF = null;
    }
    this.paused = true;
    this.countdownElement.setAttribute('aria-busy', 'false');
  }

  private pauseResume(): void {
    if (this.paused) {
      this.startTime = null;
      this.startAnimation();
    } else {
      this.stop();
    }
  }

  private resetAnimation(): void {
    this.stop();
    this.startTime = null;
    this.frameVal = this.getTotalSeconds();
    this.remaining = this.frameVal;

    const hours = Math.floor(this.remaining / 3600);
    const minutes = Math.floor((this.remaining % 3600) / 60);
    const seconds = this.remaining % 60;

    const timeString = `${this.formatNumber(hours)}:${this.formatNumber(minutes)}:${this.formatNumber(seconds)}`;
    this.countdownElement.textContent = timeString;
  }

  public destroy(): void {
    this.stop();
    this.observer?.disconnect();
  }
}
