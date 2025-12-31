document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');



    // --- Global App Currency State ---
    const AppCurrency = {
        current: 'INR', // Default
        rates: {}, // Relative to USD

        save() {
            localStorage.setItem('finance_currency', this.current);
        },

        load() {
            const saved = localStorage.getItem('finance_currency');
            if (saved) this.current = saved;
        },

        convert(amountInINR) {
            // Core Logic:
            // 1. Convert INR to USD (Base): Amount / Rate(INR)
            // 2. Convert USD to Target: AmountUSD * Rate(Target)

            // If rates not loaded or target is INR, return original
            if (!this.rates['INR'] || !this.rates[this.current] || this.current === 'INR') {
                return { value: amountInINR, code: 'INR' };
            }

            const inrRate = this.rates['INR'];
            const targetRate = this.rates[this.current];
            const converted = (amountInINR / inrRate) * targetRate;

            return { value: converted, code: this.current };
        },

        format(amountInINR) {
            const { value, code } = this.convert(amountInINR);
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: code
            }).format(value);
        },

        // Updates the "Total Balance" and "Monthly Spending" cards
        updateDashboard() {
            // 1. Total Balance: Sum of all accounts (which are stored in INR or base? Assuming Input is treated as INR since default is INR)
            // Actually, currently user inputs numbers. We assume they are entering INR as per original design.
            const totalBalanceInfo = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            const totalBalanceEl = document.getElementById('totalBalanceDisplay');
            if (totalBalanceEl) totalBalanceEl.textContent = this.format(totalBalanceInfo);

            // 2. Monthly Spending
            // Simple logic: filter transactions for 'expense' in current month
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthlySpending = transactions
                .filter(t => t.type === 'expense' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlySpendingEl = document.getElementById('monthlySpendingDisplay');
            if (monthlySpendingEl) monthlySpendingEl.textContent = this.format(monthlySpending);
        }
    };


    function switchView(targetId) {
        // Remove active class from all buttons and sections
        navButtons.forEach(b => {
            if (b.dataset.target === targetId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        viewSections.forEach(s => s.classList.remove('active'));

        // Show corresponding section
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');

        // Trigger Render Logic for specific views
        if (targetId === 'today') {
            renderTransactions();
            AppCurrency.updateDashboard();
        } else if (targetId === 'month') {
            renderMonthlyView();
        } else if (targetId === 'year') {
            renderYearlyView();
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            switchView(targetId);
            // Close sidebar when a nav item is clicked
            sidebar.classList.remove('active');
        });
    });

    // Sidebar Logic
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const settingsBtn = document.getElementById('settingsBtn');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('active');
            console.log('Sidebar toggled active');
        });
    }

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    settingsBtn.addEventListener('click', () => {
        switchView('settings-view');
        sidebar.classList.remove('active');
    });



    // Today View - Category Chips Logic
    const chips = document.querySelectorAll('.chip');
    const categoryInput = document.getElementById('expenseCategory');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            categoryInput.value = chip.dataset.val;
        });
    });

    // Transaction Management
    let transactions = []; // Store: { id, type: 'income'|'expense', account, amount, category?, title, date }
    const recentTransactionsTableBody = document.getElementById('recentTransactionsTableBody');

    // Data Persistence Helpers
    function saveData() {
        localStorage.setItem('finance_accounts', JSON.stringify(accounts));
        localStorage.setItem('finance_transactions', JSON.stringify(transactions));
        if (activeAccount) localStorage.setItem('finance_active_account', activeAccount);
    }

    function loadData() {
        try {
            const savedAccounts = localStorage.getItem('finance_accounts');
            const savedTransactions = localStorage.getItem('finance_transactions');
            const savedActiveAccount = localStorage.getItem('finance_active_account');

            if (savedAccounts) {
                const parsedAccounts = JSON.parse(savedAccounts);
                if (Array.isArray(parsedAccounts)) {
                    accounts.length = 0; // Clear existing
                    accounts.push(...parsedAccounts);
                }
            }

            if (savedTransactions) {
                const parsed = JSON.parse(savedTransactions);
                if (Array.isArray(parsed)) {
                    // Re-hydrate Date objects
                    parsed.forEach(t => t.date = new Date(t.date));

                    // In-place update to ensure references remain valid
                    transactions.length = 0;
                    transactions.push(...parsed);
                }
            }

            if (savedActiveAccount) {
                // Validate if active account still exists
                if (accounts.some(a => a.name === savedActiveAccount)) {
                    activeAccount = savedActiveAccount;
                }
            }
            console.log('Data loaded successfully:', { accounts: accounts.length, transactions: transactions.length });
        } catch (error) {
            console.error('Failed to load data from localStorage:', error);
        }
    }

    function renderTransactions() {
        // Filter by Active Account if selected
        let filtered = transactions;
        if (activeAccount) {
            filtered = transactions.filter(t => t.account === activeAccount);
        } else if (accounts.length > 0) {
            if (activeAccount === null) {
                recentTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">Select an account to view transactions</td></tr>';
                return;
            }
        } else {
            recentTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No accounts created yet.</td></tr>';
            return;
        }

        if (filtered.length === 0) {
            recentTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No transactions found for this account.</td></tr>';
            return;
        }

        // Filter for TODAY only
        const today = new Date();
        filtered = filtered.filter(t =>
            t.date.getMonth() === today.getMonth() &&
            t.date.getFullYear() === today.getFullYear()
        );

        if (filtered.length === 0) {
            recentTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No transactions for today.</td></tr>';
            return;
        }

        // Sort by newest first
        filtered.sort((a, b) => b.date - a.date);

        recentTransactionsTableBody.innerHTML = filtered.map(t => {
            const dateObj = new Date(t.date);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const sign = t.type === 'income' ? '+' : '-';
            const amountClass = t.type === 'income' ? 'income' : 'expense';
            const description = t.type === 'income' ? `From: ${t.source}` : `${t.category} - ${t.title}`;
            // Using description composed of category/title for expenses, or source for income.
            // Title is primary, but original had "meta". Let's make Description column useful.
            // Original: Title (top), Meta (bottom). Meta was Category for expense.
            // New Column "Description": Let's put Title.
            // Wait, original design had meta info. Let's make "Description" contain Title.
            // The user asked for "Date" and "Time".

            const displayTitle = t.title;

            const formattedAmount = AppCurrency.format(t.amount);

            return `
                <tr class="transaction-row">
                    <td>
                        <div class="t-info">
                            <span class="t-title">${displayTitle}</span>
                             ${t.type === 'expense' ? `<span class="t-meta">${t.category}</span>` : `<span class="t-meta">${t.source}</span>`}
                        </div>
                    </td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td style="text-align: right;">
                        <span class="t-amount ${amountClass}">${sign}${formattedAmount}</span>
                    </td>
                </tr>
            `;
        }).join('');

        // Update Chart (Simple implementation: Update data based on filtered expenses)
        updateChart(filtered);
    }



    // Helper for Dynamic Chart Colors
    function getChartColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isLight = theme === 'light';
        return {
            text: isLight ? '#2d3436' : '#a0a0b0',
            grid: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
        };
    }

    function updateChartsTheme() {
        try {
            const colors = getChartColors();
            const updateChartOptions = (chart) => {
                if (!chart || !chart.options) return;

                if (chart.options.plugins && chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = colors.text;
                }

                if (chart.options.scales) {
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks.color = colors.text;
                        chart.options.scales.x.grid.color = colors.grid;
                    }
                    if (chart.options.scales.y) {
                        chart.options.scales.y.ticks.color = colors.text;
                        chart.options.scales.y.grid.color = colors.grid;
                    }
                }
                chart.update();
            };

            updateChartOptions(todayChart);
            updateChartOptions(monthlyDailyChart);
            updateChartOptions(monthlyCategoryChart);
        } catch (e) {
            console.warn('Failed to update chart theme:', e);
        }
    }

    // Chart.js Initialization
    let todayChart;

    function initChart() {
        const canvas = document.getElementById('todayChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const colors = getChartColors();
        todayChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'],
                datasets: [{
                    label: 'Expenses',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'left', labels: { color: colors.text, padding: 20, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    }


    function updateChart(currentTransactions) {
        if (!todayChart) return;

        // Aggregate expenses by category
        const categories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];
        const dataMap = new Array(categories.length).fill(0);

        currentTransactions.forEach(t => {
            if (t.type === 'expense') {
                const idx = categories.indexOf(t.category);
                if (idx !== -1) {
                    dataMap[idx] += t.amount;
                }
            }
        });

        todayChart.data.datasets[0].data = dataMap;
        todayChart.update();
    }

    initChart();

    // --- Monthly View Logic ---
    let monthlyDailyChart = null;
    let monthlyCategoryChart = null;
    const monthlyTransactionsTableBody = document.getElementById('monthlyTransactionsTableBody');

    function renderMonthlyView(targetDate = new Date()) {
        const now = targetDate;
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Update Daily Activity Title
        const dailyActivityTitle = document.getElementById('dailyActivityTitle');
        if (dailyActivityTitle) {
            dailyActivityTitle.textContent = `${monthNames[currentMonth]} Activity`;
        }

        // 1. Filter Transactions for Month & Account
        let monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        if (activeAccount) {
            monthlyTransactions = monthlyTransactions.filter(t => t.account === activeAccount);
        }

        // --- Expense Comparison Logic ---
        const currentMonthExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        let lastMonthTransactions = transactions.filter(t =>
            t.date.getMonth() === lastMonth &&
            t.date.getFullYear() === lastMonthYear &&
            t.type === 'expense'
        );

        if (activeAccount) {
            lastMonthTransactions = lastMonthTransactions.filter(t => t.account === activeAccount);
        }

        const lastMonthExpenses = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const comparisonTextEl = document.getElementById('monthlyComparisonText');

        if (comparisonTextEl) {
            if (lastMonthExpenses === 0) {
                if (currentMonthExpenses === 0) {
                    comparisonTextEl.textContent = "No expenses recorded for this month or last month.";
                } else {
                    comparisonTextEl.textContent = `You spent ${AppCurrency.format(currentMonthExpenses)} this month. No data for last month.`;
                }
            } else {
                const diff = currentMonthExpenses - lastMonthExpenses;
                if (diff > 0) {
                    comparisonTextEl.textContent = `You spent ${AppCurrency.format(Math.abs(diff))} more than last month.`;
                    comparisonTextEl.style.color = '#e74c3c'; // Red for more spending
                } else if (diff < 0) {
                    comparisonTextEl.textContent = `You spent ${AppCurrency.format(Math.abs(diff))} less than last month.`;
                    comparisonTextEl.style.color = '#2ecc71'; // Green for savings
                } else {
                    comparisonTextEl.textContent = "You spent exactly the same as last month.";
                    comparisonTextEl.style.color = '#a0a0b0';
                }
            }
        }
        // -----------------------------

        // 2. Render Monthly Transactions Table
        if (monthlyTransactions.length === 0) {
            monthlyTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No transactions this month</td></tr>';
        } else {
            // Sort Date Descending
            monthlyTransactions.sort((a, b) => b.date - a.date);
            monthlyTransactionsTableBody.innerHTML = monthlyTransactions.map(t => {
                const dateObj = new Date(t.date);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sign = t.type === 'income' ? '+' : '-';
                const amountClass = t.type === 'income' ? 'income' : 'expense';
                const formattedAmount = AppCurrency.format(t.amount);
                const displayTitle = t.title;

                return `
                <tr class="transaction-row">
                    <td>
                        <div class="t-info">
                            <span class="t-title">${displayTitle}</span>
                             ${t.type === 'expense' ? `<span class="t-meta">${t.category}</span>` : `<span class="t-meta">${t.source}</span>`}
                        </div>
                    </td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td style="text-align: right;">
                        <span class="t-amount ${amountClass}">${sign}${formattedAmount}</span>
                    </td>
                </tr>`;
            }).join('');
        }

        // 3. Prepare Chart Data
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const dailyData = new Array(daysInMonth).fill(0);

        const categories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];
        const categoryData = new Array(categories.length).fill(0);

        monthlyTransactions.forEach(t => {
            if (t.type === 'expense') {
                // Daily Data (Day 1 is index 0)
                const day = t.date.getDate();
                if (day <= daysInMonth) {
                    dailyData[day - 1] += t.amount;
                }

                // Category Data
                const catIdx = categories.indexOf(t.category);
                if (catIdx !== -1) {
                    categoryData[catIdx] += t.amount;
                }
            }
        });

        // 4. Render/Update Daily Bar Chart
        const dailyCtx = document.getElementById('monthlyDailyChart').getContext('2d');
        const colors = getChartColors();

        if (monthlyDailyChart) {
            monthlyDailyChart.destroy();
        }

        monthlyDailyChart = new Chart(dailyCtx, {
            type: 'bar',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'Daily Expenses',
                    data: dailyData,
                    backgroundColor: '#6c5ce7',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.grid },
                        ticks: { color: colors.text }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    }
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const day = index + 1; // logical day (1-31)

                        // Filter filtering for Day
                        const clickedDate = new Date(currentYear, currentMonth, day);
                        const dailyTransactions = monthlyTransactions.filter(t => {
                            const tD = new Date(t.date);
                            return tD.getDate() === day;
                        });


                        // Open Modal
                        const modal = document.getElementById('dayDetailsModal');
                        const dateHeader = document.getElementById('dayDetailsDate');
                        const listContainer = document.getElementById('dayDetailsList');

                        if (modal && dateHeader && listContainer) {
                            dateHeader.textContent = clickedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                            if (dailyTransactions.length === 0) {
                                listContainer.innerHTML = '<div class="empty-msg">No transactions found.</div>';
                            } else {
                                // Sort by time
                                dailyTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                                listContainer.innerHTML = dailyTransactions.map(t => {
                                    const timeStr = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const amountClass = t.type === 'income' ? 'income' : 'expense';
                                    const sign = t.type === 'income' ? '+' : '-';
                                    const formatted = AppCurrency.format(t.amount);
                                    const sourceOrCat = t.type === 'expense' ? t.category : t.source;

                                    return `
                                        <div class="transaction-row" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                                            <div class="t-info">
                                                <span class="t-title" style="display: block; font-weight: 500;">${t.title || 'Transaction'}</span>
                                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                                                    <span>${timeStr}</span> • <span>${sourceOrCat}</span>
                                                    <div style="margin-top:2px;">Account: ${t.account}</div>
                                                </div>
                                            </div>
                                            <span class="t-amount ${amountClass}" style="font-weight: 700; font-size: 1.1rem; color: ${t.type === 'income' ? 'var(--accent-secondary)' : '#ff7675'};">${sign}${formatted}</span>
                                        </div>
                                        `;
                                }).join('');
                            }
                            openModal(modal);
                        }
                    }
                }
            }
        });

        // Modal Close Logic
        const closeDayBtn = document.getElementById('closeDayDetails');
        const dayModal = document.getElementById('dayDetailsModal');
        if (closeDayBtn && dayModal) {
            closeDayBtn.onclick = () => {
                dayModal.style.display = 'none';
            };
        }

        // 5. Render/Update Monthly Category Pie Chart
        const catCtx = document.getElementById('monthlyCategoryChart').getContext('2d');
        if (monthlyCategoryChart) {
            monthlyCategoryChart.data.datasets[0].data = categoryData;
            // Update colors dynamically
            monthlyCategoryChart.options.plugins.legend.labels.color = colors.text;
            monthlyCategoryChart.update();
        } else {
            monthlyCategoryChart = new Chart(catCtx, {
                type: 'pie', // User asked for Pie
                data: {
                    labels: categories,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'left', labels: { color: colors.text, padding: 20, usePointStyle: true } }
                    }
                }
            });
        }

        function renderMonthlyView(targetDate = new Date()) {
            const now = targetDate;
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            // Update Daily Activity Title
            const dailyActivityTitle = document.getElementById('dailyActivityTitle');
            if (dailyActivityTitle) {
                dailyActivityTitle.textContent = `${monthNames[currentMonth]} Activity`;
            }

            // 1. Filter Transactions for Month & Account
            let monthlyTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });

            if (activeAccount) {
                monthlyTransactions = monthlyTransactions.filter(t => t.account === activeAccount);
            }

            // --- Expense Comparison Logic ---
            const currentMonthExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();

            let lastMonthTransactions = transactions.filter(t =>
                t.date.getMonth() === lastMonth &&
                t.date.getFullYear() === lastMonthYear &&
                t.type === 'expense'
            );

            if (activeAccount) {
                lastMonthTransactions = lastMonthTransactions.filter(t => t.account === activeAccount);
            }

            const lastMonthExpenses = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
            const comparisonTextEl = document.getElementById('monthlyComparisonText');

            if (comparisonTextEl) {
                if (lastMonthExpenses === 0) {
                    if (currentMonthExpenses === 0) {
                        comparisonTextEl.textContent = "No expenses recorded for this month or last month.";
                    } else {
                        comparisonTextEl.textContent = `You spent ${AppCurrency.format(currentMonthExpenses)} this month. No data for last month.`;
                    }
                } else {
                    const diff = currentMonthExpenses - lastMonthExpenses;
                    if (diff > 0) {
                        comparisonTextEl.textContent = `You spent ${AppCurrency.format(Math.abs(diff))} more than last month.`;
                        comparisonTextEl.style.color = '#e74c3c'; // Red for more spending
                    } else if (diff < 0) {
                        comparisonTextEl.textContent = `You spent ${AppCurrency.format(Math.abs(diff))} less than last month.`;
                        comparisonTextEl.style.color = '#2ecc71'; // Green for savings
                    } else {
                        comparisonTextEl.textContent = "You spent exactly the same as last month.";
                        comparisonTextEl.style.color = '#a0a0b0';
                    }
                }
            }
            // -----------------------------

            // 2. Render Monthly Transactions Table
            if (monthlyTransactions.length === 0) {
                monthlyTransactionsTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No transactions this month</td></tr>';
            } else {
                // Sort Date Descending
                monthlyTransactions.sort((a, b) => b.date - a.date);
                monthlyTransactionsTableBody.innerHTML = monthlyTransactions.map(t => {
                    const dateObj = new Date(t.date);
                    const dateStr = dateObj.toLocaleDateString();
                    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const sign = t.type === 'income' ? '+' : '-';
                    const amountClass = t.type === 'income' ? 'income' : 'expense';
                    const formattedAmount = AppCurrency.format(t.amount);
                    const displayTitle = t.title;

                    return `
                <tr class="transaction-row">
                    <td>
                        <div class="t-info">
                            <span class="t-title">${displayTitle}</span>
                             ${t.type === 'expense' ? `<span class="t-meta">${t.category}</span>` : `<span class="t-meta">${t.source}</span>`}
                        </div>
                    </td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td style="text-align: right;">
                        <span class="t-amount ${amountClass}">${sign}${formattedAmount}</span>
                    </td>
                </tr>`;
                }).join('');
            }

            // 3. Prepare Chart Data
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const dailyData = new Array(daysInMonth).fill(0);

            const categories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];
            const categoryData = new Array(categories.length).fill(0);

            monthlyTransactions.forEach(t => {
                if (t.type === 'expense') {
                    // Daily Data (Day 1 is index 0)
                    const day = t.date.getDate();
                    if (day <= daysInMonth) {
                        dailyData[day - 1] += t.amount;
                    }

                    // Category Data
                    const catIdx = categories.indexOf(t.category);
                    if (catIdx !== -1) {
                        categoryData[catIdx] += t.amount;
                    }
                }
            });

            // 4. Render/Update Daily Bar Chart
            const dailyCtx = document.getElementById('monthlyDailyChart').getContext('2d');
            const colors = getChartColors();

            if (monthlyDailyChart) {
                monthlyDailyChart.destroy();
            }

            monthlyDailyChart = new Chart(dailyCtx, {
                type: 'bar',
                data: {
                    labels: dailyLabels,
                    datasets: [{
                        label: 'Daily Expenses',
                        data: dailyData,
                        backgroundColor: '#6c5ce7',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: colors.grid },
                            ticks: { color: colors.text }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: colors.text }
                        }
                    },
                    onClick: (e, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const day = index + 1; // logical day (1-31)

                            // Filter filtering for Day
                            const clickedDate = new Date(currentYear, currentMonth, day);
                            const dailyTransactions = monthlyTransactions.filter(t => {
                                const tD = new Date(t.date);
                                return tD.getDate() === day;
                            });


                            // Open Modal
                            const modal = document.getElementById('dayDetailsModal');
                            const dateHeader = document.getElementById('dayDetailsDate');
                            const listContainer = document.getElementById('dayDetailsList');

                            if (modal && dateHeader && listContainer) {
                                dateHeader.textContent = clickedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                                if (dailyTransactions.length === 0) {
                                    listContainer.innerHTML = '<div class="empty-msg">No transactions found.</div>';
                                } else {
                                    // Sort by time
                                    dailyTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                                    listContainer.innerHTML = dailyTransactions.map(t => {
                                        const timeStr = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const amountClass = t.type === 'income' ? 'income' : 'expense';
                                        const sign = t.type === 'income' ? '+' : '-';
                                        const formatted = AppCurrency.format(t.amount);
                                        const sourceOrCat = t.type === 'expense' ? t.category : t.source;

                                        return `
                                        <div class="transaction-row" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                                            <div class="t-info">
                                                <span class="t-title" style="display: block; font-weight: 500;">${t.title || 'Transaction'}</span>
                                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                                                    <span>${timeStr}</span> • <span>${sourceOrCat}</span>
                                                    <div style="margin-top:2px;">Account: ${t.account}</div>
                                                </div>
                                            </div>
                                            <span class="t-amount ${amountClass}" style="font-weight: 700; font-size: 1.1rem; color: ${t.type === 'income' ? 'var(--accent-secondary)' : '#ff7675'};">${sign}${formatted}</span>
                                        </div>
                                        `;
                                    }).join('');
                                }
                                openModal(modal);
                            }
                        }
                    }
                }
            });

            // Modal Close Logic
            const closeDayBtn = document.getElementById('closeDayDetails');
            const dayModal = document.getElementById('dayDetailsModal');
            if (closeDayBtn && dayModal) {
                closeDayBtn.onclick = () => {
                    dayModal.style.display = 'none';
                };
            }

            // 5. Render/Update Monthly Category Pie Chart
            const catCtx = document.getElementById('monthlyCategoryChart').getContext('2d');
            if (monthlyCategoryChart) {
                monthlyCategoryChart.data.datasets[0].data = categoryData;
                // Update colors dynamically if reused (though full update handles it usually, explicit options update is better)
                monthlyCategoryChart.options.plugins.legend.labels.color = colors.text;
                monthlyCategoryChart.update();
            } else {
                monthlyCategoryChart = new Chart(catCtx, {
                    type: 'pie', // User asked for Pie
                    data: {
                        labels: categories,
                        datasets: [{
                            data: categoryData,
                            backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'left', labels: { color: colors.text, padding: 20, usePointStyle: true } }
                        }
                    }
                });
            }
        }

        // Add Account & Dropdown Logic
        const accountsToggle = document.getElementById('accountsToggle');
        const accountsToggleText = accountsToggle.querySelector('span'); // Get the text span
        const accountsMenu = document.getElementById('accountsMenu');
        const accountsList = document.getElementById('accountsList');
        const addNewAccountAction = document.getElementById('addNewAccountAction');

        // Monthly View Dropdown Elements
        const accountsToggleMonth = document.getElementById('accountsToggleMonth');
        const accountsToggleTextMonth = accountsToggleMonth ? accountsToggleMonth.querySelector('span') : null;
        const accountsMenuMonth = document.getElementById('accountsMenuMonth');
        const accountsListMonth = document.getElementById('accountsListMonth');
        const addNewAccountActionMonth = document.getElementById('addNewAccountActionMonth');
        const newAccountFormMonth = document.getElementById('newAccountFormMonth');
        const newAccountNameInputMonth = document.getElementById('newAccountNameMonth');
        const confirmAddAccountBtnMonth = document.getElementById('confirmAddAccountMonth');

        // Month Selector Logic
        const monthSelector = document.getElementById('monthSelector');
        if (monthSelector) {
            // Set default to current month YYYY-MM
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            monthSelector.value = `${yyyy}-${mm}`;

            monthSelector.addEventListener('change', (e) => {
                if (e.target.value) {
                    const [selectedYear, selectedMonth] = e.target.value.split('-');
                    // Create date for 1st of selected month
                    // Month is 0-indexed in JS Date
                    const targetDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
                    renderMonthlyView(targetDate);
                }
            });
        }
        const cancelAddAccountBtnMonth = document.getElementById('cancelAddAccountBtnMonth');

        // New Form Elements
        const newAccountForm = document.getElementById('newAccountForm');
        const newAccountNameInput = document.getElementById('newAccountName');
        const confirmAddAccountBtn = document.getElementById('confirmAddAccount');
        const cancelAddAccountBtn = document.getElementById('cancelAddAccount');

        // Initial Accounts
        const accounts = [];
        let activeAccount = null;

        function renderAccounts() {
            const renderList = (listEl) => {
                if (accounts.length === 0) {
                    listEl.innerHTML = '<li class="empty-state" style="font-style: italic; opacity: 0.7;">No accounts yet</li>';
                    return;
                }

                listEl.innerHTML = accounts.map(acc => `
                <li class="account-item ${activeAccount === acc.name ? 'active' : ''}" data-account="${acc.name}">
                    <div class="acc-info">
                        <span class="acc-name">${acc.name}</span>
                        <span class="acc-balance">${AppCurrency.format(acc.balance)}</span>
                    </div>
                    ${activeAccount === acc.name ? '<span class="check-icon">✓</span>' : ''}
                </li>
            `).join('');

                // Add Click Listeners to Items
                listEl.querySelectorAll('.account-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        const accName = item.dataset.account;
                        setActiveAccount(accName);
                        // Close both menus
                        accountsMenu.classList.remove('show');
                        accountsToggle.classList.remove('active');
                        if (accountsMenuMonth) accountsMenuMonth.classList.remove('show');
                        if (accountsToggleMonth) accountsToggleMonth.classList.remove('active');
                    });
                });
            };

            renderList(accountsList);
            if (accountsListMonth) renderList(accountsListMonth);
        }

        function setActiveAccount(name) {
            activeAccount = name;
            accountsToggleText.textContent = name; // Update button text
            if (accountsToggleTextMonth) accountsToggleTextMonth.textContent = name;

            saveData(); // Save active account preference

            renderAccounts(); // Re-render to show checkmark
            renderTransactions(); // Update transactions list
            renderMonthlyView(); // Update monthly view if active
        }

        // Theme Toggle Logic
        const themeToggle = document.getElementById('themeToggle'); // Settings Switch
        const navThemeToggle = document.getElementById('navThemeToggle'); // Navbar Button
        const storedTheme = localStorage.getItem('theme');

        function applyTheme(theme) {
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (themeToggle) themeToggle.checked = true;

                // Update Navbar Icon
                if (navThemeToggle) {
                    navThemeToggle.querySelector('.theme-icon-moon').style.display = 'none';
                    navThemeToggle.querySelector('.theme-icon-sun').style.display = 'block';
                }
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                if (themeToggle) themeToggle.checked = false;

                // Update Navbar Icon
                if (navThemeToggle) {
                    navThemeToggle.querySelector('.theme-icon-moon').style.display = 'block';
                    navThemeToggle.querySelector('.theme-icon-sun').style.display = 'none';
                }
            }
            updateChartsTheme();
        }

        // Initial Load
        if (storedTheme) {
            applyTheme(storedTheme);
        } else {
            // Default to dark logic if needed, or just let CSS handle default
            // Ensuring icons are correct for default dark
            applyTheme('dark');
        }

        // Settings Switch Listener
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                applyTheme(e.target.checked ? 'light' : 'dark');
            });
        }

        // Navbar Button Listener
        if (navThemeToggle) {
            navThemeToggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const newTheme = current === 'light' ? 'dark' : 'light';
                applyTheme(newTheme);
            });
        }

        // Initial Load & Render
        AppCurrency.load(); // Load currency preference
        loadData(); // Load accounts and transactions

        // Set active account UI if loaded
        if (activeAccount) {
            accountsToggleText.textContent = activeAccount;
            if (accountsToggleTextMonth) accountsToggleTextMonth.textContent = activeAccount;
        }

        renderAccounts();
        updateFormAccountSelects(activeAccount);

        accountsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            accountsMenu.classList.toggle('show');
            accountsToggle.classList.toggle('active');

            // Reset form state when closing/opening
            if (!accountsMenu.classList.contains('show')) {
                resetAddAccountForm();
            }
            // Ensure other menu is closed
            if (accountsMenuMonth) accountsMenuMonth.classList.remove('show');
        });

        if (accountsToggleMonth) {
            accountsToggleMonth.addEventListener('click', (e) => {
                e.stopPropagation();
                accountsMenuMonth.classList.toggle('show');
                accountsToggleMonth.classList.toggle('active');

                // Reset form state
                if (!accountsMenuMonth.classList.contains('show')) {
                    resetAddAccountFormMonth();
                }
                // Ensure other menu is closed
                accountsMenu.classList.remove('show');
            });

            accountsMenuMonth.addEventListener('click', (e) => e.stopPropagation());
        }

        // Close Dropdown when clicking outside
        window.addEventListener('click', () => {
            if (accountsMenu.classList.contains('show')) {
                accountsMenu.classList.remove('show');
                accountsToggle.classList.remove('active');
                resetAddAccountForm();
            }
            if (accountsMenuMonth && accountsMenuMonth.classList.contains('show')) {
                accountsMenuMonth.classList.remove('show');
                accountsToggleMonth.classList.remove('active');
                resetAddAccountFormMonth();
            }
        });

        accountsMenu.addEventListener('click', (e) => e.stopPropagation());

        // Switch to Form Mode
        addNewAccountAction.addEventListener('click', () => {
            addNewAccountAction.style.display = 'none';
            newAccountForm.style.display = 'block';
            newAccountNameInput.focus();
        });

        if (addNewAccountActionMonth) {
            addNewAccountActionMonth.addEventListener('click', () => {
                addNewAccountActionMonth.style.display = 'none';
                newAccountFormMonth.style.display = 'block';
                newAccountNameInputMonth.focus();
            });
        }

        // Cancel Add
        cancelAddAccountBtn.addEventListener('click', () => {
            resetAddAccountForm();
        });

        if (cancelAddAccountBtnMonth) {
            cancelAddAccountBtnMonth.addEventListener('click', () => {
                resetAddAccountFormMonth();
            });
        }

        function resetAddAccountForm() {
            newAccountForm.style.display = 'none';
            addNewAccountAction.style.display = 'block';
            newAccountNameInput.value = '';
        }

        function resetAddAccountFormMonth() {
            if (newAccountFormMonth) {
                newAccountFormMonth.style.display = 'none';
                addNewAccountActionMonth.style.display = 'block';
                newAccountNameInputMonth.value = '';
            }
        }

        // Confirm Add Logic Shared
        function handleAddAccount(nameInput, menu, toggle, resetFunc) {
            const accountName = nameInput.value.trim();
            if (accountName) {
                // Check for duplicate names
                if (accounts.some(acc => acc.name === accountName)) {
                    alert('Account with this name already exists.');
                    return;
                }

                // Add to data array
                accounts.push({
                    name: accountName,
                    balance: 0.00
                });

                // Auto-select
                setActiveAccount(accountName);

                saveData(); // Save new account

                // Add to Form Selects
                updateFormAccountSelects(accountName);

                // Reset UI
                resetFunc();
                menu.classList.remove('show');
                toggle.classList.remove('active');
            }
        }

        // Confirm Add
        confirmAddAccountBtn.addEventListener('click', () => {
            handleAddAccount(newAccountNameInput, accountsMenu, accountsToggle, resetAddAccountForm);
        });

        if (confirmAddAccountBtnMonth) {
            confirmAddAccountBtnMonth.addEventListener('click', () => {
                handleAddAccount(newAccountNameInputMonth, accountsMenuMonth, accountsToggleMonth, resetAddAccountFormMonth);
            });
        }

        function updateFormAccountSelects(selectedAccountName = null) {
            const incomeSelect = document.getElementById('incomeAccountSelect');
            const expenseSelect = document.getElementById('expenseAccountSelect');

            [incomeSelect, expenseSelect].forEach(select => {
                if (!select) return;

                // Save current selection if valid, unless we have a specific target
                let targetVal = selectedAccountName || select.value;

                // Clear existing options (except first placeholder)
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // Populate from accounts array
                accounts.forEach(acc => {
                    const option = document.createElement('option');
                    option.text = acc.name;
                    option.value = acc.name;
                    select.add(option);
                });

                // Set value
                if (targetVal) {
                    // Check if targetVal exists in options to avoid error or empty selection
                    // though assigning a non-existent value usually just defaults to empty/first.
                    // We want to ensure it works.
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value === targetVal) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                }
            });
        }


        // Allow Enter key to submit
        newAccountNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmAddAccountBtn.click();
            }
        });

        // Expandable Panels Logic
        const expandables = document.querySelectorAll('.glass-panel.expandable');

        expandables.forEach(panel => {
            const header = panel.querySelector('.panel-header');
            const form = panel.querySelector('form');
            const closeBtn = panel.querySelector('.close-modal-x');

            // Toggle on Header Click
            if (header) {
                header.addEventListener('click', () => {
                    panel.classList.toggle('expanded');
                });
            }

            // Close on X Click
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    panel.classList.remove('expanded');
                });
            }

            // Handle Form Submission 
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const isIncome = form.id === 'incomeForm';
                    const formData = new FormData(form);

                    // Find account selection
                    const accountSelect = form.querySelector('select');
                    if (!accountSelect.value || accountSelect.value === "") {
                        alert('Please create and select an account first.');
                        return;
                    }

                    const selectedAccountName = accountSelect.options[accountSelect.selectedIndex].text;

                    const amount = parseFloat(form.querySelector('input[type="number"]').value);

                    if (isNaN(amount) || amount <= 0) {
                        alert('Please enter a valid amount');
                        return;
                    }

                    const transactionData = {
                        type: isIncome ? 'income' : 'expense',
                        account: selectedAccountName,
                        amount: amount,
                        title: isIncome ? 'Income' : (form.querySelector('input[placeholder="Purpose of transaction"]').value || 'Expense'),
                    };

                    if (isIncome) {
                        transactionData.source = form.querySelector('input[placeholder="e.g. Salary, Freelance"]').value || 'Unknown Source';
                    } else {
                        transactionData.category = document.getElementById('expenseCategory').value || 'Uncategorized';
                    }

                    addTransaction(transactionData);

                    form.reset();
                    // Collapse after add as per user request "after completing it will be like same"
                    panel.classList.remove('expanded');
                });
            }
        });

        function addTransaction(data) {
            // Add transaction to list
            transactions.push({
                id: Date.now(),
                date: new Date(),
                ...data
            });

            // Update Account Balance
            const account = accounts.find(acc => acc.name === data.account);
            if (account) {
                if (data.type === 'income') {
                    account.balance += data.amount;
                } else {
                    account.balance -= data.amount;
                }
            }

            saveData(); // Save after modifying transactions and balances

            renderTransactions();
            renderAccounts(); // Re-render accounts to update balance display
            AppCurrency.updateDashboard();
            alert('Transaction Added!');
        }


        // Modify Register Form Submit


        // Currency Exchange Logic
        // --- Currency Exchange Module ---
        const CurrencyManager = {
            API_KEY: '8638fb66971d17f15609568e',
            get apiUrl() { return `https://v6.exchangerate-api.com/v6/${this.API_KEY}/latest/USD`; },
            rates: {},
            codes: [],

            elements: {
                appCurrencyInput: document.getElementById('appCurrencySelect'),
                currencyList: document.getElementById('currencyList'),
                dropdownArrow: document.getElementById('currencySelectArrow')
            },

            async fetchRates() {
                try {
                    const response = await fetch(this.apiUrl);
                    const data = await response.json();

                    if (data.result === 'success') {
                        this.rates = data.conversion_rates;

                        this.codes = Object.keys(this.rates);

                        // Sync with AppCurrency
                        AppCurrency.rates = this.rates;

                        this.populateCurrencyList();

                        // Initial Dashboard Update
                        AppCurrency.updateDashboard();
                        renderTransactions();
                        renderAccounts();
                    } else {
                        console.error('Failed to load rates');
                    }
                } catch (error) {
                    console.error('Error fetching rates:', error);
                }
            },

            populateCurrencyList() {
                const { currencyList, appCurrencyInput } = this.elements;

                if (currencyList) {
                    const frag = document.createDocumentFragment();
                    this.codes.forEach(code => {
                        const opt = document.createElement('option');
                        opt.value = code;
                        frag.appendChild(opt);
                    });
                    currencyList.innerHTML = '';
                    currencyList.appendChild(frag);
                }

                // Initialize Input Value check
                if (appCurrencyInput && !appCurrencyInput.value) {
                    appCurrencyInput.value = AppCurrency.current;
                }
            }
        };

        // --- Utilities ---
        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        // --- Event Listeners ---
        if (CurrencyManager.elements.appCurrencyInput) {
            CurrencyManager.elements.appCurrencyInput.addEventListener('change', (e) => {
                const val = e.target.value.toUpperCase();
                // Validate if valid code
                if (CurrencyManager.codes.includes(val)) {
                    AppCurrency.current = val;
                    AppCurrency.save(); // Save new currency preference
                    AppCurrency.updateDashboard();
                    renderTransactions();
                    renderAccounts();
                    CurrencyManager.elements.appCurrencyInput.blur();
                }
            });

            // Optional: Select all on focus for easier search
            CurrencyManager.elements.appCurrencyInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }

        // Arrow Click Logic for Currency Selector
        if (CurrencyManager.elements.dropdownArrow && CurrencyManager.elements.appCurrencyInput) {
            const arrow = CurrencyManager.elements.dropdownArrow;
            const input = CurrencyManager.elements.appCurrencyInput;
            let previousValue = '';

            arrow.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling

                // Save current value if valid to restore if needed
                if (input.value) previousValue = input.value;

                // Clear input to force datalist to show all options
                input.value = '';
                input.focus();
            });

            // Restore value if blurred empty
            input.addEventListener('blur', () => {
                // Delay to allow selection from list
                setTimeout(() => {
                    if (input.value === '') {
                        input.value = previousValue || AppCurrency.current;
                    }
                    // If input has valid value, update previous
                    if (input.value) previousValue = input.value;
                }, 200);
            });
        }

        // Initialize Currency Data immediately for Global features
        CurrencyManager.fetchRates();

        // Settings Integration
        // The settings button listener is defined earlier, we can append logic here or hook into the specific button if accessible.
        // We'll trust the existing settingsBtn logic switches view.
        const settingsBtnCheck = document.getElementById('settingsBtn');
        if (settingsBtnCheck) {
            settingsBtnCheck.addEventListener('click', () => {
                // Already fetching on load, so maybe just ensure UI is updated if needed.
                // But if fetch failed, we might want to retry?
                if (CurrencyManager.codes.length === 0) {
                    CurrencyManager.fetchRates();
                }
            });
        }





        // --- Yearly View Logic ---
        let yearlyCategoryChart = null;
        let yearlyComparisonChart = null;

        function renderYearlyView() {
            const now = new Date();
            const currentYear = now.getFullYear();

            // 1. Filter Transactions for Current Calendar Year
            let yearlyTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getFullYear() === currentYear;
            });

            if (activeAccount) {
                yearlyTransactions = yearlyTransactions.filter(t => t.account === activeAccount);
            }

            // Dynamic Categories: Aggregate from actual yearly transactions
            const categoryTotals = {};
            yearlyTransactions.forEach(t => {
                if (t.type === 'expense') {
                    const cat = t.category || 'Uncategorized';
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
                }
            });

            const dynamicCategories = Object.keys(categoryTotals);
            const dynamicCategoryData = Object.values(categoryTotals);

            // Prepare Jan-Dec Labels & Data for Bar Chart
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthLabels = monthNames;
            const monthlyData = new Array(12).fill(0);

            yearlyTransactions.forEach(t => {
                if (t.type === 'expense') {
                    const tDate = new Date(t.date);
                    const amount = t.amount;

                    // Monthly Data (Bar Chart)
                    const m = tDate.getMonth(); // 0-11
                    monthlyData[m] += amount;
                }
            });

            // 2. Render/Update Yearly Category Chart (Pie)
            const catCtx = document.getElementById('yearlyCategoryChart');
            const catWrapper = catCtx ? catCtx.parentElement : null;

            if (catCtx && catWrapper) {
                const totalExpenses = dynamicCategoryData.reduce((a, b) => a + b, 0);

                // Remove existing no-data message if any
                const existingMsg = catWrapper.querySelector('.no-data-msg');
                if (existingMsg) existingMsg.remove();

                if (totalExpenses === 0) {
                    catCtx.style.display = 'none';
                    const msg = document.createElement('div');
                    msg.className = 'no-data-msg';
                    msg.textContent = 'No expenses recorded for this year.';
                    msg.style.color = 'var(--text-secondary)';
                    msg.style.fontStyle = 'italic';
                    catWrapper.appendChild(msg);
                } else {
                    catCtx.style.display = 'block';
                    const ctx = catCtx.getContext('2d');

                    // Generate Colors dynamically
                    const baseColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
                    const bgColors = dynamicCategories.map((_, i) => baseColors[i % baseColors.length]);

                    if (yearlyCategoryChart) {
                        yearlyCategoryChart.data.labels = dynamicCategories;
                        yearlyCategoryChart.data.datasets[0].data = dynamicCategoryData;
                        yearlyCategoryChart.data.datasets[0].backgroundColor = bgColors;
                        yearlyCategoryChart.update();
                    } else {
                        yearlyCategoryChart = new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: dynamicCategories,
                                datasets: [{
                                    data: dynamicCategoryData,
                                    backgroundColor: bgColors,
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'left', labels: { color: '#a0a0b0', padding: 20, usePointStyle: true } }
                                }
                            }
                        });
                    }
                }
            }

            // 3. Render/Update Monthly Comparison Chart (Bar)
            const compCtx = document.getElementById('yearlyComparisonChart');
            const compWrapper = compCtx ? compCtx.parentElement : null;

            if (compCtx && compWrapper) {
                const totalMonthlyParams = monthlyData.reduce((a, b) => a + b, 0);

                // Remove existing no-data msg
                const existingMsg = compWrapper.querySelector('.no-data-msg');
                if (existingMsg) existingMsg.remove();

                if (totalMonthlyParams === 0) {
                    compCtx.style.display = 'none';
                    const msg = document.createElement('div');
                    msg.className = 'no-data-msg';
                    msg.textContent = 'No data available for this year.';
                    msg.style.color = 'var(--text-secondary)';
                    msg.style.fontStyle = 'italic';
                    // Center it
                    msg.style.position = 'absolute';
                    msg.style.top = '50%';
                    msg.style.left = '50%';
                    msg.style.transform = 'translate(-50%, -50%)';
                    compWrapper.appendChild(msg);
                } else {
                    compCtx.style.display = 'block';
                    const ctx = compCtx.getContext('2d');
                    if (yearlyComparisonChart) {
                        yearlyComparisonChart.data.labels = monthLabels;
                        yearlyComparisonChart.data.datasets[0].data = monthlyData;
                        yearlyComparisonChart.update();
                    } else {
                        yearlyComparisonChart = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: monthLabels,
                                datasets: [{
                                    label: 'Monthly Expenses',
                                    data: monthlyData,
                                    backgroundColor: '#6c5ce7',
                                    borderRadius: 4
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                        ticks: { color: '#a0a0b0' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#a0a0b0' }
                                    }
                                }
                            }
                        });
                    }
                }
            }

            // 4. Yearly Transactions List
            const yearlyTableBody = document.getElementById('yearlyTransactionsTableBody');
            if (yearlyTableBody) {
                if (yearlyTransactions.length === 0) {
                    yearlyTableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No transactions this year</td></tr>';
                } else {
                    // Sort Date Descending (Newest First)
                    yearlyTransactions.sort((a, b) => b.date - a.date);
                    yearlyTableBody.innerHTML = yearlyTransactions.map(t => {
                        const dateObj = new Date(t.date);
                        const dateStr = dateObj.toLocaleDateString();
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const sign = t.type === 'income' ? '+' : '-';
                        const amountClass = t.type === 'income' ? 'income' : 'expense';
                        const formattedAmount = AppCurrency.format(t.amount);
                        const displayTitle = t.title;

                        return `
                <tr class="transaction-row">
                    <td>
                        <div class="t-info">
                            <span class="t-title">${displayTitle}</span>
                             ${t.type === 'expense' ? `<span class="t-meta">${t.category}</span>` : `<span class="t-meta">${t.source}</span>`}
                        </div>
                    </td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td style="text-align: right;">
                        <span class="t-amount ${amountClass}">${sign}${formattedAmount}</span>
                    </td>
                </tr>`;
                    }).join('');
                }
            }
        }
    }

    // --- Sample Data Generation for Dev/Demo ---
    const generateBtn = document.getElementById('generateDataBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            generateSampleData();
        });
    }

    function generateSampleData() {
        if (!confirm('This will modify your data for demonstration purposes. Continue?')) return;

        // Create a demo account if none exists
        if (accounts.length === 0) {
            accounts.push({ name: 'HDFC Bank', balance: 50000 });
            accounts.push({ name: 'Cash', balance: 5000 });
            activeAccount = 'HDFC Bank';
            localStorage.setItem('finance_active_account', activeAccount);
        }
        const accName = accounts[0].name;

        const categories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];
        const currentYear = new Date().getFullYear();

        // Generate ~50 random transactions
        for (let i = 0; i < 50; i++) {
            const month = Math.floor(Math.random() * 12);
            const day = Math.floor(Math.random() * 28) + 1;
            const hour = Math.floor(Math.random() * 24);
            const min = Math.floor(Math.random() * 60);

            const date = new Date(currentYear, month, day, hour, min);
            const isExpense = Math.random() > 0.3; // 70% expenses

            const amount = Math.floor(Math.random() * 2000) + 100;

            if (isExpense) {
                const cat = categories[Math.floor(Math.random() * categories.length)];
                transactions.push({
                    id: Date.now() + i,
                    date: date,
                    type: 'expense',
                    account: accName,
                    amount: amount,
                    category: cat,
                    title: `Demo ${cat}`
                });
                // Update balance
                const acc = accounts.find(a => a.name === accName);
                if (acc) acc.balance -= amount;

            } else {
                transactions.push({
                    id: Date.now() + i,
                    date: date,
                    type: 'income',
                    account: accName,
                    amount: amount * 5, // Higher income
                    source: 'Salary/Freelance',
                    title: 'Demo Income'
                });
                // Update balance
                const acc = accounts.find(a => a.name === accName);
                if (acc) acc.balance += (amount * 5);
            }
        }

        // Explicitly add recent data for Current Month to ensure charts look good immediately
        const now = new Date();
        for (let i = 0; i < 5; i++) {
            const date = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * now.getDate()) + 1);
            transactions.push({
                id: Date.now() + 100 + i,
                date: date,
                type: 'expense',
                account: accName,
                amount: Math.floor(Math.random() * 500) + 100,
                category: categories[i % categories.length],
                title: `Recent Demo ${categories[i % categories.length]}`
            });
            const acc = accounts.find(a => a.name === accName);
            if (acc) acc.balance -= 100;
        }

        // Save and Refresh
        localStorage.setItem('finance_accounts', JSON.stringify(accounts));
        localStorage.setItem('finance_transactions', JSON.stringify(transactions));

        // Determine active view to re-render correct one, but simpler to just reload or re-render everything
        alert('Sample Data Generated! Refreshing view...');
        location.reload();
    }

    // --- Landing Page Logic ---
    const getStartedBtn = document.getElementById('getStartedBtn');
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');

    if (getStartedBtn && landingPage && mainApp) {
        console.log('Landing page elements found, adding listener');
        getStartedBtn.addEventListener('click', () => {
            console.log('Get Started clicked');
            // 1. Animate Landing Page Out
            landingPage.classList.add('slide-out');

            // 2. Animate App In
            mainApp.classList.remove('app-hidden');
            mainApp.classList.add('app-visible');

            // 3. Trigger Render Logic after transition
            setTimeout(() => {
                if (typeof renderTransactions === 'function') renderTransactions();
                if (typeof AppCurrency !== 'undefined') AppCurrency.updateDashboard();

                // Remove landing from DOM for performance
                landingPage.style.display = 'none';
            }, 800);
        });
    } else {
        // Fallback if elements invalid
        if (mainApp) mainApp.classList.remove('app-hidden');
    }
});
