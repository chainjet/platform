import { NestFactory } from '@nestjs/core'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // exposes req.rawBody which is needed by the discord hook
    ...(process.env.NODE_ENV === 'development'
      ? {
          cors: {
            origin: process.env.FRONTEND_ENDPOINT,
            credentials: true,
          },
        }
      : {}),
  })
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
      cookie: {
        secure: process.env.NODE_ENV !== 'development',
      },
    }),
  )
  await app.listen(process.env.PORT ?? 8000)
}

void bootstrap()
