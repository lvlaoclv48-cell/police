(async function() {
    const spinner = document.getElementById('health-spinner');
    const mainContent = document.getElementById('main-content');
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('https://graph.maybebot.icu/health', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Health check failed');

        const data = await response.json();

        if (data && data.status === 'ok') {
            const pageResponse = await fetch('/page-content.html');
            if (!pageResponse.ok) throw new Error('Page content not found');
            
            const html = await pageResponse.text();
            mainContent.innerHTML = html;
            mainContent.style.display = 'block';
            spinner.style.display = 'none';
        } else {
            throw new Error('Status not ok');
        }
    } catch (error) {
        spinner.style.display = 'none';
        errorMessage.style.display = 'flex';
        errorMessage.style.justifyContent = 'center';
        errorMessage.style.alignItems = 'center';
        errorMessage.style.height = '100vh';
    }
})();
