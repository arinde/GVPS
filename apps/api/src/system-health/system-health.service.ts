import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MonitoredService, ServiceHealthStatus } from "@prisma/client";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

const EMAIL_AUDIT_ACTIONS = ["email.sent", "email.failed"];
const LATENCY_BUCKETS = [
  { label: "< 50ms", max: 50 },
  { label: "50–150ms", max: 150 },
  { label: "150–400ms", max: 400 },
  { label: "400ms+", max: Infinity },
];

type Check = { status: ServiceHealthStatus; latencyMs: number };

/**
 * A periodic snapshot of each dependency's reachability — not a log of every
 * API call, which would write to the database on every request forever with
 * no retention policy. A cron records one row per service every 5 minutes;
 * the status page turns the series into uptime charts. If the database
 * itself is down, the cron tick that would record that fact also needs the
 * database to write it — a gap in the series is the signal in that case.
 */
@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async recordChecks(): Promise<void> {
    const schools = await this.prisma.school.findMany({ select: { id: true } });
    if (schools.length === 0) return;

    const database = await this.pingDatabase();
    try {
      for (const school of schools) {
        const email = await this.deriveEmailHealth(school.id);
        await this.prisma.serviceHealthCheck.createMany({
          data: [
            { schoolId: school.id, service: MonitoredService.DATABASE, ...database },
            { schoolId: school.id, service: MonitoredService.API_SERVER, status: ServiceHealthStatus.UP, latencyMs: 0 },
            { schoolId: school.id, service: MonitoredService.EMAIL, ...email },
          ],
        });
      }
    } catch (error) {
      this.logger.warn(`Could not record a health check: ${String(error)}`);
    }
  }

  /** A right-now snapshot for the status page — never stale, unlike the history table. */
  async liveStatus(actor: AuthenticatedStaff) {
    const database = await this.pingDatabase();
    const email = await this.deriveEmailHealth(actor.schoolId);
    const emailConfigured =
      Boolean(this.config.get<string>("SENDLIB_API_KEY")) && Boolean(this.config.get<string>("EMAIL_FROM"));
    const memory = process.memoryUsage();

    return {
      checkedAt: new Date().toISOString(),
      database: { status: database.status, latencyMs: database.latencyMs },
      email: { status: email.status, configured: emailConfigured },
      server: {
        status: ServiceHealthStatus.UP,
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        environment: this.config.get<string>("NODE_ENV") ?? "development",
        memoryUsedMb: Math.round(memory.rss / (1024 * 1024)),
      },
    };
  }

  /** The recorded history turned into chart-ready series — FEATURES.md §11 "system administration". */
  async history(actor: AuthenticatedStaff, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const checks = await this.prisma.serviceHealthCheck.findMany({
      where: { schoolId: actor.schoolId, checkedAt: { gte: since } },
      orderBy: { checkedAt: "asc" },
    });

    return {
      windowDays: days,
      uptimeByDay: {
        database: uptimeSeries(checks, MonitoredService.DATABASE),
        email: uptimeSeries(checks, MonitoredService.EMAIL),
        apiServer: uptimeSeries(checks, MonitoredService.API_SERVER),
      },
      statusShare: {
        database: statusShare(checks, MonitoredService.DATABASE),
        email: statusShare(checks, MonitoredService.EMAIL),
        apiServer: statusShare(checks, MonitoredService.API_SERVER),
      },
      latencyHistogram: latencyHistogram(checks, MonitoredService.DATABASE),
    };
  }

  private async pingDatabase(): Promise<Check> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: ServiceHealthStatus.UP, latencyMs: Date.now() - start };
    } catch {
      return { status: ServiceHealthStatus.DOWN, latencyMs: Date.now() - start };
    }
  }

  /**
   * No live ping to the email provider on every check — that would hammer it
   * every 5 minutes for no reason. The most recent send attempt already in
   * the audit trail (every EmailService.send call writes one) says whether
   * it is working right now.
   */
  private async deriveEmailHealth(schoolId: string): Promise<Check> {
    const latest = await this.prisma.auditLog.findFirst({
      where: { schoolId, action: { in: EMAIL_AUDIT_ACTIONS } },
      orderBy: { createdAt: "desc" },
      select: { action: true },
    });
    const status = latest?.action === "email.failed" ? ServiceHealthStatus.DOWN : ServiceHealthStatus.UP;
    return { status, latencyMs: 0 };
  }
}

type HealthRow = { service: MonitoredService; status: ServiceHealthStatus; latencyMs: number; checkedAt: Date };

function uptimeSeries(checks: HealthRow[], service: MonitoredService): { date: string; uptimePercent: number }[] {
  const byDay = new Map<string, { up: number; total: number }>();
  for (const check of checks) {
    if (check.service !== service) continue;
    const day = check.checkedAt.toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { up: 0, total: 0 };
    bucket.total++;
    if (check.status === ServiceHealthStatus.UP) bucket.up++;
    byDay.set(day, bucket);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { up, total }]) => ({ date, uptimePercent: total ? Math.round((up / total) * 100) : 100 }));
}

function statusShare(checks: HealthRow[], service: MonitoredService): { name: string; value: number }[] {
  const rows = checks.filter((check) => check.service === service);
  const up = rows.filter((check) => check.status === ServiceHealthStatus.UP).length;
  return [
    { name: "Up", value: up },
    { name: "Down", value: rows.length - up },
  ];
}

function latencyHistogram(checks: HealthRow[], service: MonitoredService): { bucket: string; count: number }[] {
  const counts = new Map(LATENCY_BUCKETS.map((bucket) => [bucket.label, 0]));
  for (const check of checks) {
    if (check.service !== service) continue;
    const bucket = LATENCY_BUCKETS.find((candidate) => check.latencyMs < candidate.max);
    if (bucket) counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
  }
  return LATENCY_BUCKETS.map((bucket) => ({ bucket: bucket.label, count: counts.get(bucket.label) ?? 0 }));
}
