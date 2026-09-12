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
  // needs `credentials: true` to cross that boundary at all.
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
