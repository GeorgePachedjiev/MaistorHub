// API Base URL
const API_BASE_URL = 'http://localhost:3000';

// Helper function to check if server is reachable
async function checkServerConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${API_BASE_URL}/`, { 
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add JWT token if available
    const token = localStorage.getItem('jwt_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, config);
        
        // Check if response is JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || 'Неочакван отговор от сървъра');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Възникна грешка');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Better error messages
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            const isFileProtocol = window.location.protocol === 'file:';
            if (isFileProtocol) {
                throw new Error('Моля, стартирай локален HTTP сървър. Файловете не могат да правят заявки директно. Използвай: python -m http.server 8000 или npx http-server');
            } else {
                throw new Error('Не може да се свърже със сървъра. Провери дали backend сървърът работи на http://localhost:3000');
            }
        }
        
        if (error.name === 'AbortError') {
            throw new Error('Заявката отне твърде много време. Провери интернет връзката си.');
        }
        
        throw error;
    }
}

// Search masters with optional filters
async function searchMasters(city, services) {
    try {
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (services) params.append('services', services);
        
        const queryString = params.toString();
        const endpoint = `/masters${queryString ? `?${queryString}` : ''}`;
        
        const response = await apiRequest(endpoint, { method: 'GET' });
        return response.data || [];
    } catch (error) {
        console.error('Search masters error:', error);
        const errorMsg = error.message || 'Възникна грешка при търсене на майстори';
        showNotification(errorMsg, 'error');
        return [];
    }
}

// Register a new master
async function registerMaster(masterData) {
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(masterData),
        });
        return response;
    } catch (error) {
        console.error('Register error:', error);
        return {
            success: false,
            error: error.message || 'Възникна грешка при регистрацията'
        };
    }
}

// Login master
async function loginMaster(credentials) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        // Save JWT token to localStorage
        if (response.token) {
            localStorage.setItem('jwt_token', response.token);
        }
        
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.message || 'Възникна грешка при влизането'
        };
    }
}

// Display masters in a container
function displayMasters(masters, containerId) {
    const container = document.getElementById(containerId);
    
    if (!masters || masters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h3>Няма намерени майстори</h3>
                <p>Опитай с различни критерии за търсене</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = masters.map(master => `
        <div class="master-card">
            <div class="master-card-header">
                <div class="master-avatar">
                    ${(master.name || 'М').charAt(0).toUpperCase()}
                </div>
                <div class="master-info">
                    <h3 class="master-name">${escapeHtml(master.name || 'Без име')}</h3>
                    ${master.city ? `<p class="master-location">📍 ${escapeHtml(master.city)}</p>` : ''}
                </div>
            </div>
            
            <div class="master-card-body">
                ${master.services ? `
                    <div class="master-detail">
                        <span class="detail-label">Услуги:</span>
                        <span class="detail-value">${escapeHtml(master.services)}</span>
                    </div>
                ` : ''}
                
                ${master.price_range ? `
                    <div class="master-detail">
                        <span class="detail-label">Цена:</span>
                        <span class="detail-value price-value">${escapeHtml(master.price_range)}</span>
                    </div>
                ` : ''}
            </div>
            
            ${master.phone ? `
                <div class="master-card-footer">
                    <a href="tel:${master.phone}" class="btn btn-primary btn-small">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${escapeHtml(master.phone)}</span>
                    </a>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification notification-${type} notification-show`;
    
    setTimeout(() => {
        notification.classList.remove('notification-show');
    }, 4000);
}

// Logout function (remove token)
function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = 'index.html';
}
