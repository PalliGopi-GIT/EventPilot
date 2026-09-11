const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
  try {
    console.log('🚀 Creating database schema...');

    // Create users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        "avatarUrl" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ users table created');

    // Create google_connections table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS google_connections (
        id TEXT PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL,
        "googleEmail" TEXT NOT NULL,
        "encryptedAccessToken" TEXT NOT NULL,
        "accessTokenIv" TEXT NOT NULL,
        "accessTokenTag" TEXT NOT NULL,
        "encryptedRefreshToken" TEXT,
        "refreshTokenIv" TEXT,
        "refreshTokenTag" TEXT,
        "tokenExpiry" TIMESTAMP(3),
        scopes TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ google_connections table created');

    // Create sources table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileType" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "rawContent" TEXT,
        "extractedText" TEXT,
        "sourceType" TEXT NOT NULL,
        "eventDetected" BOOLEAN DEFAULT false,
        confidence DOUBLE PRECISION DEFAULT 0.0,
        status TEXT DEFAULT 'PENDING',
        metadata TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ sources table created');

    // Create events table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "sourceId" TEXT,
        name TEXT NOT NULL,
        date TEXT,
        time TEXT,
        venue TEXT,
        organizer TEXT,
        description TEXT,
        audience TEXT,
        "registrationRequired" BOOLEAN DEFAULT false,
        confidence DOUBLE PRECISION DEFAULT 0.0,
        "rawAiOutput" TEXT,
        status TEXT DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("sourceId") REFERENCES sources(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ events table created');

    // Create forms table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "eventId" TEXT,
        title TEXT NOT NULL,
        description TEXT,
        "formType" TEXT DEFAULT 'REGISTRATION',
        "questionsJson" TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        "actionPlanJson" TEXT,
        "approvedAt" TIMESTAMP(3),
        "approvedBy" TEXT,
        "requestId" TEXT UNIQUE,
        "googleFormId" TEXT UNIQUE,
        "googleFormUrl" TEXT,
        "googleResponderUri" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ forms table created');

    // Create form_questions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS form_questions (
        id TEXT PRIMARY KEY,
        "formId" TEXT NOT NULL,
        "questionIndex" INTEGER NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        required BOOLEAN DEFAULT false,
        "optionsJson" TEXT,
        "scaleMin" INTEGER DEFAULT 1,
        "scaleMax" INTEGER DEFAULT 5,
        "scaleLowLabel" TEXT,
        "scaleHighLabel" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("formId") REFERENCES forms(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ form_questions table created');

    // Create responses table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        "formId" TEXT NOT NULL,
        "googleResponseId" TEXT UNIQUE NOT NULL,
        "respondentEmail" TEXT,
        "answersJson" TEXT NOT NULL,
        "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("formId") REFERENCES forms(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ responses table created');

    // Create response_analyses table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS response_analyses (
        id TEXT PRIMARY KEY,
        "formId" TEXT UNIQUE NOT NULL,
        "totalResponses" INTEGER DEFAULT 0,
        "averageRating" DOUBLE PRECISION,
        "topStrengthsJson" TEXT,
        "commonSuggestionsJson" TEXT,
        "themesJson" TEXT,
        sentiment TEXT,
        "recommendationsJson" TEXT,
        "rawAnalysisJson" TEXT,
        "analyzedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("formId") REFERENCES forms(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ response_analyses table created');

    // Create idempotency_records table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS idempotency_records (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        action TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        status TEXT NOT NULL,
        "resultJson" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL
      )
    `;
    console.log('✅ idempotency_records table created');

    // Create audit_logs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        action TEXT NOT NULL,
        "resourceType" TEXT NOT NULL,
        "resourceId" TEXT,
        "detailsJson" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ audit_logs table created');

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "sources_userId_idx" ON sources("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "events_userId_idx" ON events("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "events_sourceId_idx" ON events("sourceId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "forms_userId_idx" ON forms("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "forms_eventId_idx" ON forms("eventId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "forms_requestId_idx" ON forms("requestId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "form_questions_formId_idx" ON form_questions("formId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "responses_formId_idx" ON responses("formId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "responses_googleResponseId_idx" ON responses("googleResponseId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idempotency_records_key_idx" ON idempotency_records(key)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idempotency_records_userId_idx" ON idempotency_records("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON audit_logs("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON audit_logs(action)`;
    console.log('✅ Indexes created');

    console.log('\n🎉 Database setup complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setup();
