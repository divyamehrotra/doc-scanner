// Document Scanner Functions

// Scan a document
async function scanDocument() {
    const fileInput = document.getElementById('document-upload');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a document to scan', 'error');
        return;
    }

    if (file.type !== 'text/plain') {
        showAlert('Please upload a text file (.txt)', 'error');
        return;
    }

    try {
        // First check if user has enough credits
        const creditsResponse = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const userData = await creditsResponse.json();
        if (userData.credits <= 0) {
            showAlert('Not enough credits. Please request more credits.', 'error');
            return;
        }

        // Create form data
        const formData = new FormData();
        formData.append('document', file);

        // Upload and scan document
        const response = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            displayResults(data);
            // Update credits after successful scan
            await checkAuthStatus();
        } else {
            showAlert(data.error || 'Scan failed', 'error');
        }
    } catch (error) {
        console.error('Scan error:', error);
        showAlert('Error scanning document. Please try again.', 'error');
    }
}

// Display scan results
function displayResults(data) {
    const resultsDiv = document.getElementById('scan-results');
    
    if (data.bestMatch) {
        const { filename, similarity } = data.bestMatch;
        const similarityPercentage = similarity.toFixed(2);
        
        resultsDiv.innerHTML = `
            <div class="result-item">
                <h4>Best Match Found:</h4>
                <p>File: ${filename}</p>
                <p>Similarity: ${similarityPercentage}%</p>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = '<p>No matching documents found.</p>';
    }
}

// Request additional credits
async function requestCredits() {
    try {
        const reason = prompt('Please enter a reason for requesting credits:');
        if (!reason) {
            showAlert('Please provide a reason for the credit request', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/credits/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Credit request submitted successfully', 'success');
        } else {
            showAlert(data.error || 'Failed to request credits', 'error');
        }
    } catch (error) {
        console.error('Credit request error:', error);
        showAlert('Error requesting credits. Please try again.', 'error');
    }
}

// Export functions for use in HTML
window.scanDocument = scanDocument;
window.requestCredits = requestCredits; 