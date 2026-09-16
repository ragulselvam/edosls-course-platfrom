/**
 * Master Application Controller, URL Hash Router & State Persistence
 */
const App = {
  currentView: 'login-view',
  currentRoute: 'dashboard',

  async init() {
    Auth.init();
    this.initTheme();

    // Global listeners for dropdowns and command palette
    window.addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openQuickSearchModal();
      }
    });

    // Listen for hash changes (browser back/forward & refresh)
    window.addEventListener('hashchange', () => {
      this.closeMobileSidebar();
      this.handleHashChange();
    });

    // Touch swipe gestures for mobile sidebar drawer
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        // Swipe right from left edge (< 40px) to open sidebar
        if (touchStartX < 40 && deltaX > 60) {
          this.openMobileSidebar();
        }
        // Swipe left to close open sidebar
        else if (deltaX < -70) {
          this.closeMobileSidebar();
        }
      }
    }, { passive: true });

    // Check for public course registration route in URL hash
    const initialHash = window.location.hash.replace(/^#+\/*/, '').trim();
    if (initialHash.startsWith('register-course/')) {
      const courseId = parseInt(initialHash.split('/')[1]);
      if (courseId) {
        this.renderPublicCourseRegistration(courseId);
        return;
      }
    }
    if (initialHash === 'register' || initialHash === 'student-registration') {
      this.renderGeneralStudentRegistration();
      return;
    }

    // Check if user is logged in
    const user = Auth.getUser();
    if (user && API.getToken()) {
      // Validate or refresh session
      try {
        const freshUser = await API.get('/api/auth/me');
        if (freshUser) {
          Auth.currentUser = freshUser;
          sessionStorage.setItem('platform_user', JSON.stringify(freshUser));
        }
      } catch (e) {
        // Token expired
        this.showLandingView();
        return;
      }

      if (initialHash === 'landing' || initialHash === 'home') {
        this.showLandingView();
      } else if (initialHash === 'login' || initialHash === 'signin') {
        this.showLoginView();
      } else {
        this.routeToUserDashboard();
      }
    } else {
      if (initialHash === 'login' || initialHash === 'signin') {
        this.showLoginView();
      } else {
        this.showLandingView();
      }
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('platform_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('platform_theme', next);
    this.updateThemeIcons(next);
  },

  updateThemeIcons(theme) {
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
      if (theme === 'dark') {
        el.className = 'fi fi-rr-sun theme-toggle-icon';
      } else {
        el.className = 'fi fi-rr-moon theme-toggle-icon';
      }
    });
  },

  showModal(htmlContent, sizeClass = '') {
    const backdrop = document.getElementById('global-modal-backdrop');
    const dialog = document.getElementById('global-modal-dialog');
    if (!backdrop || !dialog) return;

    dialog.className = `modal-dialog ${sizeClass}`;
    dialog.innerHTML = htmlContent;
    backdrop.style.display = 'flex';
    document.body.classList.add('modal-open');
  },

  closeModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
    document.body.classList.remove('modal-open');
  },

  showDangerConfirmModal({
    title = 'Are you sure?',
    warningBanner = "Unexpected bad things will happen if you don't read this!",
    description = '',
    itemName = '',
    itemType = 'course',
    confirmButtonText = '',
    onConfirm = null
  }) {
    const targetName = itemName || '';
    const btnLabel = confirmButtonText || `I understand, delete this ${itemType}`;
    const desc = description || `This action <strong>CANNOT</strong> be undone. This will permanently delete the <strong>${targetName}</strong> curriculum, modules, lessons, student progress and assignments, and remove all trainer associations.`;

    const escapedName = targetName.replace(/["']/g, '');

    const modalHTML = `
      <div class="danger-modal-header">
        <h3>${title}</h3>
        <button class="icon-btn" onclick="App.closeModal()" title="Close">✕</button>
      </div>

      <div class="danger-confirm-banner">
        ${warningBanner}
      </div>

      <div class="danger-modal-body">
        <div class="danger-modal-desc">
          ${desc}
        </div>

        <label class="danger-modal-label" for="danger-confirm-input">
          Please type in the name of the ${itemType} to confirm.
        </label>

        <input type="text" id="danger-confirm-input" class="danger-modal-input" 
          placeholder="${escapedName}" 
          autocomplete="off"
        />

        <button id="danger-confirm-submit-btn" class="danger-modal-btn" disabled>
          ${btnLabel}
        </button>
      </div>
    `;

    this.showModal(modalHTML, 'modal-danger-confirm');

    setTimeout(() => {
      const input = document.getElementById('danger-confirm-input');
      const btn = document.getElementById('danger-confirm-submit-btn');
      if (!input || !btn) return;

      input.focus();

      const validateInput = () => {
        const val = input.value.trim().toLowerCase();
        const expected = targetName.trim().toLowerCase();
        if (val === expected && expected.length > 0) {
          btn.disabled = false;
          btn.classList.add('active');
        } else {
          btn.disabled = true;
          btn.classList.remove('active');
        }
      };

      input.addEventListener('input', validateInput);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btn.disabled) {
          e.preventDefault();
          btn.click();
        }
      });

      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-sm"></span> Deleting...';
        try {
          if (onConfirm) await onConfirm();
          App.closeModal();
        } catch (err) {
          console.error(err);
          API.toast(err.message || 'Failed to delete item', 'error');
          btn.disabled = false;
          btn.innerHTML = btnLabel;
        }
      });
    }, 50);
  },

  showView(viewId) {
    let target = document.getElementById(viewId);
    if (!target) {
      console.warn(`[App] Target view container "${viewId}" not found in DOM. Falling back to default role view.`);
      const role = Auth.getRole();
      if (role === 'super_admin') viewId = 'super-admin-view';
      else if (role === 'college_admin' || role === 'trainer') viewId = 'college-admin-view';
      else if (role === 'student') viewId = 'student-view';
      else viewId = 'login-view';
      target = document.getElementById(viewId);
    }
    if (!target) return;

    document.querySelectorAll('.app-view-container').forEach(el => {
      el.style.display = 'none';
      el.classList.remove('active');
    });
    
    if (viewId === 'login-view') {
      target.style.display = 'flex';
    } else {
      target.style.display = 'block';
    }
    target.classList.add('active');
    this.currentView = viewId;
  },

  showLandingView() {
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    this.closeMobileSidebar();
    this.showView('landing-view');
    if (typeof LandingPage !== 'undefined') {
      LandingPage.init();
    }
  },

  showLoginView() {
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    this.closeMobileSidebar();
    this.showView('login-view');
  },

  navigate(route) {
    if (!route) route = 'dashboard';
    // Clean route formatting
    route = route.replace(/^#+\/*/, '').trim();
    if (!route) route = 'dashboard';

    this.closeMobileSidebar();
    this.currentRoute = route;
    sessionStorage.setItem('platform_current_route', route);

    const targetHash = `#/${route}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      this.executeRoute(route);
    }
  },

  handleHashChange() {
    const raw = window.location.hash.replace(/^#+\/*/, '').trim();
    if (!raw && Auth.getUser()) {
      const saved = sessionStorage.getItem('platform_current_route') || 'dashboard';
      this.navigate(saved);
      return;
    }
    if (raw) {
      this.currentRoute = raw;
      sessionStorage.setItem('platform_current_route', raw);
      this.executeRoute(raw);
    }
  },

  routeToUserDashboard() {
    const role = Auth.getRole();
    if (!role) {
      this.showLoginView();
      return;
    }

    if (role === 'super_admin') {
      this.showView('super-admin-view');
      this.renderSidebar('super_admin');
    } else if (role === 'college_admin') {
      this.showView('college-admin-view');
      this.renderSidebar('college_admin');
    } else if (role === 'trainer') {
      this.showView('college-admin-view');
      this.renderSidebar('trainer');
    } else if (role === 'student') {
      this.showView('student-view');
      this.renderSidebar('student');
    }

    this.updateUserNavbarInfo();
    this.fetchNotificationCount();
    this.renderBottomNav(role);

    // Check saved route from URL hash or sessionStorage to prevent resetting on refresh!
    const hashRoute = window.location.hash.replace(/^#+\/*/, '').trim();
    const savedRoute = hashRoute || sessionStorage.getItem('platform_current_route') || 'dashboard';
    this.navigate(savedRoute);
  },

  executeRoute(route) {
    if (route === 'landing' || route === 'home' || route === 'landing-hero') {
      this.showLandingView();
      return;
    }

    if (route === 'features' || route === 'landing-features') {
      this.showLandingView();
      setTimeout(() => { if (typeof LandingPage !== 'undefined') LandingPage.scrollTo('landing-features'); }, 100);
      return;
    }

    if (route === 'labs' || route === 'interactive-labs' || route === 'landing-interactive-labs') {
      this.showLandingView();
      setTimeout(() => { if (typeof LandingPage !== 'undefined') LandingPage.scrollTo('landing-interactive-labs'); }, 100);
      return;
    }

    if (route === 'curriculum' || route === 'landing-courses') {
      this.showLandingView();
      setTimeout(() => { if (typeof LandingPage !== 'undefined') LandingPage.scrollTo('landing-courses'); }, 100);
      return;
    }

    if (route === 'verifier' || route === 'verify') {
      this.showLandingView();
      setTimeout(() => {
        if (typeof CertificateViewer !== 'undefined') {
          CertificateViewer.openVerifier();
        }
      }, 100);
      return;
    }

    if (route === 'login' || route === 'signin') {
      this.showLoginView();
      return;
    }

    // Handle parameterized public course registration route
    if (route.startsWith('register-course/')) {
      const parts = route.split('/');
      const courseId = parseInt(parts[1]);
      if (courseId) {
        this.renderPublicCourseRegistration(courseId);
        return;
      }
    }

    // Handle general student registration route
    if (route === 'register' || route === 'student-registration') {
      this.renderGeneralStudentRegistration();
      return;
    }

    const role = Auth.getRole();
    if (!role) {
      this.showLoginView();
      return;
    }

    // Handle parameterized routes like player/1 or player/1/lesson/3
    if (route.startsWith('player/')) {
      const parts = route.split('/');
      const courseId = parseInt(parts[1]);
      let contentId = null;
      if (parts.length >= 4 && parts[2] === 'lesson') {
        contentId = parseInt(parts[3]);
      } else if (parts.length >= 3 && !isNaN(parseInt(parts[2]))) {
        contentId = parseInt(parts[2]);
      }
      if (courseId) Player.openPlayer(courseId, contentId);
      return;
    }

    // Handle parameterized routes like exam/1
    if (route.startsWith('exam/')) {
      const assessId = parseInt(route.split('/')[1]);
      if (assessId) AssessmentRunner.startExam(assessId);
      return;
    }

    // Highlight matching sidebar tab (exact or base route)
    let baseRoute = route.split('/')[0];
    if (baseRoute === 'classes') baseRoute = 'courses';
    this.highlightNavTab(baseRoute);

    // Update topbar breadcrumb dynamically
    this.updateDynamicBreadcrumb(role, baseRoute);

    if (role === 'super_admin') {
      this.showView('super-admin-view');
      switch (baseRoute) {
        case 'colleges':
          SuperAdmin.renderCollegesView();
          break;
        case 'admins':
          SuperAdmin.renderAdminsView();
          break;
        case 'students':
          SuperAdmin.renderGlobalStudentsView();
          break;
        case 'courses':
        case 'classes':
        case 'curriculum':
          SuperAdmin.renderGlobalCoursesView();
          break;
        case 'create-course':
        case 'new-course':
        case 'course-studio':
        case 'course-wizard':
          SuperAdmin.renderGlobalCoursesView();
          setTimeout(() => SuperAdmin.openCreateCourseModal(), 150);
          break;
        case 'enrollments':
          SuperAdmin.renderGlobalEnrollmentsView();
          break;
        case 'assessments':
          SuperAdmin.renderGlobalAssessmentsView();
          break;
        case 'reports':
          SuperAdmin.renderReportsView();
          break;
        case 'settings':
          SuperAdmin.renderSettingsView();
          break;
        case 'dashboard':
        default:
          SuperAdmin.renderDashboard();
          break;
      }
    } else if (role === 'college_admin') {
      this.showView('college-admin-view');
      switch (baseRoute) {
        case 'students':
          CollegeAdmin.renderStudentsView();
          break;
        case 'courses':
        case 'classes':
        case 'curriculum':
          CollegeAdmin.renderCoursesView();
          break;
        case 'create-course':
        case 'new-course':
          CollegeAdmin.renderCoursesView();
          setTimeout(() => CollegeAdmin.openCreateCourseModal(), 150);
          break;
        case 'enrollments':
          CollegeAdmin.renderEnrollmentsView();
          break;
        case 'assessments':
          CollegeAdmin.renderAssessmentsView();
          break;
        case 'results':
          CollegeAdmin.renderResultsView();
          break;
        case 'certificates':
          CollegeAdmin.renderCertificatesView();
          break;
        case 'reports':
          CollegeAdmin.renderReportsView();
          break;
        case 'notifications':
          CollegeAdmin.renderNotificationsView();
          break;
        case 'settings':
          CollegeAdmin.renderSettingsView();
          break;
        case 'dashboard':
        default:
          CollegeAdmin.renderDashboard();
          break;
      }
    } else if (role === 'trainer') {
      this.showView('college-admin-view');
      switch (baseRoute) {
        case 'courses':
        case 'classes':
          CollegeAdmin.renderCoursesView();
          break;
        case 'students':
          CollegeAdmin.renderStudentsView();
          break;
        case 'assessments':
          CollegeAdmin.renderAssessmentsView();
          break;
        case 'results':
          CollegeAdmin.renderResultsView();
          break;
        case 'notifications':
          CollegeAdmin.renderNotificationsView();
          break;
        case 'dashboard':
        default:
          CollegeAdmin.renderDashboard();
          break;
      }
    } else if (role === 'student') {
      this.showView('student-view');
      switch (baseRoute) {
        case 'available-courses':
        case 'courses':
        case 'catalog':
          Student.renderAvailableCourses();
          break;
        case 'my-courses':
        case 'enrolled':
          Student.renderMyCourses();
          break;
        case 'assessments':
        case 'exams':
          Student.renderAssessmentsView();
          break;
        case 'certificates':
        case 'certs':
          Student.renderCertificatesView();
          break;
        case 'assignments':
          Student.renderAssignmentsView();
          break;
        case 'results':
        case 'grades':
          Student.renderResultsView();
          break;
        case 'notifications':
          Student.renderNotificationsView();
          break;
        case 'profile':
        case 'settings':
          Student.renderProfileView();
          break;
        case 'dashboard':
        default:
          Student.renderDashboard();
          break;
      }
    }
  },

  filterQuickSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const container = document.getElementById('quick-search-results');
    if (!container || !this.cachedSearchOptions) return;

    const filtered = this.cachedSearchOptions.filter(o => o.title.toLowerCase().includes(q) || o.cat.toLowerCase().includes(q) || o.route.toLowerCase().includes(q));
    if (filtered.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-muted">No matching pages or modules found.</div>';
      return;
    }

    container.innerHTML = filtered.map(opt => `
      <div class="dropdown-item-link" style="padding: 0.65rem 0.85rem; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;" onclick="App.closeModal(); App.navigate('${opt.route}');">
        <div class="flex items-center gap-3">
          <span style="width: 28px; height: 28px; border-radius: 6px; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center;"><i class="${opt.icon}"></i></span>
          <span style="font-weight: 600;">${opt.title}</span>
        </div>
        <span class="badge badge-secondary font-mono" style="font-size: 0.65rem;">${opt.cat}</span>
      </div>
    `).join('');
  },

  renderSidebar(role) {
    const user = Auth.getUser();
    let sidebarId = 'app-sidebar-container';
    if (role === 'college_admin') sidebarId = 'college-sidebar-container';
    if (role === 'student') sidebarId = 'student-sidebar-container';

    const sidebar = document.getElementById(sidebarId);
    if (!sidebar) return;

    let collegeBadge = '';
    if (user && user.college_name) {
      collegeBadge = `
        <div class="sidebar-college-badge">
          <div class="college-badge-text">
            <div class="college-badge-name">${user.college_name}</div>
            <div class="college-badge-role">${(user.role_name || role).replace('_', ' ')}</div>
          </div>
        </div>
      `;
    }

    let navItems = '';
    if (role === 'super_admin') {
      navItems = `
        <div class="nav-section-title">GLOBAL PLATFORM</div>
        <div class="nav-item" data-route="dashboard" onclick="App.navigate('dashboard')">
          <i class="fi fi-rr-apps"></i> <span>Dashboard</span>
        </div>
        <div class="nav-item" data-route="colleges" onclick="App.navigate('colleges')">
          <i class="fi fi-rr-building"></i> <span>Colleges</span>
        </div>
        <div class="nav-item" data-route="admins" onclick="App.navigate('admins')">
          <i class="fi fi-rr-users-alt"></i> <span>Admins</span>
        </div>
        <div class="nav-item" data-route="students" onclick="App.navigate('students')">
          <i class="fi fi-rr-graduation-cap"></i> <span>Students</span>
        </div>
        <div class="nav-item" data-route="courses" onclick="App.navigate('courses')">
          <i class="fi fi-rr-book-alt"></i> <span>Courses</span>
        </div>
        <div class="nav-item" data-route="enrollments" onclick="App.navigate('enrollments')">
          <i class="fi fi-rr-user-add"></i> <span>Enrollments</span>
        </div>
        <div class="nav-item" data-route="assessments" onclick="App.navigate('assessments')">
          <i class="fi fi-rr-checkbox"></i> <span>Assessments</span>
        </div>
        <div class="nav-item" data-route="reports" onclick="App.navigate('reports')">
          <i class="fi fi-rr-chart-pie-alt"></i> <span>Reports & Logs</span>
        </div>
        <div class="nav-item" data-route="settings" onclick="App.navigate('settings')">
          <i class="fi fi-rr-settings"></i> <span>Settings</span>
        </div>
      `;
    } else if (role === 'college_admin' || role === 'trainer') {
      navItems = `
        <div class="nav-section-title">COLLEGE PORTAL</div>
        <div class="nav-item" data-route="dashboard" onclick="App.navigate('dashboard')">
          <i class="fi fi-rr-apps"></i> <span>Dashboard</span>
        </div>
        <div class="nav-item" data-route="students" onclick="App.navigate('students')">
          <i class="fi fi-rr-graduation-cap"></i> <span>Students</span>
        </div>
        <div class="nav-item" data-route="courses" onclick="App.navigate('courses')">
          <i class="fi fi-rr-book-alt"></i> <span>Courses</span>
        </div>
        <div class="nav-item" data-route="enrollments" onclick="App.navigate('enrollments')">
          <i class="fi fi-rr-user-add"></i> <span>Enrollments</span>
        </div>
        <div class="nav-item" data-route="assessments" onclick="App.navigate('assessments')">
          <i class="fi fi-rr-checkbox"></i> <span>Assessments</span>
        </div>
        <div class="nav-item" data-route="results" onclick="App.navigate('results')">
          <i class="fi fi-rr-trophy"></i> <span>Results & Grades</span>
        </div>
        <div class="nav-item" data-route="certificates" onclick="App.navigate('certificates')">
          <i class="fi fi-rr-diploma"></i> <span>Certificates</span>
        </div>
        <div class="nav-item" data-route="reports" onclick="App.navigate('reports')">
          <i class="fi fi-rr-chart-pie-alt"></i> <span>Reports</span>
        </div>
        <div class="nav-item" data-route="notifications" onclick="App.navigate('notifications')">
          <i class="fi fi-rr-bell"></i> <span>Announcements</span>
        </div>
        <div class="nav-item" data-route="settings" onclick="App.navigate('settings')">
          <i class="fi fi-rr-settings"></i> <span>Settings</span>
        </div>
      `;
    } else if (role === 'student') {
      navItems = `
        <div class="nav-section-title">LEARNER PORTAL</div>
        <div class="nav-item" data-route="dashboard" onclick="App.navigate('dashboard')">
          <i class="fi fi-rr-apps"></i> <span>Dashboard</span>
        </div>
        <div class="nav-item" data-route="my-courses" onclick="App.navigate('my-courses')">
          <i class="fi fi-rr-play-alt"></i> <span>My Courses</span>
        </div>
        <div class="nav-item" data-route="available-courses" onclick="App.navigate('available-courses')">
          <i class="fi fi-rr-book-alt"></i> <span>Browse Courses</span>
        </div>
        <div class="nav-item" data-route="assignments" onclick="App.navigate('assignments')">
          <i class="fi fi-rr-document"></i> <span>Assignments</span>
        </div>
        <div class="nav-item" data-route="assessments" onclick="App.navigate('assessments')">
          <i class="fi fi-rr-checkbox"></i> <span>Assessments</span>
        </div>
        <div class="nav-item" data-route="results" onclick="App.navigate('results')">
          <i class="fi fi-rr-trophy"></i> <span>My Results</span>
        </div>
        <div class="nav-item" data-route="certificates" onclick="App.navigate('certificates')">
          <i class="fi fi-rr-diploma"></i> <span>Certificates</span>
        </div>
        <div class="nav-item" data-route="notifications" onclick="App.navigate('notifications')">
          <i class="fi fi-rr-bell"></i> <span>Notifications</span>
        </div>
        <div class="nav-item" data-route="profile" onclick="App.navigate('profile')">
          <i class="fi fi-rr-user"></i> <span>My Profile</span>
        </div>
      `;
    }

    sidebar.innerHTML = `
      ${collegeBadge}
      <div class="sidebar-nav-menu">
        ${navItems}
      </div>
    `;
  },

  updateUserNavbarInfo() {
    const user = Auth.getUser();
    if (!user) return;
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const name = `${firstName} ${lastName}`.trim() || user.email || 'User';
    const initials = (firstName[0] || user.email?.[0] || 'U') + (lastName[0] || '');
    
    document.querySelectorAll('.topbar-user-name, .user-meta-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.topbar-user-role, .user-meta-role').forEach(el => el.textContent = (user.role_name || Auth.getRole() || '').replace(/_/g, ' ').toUpperCase());
    document.querySelectorAll('.topbar-user-avatar, .user-avatar').forEach(el => el.textContent = initials.toUpperCase());
    document.querySelectorAll('.user-dropdown-email').forEach(el => el.textContent = user.email || '');
  },

  updateDynamicBreadcrumb(role, route) {
    const routeMap = {
      'dashboard': { title: 'Dashboard', icon: 'fi fi-rr-apps' },
      'colleges': { title: 'Institutions & Colleges', icon: 'fi fi-rr-building' },
      'admins': { title: 'Institutional Administrators', icon: 'fi fi-rr-users-alt' },
      'students': { title: 'Student Management', icon: 'fi fi-rr-graduation-cap' },
      'courses': { title: 'Course Studio & Curriculum', icon: 'fi fi-rr-book-alt' },
      'available-courses': { title: 'Course Catalog', icon: 'fi fi-rr-book-alt' },
      'my-courses': { title: 'My Enrolled Courses', icon: 'fi fi-rr-play-alt' },
      'enrollments': { title: 'Enrollment Management', icon: 'fi fi-rr-user-add' },
      'assessments': { title: 'Examinations & Assessments', icon: 'fi fi-rr-checkbox' },
      'results': { title: 'Results & Performance', icon: 'fi fi-rr-trophy' },
      'certificates': { title: 'Verifiable Credentials', icon: 'fi fi-rr-diploma' },
      'assignments': { title: 'Practical Assignments', icon: 'fi fi-rr-document' },
      'reports': { title: 'Analytics & Audit Logs', icon: 'fi fi-rr-chart-pie-alt' },
      'notifications': { title: 'Announcements & Alerts', icon: 'fi fi-rr-bell' },
      'settings': { title: 'Platform Settings', icon: 'fi fi-rr-settings' },
      'profile': { title: 'My Account Profile', icon: 'fi fi-rr-user' }
    };
    const currentInfo = routeMap[route] || { title: (route || 'Dashboard').replace(/-/g, ' ').toUpperCase(), icon: 'fi fi-rr-folder' };
    document.querySelectorAll('.topbar-breadcrumb-current').forEach(el => {
      let iconColor = 'var(--primary)';
      if (role === 'college_admin') iconColor = 'var(--accent-emerald)';
      if (role === 'student') iconColor = 'var(--accent-purple)';
      el.innerHTML = `<i class="${currentInfo.icon}" style="color: ${iconColor};"></i> <span>${currentInfo.title}</span>`;
    });
  },

  toggleUserDropdown(triggerEl, event) {
    if (event) event.stopPropagation();
    const wrapper = triggerEl.closest('.topbar-user-profile-wrapper');
    if (!wrapper) return;
    const popover = wrapper.querySelector('.user-dropdown-popover');
    if (!popover) return;
    const isVisible = popover.style.display === 'block';
    this.closeAllDropdowns();
    if (!isVisible) {
      popover.style.display = 'block';
      triggerEl.classList.add('active');
    }
  },

  closeAllDropdowns() {
    document.querySelectorAll('.user-dropdown-popover').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.topbar-user-pill').forEach(el => el.classList.remove('active'));
  },

  openQuickSearchModal() {
    const role = Auth.getRole();
    let searchOptions = [];
    if (role === 'super_admin') {
      searchOptions = [
        { title: 'Dashboard & Metrics', cat: 'Overview', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { title: 'Institutions & Colleges', cat: 'Governance', route: 'colleges', icon: 'fi fi-rr-building' },
        { title: 'College Administrators', cat: 'Governance', route: 'admins', icon: 'fi fi-rr-users-alt' },
        { title: 'Global Student Directory', cat: 'Users', route: 'students', icon: 'fi fi-rr-graduation-cap' },
        { title: 'Course Studio & Curriculum', cat: 'Academic', route: 'courses', icon: 'fi fi-rr-book-alt' },
        { title: 'Student Enrollments', cat: 'Academic', route: 'enrollments', icon: 'fi fi-rr-user-add' },
        { title: 'Global Examinations', cat: 'Testing', route: 'assessments', icon: 'fi fi-rr-checkbox' },
        { title: 'Audit & Compliance Logs', cat: 'System', route: 'reports', icon: 'fi fi-rr-chart-pie-alt' },
        { title: 'Platform Settings', cat: 'System', route: 'settings', icon: 'fi fi-rr-settings' }
      ];
    } else if (role === 'college_admin' || role === 'trainer') {
      searchOptions = [
        { title: 'Dashboard', cat: 'Overview', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { title: 'Student Directory', cat: 'Roster', route: 'students', icon: 'fi fi-rr-graduation-cap' },
        { title: 'Courses & Curriculum', cat: 'Curriculum', route: 'courses', icon: 'fi fi-rr-book-alt' },
        { title: 'Student Enrollments', cat: 'Roster', route: 'enrollments', icon: 'fi fi-rr-user-add' },
        { title: 'Examinations & MCQs', cat: 'Exams', route: 'assessments', icon: 'fi fi-rr-checkbox' },
        { title: 'Submissions & Grading', cat: 'Grades', route: 'results', icon: 'fi fi-rr-trophy' },
        { title: 'Certificates Center', cat: 'Credentials', route: 'certificates', icon: 'fi fi-rr-diploma' },
        { title: 'College Analytics', cat: 'Reports', route: 'reports', icon: 'fi fi-rr-chart-pie-alt' },
        { title: 'Announcements', cat: 'Broadcast', route: 'notifications', icon: 'fi fi-rr-bell' },
        { title: 'Settings & Profile', cat: 'Account', route: 'settings', icon: 'fi fi-rr-settings' }
      ];
    } else if (role === 'student') {
      searchOptions = [
        { title: 'Student Dashboard', cat: 'Home', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { title: 'My Enrolled Courses', cat: 'Learning', route: 'my-courses', icon: 'fi fi-rr-play-alt' },
        { title: 'Browse Available Courses', cat: 'Catalog', route: 'available-courses', icon: 'fi fi-rr-book-alt' },
        { title: 'Course Assignments', cat: 'Tasks', route: 'assignments', icon: 'fi fi-rr-document' },
        { title: 'Exams & Quizzes', cat: 'Exams', route: 'assessments', icon: 'fi fi-rr-checkbox' },
        { title: 'Grades & Test Results', cat: 'Performance', route: 'results', icon: 'fi fi-rr-trophy' },
        { title: 'Earned Certificates', cat: 'Credentials', route: 'certificates', icon: 'fi fi-rr-diploma' },
        { title: 'Notifications & Alerts', cat: 'Alerts', route: 'notifications', icon: 'fi fi-rr-bell' },
        { title: 'My Profile', cat: 'Account', route: 'profile', icon: 'fi fi-rr-user' }
      ];
    }

    this.cachedSearchOptions = searchOptions;

    this.showModal(`
      <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1rem 1.25rem;">
        <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
          <i class="fi fi-rr-search" style="color: var(--primary); font-size: 1.1rem;"></i>
          <input 
            type="text" 
            id="quick-search-input" 
            class="form-input" 
            placeholder="Type to search pages, modules, exams (Cmd+K)..." 
            style="border: none; background: transparent; font-size: 1rem; width: 100%; box-shadow: none;" 
            oninput="App.filterQuickSearch(this.value)"
            autofocus
          />
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 0.75rem; max-height: 380px; overflow-y: auto;" id="quick-search-results">
        ${searchOptions.map(opt => `
          <div class="dropdown-item-link" style="padding: 0.65rem 0.85rem; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;" onclick="App.closeModal(); App.navigate('${opt.route}');">
            <div class="flex items-center gap-3">
              <span style="width: 28px; height: 28px; border-radius: 6px; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center;"><i class="${opt.icon}"></i></span>
              <span style="font-weight: 600;">${opt.title}</span>
            </div>
            <span class="badge badge-secondary font-mono" style="font-size: 0.65rem;">${opt.cat}</span>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer" style="padding: 0.6rem 1.25rem; font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
        <span>Press <kbd style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">ESC</kbd> to exit</span>
        <span>Navigation Command Center</span>
      </div>
    `, 'modal-md');

    setTimeout(() => {
      const inp = document.getElementById('quick-search-input');
      if (inp) inp.focus();
    }, 100);
  },

  toggleMobileSidebar() {
    const role = Auth.getRole();
    let sidebarId = 'app-sidebar-container';
    if (role === 'college_admin' || role === 'trainer') sidebarId = 'college-sidebar-container';
    if (role === 'student') sidebarId = 'student-sidebar-container';

    const sidebar = document.getElementById(sidebarId);
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('mobile-open');
    if (isOpen) {
      this.closeMobileSidebar();
    } else {
      sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
    }
  },

  openMobileSidebar() {
    const role = Auth.getRole();
    let sidebarId = 'app-sidebar-container';
    if (role === 'college_admin' || role === 'trainer') sidebarId = 'college-sidebar-container';
    if (role === 'student') sidebarId = 'student-sidebar-container';

    const sidebar = document.getElementById(sidebarId);
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  },

  closeMobileSidebar() {
    document.querySelectorAll('.app-sidebar').forEach(el => el.classList.remove('mobile-open'));
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  },

  renderBottomNav(role) {
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (!bottomNav) return;

    if (!role) {
      bottomNav.style.display = 'none';
      return;
    }

    bottomNav.style.display = 'flex';
    let tabs = [];
    if (role === 'super_admin') {
      tabs = [
        { label: 'Overview', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { label: 'Colleges', route: 'colleges', icon: 'fi fi-rr-building' },
        { label: 'Courses', route: 'courses', icon: 'fi fi-rr-book-alt' },
        { label: 'Reports', route: 'reports', icon: 'fi fi-rr-chart-pie-alt' },
        { label: 'Menu', action: 'App.toggleMobileSidebar()', icon: 'fi fi-rr-menu-burger' }
      ];
    } else if (role === 'college_admin') {
      tabs = [
        { label: 'Home', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { label: 'Courses', route: 'courses', icon: 'fi fi-rr-book-alt' },
        { label: 'Results', route: 'results', icon: 'fi fi-rr-trophy' },
        { label: 'Certs', route: 'certificates', icon: 'fi fi-rr-award' },
        { label: 'Menu', action: 'App.toggleMobileSidebar()', icon: 'fi fi-rr-menu-burger' }
      ];
    } else if (role === 'trainer') {
      tabs = [
        { label: 'Dashboard', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { label: 'Classes', route: 'courses', icon: 'fi fi-rr-book-alt' },
        { label: 'Grading', route: 'results', icon: 'fi fi-rr-trophy' },
        { label: 'Exams', route: 'assessments', icon: 'fi fi-rr-document-signed' },
        { label: 'Menu', action: 'App.toggleMobileSidebar()', icon: 'fi fi-rr-menu-burger' }
      ];
    } else if (role === 'student') {
      tabs = [
        { label: 'Home', route: 'dashboard', icon: 'fi fi-rr-apps' },
        { label: 'Courses', route: 'my-courses', icon: 'fi fi-rr-book-alt' },
        { label: 'Catalog', route: 'available-courses', icon: 'fi fi-rr-book-open-cover' },
        { label: 'Results', route: 'results', icon: 'fi fi-rr-chart-histogram' },
        { label: 'Menu', action: 'App.toggleMobileSidebar()', icon: 'fi fi-rr-menu-burger' }
      ];
    }

    bottomNav.innerHTML = tabs.map(t => {
      const clickHandler = t.action || `App.navigate('${t.route}')`;
      const dataRouteAttr = t.route ? `data-bottom-route="${t.route}"` : '';
      return `
        <button type="button" class="mobile-nav-tab" ${dataRouteAttr} onclick="${clickHandler}">
          <i class="${t.icon}"></i>
          <span>${t.label}</span>
        </button>
      `;
    }).join('');

    this.highlightNavTab(this.currentRoute);
  },

  async fetchNotificationCount() {
    try {
      const data = await API.get('/api/notifications');
      const countEls = document.querySelectorAll('.notification-badge');
      const unread = (data.notifications || []).filter(n => !n.is_read).length;
      countEls.forEach(el => {
        if (unread > 0) {
          el.textContent = unread > 99 ? '99+' : unread;
          el.style.display = 'inline-flex';
        } else {
          el.style.display = 'none';
        }
      });
    } catch (e) {
      console.warn('Failed to fetch notification count:', e);
    }
  },

  showModal(html, sizeClass = '') {
    const backdrop = document.getElementById('global-modal-backdrop');
    const dialog = document.getElementById('global-modal-dialog');
    if (!backdrop || !dialog) return;
    dialog.className = 'modal-dialog ' + sizeClass;
    dialog.innerHTML = html;
    backdrop.style.display = 'flex';
  },

  closeModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  },

  async downloadSyllabusPDF(courseId) {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      const c = data.course;
      const modules = data.modules || [];
      const assessments = data.assessments || [];
      const totalLessons = modules.reduce((acc, m) => acc + (m.contents ? m.contents.length : 0), 0);
      const totalHours = modules.reduce((acc, m) => acc + (m.duration_hours || 2), 0);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        API.toast('Popup blocked! Please allow popups to download/print the syllabus.', 'warning');
        return;
      }

      const modulesDocHtml = modules.map((m, idx) => {
        const contentsRows = (m.contents || []).map(cnt => `
          <tr>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${cnt.title}</td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;"><span style="text-transform: uppercase; font-size: 10px; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${cnt.content_type}</span></td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-align: right;">${cnt.duration_minutes || 15} Mins</td>
          </tr>
        `).join('');

        return `
          <div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
            <div style="background: #f8fafc; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #0f172a; font-size: 13px;">Module ${idx + 1}: ${m.title}</strong>
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">~${m.duration_hours || 2} Hours</span>
            </div>
            ${m.description ? `<div style="padding: 8px 12px; font-size: 12px; color: #64748b; font-style: italic; background: #fafafa;">${m.description}</div>` : ''}
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <thead>
                <tr style="background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
                  <th style="padding: 6px 12px;">Lesson / Topic</th>
                  <th style="padding: 6px 12px;">Type</th>
                  <th style="padding: 6px 12px; text-align: right;">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${contentsRows || '<tr><td colspan="3" style="padding: 8px 12px; color: #94a3b8; font-style: italic;">No lessons in this module.</td></tr>'}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      const assessmentsDocHtml = assessments.length > 0 ? `
        <div style="margin-top: 24px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
            Assessment & Examination Framework
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 8px 12px;">Assessment Title</th>
                <th style="padding: 8px 12px;">Type</th>
                <th style="padding: 8px 12px;">Duration</th>
                <th style="padding: 8px 12px; text-align: right;">Passing Requirement</th>
              </tr>
            </thead>
            <tbody>
              ${assessments.map(a => `
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${a.title}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${a.assessment_type}</span></td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${a.duration_minutes} Minutes</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">${a.passing_score}% Score</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';

      const printableDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${c.code} - ${c.title} Syllabus & Details</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #0f172a; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h1 style="font-size: 24px; margin: 0 0 6px 0; color: #0f172a;">${c.title}</h1>
                <div style="font-size: 13px; color: #64748b;">Course Code: <strong>${c.code}</strong> | Category: <strong>${c.category}</strong></div>
              </div>
              <div style="text-align: right; font-size: 13px; color: #64748b;">
                <div>${c.college_name || 'Multi-Tenant Platform'}</div>
                <div>Level: <strong>${c.level || 'Beginner'}</strong></div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div>
                <span style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Target Batch</span>
                <strong style="color: #0f172a; font-size: 13px;">${c.batch || 'All Batches'}</strong>
              </div>
              <div>
                <span style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Estimated Duration</span>
                <strong style="color: #0f172a; font-size: 13px;">${c.duration || '6 Weeks'}</strong>
              </div>
              <div>
                <span style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Curriculum</span>
                <strong style="color: #2563eb; font-size: 13px;">${modules.length} Modules • ${totalLessons} Lessons</strong>
              </div>
            </div>

            <div style="margin-bottom: 18px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;">
                Course Overview
              </h3>
              <p style="font-size: 12.5px; line-height: 1.6; color: #334155;">
                ${c.description || 'This course offers an intensive, structured academic and practical learning journey designed to build comprehensive industry competencies.'}
              </p>
            </div>

            ${c.learning_objectives ? `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;">
                  Learning Objectives
                </h3>
                <div style="font-size: 12.5px; line-height: 1.6; color: #334155; white-space: pre-line;">
                  ${c.learning_objectives}
                </div>
              </div>
            ` : ''}

            <div style="margin-top: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>Curriculum Modules & Topics</span>
                <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: none;">Total Duration: ~${totalHours} Hours</span>
              </h3>
              ${modulesDocHtml || '<div style="color: #94a3b8; font-style: italic; font-size: 12px;">No curriculum modules configured yet.</div>'}
            </div>

            ${assessmentsDocHtml}

            <div style="margin-top: 30px; padding-top: 16px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; page-break-inside: avoid;">
              <div>
                <div><strong>NEXUS ENTERPRISE PLATFORM</strong> • Institutional Academic Suite</div>
                <div>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: #0f172a;">Official Verified Syllabus</div>
                <div>Ref: SYL-${c.code}-${c.id}</div>
              </div>
            </div>
          </div>

          <script>
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => { window.print(); }, 400);
            });
          <\/script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(printableDoc);
      printWindow.document.close();
      API.toast('Syllabus document generated! Ready to print or save as PDF.', 'success');
    } catch (err) {
      console.error(err);
      API.toast('Failed to generate syllabus document: ' + (err.message || err), 'error');
    }
  },

  async openShareCourseModal(courseId) {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      const c = data.course;
      const modules = data.modules || [];
      const totalLessons = modules.reduce((acc, m) => acc + (m.contents ? m.contents.length : 0), 0);
      const regUrl = `${window.location.origin}/#register-course/${c.id}`;
      const batchLabel = c.batch || 'All Batches';

      this.showModal(`
        <div class="modal-header">
          <div>
            <h3>Share Course for Student Registration</h3>
            <span class="badge badge-primary font-mono">${c.code}</span>
            <span class="badge badge-secondary font-mono" style="margin-left: 4px;"><i class="fi fi-rr-users-alt"></i> Batch: ${batchLabel}</span>
            ${!c.college_id ? '<span class="badge badge-success font-mono" style="margin-left: 4px;"><i class="fi fi-rr-globe"></i> All Colleges</span>' : ''}
          </div>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body" style="padding: 1.5rem;">
          
          <!-- Course Hero Info -->
          <div class="card" style="padding: 1.15rem 1.25rem; display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.25rem; background: var(--bg-tertiary);">
            <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 90px; height: 65px; border-radius: 8px; object-fit: cover;" />
            <div style="flex: 1;">
              <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem; color: var(--text-primary); font-weight: 800;">${c.title}</h4>
              <p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 0.35rem;">${c.category} • ${c.duration || '6 Weeks'} • ${modules.length} Modules (${totalLessons} Lessons)</p>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                Target Audience: <strong style="color: var(--primary); font-weight: 700;">${batchLabel}</strong> ${c.college_name ? `• ${c.college_name}` : ''}
              </div>
            </div>
          </div>

          <!-- Section 1: Direct Registration Link -->
          <div class="card" style="margin-bottom: 1.15rem; padding: 1.15rem;">
            <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 6px; color: var(--text-primary);">
              <i class="fi fi-rr-link-alt" style="color: var(--primary);"></i> 1. Direct Student Registration Link
            </div>
            <p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 0.75rem;">
              Share this dedicated link via WhatsApp, Student Groups, Email, or Campus LMS for instant course enrollment.
            </p>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="share-reg-url-input" class="form-input font-mono" value="${regUrl}" readonly style="background: var(--bg-primary); font-size: 0.85rem;" />
              <button class="btn btn-primary" onclick="App.copyShareLink('${regUrl}')" style="white-space: nowrap; gap: 6px; font-weight: 600;">
                <i class="fi fi-rr-copy"></i> Copy Link
              </button>
            </div>
          </div>

          <!-- Section 2: QR Code & Fast Actions Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 1.15rem; margin-bottom: 1.15rem;">
            
            <!-- QR Code Card -->
            <div class="card" style="padding: 1.15rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.6rem; color: var(--text-primary);">
                <i class="fi fi-rr-qrcode" style="color: var(--accent-purple);"></i> Mobile QR Code
              </div>
              <div style="background: #ffffff; padding: 8px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: inline-block;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(regUrl)}" style="width: 120px; height: 120px; display: block;" alt="Course QR" />
              </div>
              <span class="text-muted" style="font-size: 0.72rem; margin-top: 0.4rem;">Scan with smartphone camera to enroll</span>
            </div>

            <!-- Fast Batch Broadcast & Direct Enrollment -->
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              
              <!-- In-App Broadcast -->
              <div class="card" style="padding: 1rem 1.15rem; flex: 1;">
                <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.25rem; color: var(--primary);">
                  <i class="fi fi-rr-bell-ring"></i> Broadcast In-App Notification
                </div>
                <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 0.65rem;">
                  Send a registration notification & link directly to all students in <strong>${batchLabel}</strong>.
                </p>
                <button class="btn btn-outline btn-sm" id="btn-broadcast-invite" onclick="App.sendBatchCourseInvite(${c.id})" style="width: 100%; gap: 6px; font-weight: 600;">
                  <i class="fi fi-rr-paper-plane"></i> Send Invite to Batch (${batchLabel})
                </button>
              </div>

              <!-- Direct Bulk Enrollment -->
              <div class="card" style="padding: 1rem 1.15rem; flex: 1; border-color: rgba(16, 185, 129, 0.35);">
                <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.25rem; color: var(--accent-emerald);">
                  <i class="fi fi-rr-users"></i> Instant Batch Auto-Enroll
                </div>
                <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 0.65rem;">
                  Directly register all students in <strong>${batchLabel}</strong> without waiting for manual signups.
                </p>
                <button class="btn btn-success btn-sm" id="btn-bulk-enroll" onclick="App.bulkEnrollBatchStudents(${c.id})" style="width: 100%; gap: 6px; font-weight: 600;">
                  <i class="fi fi-rr-user-add"></i> Auto-Enroll All in Batch
                </button>
              </div>

            </div>

          </div>

          <!-- Section 3: Copy Pre-formatted Announcement Template -->
          <div class="card" style="padding: 1.15rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">
                <i class="fi fi-rr-envelope" style="color: var(--accent-amber);"></i> Email / Announcement Template
              </div>
              <button class="btn btn-outline btn-sm" onclick="App.copyAnnouncementText(${c.id})" style="gap: 5px; font-size: 0.75rem;">
                <i class="fi fi-rr-copy"></i> Copy Message
              </button>
            </div>
            <textarea id="share-announcement-text" class="form-input" rows="4" readonly style="font-size: 0.8rem; line-height: 1.5; background: var(--bg-primary); resize: none;">📢 Course Registration Open: ${c.title} (${c.code})

Target Cohort: ${batchLabel}
Duration: ${c.duration || '6 Weeks'} | Category: ${c.category}

Dear Students, registration is now live for '${c.title}'. Click the link below to enroll and begin your coursework:
${regUrl}

— Academic Administration</textarea>
          </div>

        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Close</button>
          <button type="button" class="btn btn-outline" onclick="App.downloadSyllabusPDF(${c.id})" style="gap: 6px;">
            <i class="fi fi-rr-download"></i> Download Syllabus PDF
          </button>
        </div>
      `, 'modal-lg');
    } catch (err) {
      console.error(err);
      API.toast('Failed to prepare course share modal: ' + (err.message || err), 'error');
    }
  },

  copyShareLink(url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        API.toast('✓ Course registration link copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopy(url);
      });
    } else {
      this.fallbackCopy(url);
    }
  },

  copyAnnouncementText(courseId) {
    const textarea = document.getElementById('share-announcement-text');
    if (textarea) {
      this.copyShareLink(textarea.value);
    }
  },

  fallbackCopy(text) {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    API.toast('✓ Copied to clipboard!', 'success');
  },

  async sendBatchCourseInvite(courseId) {
    const btn = document.getElementById('btn-broadcast-invite');
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width: 12px; height: 12px; border-width: 2px; display: inline-block;"></span> Sending...';
      }
      const res = await API.post(`/api/courses/${courseId}/invite-students`);
      API.toast(`✓ ${res.message}`, 'success');
      if (btn) {
        btn.innerHTML = '✓ Invitations Sent!';
        btn.className = 'btn btn-success btn-sm';
      }
    } catch (e) {
      console.error(e);
      API.toast('Failed to broadcast invites: ' + (e.message || e), 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-paper-plane"></i> Send Invite to Batch';
      }
    }
  },

  async bulkEnrollBatchStudents(courseId) {
    const btn = document.getElementById('btn-bulk-enroll');
    if (!confirm('Are you sure you want to directly register all eligible students in this batch into this course?')) {
      return;
    }
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width: 12px; height: 12px; border-width: 2px; display: inline-block;"></span> Enrolling...';
      }
      const res = await API.post(`/api/courses/${courseId}/bulk-enroll-batch`);
      API.toast(`✓ ${res.message}`, 'success');
      if (btn) {
        btn.innerHTML = `✓ ${res.enrolled_count} Enrolled!`;
      }
      // Refresh current view if applicable
      const role = Auth.getRole();
      if (role === 'college_admin') CollegeAdmin.renderCoursesView();
      if (role === 'super_admin') SuperAdmin.renderCoursesView();
    } catch (e) {
      console.error(e);
      API.toast('Failed to auto-enroll batch: ' + (e.message || e), 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-user-add"></i> Auto-Enroll All in Batch';
      }
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});


















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































