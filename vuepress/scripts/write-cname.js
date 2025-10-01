import fs from 'fs'
import path from 'path'

const distPath = path.resolve('./docs/.vuepress/dist')
const cnamePath = path.join(distPath, 'CNAME')
const cnameValue = 'docs.kutsum.org'

try {
  // ensure dist dir exists
  fs.mkdirSync(distPath, { recursive: true })
  fs.writeFileSync(cnamePath, cnameValue + '\n', { encoding: 'utf8' })
  console.log(`Wrote CNAME to ${cnamePath}`)
} catch (err) {
  console.error('Failed to write CNAME:', err)
  process.exit(1)
}
