// Admin Dashboard Functions

// Load credit requests
async function loadCreditRequests() {
    if (!currentUser?.isAdmin) return;

    try {
        const response = await fetch(`${API_URL}/admin/credit-requests`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayCreditRequests(data.requests);
        } else {
            showAlert('Failed to load credit requests', 'error');
        }
    } catch (error) {
        console.error('Error loading credit requests:', error);
    }
}

// Display credit requests
function displayCreditRequests(requests) {
    const requestsList = document.getElementById('credit-requests-list');
    
    if (!requests || requests.length === 0) {
        requestsList.innerHTML = '<p>No pending credit requests</p>';
        return;
    }

    requestsList.innerHTML = requests.map(request => `
        <div class="credit-request">
            <p>User: ${request.username}</p>
            <p>Current Credits: ${request.currentCredits}</p>
            <p>Requested: ${request.requestedCredits}</p>
            <p>Reason: ${request.reason || 'No reason provided'}</p>
            <div class="request-actions">
                <button onclick="handleCreditRequest(${request.id}, true)" class="success">Approve</button>
                <button onclick="handleCreditRequest(${request.id}, false)" class="danger">Deny</button>
            </div>
        </div>
    `).join('');
}

// Handle credit request (approve/deny)
async function handleCreditRequest(requestId, approved) {
    try {
        const response = await fetch(`${API_URL}/admin/credit-requests/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ approved })
        });

        if (response.ok) {
            showAlert(`Request ${approved ? 'approved' : 'denied'} successfully`, 'success');
            loadCreditRequests(); // Reload the requests
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to process request', 'error');
        }
    } catch (error) {
        console.error('Error handling credit request:', error);
        showAlert('Error processing request', 'error');
    }
}

// Load analytics data
async function loadAnalytics() {
    if (!currentUser?.isAdmin) return;

    try {
        const response = await fetch(`${API_URL}/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayAnalytics(data);
        } else {
            showAlert('Failed to load analytics', 'error');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display analytics data
function displayAnalytics(data) {
    const analyticsDiv = document.getElementById('analytics-data');
    
    analyticsDiv.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h4>Total Users</h4>
                <p>${data.totalUsers}</p>
            </div>
            <div class="analytics-card">
                <h4>Total Scans Today</h4>
                <p>${data.scansToday}</p>
            </div>
            <div class="analytics-card">
                <h4>Active Users Today</h4>
                <p>${data.activeUsersToday}</p>
            </div>
            <div class="analytics-card">
                <h4>Average Similarity Score</h4>
                <p>${data.avgSimilarity?.toFixed(2)}%</p>
            </div>
        </div>
        
        <div class="analytics-section">
            <h4>Top Users by Scans</h4>
            <ul>
                ${data.topUsers?.map(user => `
                    <li>${user.username}: ${user.scanCount} scans</li>
                `).join('') || 'No data available'}
            </ul>
        </div>
    `;
}

// Initialize dashboard
if (document.getElementById('admin-section')) {
    // Load data when admin section is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'admin-section' && 
                mutation.target.style.display !== 'none') {
                loadCreditRequests();
                loadAnalytics();
            }
        });
    });

    observer.observe(document.getElementById('admin-section'), {
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}

// Export functions for use in HTML
window.handleCreditRequest = handleCreditRequest; 