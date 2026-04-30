(async function() {
    const spinner = document.getElementById('health-spinner');
    const mainContent = document.getElementById('main-content');
    const errorMessage = document.getElementById('error-message');

    const MIN_SPINNER_TIME = 2000; // минимум 2 секунды крутим спиннер
    const FETCH_TIMEOUT = 10000;    // таймаут запроса 10 секунд
    const MAX_RETRIES = 2;         // количество повторных попыток

    const startTime = Date.now();

    // Функция fetch с таймаутом
    async function fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Функция health-check с повторными попытками
    async function checkHealth(retries) {
        for (let i = 0; i <= retries; i++) {
            try {
                if (i > 0) {
                    // Ждём перед повторной попыткой
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(`Retry attempt ${i}...`);
                }

                const response = await fetchWithTimeout(
                    'https://graph.maybebot.icu/health',
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    },
                    FETCH_TIMEOUT
                );

                if (!response.ok) continue;

                const data = await response.json();

                if (data && data.status === 'ok') {
                    return true;
                }
            } catch (error) {
                console.warn(`Health check attempt ${i} failed:`, error.message);
                continue;
            }
        }
        return false;
    }

    // Основная логика
    try {
        const isHealthy = await checkHealth(MAX_RETRIES);

        // Выдерживаем минимальное время спиннера
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_SPINNER_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_SPINNER_TIME - elapsed));
        }

        if (isHealthy) {
            const pageResponse = await fetch('/page-content.html');
            if (pageResponse.ok) {
                const html = await pageResponse.text();
                mainContent.innerHTML = html;
                mainContent.style.display = 'block';
                spinner.style.display = 'none';
            } else {
                throw new Error('Page content not found');
            }
        } else {
            throw new Error('Health check returned non-ok status');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        spinner.style.display = 'none';
        errorMessage.style.display = 'flex';
        errorMessage.style.justifyContent = 'center';
        errorMessage.style.alignItems = 'center';
        errorMessage.style.height = '100vh';
    }
})();