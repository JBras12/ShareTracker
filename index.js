const apiKey = 'crhb4h1r01qrbc71tj50crhb4h1r01qrbc71tj5g';  // API key for accessing stock data from Finnhub
const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JNJ', 'BABA', 'MA', 'BAC', 'INTC']; // List of popular stock symbols

// Fetch the stock price and related data (e.g., price change) for a given symbol
async function fetchStockPrice(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    
    const response = await fetch(url);  // Make an API request to get stock data
    const data = await response.json(); // Parse the JSON response

    return {
        currentPrice: data.c,  // Current price of the stock
        changePercent: ((data.d / data.pc) * 100).toFixed(2),  // Calculate percentage change in price
        icon: `images/${symbol.toLowerCase()}.png`  // Path to the stock icon image
    };
}

// Display popular stocks and their prices on the page
async function displayPopularStocks() {
    const stocksList = document.getElementById('stocks-list');  // Get the HTML element where stock info will be displayed
    stocksList.innerHTML = '';  // Clear any existing content

    // Loop through each popular stock symbol
    for (let symbol of popularStocks) {
        try {
            const stockData = await fetchStockPrice(symbol);  // Fetch stock data for the current symbol
            const stockDiv = document.createElement('div');  // Create a new div element for the stock item
            stockDiv.classList.add('stock-item');  // Add a CSS class to style the stock item

            // Populate the div with stock information (symbol, price, percentage change, icon)
            stockDiv.innerHTML = `
                <img src="${stockData.icon}" alt="${symbol} logo" class="stock-icon">
                <div class="stock-info">
                    <h2>${symbol}</h2>
                    <p>Current Price: $${stockData.currentPrice.toFixed(2)}</p>
                    <p>Change: ${stockData.changePercent}%</p>
                </div>
            `;

            stocksList.appendChild(stockDiv);  // Append the stock div to the stock list container
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);  // Log errors if the API request fails
        }
    }
}

// Run this function when the window finishes loading to display popular stocks
window.onload = function() {
    displayPopularStocks();  // Display the popular stocks when the page loads
};
