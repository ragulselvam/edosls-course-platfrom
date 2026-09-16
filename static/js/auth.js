/**
 * Authentication Manager & Fast Role Switcher
 */
const Auth = {
  currentUser: null,
  activeTab: 'superadmin',

  init() {
    try {
      const savedUser = sessionStorage.getItem('platform_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      this.currentUser = null;
    }

    window.addEventListener('auth:expired', () => {
      this.logout();
    });
  },

  getUser() {
    return this.currentUser;
  },

  getRole() {
    return this.currentUser ? this.currentUser.role_name : null;
  },

  getCollegeId() {
    return this.currentUser ? this.currentUser.college_id : null;
  },

  async login(email, password) {
    const btn = document.getElementById('login-submit-btn');
    const origHtml = btn ? btn.innerHTML : '<span>Sign In to Portal</span> <i class="fi fi-rr-arrow-right"></i>';
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> Signing in...';
      }

      const res = await API.post('/api/auth/login', { email: (email || '').trim(), password });
      API.setToken(res.access_token);
      this.currentUser = res.user;
      sessionStorage.setItem('platform_user', JSON.stringify(res.user));

      let roleLabel = 'User';
      if (res.user.role_name === 'super_admin') roleLabel = 'Super Admin';
      else if (res.user.role_name === 'college_admin') roleLabel = 'College Admin';
      else if (res.user.role_name === 'student') roleLabel = 'Student';

      API.toast(`Welcome back, ${res.user.first_name || 'User'}! (${roleLabel})`, 'success');
      
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Login</span>';
      }

      // Automatically route user to their respective portal (Super Admin / College Admin / Student)
      App.routeToUserDashboard();
      return res;
    } catch (e) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Login</span>';
      }
      throw e;
    }
  },

  async fastLogin(roleKey) {
    const credentialsMap = {
      'superadmin': { email: 'superadmin@platform.edu', pass: 'Password@123' },
      'ait_admin': { email: 'admin@ait.edu', pass: 'Password@123' },
      'svce_admin': { email: 'admin@svce.edu', pass: 'Password@123' },
      'mau_admin': { email: 'admin@mau.edu', pass: 'Password@123' },
      'ait_student1': { email: 'student1@ait.edu', pass: 'Password@123' },
      'ait_student2': { email: 'student2@ait.edu', pass: 'Password@123' },
      'svce_student1': { email: 'student1@svce.edu', pass: 'Password@123' },
      'mau_student1': { email: 'student1@mau.edu', pass: 'Password@123' }
    };

    const creds = credentialsMap[roleKey];
    if (creds) {
      await this.login(creds.email, creds.pass);
    }
  },

  openForgotPassword() {
    App.showModal(`
      <div class="modal-header">
        <h3>Reset Account Password</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-secondary" style="font-size: 0.88rem; margin-bottom: 1.25rem;">
          Enter your institutional email address and we will generate a secure reset link.
        </p>
        <form onsubmit="Auth.submitForgotPassword(event)">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="forgot-email" required placeholder="user@university.edu" />
          </div>
          <div class="flex justify-end gap-2" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Send Reset Link</button>
          </div>
        </form>
      </div>
    `);
  },

  async submitForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    try {
      await API.post('/api/auth/forgot-password', { email });
      API.toast('Password reset link has been dispatched to your email.', 'success');
      App.closeModal();
    } catch (err) {
      API.toast(err.message || 'Failed to request reset link', 'error');
    }
  },

  togglePasswordVisibility() {
    const input = document.getElementById('login-pass');
    const icon = document.getElementById('pass-visibility-icon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.className = 'fi fi-rr-eye-crossed';
    } else {
      input.type = 'password';
      if (icon) icon.className = 'fi fi-rr-eye';
    }
  },

  async quickSSOLogin(provider) {
    if (provider === 'google') {
      document.getElementById('login-email').value = 'superadmin@platform.edu';
      document.getElementById('login-pass').value = 'Password@123';
      API.toast('Connecting via Google SSO (Super Admin)...', 'info');
      await this.login('superadmin@platform.edu', 'Password@123');
    } else if (provider === 'apple') {
      document.getElementById('login-email').value = 'admin_demo@college.edu';
      document.getElementById('login-pass').value = 'Password@123';
      API.toast('Connecting via Apple ID (College Admin)...', 'info');
      await this.login('admin_demo@college.edu', 'Password@123');
    } else if (provider === 'microsoft') {
      document.getElementById('login-email').value = 'student_demo@platform.edu';
      document.getElementById('login-pass').value = 'Password@123';
      API.toast('Connecting via Microsoft Account (Student Portal)...', 'info');
      await this.login('student_demo@platform.edu', 'Password@123');
    }
  },

  setOrbitSlide(index) {
    const slides = [
      {
        headline: 'Train & Deploy <span class="highlight-blue">Everywhere</span>',
        desc: 'Compatible with <b>PyTorch</b>, <b>TensorRT</b>, <b>Hugging Face</b>, <b>LangChain</b> and <b>Docker</b> for advanced AI development.'
      },
      {
        headline: 'Generative AI & LLMs <span class="highlight-blue">Everywhere</span>',
        desc: 'Powered by <b>LlamaIndex</b>, <b>JAX</b>, <b>Scikit-learn</b>, and <b>Statsmodels</b> for cutting-edge machine learning.'
      },
      {
        headline: 'Edge Robotics <span class="highlight-blue">Everywhere</span>',
        desc: 'Equipped with <b>MediaPipe</b>, <b>NVIDIA JetBot Simulation</b>, and real-time computer vision inference.'
      }
    ];

    const slide = slides[index] || slides[0];
    const headlineEl = document.getElementById('orbit-headline-text');
    const descEl = document.getElementById('orbit-desc-text');
    if (headlineEl) headlineEl.innerHTML = slide.headline;
    if (descEl) descEl.innerHTML = slide.desc;

    document.querySelectorAll('.orbit-carousel-bars span').forEach((bar, i) => {
      if (i === index) {
        bar.className = 'carousel-bar-pill';
      } else {
        bar.className = 'carousel-dot-pill';
      }
    });
  },

  logout() {
    API.setToken(null);
    this.currentUser = null;
    sessionStorage.removeItem('platform_user');
    sessionStorage.removeItem('platform_current_route');
    sessionStorage.removeItem('college_admin_course_wizard_state');
    try {
      localStorage.removeItem('platform_user');
      localStorage.removeItem('platform_current_route');
      localStorage.removeItem('platform_access_token');
      localStorage.removeItem('platform_token');
    } catch(e) {}
    API.toast('You have been logged out.', 'info');
    App.showLoginView();
  }
};
