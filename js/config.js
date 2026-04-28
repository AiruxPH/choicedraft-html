/**
 * ChoiceDraft Configuration
 * Centralized API paths and configuration
 * 
 * IMPORTANT: Update the API_BASE_URL to match your Hostinger domain
 * Example: 'https://choicedraft.ccsblock2.com/api'
 */

const CONFIG = {
    // Base URL for API endpoints
    // Change this to your actual Hostinger domain
    API_BASE_URL: 'https://choicedraft.ccsblock2.com/api',
    
    // Individual API endpoints
    ENDPOINTS: {
        AUTH: '/auth.php',
        TESTS: '/tests.php',
        QUESTIONS: '/questions.php',
        ATTEMPTS: '/attempts.php',
        USERS: '/users.php',
        COLLABORATORS: '/collaborators.php',
        SUBJECTS: '/subjects.php'
    },
    
    // App settings
    APP: {
        NAME: 'ChoiceDraft',
        VERSION: '1.0.0',
        STORAGE_KEY: 'choicedraft_session'
    }
};

/**
 * Build full API URL
 * @param {string} endpoint - Endpoint key from CONFIG.ENDPOINTS
 * @param {Object} params - Query parameters
 * @returns {string} Full URL
 */
function getApiUrl(endpoint, params = {}) {
    const baseUrl = CONFIG.API_BASE_URL + endpoint;
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Make API request
 * @param {string} endpoint - Endpoint key
 * @param {string} method - HTTP method
 * @param {Object} data - Request body data
 * @param {Object} params - Query parameters
 * @returns {Promise} Fetch promise
 */
async function apiRequest(endpoint, method = 'GET', data = null, params = {}) {
    const url = getApiUrl(endpoint, params);
    
    const options = {
        method: method,
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

/**
 * API Service - All backend interactions
 */
const apiService = {
    // Authentication
    auth: {
        login: async (email, password) => {
            return await apiRequest(CONFIG.ENDPOINTS.AUTH, 'POST', { 
                action: 'login', 
                email, 
                password 
            });
        },
        
        register: async (name, email, password, role, institution, schoolId = null) => {
            return await apiRequest(CONFIG.ENDPOINTS.AUTH, 'POST', { 
                action: 'register', 
                name, 
                email, 
                password, 
                role, 
                institution,
                school_id: schoolId
            });
        },
        
        logout: async () => {
            return await apiRequest(CONFIG.ENDPOINTS.AUTH, 'POST', { action: 'logout' });
        }
    },
    
    // Tests
    tests: {
        getAll: async (userId = null, isAdmin = false) => {
            const params = userId ? { user_id: userId } : {};
            if (isAdmin) params.admin = 1;
            const result = await apiRequest(CONFIG.ENDPOINTS.TESTS, 'GET', null, params);
            return result.tests || [];
        },
        
        getById: async (id) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.TESTS, 'GET', null, { id });
            return result.test;
        },
        
        create: async (testData) => {
            return await apiRequest(CONFIG.ENDPOINTS.TESTS, 'POST', testData);
        },
        
        update: async (id, updates) => {
            return await apiRequest(CONFIG.ENDPOINTS.TESTS, 'PUT', updates, { id });
        },
        
        delete: async (id) => {
            return await apiRequest(CONFIG.ENDPOINTS.TESTS, 'DELETE', null, { id });
        }
    },
    
    // Questions
    questions: {
        getByTest: async (testId) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.QUESTIONS, 'GET', null, { test_id: testId });
            return result.questions || [];
        },
        
        create: async (questionData) => {
            return await apiRequest(CONFIG.ENDPOINTS.QUESTIONS, 'POST', questionData);
        },
        
        update: async (testId, questionId, updates) => {
            return await apiRequest(CONFIG.ENDPOINTS.QUESTIONS, 'PUT', updates, { 
                test_id: testId, 
                id: questionId 
            });
        },
        
        delete: async (testId, questionId) => {
            return await apiRequest(CONFIG.ENDPOINTS.QUESTIONS, 'DELETE', null, { 
                test_id: testId, 
                id: questionId 
            });
        }
    },
    
    // Test Attempts
    attempts: {
        getByTestAndUser: async (testId, userId) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.ATTEMPTS, 'GET', null, { 
                test_id: testId, 
                user_id: userId 
            });
            return result.attempts || [];
        },
        
        getByTest: async (testId) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.ATTEMPTS, 'GET', null, { test_id: testId });
            return result.attempts || [];
        },
        
        getAllByUser: async (userId) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.ATTEMPTS, 'GET', null, { user_id: userId });
            return result.attempts || [];
        },
        
        submit: async (testId, userId, answers, isAnonymous = false) => {
            return await apiRequest(CONFIG.ENDPOINTS.ATTEMPTS, 'POST', { 
                test_id: testId, 
                user_id: userId, 
                answers,
                is_anonymous: isAnonymous ? 1 : 0
            });
        },
        
        updateFeedback: async (attemptId, feedback) => {
            return await apiRequest(CONFIG.ENDPOINTS.ATTEMPTS, 'PUT', { feedback }, { id: attemptId });
        }
    },
    
    // Users
    users: {
        getAll: async (role = null) => {
            const params = role ? { role } : {};
            const result = await apiRequest(CONFIG.ENDPOINTS.USERS, 'GET', null, params);
            return result.users || [];
        },
        
        getById: async (id) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.USERS, 'GET', null, { id });
            return result.user;
        },
        
        getByEmail: async (email) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.USERS, 'GET', null, { email });
            return result.user;
        },
        
        update: async (id, updates) => {
            return await apiRequest(CONFIG.ENDPOINTS.USERS, 'PUT', updates, { id });
        },
        
        delete: async (id) => {
            return await apiRequest(CONFIG.ENDPOINTS.USERS, 'DELETE', null, { id });
        }
    },
    
    // Collaborators
    collaborators: {
        getByTest: async (testId) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.COLLABORATORS, 'GET', null, { test_id: testId });
            return result.collaborators || [];
        },
        
        add: async (testId, email, currentUserId, role) => {
            return await apiRequest(CONFIG.ENDPOINTS.COLLABORATORS, 'POST', { 
                test_id: testId, 
                email, 
                current_user_id: currentUserId,
                role
            });
        },
        
        remove: async (testId, userId) => {
            return await apiRequest(CONFIG.ENDPOINTS.COLLABORATORS, 'DELETE', null, { 
                test_id: testId, 
                user_id: userId 
            });
        },
        
        updateRole: async (testId, userId, role, currentUserId) => {
            return await apiRequest(CONFIG.ENDPOINTS.COLLABORATORS, 'PUT', { 
                test_id: testId, 
                user_id: userId,
                role: role,
                current_user_id: currentUserId
            });
        }
    },
    
    // Subjects
    subjects: {
        getAll: async (userId, role) => {
            const params = { user_id: userId, role: role };
            const result = await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'GET', null, params);
            return result.subjects || [];
        },
        
        getById: async (id) => {
            const result = await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'GET', null, { id });
            return result.subject || null;
        },
        
        create: async (name, description, joinCode, teacherId) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'POST', { 
                name,
                description,
                join_code: joinCode, 
                teacher_id: teacherId 
            });
        },
        
        update: async (id, updates) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'PUT', updates, { id });
        },
        
        delete: async (id) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'DELETE', null, { id });
        },
        
        join: async (joinCode, userId) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'POST', { 
                action: 'join',
                join_code: joinCode, 
                user_id: userId 
            });
        },
        
        addBySchoolId: async (subjectId, schoolId) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'POST', {
                action: 'add_by_school_id',
                subject_id: subjectId,
                school_id: schoolId
            });
        },
        
        removeStudent: async (subjectId, userId) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'DELETE', null, { 
                id: subjectId,
                user_id: userId
            });
        },
        
        getAnalytics: async (id) => {
            return await apiRequest(CONFIG.ENDPOINTS.SUBJECTS, 'GET', null, { 
                id: id,
                analytics: 1
            });
        }
    }
};

/**
 * Session Management
 */
const sessionManager = {
    getUser: () => {
        const session = localStorage.getItem(CONFIG.APP.STORAGE_KEY);
        return session ? JSON.parse(session) : null;
    },
    
    setUser: (user) => {
        localStorage.setItem(CONFIG.APP.STORAGE_KEY, JSON.stringify(user));
    },
    
    clear: () => {
        localStorage.removeItem(CONFIG.APP.STORAGE_KEY);
    },
    
    isLoggedIn: () => {
        return !!sessionManager.getUser();
    },
    
    getUserId: () => {
        const user = sessionManager.getUser();
        return user ? user.id : null;
    },
    
    isAdmin: () => {
        const user = sessionManager.getUser();
        return user ? user.role === 'Admin' : false;
    },
    
    isTeacher: () => {
        const user = sessionManager.getUser();
        return user ? user.role === 'Teacher' || user.role === 'Admin' : false;
    }
};

// Export for use in other scripts
window.CHOICEDRAFT_CONFIG = CONFIG;
window.apiService = apiService;
window.sessionManager = sessionManager;
window.getApiUrl = getApiUrl;
window.apiRequest = apiRequest;
