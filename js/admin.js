/* ========================================
   MAMAILA UNVEILING - ADMIN DASHBOARD JAVASCRIPT
   ======================================== */

// ========== CONFIGURATION ==========
const ADMIN_PASSWORD = '88888';
const STORAGE_KEY = 'mamailaUnveilingRSVPs';

// ========== DOM ELEMENTS ==========
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Stats elements
const totalRsvpsEl = document.getElementById('total-rsvps');
const totalAttendingEl = document.getElementById('total-attending');
const totalNotAttendingEl = document.getElementById('total-not-attending');
const totalGuestsEl = document.getElementById('total-guests');

// Table elements
const rsvpTableBody = document.getElementById('rsvp-table-body');
const noDataMessage = document.getElementById('no-data-message');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');

// Messages elements
const messagesContainer = document.getElementById('messages-container');
const noMessagesEl = document.getElementById('no-messages');

// Action buttons
const downloadCsvBtn = document.getElementById('download-csv');
const downloadPdfBtn = document.getElementById('download-pdf');
const printListBtn = document.getElementById('print-list');
const refreshDataBtn = document.getElementById('refresh-data');
const clearDataBtn = document.getElementById('clear-data');

// Modals
const deleteModal = document.getElementById('delete-modal');
const clearModal = document.getElementById('clear-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmClearBtn = document.getElementById('confirm-clear');
const cancelClearBtn = document.getElementById('cancel-clear');
const confirmClearInput = document.getElementById('confirm-clear-input');

// ========== STATE ==========
let currentDeleteId = null;
let rsvpData = [];

// ========== AUTHENTICATION ==========
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const enteredPassword = passwordInput.value.trim();
    
    if (enteredPassword === ADMIN_PASSWORD) {
        // Successful login
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loginError.style.display = 'none';
        passwordInput.value = '';
        
        // Load dashboard data
        loadDashboardData();
        
        // Store session
        sessionStorage.setItem('mamailaAdminLoggedIn', 'true');
    } else {
        // Failed login
        loginError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// Check for existing session
window.addEventListener('load', () => {
    if (sessionStorage.getItem('mamailaAdminLoggedIn') === 'true') {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadDashboardData();
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('mamailaAdminLoggedIn');
    dashboardSection.style.display = 'none';
    loginSection.style.display = 'flex';
});

// ========== LOAD DASHBOARD DATA ==========
function loadDashboardData() {
    rsvpData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    updateStatistics();
    renderTable();
    renderMessages();
}

// ========== UPDATE STATISTICS ==========
function updateStatistics() {
    const totalRsvps = rsvpData.length;
    const attending = rsvpData.filter(r => r.attending).length;
    const notAttending = rsvpData.filter(r => !r.attending).length;
    
    // Calculate total guests (including additional guests)
    const totalGuests = rsvpData.reduce((sum, r) => {
        if (r.attending) {
            return sum + (r.attendees || 1);
        }
        return sum;
    }, 0);
    
    totalRsvpsEl.textContent = totalRsvps;
    totalAttendingEl.textContent = attending;
    totalNotAttendingEl.textContent = notAttending;
    totalGuestsEl.textContent = totalGuests;
}

// ========== RENDER TABLE ==========
function renderTable(data = rsvpData) {
    if (data.length === 0) {
        rsvpTableBody.innerHTML = '';
        noDataMessage.style.display = 'block';
        document.querySelector('.table-container').style.display = 'none';
        return;
    }
    
    noDataMessage.style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
    
    rsvpTableBody.innerHTML = data.map((rsvp, index) => `
        <tr data-id="${rsvp.id}">
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(rsvp.fullName)}</strong></td>
            <td>${escapeHtml(rsvp.email)}</td>
            <td>${escapeHtml(rsvp.phone)}</td>
            <td>${rsvp.attendees || 1}</td>
            <td>${rsvp.guestName ? escapeHtml(rsvp.guestName) : '-'}</td>
            <td>${escapeHtml(rsvp.relationship) || '-'}</td>
            <td>${escapeHtml(rsvp.dietary) || '-'}</td>
            <td>
                <span class="status-badge ${rsvp.attending ? 'attending' : 'not-attending'}">
                    ${rsvp.attending ? 'Attending' : 'Not Attending'}
                </span>
            </td>
            <td class="message-preview" title="${escapeHtml(rsvp.message) || 'No message'}">
                ${rsvp.message ? escapeHtml(rsvp.message.substring(0, 30)) + (rsvp.message.length > 30 ? '...' : '') : '-'}
            </td>
            <td>${formatTableDate(rsvp.submittedAt)}</td>
            <td>
                <button class="delete-btn" onclick="openDeleteModal('${rsvp.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ========== RENDER MESSAGES ==========
function renderMessages() {
    const messagesWithContent = rsvpData.filter(r => r.message && r.message.trim() !== '');
    
    if (messagesWithContent.length === 0) {
        messagesContainer.innerHTML = '';
        noMessagesEl.style.display = 'block';
        return;
    }
    
    noMessagesEl.style.display = 'none';
    
    messagesContainer.innerHTML = messagesWithContent.map(rsvp => `
        <div class="message-card">
            <div class="message-header">
                <span class="sender-name">${escapeHtml(rsvp.fullName)}</span>
                <span class="message-date">${formatTableDate(rsvp.submittedAt)}</span>
            </div>
            <p class="message-text">"${escapeHtml(rsvp.message)}"</p>
        </div>
    `).join('');
}

// ========== SEARCH & FILTER ==========
searchInput.addEventListener('input', applyFilters);
filterStatus.addEventListener('change', applyFilters);

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusFilter = filterStatus.value;
    
    let filteredData = rsvpData;
    
    // Apply search filter
    if (searchTerm) {
        filteredData = filteredData.filter(rsvp => 
            rsvp.fullName.toLowerCase().includes(searchTerm) ||
            rsvp.email.toLowerCase().includes(searchTerm) ||
            rsvp.phone.includes(searchTerm) ||
            (rsvp.guestName && rsvp.guestName.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply status filter
    if (statusFilter === 'attending') {
        filteredData = filteredData.filter(rsvp => rsvp.attending);
    } else if (statusFilter === 'not-attending') {
        filteredData = filteredData.filter(rsvp => !rsvp.attending);
    }
    
    renderTable(filteredData);
}

// ========== DELETE FUNCTIONALITY ==========
function openDeleteModal(id) {
    currentDeleteId = id;
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    currentDeleteId = null;
    deleteModal.style.display = 'none';
}

confirmDeleteBtn.addEventListener('click', () => {
    if (currentDeleteId) {
        // Remove from data array
        rsvpData = rsvpData.filter(rsvp => rsvp.id !== currentDeleteId);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvpData));
        
        // Refresh dashboard
        loadDashboardData();
        
        // Close modal
        closeDeleteModal();
    }
});

cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Close modal when clicking outside
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// ========== CLEAR ALL DATA ==========
clearDataBtn.addEventListener('click', () => {
    clearModal.style.display = 'flex';
    confirmClearInput.value = '';
    confirmClearBtn.disabled = true;
});

confirmClearInput.addEventListener('input', (e) => {
    confirmClearBtn.disabled = e.target.value !== 'DELETE';
});

confirmClearBtn.addEventListener('click', () => {
    if (confirmClearInput.value === 'DELETE') {
        // Clear all data
        localStorage.removeItem(STORAGE_KEY);
        rsvpData = [];
        
        // Refresh dashboard
        loadDashboardData();
        
        // Close modal
        closeClearModal();
        
        alert('All RSVP data has been cleared.');
    }
});

cancelClearBtn.addEventListener('click', closeClearModal);

function closeClearModal() {
    clearModal.style.display = 'none';
    confirmClearInput.value = '';
    confirmClearBtn.disabled = true;
}

// Close modal when clicking outside
clearModal.addEventListener('click', (e) => {
    if (e.target === clearModal) {
        closeClearModal();
    }
});

// ========== REFRESH DATA ==========
refreshDataBtn.addEventListener('click', () => {
    loadDashboardData();
    alert('Data refreshed successfully!');
});

// ========== DOWNLOAD CSV ==========
downloadCsvBtn.addEventListener('click', () => {
    if (rsvpData.length === 0) {
        alert('No data to download.');
        return;
    }
    
    // CSV headers
    const headers = [
        'No.',
        'Full Name',
        'Email',
        'Phone',
        'Number of Attendees',
        'Additional Guest',
        'Relationship',
        'Dietary Requirements',
        'Attending Status',
        'Message',
        'Submitted Date'
    ];
    
    // CSV rows
    const rows = rsvpData.map((rsvp, index) => [
        index + 1,
        rsvp.fullName,
        rsvp.email,
        rsvp.phone,
        rsvp.attendees || 1,
        rsvp.guestName || '',
        rsvp.relationship || '',
        rsvp.dietary || '',
        rsvp.attending ? 'Attending' : 'Not Attending',
        rsvp.message || '',
        formatTableDate(rsvp.submittedAt)
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Mamaila_Unveiling_RSVPs_${getDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ========== DOWNLOAD PDF ==========
downloadPdfBtn.addEventListener('click', () => {
    if (rsvpData.length === 0) {
        alert('No data to download.');
        return;
    }
    
    // Create printable HTML content
    const attending = rsvpData.filter(r => r.attending);
    const notAttending = rsvpData.filter(r => !r.attending);
    const totalGuests = attending.reduce((sum, r) => sum + (r.attendees || 1), 0);
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mamaila Unveiling - RSVP List</title>
            <style>
                body {
                    font-family: 'Georgia', serif;
                    padding: 40px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #d4af37;
                    padding-bottom: 20px;
                }
                .header h1 {
                    font-size: 28px;
                    color: #1a1a2e;
                    margin-bottom: 5px;
                }
                .header h2 {
                    font-size: 18px;
                    color: #8b7355;
                    font-weight: normal;
                }
                .header p {
                    color: #666;
                    font-size: 14px;
                }
                .stats {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 40px;
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 10px;
                }
                .stat-item {
                    text-align: center;
                }
                .stat-item h3 {
                    font-size: 32px;
                    color: #d4af37;
                    margin: 0;
                }
                .stat-item p {
                    color: #666;
                    margin: 5px 0 0;
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 12px;
                }
                th {
                    background: #1a1a2e;
                    color: #d4af37;
                    font-weight: 600;
                }
                tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .section-title {
                    font-size: 18px;
                    color: #1a1a2e;
                    margin: 30px 0 15px;
                    border-bottom: 1px solid #d4af37;
                    padding-bottom: 5px;
                }
                .attending-badge {
                    color: #2ecc71;
                    font-weight: bold;
                }
                .not-attending-badge {
                    color: #e74c3c;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #888;
                    font-size: 12px;
                }
                @media print {
                    body { padding: 20px; }
                    .stats { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✝ Magret Mamaila Unveiling Ceremony</h1>
                <h2>RSVP Guest List</h2>
                <p>Generated on ${new Date().toLocaleDateString('en-ZA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <h3>${rsvpData.length}</h3>
                    <p>Total RSVPs</p>
                </div>
                <div class="stat-item">
                    <h3>${attending.length}</h3>
                    <p>Attending</p>
                </div>
                <div class="stat-item">
                    <h3>${notAttending.length}</h3>
                    <p>Not Attending</p>
                </div>
                <div class="stat-item">
                    <h3>${totalGuests}</h3>
                    <p>Total Guests</p>
                </div>
            </div>
            
            <h3 class="section-title">✓ Attending Guests (${attending.length})</h3>
            ${attending.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Guests</th>
                            <th>Additional Guest</th>
                            <th>Relationship</th>
                            <th>Dietary</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attending.map((rsvp, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><strong>${escapeHtml(rsvp.fullName)}</strong></td>
                                <td>${escapeHtml(rsvp.phone)}</td>
                                <td>${rsvp.attendees || 1}</td>
                                <td>${rsvp.guestName ? escapeHtml(rsvp.guestName) : '-'}</td>
                                <td>${escapeHtml(rsvp.relationship) || '-'}</td>
                                <td>${escapeHtml(rsvp.dietary) || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No guests attending.</p>'}
            
            <h3 class="section-title">✗ Not Attending (${notAttending.length})</h3>
            ${notAttending.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Relationship</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${notAttending.map((rsvp, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${escapeHtml(rsvp.fullName)}</td>
                                <td>${escapeHtml(rsvp.phone)}</td>
                                <td>${escapeHtml(rsvp.relationship) || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No one has declined.</p>'}
            
            <div class="footer">
                <p>Mamaila Family Unveiling - RSVP Dashboard</p>
                <p>In Loving Memory of Magret Mamaila (1955 - 2025)</p>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = function() {
        printWindow.print();
    };
});

// ========== PRINT LIST ==========
printListBtn.addEventListener('click', () => {
    if (rsvpData.length === 0) {
        alert('No data to print.');
        return;
    }
    
    // Use the same PDF generation but trigger print directly
    downloadPdfBtn.click();
});

// ========== UTILITY FUNCTIONS ==========

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date for table display
function formatTableDate(isoString) {
    if (!isoString) return '-';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '-';
    }
}

// Get date string for filenames
function getDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Make openDeleteModal available globally
window.openDeleteModal = openDeleteModal;

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeDeleteModal();
        closeClearModal();
    }
    
    // Ctrl+P to print
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (dashboardSection.style.display !== 'none') {
            printListBtn.click();
        }
    }
});

// ========== AUTO REFRESH ==========
// Refresh data every 30 seconds when dashboard is visible
setInterval(() => {
    if (dashboardSection.style.display !== 'none') {
        loadDashboardData();
    }
}, 30000);

// ========== CONSOLE MESSAGE ==========
console.log('%c Mamaila Unveiling - Admin Dashboard ', 
    'background: #d4af37; color: #1a1a2e; font-size: 14px; padding: 8px;');