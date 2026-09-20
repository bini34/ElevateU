import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import sharp from 'sharp';
import config from '../next.config.js';

const require = createRequire(import.meta.url);
const { defaultConfig } = require('next/dist/server/config-shared');
const { ImageOptimizerCache, optimizeImage } = require('next/dist/server/image-optimizer');
const { getImgProps } = require('next/dist/shared/lib/get-img-props');
const defaultLoader = require('next/dist/shared/lib/image-loader').default;
const images = { ...defaultConfig.images, ...config.images };
const nextConfig = { ...defaultConfig, ...config, images };
const publicPattern = images.remotePatterns[0];
const origin = `${publicPattern.protocol}://${publicPattern.hostname}${publicPattern.port ? `:${publicPattern.port}` : ''}`;
const uploadRoot = publicPattern.pathname.replace(/avatars\/\*\*$/, '');
const validate = (url) => ImageOptimizerCache.validateParams(
  { headers: { accept: 'image/webp' } }, { url, w: '64', q: '75' }, nextConfig, false,
);

test('optimizer accepts configured public avatars, posts, groups and local assets', () => {
  for (const folder of ['avatars', 'posts', 'groups']) {
    assert.equal(validate(`${origin}${uploadRoot}${folder}/fixture.png`).errorMessage, undefined);
  }
  assert.equal(validate('/images/avator.png').errorMessage, undefined);
});

test('optimizer rejects private attachments, legacy message paths and other origins', () => {
  for (const url of [
    `${origin}/api/message-attachments/00000000-0000-0000-0000-000000000000`,
    `${origin}${uploadRoot}messages/fixture.png`,
    `${origin}${uploadRoot}avatars/fixture.png?redirect=private`,
    'https://untrusted.example/storage/uploads/avatars/fixture.png',
  ]) assert.ok(validate(url).errorMessage, url);
});

test('responsive public image props retain optimizer srcsets at multiple widths', () => {
  const { props } = getImgProps({
    src: `${origin}${uploadRoot}posts/fixture.png`, fill: true,
    sizes: '(max-width: 640px) 100vw, 450px', alt: 'Post',
  }, { defaultLoader, imgConf: images });
  assert.ok(props.src.startsWith('/_next/image?'));
  assert.match(props.srcSet, /640w/);
  assert.match(props.srcSet, /1080w/);
  assert.equal(props.sizes, '(max-width: 640px) 100vw, 450px');
});

test('Next optimizer with patched sharp resizes and decodes supported public images', async () => {
  const source = await sharp({ create: { width: 256, height: 128, channels: 3, background: '#336699' } }).png().toBuffer();
  for (const [mime, format] of [['image/jpeg', 'jpeg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/avif', 'heif']]) {
    const output = await optimizeImage({ buffer: source, contentType: mime, quality: 75, width: 64 });
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.width, 64);
    assert.equal(metadata.height, 32);
    assert.equal(metadata.format, format);
  }
});

test('bundled avatar passes native image optimization', async () => {
  const source = await readFile(new URL('../public/images/avator.png', import.meta.url));
  const output = await optimizeImage({ buffer: source, contentType: 'image/webp', quality: 75, width: 32 });
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, 'webp');
  assert.ok(metadata.width > 0 && metadata.width <= 32);
});
