import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const url = 'http://127.0.0.1:3008/set-editor-yaml.html';
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // wait for redirect to editor page
    await page.waitForURL('**/teacher/questions/edit', { timeout: 30000 }).catch(e => {
        console.error('Timeout waiting for editor URL', e.message);
    });

    // give the app some time to hydrate and render preview
    await page.waitForTimeout(2000);

    // reload to ensure localStorage is read by the client app
    await page.reload({ waitUntil: 'networkidle' });

    // Wait for MathJax wrapper or typical MathJax element
    const selector = '.mq-mathjax-wrapper, .mjx-chtml, .MathJax';
    console.log('Waiting for math selector:', selector);
    await page.waitForSelector(selector, { timeout: 30000 }).catch(e => {
        console.error('Timeout waiting for MathJax elements', e.message);
    });

    // Try to locate the question preview container
    const previewSelector = '[data-testid="question-preview"], .question-preview, .tqcard-content';
    const el = await page.$(previewSelector);
    let html = null;
    if (el) {
        html = await el.evaluate((n) => n.innerHTML);
    } else {
        // fallback: grab body
        html = await page.content();
    }

    const screenshotPath = '/tmp/mathjax_preview.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('Screenshot saved to', screenshotPath);
    console.log('---- BEGIN PREVIEW HTML ----');
    console.log(html);
    console.log('---- END PREVIEW HTML ----');

    // Diagnostic: find MathJax nodes and print sizes + ancestor overflow styles
    const nodes = await page.$$('.mq-mathjax-wrapper, .mjx-chtml, .MathJax');
    console.log('Found MathJax nodes count:', nodes.length);
    for (let i = 0; i < nodes.length; i++) {
        try {
            const info = await nodes[i].evaluate((el) => {
                function ancestorInfo(node, depth) {
                    const out = [];
                    let n = node;
                    for (let i = 0; i < depth && n; i++) {
                        const style = window.getComputedStyle(n);
                        out.push({
                            tag: n.tagName,
                            class: n.className,
                            overflow: style.overflow,
                            overflowY: style.overflowY,
                            height: style.height,
                        });
                        n = n.parentElement;
                    }
                    return out;
                }
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName,
                    class: el.className,
                    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                    ancestors: ancestorInfo(el.parentElement, 6),
                    outer: el.outerHTML.slice(0, 500),
                };
            });
            console.log(`Node ${i}:`, JSON.stringify(info, null, 2));
        } catch (e) {
            console.error('Error inspecting node', e.message);
        }
    }

    await browser.close();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
