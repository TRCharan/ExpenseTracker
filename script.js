 // DOM Elements
        const transactionForm = document.getElementById('transaction-form');
        const transactionsList = document.getElementById('transactions-list');
        const totalBalanceElement = document.getElementById('total-balance');
        const totalIncomeElement = document.getElementById('total-income');
        const totalExpenseElement = document.getElementById('total-expense');
        const categorySelect = document.getElementById('category');
        const filterTypeSelect = document.getElementById('filter-type');
        const filterCategorySelect = document.getElementById('filter-category');
        const categoriesList = document.getElementById('categories-list');
        const budgetList = document.getElementById('budget-list');
        const expenseChartCanvas = document.getElementById('expense-chart');
        
        // Modal Elements
        const categoryModal = document.getElementById('category-modal');
        const addCategoryModalBtn = document.getElementById('add-category-modal-btn');
        const closeCategoryModal = document.getElementById('close-category-modal');
        const cancelCategory = document.getElementById('cancel-category');
        const categoryForm = document.getElementById('category-form');
        
        const budgetModal = document.getElementById('budget-modal');
        const addBudgetBtn = document.getElementById('add-budget-btn');
        const closeBudgetModal = document.getElementById('close-budget-modal');
        const cancelBudget = document.getElementById('cancel-budget');
        const budgetForm = document.getElementById('budget-form');
        
        
        const editTransactionModal = document.getElementById('edit-transaction-modal');
        const closeEditTransactionModal = document.getElementById('close-edit-transaction-modal');
        const cancelEditTransaction = document.getElementById('cancel-edit-transaction');
        const editTransactionForm = document.getElementById('edit-transaction-form');
        
        // State
        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let categories = JSON.parse(localStorage.getItem('categories')) || [
            { id: 1, name: 'Food', color: '#EF4444' },
            { id: 2, name: 'Transport', color: '#3B82F6' },
            { id: 3, name: 'Shopping', color: '#8B5CF6' },
            { id: 4, name: 'Entertainment', color: '#EC4899' },
            { id: 5, name: 'Salary', color: '#10B981' },
            { id: 6, name: 'Other', color: '#6B7280' }
        ];
        let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
        let nextCategoryId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
        let nextTransactionId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
        let nextBudgetId = budgets.length > 0 ? Math.max(...budgets.map(b => b.id)) + 1 : 1;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
            
            // Populate categories
            updateCategorySelects();
            renderCategories();
            renderTransactions();
            updateBalance();
            renderBudgets();
            updateChart();
            
            // Set up event listeners
            setupEventListeners();
        });
        
        function setupEventListeners() {
            // Transaction form submission
            transactionForm.addEventListener('submit', addTransaction);
            
            // Filter changes
            filterTypeSelect.addEventListener('change', renderTransactions);
            filterCategorySelect.addEventListener('change', renderTransactions);
            
            // Initialize Bootstrap modals
            const categoryModalElement = new bootstrap.Modal(document.getElementById('category-modal'));
            const budgetModalElement = new bootstrap.Modal(document.getElementById('budget-modal'));
            const editTransactionModalElement = new bootstrap.Modal(document.getElementById('edit-transaction-modal'));
            
            // Category modal
            addCategoryModalBtn.addEventListener('click', () => categoryModalElement.show());
            closeCategoryModal.addEventListener('click', () => categoryModalElement.hide());
            cancelCategory.addEventListener('click', () => categoryModalElement.hide());
            categoryForm.addEventListener('submit', addCategory);
            
            // Budget modal
            addBudgetBtn.addEventListener('click', () => {
                // Populate budget category select
                const budgetCategorySelect = document.getElementById('budget-category');
                budgetCategorySelect.innerHTML = '';
                
                categories.forEach(category => {
                    if (!budgets.some(b => b.categoryId === category.id)) {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        budgetCategorySelect.appendChild(option);
                    }
                });
                
                if (budgetCategorySelect.options.length === 0) {
                    alert('All categories already have budgets or no categories available.');
                    return;
                }
                
                budgetModalElement.show();
            });
            
            closeBudgetModal.addEventListener('click', () => budgetModalElement.hide());
            cancelBudget.addEventListener('click', () => budgetModalElement.hide());
            budgetForm.addEventListener('submit', addBudget);
            
            // Edit transaction modal
            closeEditTransactionModal.addEventListener('click', () => editTransactionModalElement.hide());
            cancelEditTransaction.addEventListener('click', () => editTransactionModalElement.hide());
            editTransactionForm.addEventListener('submit', updateTransaction);
            
            // Quick add category button
            document.getElementById('add-category-btn').addEventListener('click', () => {
                categoryModalElement.show();
            });
        }
        
        function addTransaction(e) {
            e.preventDefault();
            
            const type = document.getElementById('type').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value.trim();
            const categoryId = parseInt(document.getElementById('category').value);
            const date = document.getElementById('date').value;
            
            if (!description || isNaN(amount) || amount <= 0) {
                alert('Please enter valid transaction details.');
                return;
            }
            
            const category = categories.find(c => c.id === categoryId);
            
            const transaction = {
                id: nextTransactionId++,
                type,
                amount,
                description,
                categoryId,
                categoryName: category.name,
                categoryColor: category.color,
                date
            };
            
            transactions.push(transaction);
            saveTransactions();
            renderTransactions();
            updateBalance();
            updateChart();
            
            // Reset form
            transactionForm.reset();
            document.getElementById('date').valueAsDate = new Date();
        }
        
        function renderTransactions() {
            const filterType = filterTypeSelect.value;
            const filterCategory = filterCategorySelect.value;
            
            let filteredTransactions = [...transactions];
            
            if (filterType !== 'all') {
                filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
            }
            
            if (filterCategory !== 'all') {
                filteredTransactions = filteredTransactions.filter(t => t.categoryId === parseInt(filterCategory));
            }
            
            // Sort by date (newest first)
            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            transactionsList.innerHTML = '';
            
            if (filteredTransactions.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="text-center text-secondary p-3">No transactions found</td>
                `;
                transactionsList.appendChild(row);
                return;
            }
            
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.className = 'fade-in';
                
                const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
                const amountSign = transaction.type === 'income' ? '+' : '-';
                
                row.innerHTML = `
                    <td>
                        <div class="fw-medium">${transaction.description}</div>
                    </td>
                    <td>
                        <span class="category-color" style="background-color: ${transaction.categoryColor}"></span>
                        ${transaction.categoryName}
                    </td>
                    <td class="text-secondary">
                        ${new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td class="${amountClass} fw-medium">
                        ${amountSign}$${transaction.amount.toFixed(2)}
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-link text-primary p-0 me-2 edit-btn" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger p-0 delete-btn" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                transactionsList.appendChild(row);
            });
            
            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editTransaction(parseInt(btn.dataset.id)));
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteTransaction(parseInt(btn.dataset.id)));
            });
        }
        
        function editTransaction(id) {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;
            
            document.getElementById('edit-transaction-id').value = transaction.id;
            document.getElementById('edit-type').value = transaction.type;
            document.getElementById('edit-amount').value = transaction.amount;
            document.getElementById('edit-description').value = transaction.description;
            document.getElementById('edit-date').value = transaction.date;
            
            // Populate category select
            const editCategorySelect = document.getElementById('edit-category');
            editCategorySelect.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (category.id === transaction.categoryId) {
                    option.selected = true;
                }
                editCategorySelect.appendChild(option);
            });
            
            editTransactionModal.show();
        }
        
        function updateTransaction(e) {
            e.preventDefault();
            
            const id = parseInt(document.getElementById('edit-transaction-id').value);
            const type = document.getElementById('edit-type').value;
            const amount = parseFloat(document.getElementById('edit-amount').value);
            const description = document.getElementById('edit-description').value.trim();
            const categoryId = parseInt(document.getElementById('edit-category').value);
            const date = document.getElementById('edit-date').value;
            
            if (!description || isNaN(amount) || amount <= 0) {
                alert('Please enter valid transaction details.');
                return;
            }
            
            const transactionIndex = transactions.findIndex(t => t.id === id);
            if (transactionIndex === -1) return;
            
            const category = categories.find(c => c.id === categoryId);
            
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                type,
                amount,
                description,
                categoryId,
                categoryName: category.name,
                categoryColor: category.color,
                date
            };
            
            saveTransactions();
            renderTransactions();
            updateBalance();
            updateChart();
            
            editTransactionModal.show();
        }
        
        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveTransactions();
                renderTransactions();
                updateBalance();
                updateChart();
            }
        }
        
        function updateBalance() {
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const balance = income - expenses;
            
            totalIncomeElement.textContent = `$${income.toFixed(2)}`;
            totalExpenseElement.textContent = `$${expenses.toFixed(2)}`;
            totalBalanceElement.textContent = `$${balance.toFixed(2)}`;
            
            // Check budget alerts
            checkBudgetAlerts();
        }
        
        function addCategory(e) {
            e.preventDefault();
            
            const name = document.getElementById('category-name').value.trim();
            const color = document.getElementById('category-color').value;
            
            if (!name) {
                alert('Please enter a category name.');
                return;
            }
            
            const newCategory = {
                id: nextCategoryId++,
                name,
                color
            };
            
            categories.push(newCategory);
            saveCategories();
            updateCategorySelects();
            renderCategories();
            
            // Reset form and close modal
            categoryForm.reset();
            document.getElementById('category-color').value = '#3b82f6';
            categoryModalElement.hide();
        }
        
        function renderCategories() {
            categoriesList.innerHTML = '';
            
            if (categories.length === 0) {
                categoriesList.innerHTML = '<p class="text-secondary small">No categories added yet.</p>';
                return;
            }
            
            categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'd-flex justify-content-between align-items-center p-2 rounded';
                
                categoryItem.innerHTML = `
                    <div class="d-flex align-items-center">
                        <span class="category-color" style="background-color: ${category.color}"></span>
                        <span>${category.name}</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-link text-danger p-0 delete-category-btn" data-id="${category.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                categoriesList.appendChild(categoryItem);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.id)));
            });
        }
        
        function deleteCategory(id) {
            if (transactions.some(t => t.categoryId === id)) {
                alert('Cannot delete category with existing transactions. Please delete or reassign those transactions first.');
                return;
            }
            
            if (budgets.some(b => b.categoryId === id)) {
                // Remove associated budget
                budgets = budgets.filter(b => b.categoryId !== id);
                saveBudgets();
                renderBudgets();
            }
            
            categories = categories.filter(c => c.id !== id);
            saveCategories();
            updateCategorySelects();
            renderCategories();
        }
        
        function updateCategorySelects() {
            // Update main category select
            categorySelect.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            // Update filter category select
            filterCategorySelect.innerHTML = '';
            
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Categories';
            filterCategorySelect.appendChild(allOption);
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                filterCategorySelect.appendChild(option);
            });
        }
        
        function addBudget(e) {
            e.preventDefault();
            
            const categoryId = parseInt(document.getElementById('budget-category').value);
            const limit = parseFloat(document.getElementById('budget-limit').value);
            
            if (isNaN(limit) || limit <= 0) {
                alert('Please enter a valid budget limit.');
                return;
            }
            
            const newBudget = {
                id: nextBudgetId++,
                categoryId,
                limit
            };
            
            budgets.push(newBudget);
            saveBudgets();
            renderBudgets();
            
            // Reset form and close modal
            budgetForm.reset();
            budgetModalElement.hide();
        }
        
        function renderBudgets() {
            budgetList.innerHTML = '';
            
            if (budgets.length === 0) {
                budgetList.innerHTML = '<p class="text-secondary small">No budget alerts set up yet.</p>';
                return;
            }
            
            budgets.forEach(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                if (!category) return;
                
                // Calculate current spending for this category
                const currentSpending = transactions
                    .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const percentage = Math.min(100, (currentSpending / budget.limit) * 100);
                const isOverBudget = currentSpending > budget.limit;
                
                const budgetItem = document.createElement('div');
                budgetItem.className = 'p-3 border rounded fade-in';
                
                budgetItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center">
                            <span class="category-color" style="background-color: ${category.color}"></span>
                            <span class="fw-medium">${category.name}</span>
                        </div>
                        <button class="btn btn-sm btn-link text-danger p-0 delete-budget-btn" data-id="${budget.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="mb-1 d-flex justify-content-between small">
                        <span>$${currentSpending.toFixed(2)} of $${budget.limit.toFixed(2)}</span>
                        <span>${percentage.toFixed(0)}%</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${isOverBudget ? 'bg-danger' : 'bg-success'}" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    ${isOverBudget ? '<p class="mt-2 small text-danger">Budget exceeded!</p>' : ''}
                `;
                
                budgetList.appendChild(budgetItem);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-budget-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteBudget(parseInt(btn.dataset.id)));
            });
        }
        
        function deleteBudget(id) {
            budgets = budgets.filter(b => b.id !== id);
            saveBudgets();
            renderBudgets();
        }
        
        function checkBudgetAlerts() {
            budgets.forEach(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                if (!category) return;
                
                const currentSpending = transactions
                    .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                if (currentSpending > budget.limit) {
                    // You could add more visible alerts here
                    console.log(`Budget exceeded for ${category.name}!`);
                }
            });
        }
        
        function updateChart() {
            const expenseCategories = categories.filter(c => 
                transactions.some(t => t.type === 'expense' && t.categoryId === c.id)
            );
            
            const expenseData = expenseCategories.map(category => {
                const total = transactions
                    .filter(t => t.type === 'expense' && t.categoryId === category.id)
                    .reduce((sum, t) => sum + t.amount, 0);
                return total;
            });
            
            const labels = expenseCategories.map(c => c.name);
            const backgroundColors = expenseCategories.map(c => c.color);
            
            // Destroy previous chart if it exists
            if (window.expenseChart) {
                window.expenseChart.destroy();
            }
            
            const ctx = expenseChartCanvas.getContext('2d');
            window.expenseChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: expenseData,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Local Storage Functions
        function saveTransactions() {
            localStorage.setItem('transactions', JSON.stringify(transactions));
            localStorage.setItem('nextTransactionId', nextTransactionId);
        }
        
        function saveCategories() {
            localStorage.setItem('categories', JSON.stringify(categories));
            localStorage.setItem('nextCategoryId', nextCategoryId);
        }
        
        function saveBudgets() {
            localStorage.setItem('budgets', JSON.stringify(budgets));
            localStorage.setItem('nextBudgetId', nextBudgetId);
        }