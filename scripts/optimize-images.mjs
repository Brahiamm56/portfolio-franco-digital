import { readdir, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const sourceRoot = fileURLToPath(new URL('../src/assets/projects/', import.meta.url))

async function collectImages(directory) {
  const entries = await readdir(directory)
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry)
    const info = await stat(path)
    if (info.isDirectory()) files.push(...await collectImages(path))
    else if (/\.jpe?g$/i.test(extname(entry))) files.push(path)
  }

  return files
}

const images = await collectImages(sourceRoot)

await Promise.all(images.map(async (source) => {
  const output = source.replace(/\.jpe?g$/i, '.webp')
  await sharp(source)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 5, smartSubsample: true })
    .toFile(output)
}))

console.log(`Optimized ${images.length} project images.`)
