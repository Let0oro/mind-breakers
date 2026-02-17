
/**
 * @param {import('puppeteer').Browser} browser
 * @param {{url: string, options: any}} context
 */
module.exports = async (browser, context) => {
    // Only run login if we are auditing an authenticated page
    if (!context.url.includes('/guild-hall')) {
        return;
    }

    let page;
    try {
        page = await browser.newPage();
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

        // Check if we are already logged in (redirected to dashboard)
        if (page.url().includes('/guild-hall')) {
            console.log('Already logged in, skipping login flow.');
            await page.close();
            return;
        }

        const email = process.env.LHCI_USER_EMAIL;
        const password = process.env.LHCI_USER_PASSWORD;

        if (!email || !password) {
            throw new Error('LHCI_USER_EMAIL and LHCI_USER_PASSWORD environment variables must be set');
        }

        // Wait for the form to be visible
        await page.waitForSelector('form', { timeout: 10000 });

        // Type into the email and password fields
        await page.type('#email', email);
        await page.type('#password', password);

        // Wait for navigation and click button concurrently
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[type="submit"]'),
        ]);

        console.log('Successfully logged in and navigated to dashboard.');
    } catch (error) {
        console.error('Authentication script failed:', error);
        throw error;
    } finally {
        if (page) {
            await page.close();
        }
    }
};
