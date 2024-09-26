const apiKey = 'crhb4h1r01qrbc71tj50crhb4h1r01qrbc71tj5g'; // API key for accessing stock data from Finnhub
let portfolioData = {};  // Object to store portfolio data
let chart;  // Variable to store chart instance

// Save the current portfolio data to localStorage
function savePortfolio() {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
}

// Load portfolio data from localStorage and update the UI
function loadPortfolio() {
    const storedPortfolio = localStorage.getItem('portfolioData');
    if (storedPortfolio) {
        portfolioData = JSON.parse(storedPortfolio);

        // Add each stock to the portfolio table
        Object.keys(portfolioData).forEach(symbol => {
            const { shares, avgPrice, currentPrice } = portfolioData[symbol];
            addNewStock(symbol, shares, avgPrice, currentPrice);
        });

        // Update portfolio value, P/L, and the pie chart
        updatePortfolioValue();
        updatePL();
        updatePieChart();
    }
}

// Fetch stock symbol suggestions based on user input
function fetchSuggestions() {
    const query = document.getElementById('symbol').value;

    if (query.length < 2) {
        clearSuggestions(); // Clear suggestions if query is too short
        return;
    }

    const url = `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.result) {
                updateSuggestions(data.result);  // Update the suggestion list
            }
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
        });
}

// Update the suggestions box with fetched results
function updateSuggestions(results) {
    const suggestionBox = document.getElementById('suggestions');
    suggestionBox.innerHTML = '';  // Clear previous suggestions
    if (results.length === 0) {
        suggestionBox.innerHTML = '<div class="suggestion-box empty">No results</div>';
        return;
    }

    // Create and display suggestion items
    results.forEach(stock => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = `${stock.symbol} - ${stock.description}`;
        
        // On click, select the stock and clear the suggestion list
        suggestionItem.addEventListener('click', () => {
            document.getElementById('symbol').value = `${stock.symbol} - ${stock.description}`;
            suggestionBox.innerHTML = ''; // Clear suggestions after selection
        });
        
        suggestionBox.appendChild(suggestionItem);
    });
}

// Clear all stock suggestions from the UI
function clearSuggestions() {
    const suggestionBox = document.getElementById('suggestions');
    suggestionBox.innerHTML = '';
}

// Fetch the latest stock price for a given symbol
function fetchStockPrice(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.c) {
                return parseFloat(data.c); // Return the current stock price
            } else {
                throw new Error('Price not found for symbol: ' + symbol);
            }
        })
        .catch(error => {
            console.error('Error fetching stock price:', error);
            alert('Error fetching stock price. Check the symbol.');
        });
}

// Add a new stock to the portfolio
function addStockToPortfolio(event) {
    event.preventDefault();
    
    // Extract symbol, shares, and average price from the form inputs
    const symbol = document.getElementById('symbol').value.toUpperCase().split(' - ')[0];
    const shares = parseInt(document.getElementById('shares').value);
    const avgPrice = parseFloat(document.getElementById('currentPrice').value);

    if (!symbol || isNaN(shares) || isNaN(avgPrice)) {
        alert("Please fill out all fields correctly.");
        return;
    }

    // Fetch the current stock price and update the portfolio
    fetchStockPrice(symbol).then(currentPrice => {
        const totalValue = (shares * currentPrice).toFixed(2);

        // If the stock already exists, update it; otherwise, add a new entry
        if (portfolioData[symbol]) {
            updateExistingStock(symbol, shares, avgPrice, currentPrice);
        } else {
            portfolioData[symbol] = { totalValue: parseFloat(totalValue), shares, avgPrice, currentPrice };
            addNewStock(symbol, shares, avgPrice, currentPrice);
        }

        // Save the updated portfolio and refresh the UI
        savePortfolio();

        updatePieChart();
        updatePortfolioValue();
        updatePL(); 
    }).catch(error => {
        console.error("Error fetching stock price:", error);
    });
}

// Add a new stock row to the portfolio table
function addNewStock(symbol, shares, avgPrice, currentPrice) {
    const totalValue = (currentPrice * shares).toFixed(2);
    const plPercentage = (((currentPrice - avgPrice) / avgPrice) * 100).toFixed(2);
    const plClass = plPercentage >= 0 ? 'gain' : 'loss';

    // Create a new table row for the stock
    const portfolioTable = document.querySelector('#portfolio-table tbody');
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-symbol', symbol);

    newRow.innerHTML = `
        <td>${symbol}</td>
        <td>${shares}</td>
        <td>${avgPrice.toFixed(2)}</td>
        <td>${currentPrice.toFixed(2)}</td>
        <td>${totalValue}</td>
        <td class="${plClass}">${plPercentage}%</td>
        <td>
            <button onclick="openEditModal('${symbol}')">Edit</button>
            <button onclick="removeStockPartial('${symbol}')">Remove Shares</button>
            <button onclick="removeStock(this)">Remove All</button>
        </td>
    `;

    portfolioTable.appendChild(newRow);
}

// Update an existing stock's details
function updateExistingStock(symbol, newShares, newAvgPrice, currentPrice) {
    const stock = portfolioData[symbol];

    // Recalculate total shares and average price
    const totalShares = stock.shares + newShares;
    const totalInvested = (stock.shares * stock.avgPrice) + (newShares * newAvgPrice);
    const updatedAvgPrice = totalInvested / totalShares;

    // Update the portfolio data
    portfolioData[symbol].shares = totalShares;
    portfolioData[symbol].avgPrice = updatedAvgPrice;
    portfolioData[symbol].currentPrice = currentPrice;
    portfolioData[symbol].totalValue = (currentPrice * totalShares).toFixed(2);

    // Update the table row with new values
    const row = document.querySelector(`#portfolio-table tbody tr[data-symbol="${symbol}"]`);
    row.children[1].textContent = totalShares;
    row.children[2].textContent = updatedAvgPrice.toFixed(2);
    row.children[3].textContent = currentPrice.toFixed(2);
    row.children[4].textContent = portfolioData[symbol].totalValue;

    // Update the P/L display
    const plPercentage = (((currentPrice - updatedAvgPrice) / updatedAvgPrice) * 100).toFixed(2);
    const plClass = plPercentage >= 0 ? 'gain' : 'loss';
    row.children[5].textContent = `${plPercentage}%`;
    row.children[5].className = plClass;

    savePortfolio();
}

