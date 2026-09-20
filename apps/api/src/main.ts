import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  // Refresh tokens ride in an httpOnly cookie (FEATURES.md §1.2) — needs
  // this to populate req.cookies.
  app.use(cookieParser());
  // The frontend (apps/web) is a separate origin, and the refresh cookie
  // needs `credentials: true` to cross that boundary at all. FRONTEND_ORIGIN
  // takes a comma-separated list, so a preview deployment can be allowed
  // beside the live site. Never "*": that would forbid credentials.
  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  // Hosts such as Render set PORT and expect the server on every interface,
  // not just localhost.
  const port = process.env.PORT ?? 3001;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
