import { of, firstValueFrom } from 'rxjs';
import { resolveMediaUrls } from '../../src/common/media-url';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { RealtimeGateway } from '../../src/realtime/realtime.gateway';

describe('public media URLs', () => {
  const previous = process.env.PUBLIC_MEDIA_BASE_URL;
  afterEach(() => {
    if (previous === undefined) delete process.env.PUBLIC_MEDIA_BASE_URL;
    else process.env.PUBLIC_MEDIA_BASE_URL = previous;
  });

  it.each([
    ['http://localhost:3010/', 'http://localhost:3010/'],
    ['https://spin-n-win.mobios.lk/api/v1', 'https://spin-n-win.mobios.lk/api/v1/'],
  ])('resolves existing stored paths for %s without changing database objects', (base, expected) => {
    const createdAt = new Date();
    const data = { createdAt, rewards: [{ videoUrl: '/api/v1/reward-videos/clip.mp4', merchant: { logoUrl: '/api/v1/merchant-logos/logo.png' } }] };
    process.env.PUBLIC_MEDIA_BASE_URL = base;
    expect(resolveMediaUrls(data)).toEqual({ createdAt, rewards: [{ videoUrl: `${expected}reward-videos/clip.mp4`, merchant: { logoUrl: `${expected}merchant-logos/logo.png` } }] });
    expect(data.rewards[0].videoUrl).toBe('/api/v1/reward-videos/clip.mp4');
    expect(resolveMediaUrls(data).createdAt).toBe(createdAt);
  });

  it('preserves external URLs, nulls, and unrelated strings', () => {
    process.env.PUBLIC_MEDIA_BASE_URL = 'http://localhost:3010/';
    const data = { logoUrl: 'https://cdn.example/logo.png', videoUrl: null, name: '/api/v1/merchant-logos/logo.png' };
    expect(resolveMediaUrls(data)).toEqual(data);
  });

  it('returns absolute URLs inside the HTTP response envelope', async () => {
    process.env.PUBLIC_MEDIA_BASE_URL = 'http://localhost:3010/';
    const context: any = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }) };
    const response = await firstValueFrom(new TransformInterceptor().intercept(context, { handle: () => of([{ logoUrl: '/api/v1/merchant-logos/logo.png' }]) }));
    expect(response.data).toEqual([{ logoUrl: 'http://localhost:3010/merchant-logos/logo.png' }]);
  });

  it('returns the same media URLs over Socket.IO', () => {
    process.env.PUBLIC_MEDIA_BASE_URL = 'http://localhost:3010/';
    const emit = jest.fn();
    const gateway = new RealtimeGateway({} as any, {} as any);
    gateway.server = { to: () => ({ emit }) } as any;
    gateway.emitSpinCompleted({ reward: { videoUrl: '/api/v1/reward-videos/clip.mp4', merchant: { logoUrl: '/api/v1/merchant-logos/logo.png' } } });
    expect(emit).toHaveBeenCalledWith('spin:completed', { reward: { videoUrl: 'http://localhost:3010/reward-videos/clip.mp4', merchant: { logoUrl: 'http://localhost:3010/merchant-logos/logo.png' } } });
  });
});
