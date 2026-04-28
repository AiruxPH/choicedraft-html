/**
 * ChoiceDraft Application Logic (API Version)
 * Bridging ChoiceDraft UI components with the new PHP backend
 */

// Handle generic page transitions
function navigateTo(url) {
    window.location.href = url;
}

// Data Persistence Service Wrapper
// Mimics the old localStorage dataService but uses apiService
const dataService = {
    async init() {
        return true;
    },

    async getTests() {
        const user = sessionManager.getUser();
        if (!user) return [];
        // Students see all published tests (no user_id param)
        // Teachers see their own tests (user_id param)
        // Admins see all tests (no user_id, admin param)
        if (user.role === 'Admin') {
            return await apiService.tests.getAll(null, true);
        } else if (user.role === 'Student') {
            return await apiService.tests.getAll(null);
        } else {
            return await apiService.tests.getAll(user.id);
        }
    },

    async getSubjects() {
        const user = sessionManager.getUser();
        if (!user) return [];
        return await apiService.subjects.getAll(user.id, user.role);
    },

    async createSubject(name, description, joinCode) {
        const user = sessionManager.getUser();
        if (!user) return null;
        const res = await apiService.subjects.create(name, description, joinCode, user.id);
        return res.subject;
    },

    async getSubjectById(id) {
        return await apiService.subjects.getById(id);
    },

    async updateSubject(id, updates) {
        return await apiService.subjects.update(id, updates);
    },

    async deleteSubject(id) {
        return await apiService.subjects.delete(id);
    },

    async addStudentBySchoolId(subjectId, schoolId) {
        return await apiService.subjects.addBySchoolId(subjectId, schoolId);
    },

    async removeStudentFromClass(subjectId, userId) {
        return await apiService.subjects.removeStudent(subjectId, userId);
    },

    async updateUser(id, updates) {
        const res = await apiService.users.update(id, updates);
        // Refresh session if updating current user
        const currentUser = sessionManager.getUser();
        if (currentUser && currentUser.id === id && res.success) {
            const merged = { ...currentUser, ...updates };
            delete merged.password; // don't cache password
            sessionManager.setUser(merged);
        }
        return res;
    },

    async deleteUser(id) {
        return await apiService.users.delete(id);
    },

    async deleteTest(id) {
        return await apiService.tests.delete(id);
    },

    async submitAttempt(testId, userId, answers, isAnonymous = false) {
        return await apiService.attempts.submit(testId, userId, answers, isAnonymous);
    },

    async joinSubject(joinCode) {
        const user = sessionManager.getUser();
        if (!user) return { success: false, error: "Not logged in" };
        try {
            const res = await apiService.subjects.join(joinCode, user.id);
            return res;
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async getTestById(id) {
        const test = await apiService.tests.getById(id);
        if (test) {
            try {
                test.attempts = await apiService.attempts.getByTest(id);
            } catch (e) {
                console.warn('Failed to fetch attempts:', e);
                test.attempts = [];
            }
        }
        return test;
    },

    async createTest(testData) {
        const user = sessionManager.getUser();
        const payload = {
            ...testData,
            owner_id: user ? user.id : 'guest',
            status: testData.status || 'Draft'
        };
        const res = await apiService.tests.create(payload);
        return res.test;
    },

    async updateTest(id, updates) {
        return await apiService.tests.update(id, updates);
    },

    async addQuestion(testId, question) {
        const payload = { test_id: testId, ...question };
        const res = await apiService.questions.create(payload);
        return res.question;
    },

    async updateQuestion(testId, qid, updates) {
        return await apiService.questions.update(testId, qid, updates);
    },

    async deleteQuestion(testId, qid) {
        return await apiService.questions.delete(testId, qid);
    },

    async addCollaborator(testId, email, role) {
        const user = sessionManager.getUser();
        try {
            const res = await apiService.collaborators.add(testId, email, user.id, role);
            return res; // {success: true}
        } catch(e) {
            return { success: false, error: e.message };
        }
    },

    async removeCollaborator(testId, userId) {
        return await apiService.collaborators.remove(testId, userId);
    },

    async updateCollaboratorRole(testId, userId, role) {
        const user = sessionManager.getUser();
        if (!user) return { success: false, error: "Not logged in" };
        try {
            return await apiService.collaborators.updateRole(testId, userId, role, user.id);
        } catch(e) {
            return { success: false, error: e.message };
        }
    },

    async addFeedback(testId, attemptId, feedbackText) {
        return await apiService.attempts.updateFeedback(attemptId, feedbackText);
    },

    async getCurrentUser() {
        return sessionManager.getUser();
    },

    async login(email, password) {
        try {
            const res = await apiService.auth.login(email, password);
            if (res.success) {
                sessionManager.setUser(res.user);
                return { success: true, user: res.user };
            }
            return { success: false, error: res.error || 'Login failed' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async register(name, email, password, role, institution, schoolId = null) {
        try {
            const res = await apiService.auth.register(name, email, password, role, institution, schoolId);
            if (res.success) {
                sessionManager.setUser(res.user);
                return { success: true, user: res.user };
            }
            return { success: false, error: res.error || 'Registration failed' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async logout() {
        try {
            await apiService.auth.logout();
        } catch(e) {}
        sessionManager.clear();
        return true;
    },

    async setupSidebar() {
        const user = sessionManager.getUser();
        const sidebarUserBlock = document.getElementById('sidebarUserBlock');
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');
        const adminNavLink = document.getElementById('adminNavLink');
        const activityNavLink = document.getElementById('activityNavLink');
        const dashboardNavLink = document.querySelector('.sidebar-nav a[href="home.html"]');

        if (user) {
            if (sidebarUserBlock) sidebarUserBlock.classList.remove('hidden');
            if (userNameEl) userNameEl.textContent = user.name;
            if (userEmailEl) userEmailEl.textContent = user.email;
            if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();

            if (user.role === 'Admin') {
                if (adminNavLink) adminNavLink.classList.remove('hidden');
                if (activityNavLink) activityNavLink.classList.add('hidden');
                if (dashboardNavLink) dashboardNavLink.classList.add('hidden');
                
                // Hide irrelevant links for Admin
                const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
                navItems.forEach(item => {
                    const label = item.querySelector('.nav-label');
                    if (label) {
                        const text = label.textContent.trim();
                        if (text !== 'Admin Portal' && text !== 'Log Out' && text !== 'Profile') {
                            item.classList.add('hidden');
                        }
                    }
                });
            } else if (user.role === 'Student') {
                if (adminNavLink) adminNavLink.classList.add('hidden');
                if (activityNavLink) {
                    activityNavLink.classList.remove('hidden');
                }
                if (dashboardNavLink) dashboardNavLink.classList.remove('hidden');
            } else {
                if (adminNavLink) adminNavLink.classList.add('hidden');
                if (activityNavLink) activityNavLink.classList.remove('hidden');
                if (dashboardNavLink) dashboardNavLink.classList.remove('hidden');
            }
        }
    }
};

const icons = {
    logo: `<svg viewBox="0 0 150 150" fill="none" class="w-full h-full">
<path clip-rule="evenodd"
              d="M137.5 29.1667C134.185 29.1667 131.005 30.4836 128.661 32.8278C126.317 35.172 125 38.3515 125 41.6667V50H150V41.6667C150 38.3515 148.683 35.172 146.339 32.8278C143.995 30.4836 140.815 29.1667 137.5 29.1667ZM150 58.3333H125V127.083L137.5 145.833L150 127.083V58.3333ZM0 12.5V137.5C0 140.815 1.31696 143.995 3.66117 146.339C6.00537 148.683 9.18479 150 12.5 150H104.167C107.482 150 110.661 148.683 113.005 146.339C115.35 143.995 116.667 140.815 116.667 137.5V12.5C116.667 9.18479 115.35 6.00537 113.005 3.66117C110.661 1.31696 107.482 0 104.167 0H12.5C9.18479 0 6.00537 1.31696 3.66117 3.66117C1.31696 6.00537 0 9.18479 0 12.5ZM58.3333 37.5C58.3333 36.3949 58.7723 35.3351 59.5537 34.5537C60.3351 33.7723 61.3949 33.3333 62.5 33.3333H95.8333C96.9384 33.3333 97.9982 33.7723 98.7796 34.5537C99.561 35.3351 100 36.3949 100 37.5C100 38.6051 99.561 39.6649 98.7796 40.4463C97.9982 41.2277 96.9384 41.6667 95.8333 41.6667H62.5C61.3949 41.6667 60.3351 41.2277 59.5537 40.4463C58.7723 39.6649 58.3333 38.6051 58.3333 37.5ZM62.5 50C61.3949 50 60.3351 50.439 59.5537 51.2204C58.7723 52.0018 58.3333 53.0616 58.3333 54.1667C58.3333 55.2717 58.7723 56.3315 59.5537 57.1129C60.3351 57.8943 61.3949 58.3333 62.5 58.3333H95.8333C96.9384 58.3333 97.9982 57.8943 98.7796 57.1129C99.561 56.3315 100 55.2717 100 54.1667C100 53.0616 99.561 52.0018 98.7796 51.2204C97.9982 50.439 96.9384 50 95.8333 50H62.5ZM58.3333 91.6667C58.3333 90.5616 58.7723 89.5018 59.5537 88.7204C60.3351 87.939 61.3949 87.5 62.5 87.5H95.8333C96.9384 87.5 97.9982 87.939 98.7796 88.7204C99.561 89.5018 100 90.5616 100 91.6667C100 92.7717 99.561 93.8315 98.7796 94.6129C97.9982 95.3943 96.9384 95.8333 95.8333 95.8333H62.5C61.3949 95.8333 60.3351 95.3943 59.5537 94.6129C58.7723 93.8315 58.3333 92.7717 58.3333 91.6667ZM62.5 104.167C61.3949 104.167 60.3351 104.606 59.5537 105.387C58.7723 106.168 58.3333 107.228 58.3333 108.333C58.3333 109.438 58.7723 110.498 59.5537 111.28C60.3351 112.061 61.3949 112.5 62.5 112.5H95.8333C96.9384 112.5 97.9982 112.061 98.7796 111.28C99.561 110.498 100 109.438 100 108.333C100 107.228 99.561 109.438 98.7796 105.387C97.9982 104.606 96.9384 104.167 95.8333 104.167H62.5ZM25 91.6667V104.167H37.5V91.6667H25ZM20.8333 83.3333H41.6667C42.7717 83.3333 43.8315 83.7723 44.6129 84.5537C45.3943 85.3351 45.8333 86.3949 45.8333 87.5V108.333C45.8333 109.438 45.3943 110.498 44.6129 111.28C43.8315 112.061 42.7717 112.5 41.6667 112.5H20.8333C19.7283 112.5 18.6685 112.061 17.8871 111.28C17.1057 110.498 16.6667 109.438 16.6667 108.333V87.5C16.6667 86.3949 17.1057 85.3351 17.8871 84.5537C18.6685 83.7723 19.7283 83.3333 20.8333 83.3333ZM48.7792 40.4458C49.5382 39.66 49.9581 38.6075 49.9486 37.515C49.9391 36.4225 49.5009 35.3775 48.7284 34.6049C47.9559 33.8324 46.9108 33.3942 45.8183 33.3847C44.7258 33.3752 43.6733 33.7952 42.8875 34.5542L29.1667 48.275L23.7792 42.8875C22.9933 42.1285 21.9408 41.7085 20.8483 41.718C19.7558 41.7275 18.7108 42.1657 17.9383 42.9383C17.1657 43.7108 16.7275 44.7558 16.718 45.8483C16.7085 46.9408 17.1285 47.9933 17.8875 48.7792L29.1667 60.0583L48.7792 40.4458Z"
              fill="currentColor" fill-rule="evenodd" />  </svg>`
};

async function splashRedirect() {
    const user = sessionManager.getUser();
    if (user) {
        if (user.role === 'Admin') {
            navigateTo('admin.html');
        } else {
            navigateTo('home.html');
        }
    } else {
        const hasSeenOnboarding = localStorage.getItem('choicedraft_onboarding_seen');
        if (!hasSeenOnboarding) {
            navigateTo('onboarding.html');
        } else {
            navigateTo('signin.html');
        }
    }
}

function protectRoute(allowedRoles = null) {
    const user = sessionManager.getUser();
    if (!user) {
        navigateTo('signin.html');
        return false;
    }
    
    const currentPath = window.location.pathname.toLowerCase();
    const isEditingMode = currentPath.includes('admin.html') || currentPath.includes('profile.html');
    
    if (user.role === 'Admin' && !isEditingMode) {
        // Find depth to construct path back to admin.html if nested
        const depth = (currentPath.match(/\//g) || []).length;
        const rootPath = depth > 2 ? '../'.repeat(depth - 2) : '';
        // For simplicity, absolute path or just assume we are at root or 1 level deep
        // Actually, ChoiceDraftApp.navigateTo uses window.location.href
        // A safer way: just use a relative or absolute URL? We can just use the base url or just `admin.html`
        // If we are in test/index.html, it's `../admin.html`. Let's just calculate:
        const pathParts = window.location.pathname.split('/');
        const fileIndex = pathParts.findIndex(p => p.endsWith('.html'));
        const nestLevel = fileIndex > 0 ? (pathParts.length - fileIndex - 1) : 0;
        const prefix = nestLevel > 0 ? '../'.repeat(nestLevel) : '';
        
        navigateTo(prefix + 'admin.html');
        return false;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        navigateTo('home.html');
        return false;
    }
    return true;
}

async function handleLogout() {
    await dataService.logout();
    navigateTo('signin.html');
}

function checkTestAvailability(test) {
    const now = new Date();
    if (!test.start_date && !test.end_date) return { available: true, message: '' };
    if (test.start_date) {
        const startDate = new Date(test.start_date);
        if (now < startDate) return { available: false, message: `This test will open on ${startDate.toLocaleString()}` };
    }
    if (test.end_date) {
        const endDate = new Date(test.end_date);
        if (now > endDate) return { available: false, message: `This test has ended on ${endDate.toLocaleString()}` };
    }
    return { available: true, message: '' };
}

function hasTestEnded(test) {
    if (!test.end_date) return false; // No end date = ongoing
    return new Date() > new Date(test.end_date);
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
}

// Attach to window for global access
window.ChoiceDraftApp = {
    navigateTo,
    dataService,
    setupSidebar: dataService.setupSidebar,
    splashRedirect,
    protectRoute,
    handleLogout,
    checkTestAvailability,
    hasTestEnded,
    formatDate,
    icons
};
// --- Cordova Device Initialization ---
document.addEventListener("deviceready", function () {
    // Intercept the physical back button on Android
    document.addEventListener("backbutton", function (e) {
        e.preventDefault(); // Stop native browser history backtracking

        const currentUrl = window.location.href.toLowerCase();

        // If we are on root pages, confirm before exiting the app
        if (currentUrl.includes('home.html') || currentUrl.includes('signin.html') || currentUrl.includes('signup.html')) {
            const exitMessage = 'Are you sure you want to exit the app?';
            const exitTitle = 'Exit App';
            
            if (navigator.notification && navigator.notification.confirm) {
                navigator.notification.confirm(
                    exitMessage,
                    function(buttonIndex) {
                        if (buttonIndex === 1) { // 'Yes' button clicked
                            if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
                        }
                    },
                    exitTitle,
                    ['Yes', 'No']
                );
            } else {
                // Fallback for browsers or if notification plugin isn't installed
                if (confirm(exitMessage)) {
                    if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
                }
            }
            return;
        }

        // Otherwise, try to find the on-screen back button and trigger it
        const backLink = document.getElementById('backLink');
        const backBtn = document.getElementById('backBtn');
        const quitBtn = document.getElementById('quitBtn'); // For test taking
        const confirmQuitBtn = document.getElementById('confirmQuitBtn'); // For modal in test taking

        if (confirmQuitBtn && confirmQuitBtn.closest('div:not(.hidden)')) {
            // If quit modal is open, click confirm or cancel depending on logic, let's just do confirm for now
            // Actually, usually back button dismisses modal. Let's find cancel.
            const cancelBtn = document.getElementById('cancelQuitBtn');
            if (cancelBtn) cancelBtn.click();
        } else if (backLink) {
            backLink.click();
        } else if (backBtn) {
            backBtn.click();
        } else if (quitBtn) {
            quitBtn.click();
        } else {
            // Fallback if no UI button is found
            window.history.back(); 
        }
    }, false);
}, false);
