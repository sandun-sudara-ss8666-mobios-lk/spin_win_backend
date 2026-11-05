import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const merchantLogoPath = '/api/v1/merchant-logos';
export const merchantLogoDirectory = () => resolve(
  process.env.MERCHANT_LOGO_DIR || 'uploads/merchant-logos',
);
export const merchantLogoOptions = { limits: { fileSize: 2 * 1024 * 1024 } };

export async function withMerchantLogo<T>(
  file: { buffer: Buffer } | undefined,
  save: (logoUrl?: string) => Promise<T>,
): Promise<T> {
  if (!file) return save();

  const bytes = file.buffer;
  const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  const jpeg = bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  const webp = bytes.toString('latin1', 0, 4) === 'RIFF' &&
    bytes.toString('latin1', 8, 12) === 'WEBP';
  if (!png && !jpeg && !webp) {
    throw new BadRequestException('Logo must be a PNG, JPEG, or WebP image');
  }

  const extension = png ? 'png' : jpeg ? 'jpg' : 'webp';
  const filename = `${randomUUID()}.${extension}`;
  const directory = merchantLogoDirectory();
  const path = join(directory, filename);
  await mkdir(directory, { recursive: true });
  await writeFile(path, bytes, { flag: 'wx' });
  try {
    return await save(`${merchantLogoPath}/${filename}`);
  } catch (error) {
    await unlink(path).catch(() => undefined);
    throw error;
  }
}
