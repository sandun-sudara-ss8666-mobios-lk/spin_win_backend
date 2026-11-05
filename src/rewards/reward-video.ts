import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const rewardVideoPath = '/api/v1/reward-videos';
export const rewardVideoDirectory = () =>
  resolve(process.env.REWARD_VIDEO_DIR || 'uploads/video');
export const rewardVideoOptions = {
  limits: { fileSize: 15_000_000, files: 1, fields: 30 },
};

export async function withRewardVideo<T>(
  file: { buffer: Buffer } | undefined,
  save: (videoUrl?: string) => Promise<T>,
): Promise<T> {
  if (!file) return save();
  const bytes = file.buffer;
  if (bytes.length > 15_000_000)
    throw new BadRequestException('Video must not exceed 15 MB');
  // Check the container bytes rather than trusting the filename or client MIME type.
  const brand = bytes.toString('ascii', 8, 12);
  if (
    bytes.length < 16 ||
    bytes.toString('ascii', 4, 8) !== 'ftyp' ||
    !/^(isom|iso[2-9]|mp4[12]|avc1|M4V |MSNV|dash)$/.test(brand)
  ) {
    throw new BadRequestException('Video must be an MP4 file');
  }

  // Duration and resolution are checked by the browser before upload.
  // A container signature alone does not verify codecs or playback compatibility.
  const filename = `${randomUUID()}.mp4`;
  const directory = rewardVideoDirectory();
  await mkdir(directory, { recursive: true });
  const path = join(directory, filename);
  await writeFile(path, bytes, { flag: 'wx' });
  try {
    return await save(`${rewardVideoPath}/${filename}`);
  } catch (error) {
    await unlink(path).catch(() => undefined);
    throw error;
  }
}

export async function removeRewardVideo(url?: string | null): Promise<void> {
  const filename = url?.startsWith(`${rewardVideoPath}/`)
    ? url.slice(rewardVideoPath.length + 1)
    : '';
  if (/^[\da-f-]{36}\.mp4$/.test(filename)) {
    await unlink(join(rewardVideoDirectory(), filename)).catch(() => undefined);
  }
}
