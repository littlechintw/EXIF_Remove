import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as piexif from 'piexifjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create a dummy JPEG with EXIF
function createTestJpeg() {
  // A tiny valid JPEG (1x1 red pixel)
  const base64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUHCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AVf/Z';
  
  const exifObj = {
    '0th': {
      [piexif.ImageIFD.Make]: 'TestMake',
      [piexif.ImageIFD.Model]: 'TestModel',
    },
    'Exif': {
      [piexif.ExifIFD.DateTimeOriginal]: '2023:01:01 12:00:00',
    },
    'GPS': {
      [piexif.GPSIFD.GPSVersionID]: [2, 2, 0, 0],
      [piexif.GPSIFD.GPSLatitudeRef]: 'N',
      [piexif.GPSIFD.GPSLatitude]: [[45, 1], [0, 1], [0, 1]],
    }
  };
  
  const exifBytes = piexif.dump(exifObj);
  const jpegWithExif = piexif.insert(exifBytes, base64Jpeg);
  
  // Convert Data URL to Buffer
  const buffer = Buffer.from(jpegWithExif.split(',')[1], 'base64');
  const filePath = path.join(__dirname, 'test-image.jpg');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Helper to create a dummy PNG (PNG doesn't typically have EXIF in same way, but we should test handling)
function createTestPng() {
  const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Png.split(',')[1], 'base64');
  const filePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

test.describe('EXIF Remover', () => {
  let testJpegPath: string;
  let testPngPath: string;

  test.beforeAll(() => {
    testJpegPath = createTestJpeg();
    testPngPath = createTestPng();
  });

  test.afterAll(() => {
    [testJpegPath, testPngPath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });

  test('JPG: should remove all EXIF data', async ({ page }) => {
    await page.goto('/');

    // Upload the file
    await page.setInputFiles('input[type="file"]', testJpegPath);

    await expect(page.locator('text=TestMake')).toBeVisible();

    await page.click('button:has-text("Remove All Metadata")');
    const downloadButton = page.locator('button:has-text("Download Processed File")');
    await expect(downloadButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    const downloadPath = path.join(__dirname, 'downloaded-jpg-cleansed.jpg');
    await download.saveAs(downloadPath);

    const downloadedData = fs.readFileSync(downloadPath).toString('binary');
    const exifAfter = piexif.load(downloadedData);
    expect(exifAfter['0th'][piexif.ImageIFD.Make]).toBeUndefined();
    fs.unlinkSync(downloadPath);
  });

  test('JPG: should keep selected EXIF data (partial removal)', async ({ page }) => {
    await page.goto('/');

    // Upload the file
    await page.setInputFiles('input[type="file"]', testJpegPath);

    await page.click('button:has-text("Deselect All")');
    await page.click('label:has-text("Make:")');

    await page.click('button:has-text("Keep Selected")');
    const downloadButton = page.locator('button:has-text("Download Processed File")');
    await expect(downloadButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    const downloadPath = path.join(__dirname, 'downloaded-jpg-partial.jpg');
    await download.saveAs(downloadPath);

    const downloadedData = fs.readFileSync(downloadPath).toString('binary');
    const exifAfter = piexif.load(downloadedData);
    expect(exifAfter['0th'][piexif.ImageIFD.Make]).toBe('TestMake');
    expect(exifAfter['0th'][piexif.ImageIFD.Model]).toBeUndefined();
    fs.unlinkSync(downloadPath);
  });

  test('PNG: should handle file and allow removal (re-encoding)', async ({ page }) => {
    await page.goto('/');

    // Upload the file
    await page.setInputFiles('input[type="file"]', testPngPath);

    // PNG likely has no EXIF displayed
    await expect(page.locator('text=No metadata found')).toBeVisible();

    await page.click('button:has-text("Remove All Metadata")');
    const downloadButton = page.locator('button:has-text("Download Processed File")');
    await expect(downloadButton).toBeVisible();
    
    // Check if filename ends with _noexif.jpg (since our converter defaults to jpeg for now)
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('_noexif');
  });
});
