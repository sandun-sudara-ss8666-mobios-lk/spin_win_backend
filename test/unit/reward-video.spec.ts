import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withRewardVideo, removeRewardVideo } from '../../src/rewards/reward-video';

describe('reward video storage', () => {
  let directory: string;
  const file = {
    buffer: Buffer.from(
      '000000186674797069736f6d0000000069736f6d6d703432',
      'hex',
    ),
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'reward-video-test-'));
    process.env.REWARD_VIDEO_DIR = directory;
  });

  afterEach(async () => {
    delete process.env.REWARD_VIDEO_DIR;
    await rm(directory, { recursive: true, force: true });
  });

  it('saves an MP4 upload with a generated public URL', async () => {
    const url = await withRewardVideo(file, async (url) => url);
    expect(url).toMatch(/^\/api\/v1\/reward-videos\/[\da-f-]+\.mp4$/);
    const files = await readdir(directory);
    expect(files).toHaveLength(1);
    expect(await readFile(join(directory, files[0]))).toEqual(file.buffer);
  });

  it('removes the uploaded file when saving the reward fails', async () => {
    await expect(
      withRewardVideo(file, async () => {
        throw new Error('DB failed');
      }),
    ).rejects.toThrow('DB failed');
    expect(await readdir(directory)).toEqual([]);
  });

  it('does not save invalid or oversized files', async () => {
    await expect(
      withRewardVideo({ buffer: Buffer.from('not a video') }, async () => null),
    ).rejects.toThrow('MP4');
    await expect(
      withRewardVideo({ buffer: Buffer.alloc(15_000_001) }, async () => null),
    ).rejects.toThrow('15 MB');
    expect(await readdir(directory)).toEqual([]);
  });

  it('saves MP4 uploads without any installed video validation binary', async () => {
    const previous = process.env.FFPROBE_PATH;
    process.env.FFPROBE_PATH = join(directory, 'no-such-executable');
    try {
      const url = await withRewardVideo(file, async (url) => url);
      expect(url).toMatch(/\.mp4$/);
      expect(await readdir(directory)).toHaveLength(1);
    } finally {
      if (previous === undefined) delete process.env.FFPROBE_PATH;
      else process.env.FFPROBE_PATH = previous;
    }
  });

  it('generates unique names and safely removes only owned video files', async () => {
    const first = await withRewardVideo(file, async (url) => url);
    const second = await withRewardVideo(file, async (url) => url);
    expect(first).not.toBe(second);
    await removeRewardVideo('/api/v1/reward-videos/../outside.mp4');
    await removeRewardVideo('https://example.test/video.mp4');
    expect(await readdir(directory)).toHaveLength(2);
    await removeRewardVideo(first);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('preserves the normal create path when no video is uploaded', async () => {
    await expect(
      withRewardVideo(undefined, async (url) => url ?? 'normal reward'),
    ).resolves.toBe('normal reward');
  });
});
