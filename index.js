const apiKey = 'crhb4h1r01qrbc71tj50crhb4h1r01qrbc71tj5g';
const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JNJ', 'BABA', 'MA', 'BAC', 'INTC']; // Popular stocks

async function fetchStockPrice(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    return {
        currentPrice: data.c,
        changePercent: ((data.d / data.pc) * 100).toFixed(2), 
        icon: `images/${symbol.toLowerCase()}.png`
    };
}

async function displayPopularStocks() {
    const stocksList = document.getElementById('stocks-list');
    stocksList.innerHTML = ''; 

    for (let symbol of popularStocks) {
        try {
            const stockData = await fetchStockPrice(symbol); 
            const stockDiv = document.createElement('div'); 
            stockDiv.classList.add('stock-item');

            stockDiv.innerHTML = `
                <img src="${stockData.icon}" alt="${symbol} logo" class="stock-icon">
                <div class="stock-info">
                    <h2>${symbol}</h2>
                    <p>Current Price: $${stockData.currentPrice.toFixed(2)}</p>
                    <p>Change: ${stockData.changePercent}%</p>
                </div>
            `;

            stocksList.appendChild(stockDiv); 
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
        }
    }
}

window.onload = function() {
    displayPopularStocks();
};
