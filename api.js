// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    ENDPOINTS: {
        REPORTS: '/reports',
        APPROVE: '/reports/{id}/approve',
        IMAGES: '/images/{filename}',
        HEALTH: '/health'
    }
};

// API Helper Functions
class WasteAPI {
    static async submitReport(reportData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData)
            });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit report');
            }
            
            return result;
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    }
    
    static async getReports() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch reports');
            }
            
            return result.reports;
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    }
    
    static async approveReport(reportId) {
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APPROVE.replace('{id}', reportId)}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to approve report');
            }
            
            return result;
        } catch (error) {
            console.error('Error approving report:', error);
            throw error;
        }
    }
    
    static getImageUrl(filename) {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGES.replace('{filename}', filename)}`;
    }
    
    static async checkHealth() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`);
            return await response.json();
        } catch (error) {
            console.error('Backend health check failed:', error);
            return null;
        }
    }
}