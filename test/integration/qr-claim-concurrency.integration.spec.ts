import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { QrService } from '../../src/qr/qr.service';
import { RegistrationsService } from '../../src/registrations/registrations.service';

describe('QR Claim Concurrency & Registration Integration Tests', () => {
  let module: TestingModule;
  let qrService: QrService;
  let registrationsService: RegistrationsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    qrService = module.get<QrService>(QrService);
    registrationsService =
      module.get<RegistrationsService>(RegistrationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('should generate rotating QR tokens and handle concurrent claims atomically', async () => {
    // 1. Generate new QR token
    const tokenInfo = await qrService.generateRotatingToken();
    expect(tokenInfo.token).toBeDefined();
    expect(tokenInfo.ttlSeconds).toBe(15);

    // 2. Simulate 5 concurrent visitors scanning and tapping "Continue to Register" simultaneously
    const token = tokenInfo.token;
    const concurrentAttempts = 5;

    const results = await Promise.allSettled(
      Array.from({ length: concurrentAttempts }).map((_, i) =>
        qrService.claimToken(token, `192.168.1.${10 + i}`),
      ),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Invariant: Exactly ONE visitor can claim this token
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(concurrentAttempts - 1);

    const successfulClaim = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    expect(successfulClaim.sessionToken).toBeDefined();

    // The other 4 rejected requests must have been rejected with ConflictException
    for (const rej of rejected) {
      const reason = rej.reason;
      expect(reason).toBeInstanceOf(ConflictException);
    }

    // 3. Visitor completes registration with the claimed session token
    const regResult = await registrationsService.registerVisitor({
      sessionToken: successfulClaim.sessionToken,
      name: 'Nimal Perera',
      phone: '077 987 6543',
    });

    expect(regResult.reference).toBeDefined();
    expect(regResult.reference).toMatch(/^SPIN-[2-9A-HJ-NP-Z]{4}$/);
    expect(regResult.visitorName).toBe('Nimal Perera');

    // 4. Invariant: Reusing the same session token must be rejected
    await expect(
      registrationsService.registerVisitor({
        sessionToken: successfulClaim.sessionToken,
        name: 'Nimal Duplicate',
        phone: '077 987 6543',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