// Open a modal to edit the average price of a stock
function openEditModal(symbol) {
    const newPrice = prompt(`Enter the new average price for ${symbol}:`);
    
    if (newPrice && !isNaN(newPrice)) {
        portfolioData[symbol].avgPrice = parseFloat(newPrice);
        updateExistingStock(symbol, 0, 0, portfolioData[symbol].currentPrice); // Update values without adding new shares
        updatePL();
        updatePortfolioValue();
    } else {
        alert("Please enter a valid price.");
    }
}

// Remove a portion of shares for a stock
function removeStockPartial(symbol) {
    const numShares = prompt(`How many shares do you want to remove from ${symbol}?`);
    
    if (numShares && !isNaN(numShares)) {
        const sharesToRemove = parseInt(numShares);

        // Validate if the number of shares to remove is correct
        if (sharesToRemove > 0 && sharesToRemove <= portfolioData[symbol].shares) {
            portfolioData[symbol].shares -= sharesToRemove;
            portfolioData[symbol].totalValue = (portfolioData[symbol].currentPrice * portfolioData[symbol].shares).toFixed(2);

            if (portfolioData[symbol].shares === 0) {
                delete portfolioData[symbol]; // Remove stock if no shares left
                document.querySelector(`#portfolio-table tbody tr[data-symbol="${symbol}"]`).remove();
            } else {
                updateExistingStock(symbol, 0, 0, portfolioData[symbol].currentPrice);
            }

            savePortfolio();

            updatePL();
            updatePortfolioValue();
        } else {
            alert("Invalid number of shares to remove.");
        }
    } else {
        alert("Please enter a valid number.");
    }
}

// Remove a stock entirely from the portfolio
function removeStock(button) {
    const row = button.closest('tr');
    const symbol = row.getAttribute('data-symbol');
    row.remove();
    delete portfolioData[symbol];

    savePortfolio();

    updatePortfolioValue();
    updatePieChart();
    updatePL();  
}

// Update the total portfolio value
function updatePortfolioValue() {
    let totalValue = 0;

    // Sum the value of all stocks in the portfolio
    document.querySelectorAll('#portfolio-table tbody tr').forEach(row => {
        const value = parseFloat(row.children[4].textContent);
        totalValue += value;
    });

    document.getElementById('portfolio-value').textContent = `Total Value: $${totalValue.toFixed(2)}`;
}

// Update the overall profit/loss of the portfolio
function updatePL() {
    let totalPL = 0;

    // Calculate profit/loss for each stock
    Object.values(portfolioData).forEach(stock => {
        const { shares, avgPrice, currentPrice } = stock;
        totalPL += (currentPrice - avgPrice) * shares;
    });

    document.getElementById('portfolio-pl').textContent = `P/L: $${totalPL.toFixed(2)}`;
}

// Update the pie chart with the current portfolio data
function updatePieChart() {
    const ctx = document.getElementById('myChart').getContext('2d');

    if (Object.keys(portfolioData).length === 0) {
        // Show an empty chart if there's no data
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#CCCCCC'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, labels: { color: 'black' } },
                    tooltip: {
                        callbacks: {
                            label: function() {
                                return 'Empty Portfolio';
                            }
                        }
                    }
                }
            }
        });
    } else {
        const labels = Object.keys(portfolioData);
        const data = Object.values(portfolioData).map(stock => stock.totalValue);

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
}

// Event listener for form submission to add stock to the portfolio
document.getElementById('stockForm').addEventListener('submit', addStockToPortfolio);

// Load portfolio data and initialize the pie chart on page load
window.onload = function() {
    loadPortfolio(); 
    updatePieChart(); 
};
