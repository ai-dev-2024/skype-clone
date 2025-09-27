import logger from './logger';

// Metrics data structure
interface MetricsData {
  [key: string]: {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    lastUpdated: Date;
  };
}

// Performance metrics collector
class MetricsCollector {
  private metrics: MetricsData = {};
  private counters: { [key: string]: number } = {};
  private timers: { [key: string]: number } = {};

  // Counter metrics
  incrementCounter(name: string, value: number = 1): void {
    this.counters[name] = (this.counters[name] || 0) + value;
    logger.debug(`Counter incremented: ${name} = ${this.counters[name]}`);
  }

  getCounter(name: string): number {
    return this.counters[name] || 0;
  }

  // Timing metrics
  startTimer(name: string): void {
    this.timers[name] = Date.now();
  }

  endTimer(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    delete this.timers[name];

    this.recordMetric(name, duration);
    logger.debug(`Timer completed: ${name} took ${duration}ms`);

    return duration;
  }

  // Record custom metrics
  recordMetric(name: string, value: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = {
        count: 0,
        sum: 0,
        avg: 0,
        min: Infinity,
        max: -Infinity,
        lastUpdated: new Date()
      };
    }

    const metric = this.metrics[name];
    metric.count++;
    metric.sum += value;
    metric.avg = metric.sum / metric.count;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.lastUpdated = new Date();
  }

  // Get metrics summary
  getMetrics(): MetricsData {
    return { ...this.metrics };
  }

  // Get specific metric
  getMetric(name: string) {
    return this.metrics[name];
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {};
    this.counters = {};
    this.timers = {};
    logger.info('Metrics reset');
  }

  // Export metrics for monitoring systems
  exportMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      counters: { ...this.counters },
      metrics: { ...this.metrics },
      activeTimers: Object.keys(this.timers).length
    };
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Convenience functions
export const incrementCounter = (name: string, value?: number) =>
  metricsCollector.incrementCounter(name, value);

export const getCounter = (name: string) =>
  metricsCollector.getCounter(name);

export const startTimer = (name: string) =>
  metricsCollector.startTimer(name);

export const endTimer = (name: string) =>
  metricsCollector.endTimer(name);

export const recordMetric = (name: string, value: number) =>
  metricsCollector.recordMetric(name, value);

export const getMetrics = () =>
  metricsCollector.getMetrics();

export const exportMetrics = () =>
  metricsCollector.exportMetrics();

// Middleware for request metrics
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const method = req.method;
  const path = req.route?.path || req.path;

  // Increment request counter
  incrementCounter(`requests.${method}.${path}`);
  incrementCounter('requests.total');

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    recordMetric(`response_time.${method}.${path}`, duration);
    recordMetric('response_time.all', duration);

    // Track status codes
    incrementCounter(`status.${res.statusCode}`);

    logger.debug(`Request completed: ${method} ${path} ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Performance monitoring decorator
export function measurePerformance(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timerName = `${operationName}.${propertyKey}`;
      startTimer(timerName);

      try {
        const result = await originalMethod.apply(this, args);
        endTimer(timerName);
        return result;
      } catch (error) {
        endTimer(timerName);
        incrementCounter(`errors.${operationName}.${propertyKey}`);
        throw error;
      }
    };

    return descriptor;
  };
}

export default metricsCollector;
