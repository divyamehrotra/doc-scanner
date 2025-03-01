// Admin Dashboard Functions

// Load credit requests
async function loadCreditRequests() {
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
            showAlert(data.error || 'Failed to load credit requests', 'error');
        }
    } catch (error) {
        console.error('Error loading credit requests:', error);
        showAlert('Error loading credit requests', 'error');
    }
}

// Display credit requests
function displayCreditRequests(requests) {
    const requestsContainer = document.getElementById('credit-requests-list');
    
    if (!requests || requests.length === 0) {
        requestsContainer.innerHTML = '<p>No pending credit requests</p>';
        return;
    }

    const requestsHTML = requests.map(request => `
        <div class="credit-request">
            <h4>Request from ${request.username}</h4>
            <p>Requested Credits: ${request.requested_credits}</p>
            <p>Reason: ${request.reason}</p>
            <p>Date: ${new Date(request.created_at).toLocaleString()}</p>
            <div class="request-actions">
                <button onclick="handleCreditRequest(${request.id}, true)" class="success">Approve</button>
                <button onclick="handleCreditRequest(${request.id}, false)" class="danger">Deny</button>
            </div>
        </div>
    `).join('');

    requestsContainer.innerHTML = requestsHTML;
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

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            loadCreditRequests(); // Reload the requests
        } else {
            showAlert(data.error || 'Failed to process request', 'error');
        }
    } catch (error) {
        console.error('Error handling credit request:', error);
        showAlert('Error processing request', 'error');
    }
}

// Load analytics data
async function loadAnalytics() {
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
            showAlert(data.error || 'Failed to load analytics', 'error');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAlert('Error loading analytics', 'error');
    }
}

// Display analytics
function displayAnalytics(data) {
    const analyticsContainer = document.getElementById('analytics');
    
    analyticsContainer.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h4>Total Users</h4>
                <p>${data.totalUsers}</p>
            </div>
            <div class="analytics-card">
                <h4>Scans Today</h4>
                <p>${data.scansToday}</p>
            </div>
            <div class="analytics-card">
                <h4>Active Users Today</h4>
                <p>${data.activeUsersToday}</p>
            </div>
            <div class="analytics-card">
                <h4>Avg. Similarity Score</h4>
                <p>${(data.avgSimilarity || 0).toFixed(2)}%</p>
            </div>
        </div>
        <div class="analytics-section">
            <h4>Top Users by Scan Count</h4>
            <ul>
                ${data.topUsers.map(user => `
                    <li>${user.username} - ${user.scan_count} scans</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser?.is_admin) {
        loadCreditRequests();
        loadAnalytics();
        // Refresh data every 30 seconds
        setInterval(() => {
            loadCreditRequests();
            loadAnalytics();
        }, 30000);
    }
});

// Export functions for use in HTML
window.handleCreditRequest = handleCreditRequest; 