/**
 * Student Portal Controller
 */
const Student = {
  async renderDashboard() {
    const container = document.getElementById('student-content');
    if (!container) return;

    const user = Auth.getUser();

    container.innerHTML = `
      <div class="card" style="margin-bottom: 1.75rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%); border-color: rgba(99, 102, 241, 0.3);">
        <div class="flex items-center justify-between">
          <div>
            <h2 style="font-size: 1.6rem;">Welcome back, <span class="gradient-text">${user ? user.first_name : 'Student'}</span>! 🚀</h2>
            <p class="text-secondary" style="margin-top: 4px;">
              ${user ? user.college_name : 'Your College'} • Department of ${user ? (user.department || 'Engineering') : ''}
            </p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('available-courses')">
            Explore Available Courses →
          </button>
        </div>
      </div>

      <div id="student-stats-grid" class="stats-grid">
        <div class="card" style="padding: 2rem; text-align: center;">Loading dashboard...</div>
      </div>

      <div class="grid grid-cols-2 gap-6" style="margin-bottom: 1.75rem;">
        <!-- Continue Learning -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Continue Learning</h3>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('my-courses')">View All</button>
          </div>
          <div id="student-continue-learning-list">
            <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading active courses...</div>
          </div>
        </div>

        <!-- Upcoming / Available Assessments -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Upcoming Assessments</h3>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('assessments')">Exam Center</button>
          </div>
          <div id="student-assessments-list">
            <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading assessments...</div>
          </div>
        </div>
      </div>

      <!-- Recent Notifications / Activity -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Activity & Announcements</h3>
        </div>
        <div id="student-activity-list">
          <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading activity...</div>
        </div>
      </div>
    `;

    try {
      const data = await API.get('/api/reports/student-dashboard');
      const s = data.stats;

      // Stats
      document.getElementById('student-stats-grid').innerHTML = `
        <div class="stat-card stat-sky">
          <div>
            <div class="stat-label">Total Enrolled</div>
            <div class="stat-value">${s.total_courses}</div>
            <div class="stat-trend">Active Training Programs</div>
          </div>
          <div class="stat-icon-wrapper"><i class="fi fi-rr-book-alt"></i></div>
        </div>
        <div class="stat-card stat-primary">
          <div>
            <div class="stat-label">In Progress</div>
            <div class="stat-value">${s.in_progress}</div>
            <div class="stat-trend">Ongoing Learning</div>
          </div>
          <div class="stat-icon-wrapper"><i class="fi fi-rr-play-alt"></i></div>
        </div>
        <div class="stat-card stat-emerald">
          <div>
            <div class="stat-label">Completed</div>
            <div class="stat-value">${s.completed}</div>
            <div class="stat-trend">100% Finished</div>
          </div>
          <div class="stat-icon-wrapper"><i class="fi fi-rr-check-circle"></i></div>
        </div>
        <div class="stat-card stat-amber">
          <div>
            <div class="stat-label">Certificates</div>
            <div class="stat-value">${s.certificates}</div>
            <div class="stat-trend">Verified Credentials</div>
          </div>
          <div class="stat-icon-wrapper"><i class="fi fi-rr-award"></i></div>
        </div>
      `;

      // Continue Learning
      const active = data.continue_learning;
      if (active && active.length > 0) {
        document.getElementById('student-continue-learning-list').innerHTML = active.map(c => `
          <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 0.75rem; background: var(--bg-tertiary);">
            <div class="flex items-center justify-between" style="margin-bottom: 0.5rem;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">${c.course_title}</div>
                <div class="text-muted" style="font-size: 0.75rem;">${c.course_code} • ${c.duration}</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Player.openPlayer(${c.course_id})">
                ${c.status === 'completed' ? 'Review Lessons' : 'Resume Course →'}
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div class="progress-bar-container" style="flex: 1;">
                <div class="progress-bar-fill ${c.status === 'completed' ? 'success' : ''}" style="width: ${c.progress_percentage}%;"></div>
              </div>
              <span class="font-mono text-muted" style="font-size: 0.75rem; width: 45px; text-align: right;">${Math.round(c.progress_percentage)}%</span>
            </div>
          </div>
        `).join('');
      } else {
        document.getElementById('student-continue-learning-list').innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <p class="text-secondary" style="margin-bottom: 1rem;">You are not currently enrolled in any courses.</p>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('available-courses')">Browse Courses</button>
          </div>
        `;
      }

      // Assessments
      const assessList = data.upcoming_assessments;
      if (assessList && assessList.length > 0) {
        document.getElementById('student-assessments-list').innerHTML = assessList.map(a => `
          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; font-size: 0.88rem;">${a.title}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${a.course_title} • ${a.time_limit_minutes} Mins</div>
            </div>
            <div>
              ${a.latest_passed === 1 ? `
                <span class="badge badge-success">Passed ✓</span>
              ` : `
                <button class="btn btn-outline btn-sm" onclick="AssessmentRunner.startExam(${a.id})">Take Assessment</button>
              `}
            </div>
          </div>
        `).join('');
      } else {
        document.getElementById('student-assessments-list').innerHTML = '<div class="text-muted p-4 text-center">No assessments scheduled.</div>';
      }

      // Recent Activity
      const activity = data.recent_activity;
      if (activity && activity.length > 0) {
        document.getElementById('student-activity-list').innerHTML = activity.map(n => `
          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">${n.title}</div>
              <div class="text-secondary" style="font-size: 0.78rem;">${n.message}</div>
            </div>
            <span class="text-muted font-mono" style="font-size: 0.72rem;">${n.created_at ? n.created_at.split(' ')[0] : ''}</span>
          </div>
        `).join('');
      } else {
        document.getElementById('student-activity-list').innerHTML = '<div class="text-muted p-4 text-center">No notifications yet.</div>';
      }

    } catch (e) {
      console.error(e);
    }
  },

  async renderAvailableCourses() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Available Courses Catalog</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Explore published training courses tailored for your college</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
        <div class="flex items-center gap-4">
          <input type="text" id="course-search-input" class="form-input" placeholder="Search by title, technology, or category..." oninput="Student.filterCourses()" />
          <select id="course-cat-filter" class="form-select" style="width: 220px;" onchange="Student.filterCourses()">
            <option value="">All Categories</option>
            <option value="Artificial Intelligence & Robotics">AI & Robotics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Cloud Computing">Cloud Computing</option>
          </select>
        </div>
      </div>

      <div id="student-courses-grid" class="course-grid">
        <div style="padding: 2rem; text-align: center;" class="text-muted">Loading courses catalog...</div>
      </div>
    `;

    this.loadCoursesCatalog();
  },

  async loadCoursesCatalog(search = '', category = '') {
    const courses = await API.get('/api/courses', { search, category });
    const enrollments = await API.get('/api/enrollments');
    const enrolledMap = {};
    enrollments.forEach(e => {
      enrolledMap[e.course_id] = e;
    });

    const grid = document.getElementById('student-courses-grid');
    if (!grid) return;

    grid.innerHTML = courses.map(c => {
      const enrollment = enrolledMap[c.id];
      const isEnrolled = !!enrollment;

      return `
        <div class="course-card">
          <div class="course-thumbnail-wrapper">
            <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" class="course-thumbnail" />
            <span class="badge badge-primary course-card-badge">${c.category || 'Engineering'}</span>
            <span class="course-card-level">${c.level || 'Intermediate'}</span>
          </div>
          <div class="course-card-body">
            <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
              <span class="course-card-code font-mono">${c.code}</span>
              <span class="badge badge-secondary font-mono" style="font-size: 0.68rem;"><i class="fi fi-rr-users-alt"></i> ${c.batch || 'All Batches'}</span>
            </div>
            <h3 class="course-card-title">${c.title}</h3>
            <p class="course-card-desc">${c.description || 'Comprehensive training, live Python coding, and practical assessments.'}</p>
            <div class="course-card-meta">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 20px; height: 20px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800;"><i class="fi fi-rr-check" style="font-size: 0.65rem;"></i></span>
                ${(c.trainer_name && c.trainer_name !== 'Not Assigned') ? c.trainer_name : (c.instructor_name || 'Faculty Trainer')}
              </span>
              <span><i class="fi fi-rr-clock" style="margin-right: 3px;"></i> ${c.duration || '6 Weeks'}</span>
            </div>
            <div style="margin-top: 1.15rem;">
              ${isEnrolled ? `
                <button class="btn btn-secondary btn-pill" style="width: 100%; font-weight: 700;" onclick="Player.openPlayer(${c.id})">
                  ${enrollment.status === 'completed' ? 'Completed (Review Course) <i class="fi fi-rr-check"></i>' : `Resume Learning (${Math.round(enrollment.progress_percentage)}%) →`}
                </button>
              ` : `
                <button class="btn btn-primary btn-pill" style="width: 100%; font-weight: 700;" onclick="Student.enrollInCourse(${c.id}, '${c.title.replace(/'/g, "\\'")}')">
                  Register for Course →
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('') || '<div class="text-muted p-4 text-center" style="grid-column: 1/-1;">No courses available right now.</div>';
  },

  filterCourses() {
    const search = document.getElementById('course-search-input').value;
    const cat = document.getElementById('course-cat-filter').value;
    this.loadCoursesCatalog(search, cat);
  },

  async enrollInCourse(courseId, title) {
    try {
      const res = await API.post('/api/enrollments/register', { course_id: courseId });
      API.toast(`Registered in '${title}'!`, 'success');
      this.loadCoursesCatalog();
    } catch (err) {
      console.error(err);
    }
  },

  async openRegistrationModal(courseId) {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      const c = data.course;
      const modules = data.modules || [];
      const totalLessons = modules.reduce((acc, m) => acc + (m.contents ? m.contents.length : 0), 0);

      // Check if student is already enrolled
      const enrollments = await API.get('/api/enrollments');
      const existing = (enrollments || []).find(e => e.course_id === c.id);

      App.showModal(`
        <div class="modal-header">
          <div>
            <h3>Course Registration</h3>
            <span class="badge badge-primary font-mono">${c.code}</span>
            <span class="badge badge-secondary font-mono" style="margin-left: 4px;"><i class="fi fi-rr-users-alt"></i> Batch: ${c.batch || 'All Batches'}</span>
          </div>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div class="card" style="padding: 1.25rem; display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.25rem;">
            <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 130px; height: 90px; border-radius: 8px; object-fit: cover;" />
            <div>
              <h4 style="font-size: 1.15rem; margin-bottom: 0.35rem; font-weight: 800; color: var(--text-primary);">${c.title}</h4>
              <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 0.4rem;">${c.description || 'Comprehensive training and hands-on curriculum.'}</p>
              <div class="flex items-center gap-3 text-muted" style="font-size: 0.8rem;">
                <span><strong>Category:</strong> ${c.category}</span>
                <span>•</span>
                <span><strong>Duration:</strong> ${c.duration || '6 Weeks'}</span>
                <span>•</span>
                <span><strong>Structure:</strong> ${modules.length} Modules (${totalLessons} Lessons)</span>
              </div>
            </div>
          </div>

          ${existing ? `
            <div style="background: var(--accent-emerald-bg); border: 1px solid var(--accent-emerald); border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1rem;">
              <div style="font-weight: 700; color: var(--accent-emerald); font-size: 0.95rem; margin-bottom: 0.25rem;">
                ✓ You are already enrolled in this course!
              </div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                Current progress: ${Math.round(existing.progress_percentage || 0)}%
              </p>
              <button class="btn btn-primary" onclick="App.closeModal(); Player.openPlayer(${c.id})">
                Open Learning Player →
              </button>
            </div>
          ` : `
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem;">
              Register for <strong>${c.title}</strong> to access interactive video lectures, cloud coding sandboxes, AI robotics modules, and earn a verifiable cryptographic certificate upon completion.
            </p>
          `}
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Close</button>
          ${!existing ? `
            <button type="button" class="btn btn-primary" onclick="Student.confirmDirectRegistration(${c.id}, '${c.title.replace(/'/g, "\\'")}')" style="gap: 6px; font-weight: 700;">
              <i class="fi fi-rr-check"></i> Register for Course Now
            </button>
          ` : ''}
        </div>
      `, 'modal-md');
    } catch (e) {
      console.error(e);
      API.toast('Course not available for registration', 'error');
    }
  },

  async confirmDirectRegistration(courseId, title) {
    try {
      await API.post('/api/enrollments/register', { course_id: courseId });
      API.toast(`Successfully registered for '${title}'!`, 'success');
      App.closeModal();
      this.renderMyCourses();
      Player.openPlayer(courseId);
    } catch (err) {
      console.error(err);
      API.toast('Registration failed: ' + (err.message || err), 'error');
    }
  },

  async renderMyCourses() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>My Enrolled Courses</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Access your registered training programs, lesson materials, and certificates</p>
        </div>
      </div>
      <div id="student-my-courses-grid" class="course-grid">
        <div style="padding: 2rem; text-align: center;">Loading your courses...</div>
      </div>
    `;

    const enrollments = await API.get('/api/enrollments');
    const grid = document.getElementById('student-my-courses-grid');

    if (!enrollments || enrollments.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; padding: 3rem; text-align: center;">
          <h3>No Enrolled Courses Yet</h3>
          <p class="text-secondary" style="margin: 0.5rem 0 1.5rem;">You have not registered for any courses in your college yet.</p>
          <button class="btn btn-primary" onclick="App.navigate('available-courses')">Browse Available Courses</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = enrollments.map(e => `
      <div class="course-card">
        <div class="course-thumbnail-wrapper">
          <img src="${e.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" class="course-thumbnail" />
          <span class="badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'} course-card-badge">
            ${e.status}
          </span>
          <span class="course-card-level">${e.duration}</span>
        </div>
        <div class="course-card-body">
          <div class="course-card-code">${e.course_code}</div>
          <h3 class="course-card-title">${e.course_title}</h3>
          <div style="margin: 0.75rem 0;">
            <div class="flex justify-between" style="font-size: 0.75rem; margin-bottom: 4px;">
              <span class="text-muted">Course Progress</span>
              <span class="font-mono" style="font-weight: 700;">${Math.round(e.progress_percentage)}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${e.status === 'completed' ? 'success' : ''}" style="width: ${e.progress_percentage}%;"></div>
            </div>
          </div>
          <div class="flex items-center gap-2" style="margin-top: auto;">
            <button class="btn btn-primary" style="flex: 1;" onclick="Player.openPlayer(${e.course_id})">
              ${e.status === 'completed' ? 'Open Player' : 'Resume Learning →'}
            </button>
            ${e.certificate_code ? `
              <button class="btn btn-outline" onclick="CertificateViewer.openCertificate(${e.certificate_id})" title="View Certificate">
                <i class="fi fi-rr-award"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  async renderAssessmentsView() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Assessments & Examination Hub</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Take course evaluations, automated coding challenges, and view your performance</p>
        </div>
      </div>

      <div class="card">
        <div id="student-exams-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading assessments...</div>
        </div>
      </div>
    `;

    const assessments = await API.get('/api/assessments');
    const rows = assessments.map(a => {
      const isPassed = a.status === 'Passed';
      const isFailed = a.status === 'Failed';

      return `
        <tr>
          <td>
            <div style="font-weight: 700;">${a.title}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${a.course_title} (${a.course_code})</div>
          </td>
          <td><span class="badge badge-purple font-mono">${a.assessment_type}</span></td>
          <td><i class="fi fi-rr-clock"></i> ${a.time_limit_minutes} mins</td>
          <td><span class="badge badge-info">Pass: ${a.passing_percentage}%</span></td>
          <td>
            <span class="badge ${isPassed ? 'badge-success' : (isFailed ? 'badge-danger' : 'badge-warning')}">
              ${a.status}
            </span>
          </td>
          <td>
            <button class="btn ${isPassed ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="AssessmentRunner.startExam(${a.id})">
              ${isPassed ? 'Retake Exam' : (a.has_attempted ? 'Try Again' : 'Start Exam →')}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('student-exams-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Assessment Title</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Passing Criteria</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No assessments found for your enrolled courses</td></tr>'}</tbody>
      </table>
    `;
  },

  async renderCertificatesView() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Earned Certificates of Completion</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Official verifiable credentials with QR codes and digital signatures</p>
        </div>
      </div>

      <div id="student-certs-grid" class="grid grid-cols-2 gap-6">
        <div style="padding: 2rem; text-align: center;">Loading certificates...</div>
      </div>
    `;

    const certs = await API.get('/api/certificates');
    const grid = document.getElementById('student-certs-grid');

    if (!certs || certs.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; padding: 3rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem; color: var(--accent-amber);"><i class="fi fi-rr-award"></i></div>
          <h3>No Certificates Earned Yet</h3>
          <p class="text-secondary" style="margin: 0.5rem 0 1.5rem;">Complete 100% of your course modules and pass the assessments to receive official certificates.</p>
          <button class="btn btn-primary" onclick="App.navigate('my-courses')">Go to My Courses</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = certs.map(c => `
      <div class="card" style="border-color: rgba(245, 158, 11, 0.4); background: linear-gradient(145deg, #182035, #111728);">
        <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
          <span class="badge badge-amber font-mono">${c.certificate_code}</span>
          <span class="text-muted" style="font-size: 0.75rem;">Issued: ${c.issue_date}</span>
        </div>
        <h3 style="margin-bottom: 0.5rem;">${c.course_title}</h3>
        <p class="text-secondary" style="font-size: 0.82rem; margin-bottom: 1.25rem;">${c.college_name}</p>
        <div class="flex items-center gap-2">
          <button class="btn btn-primary btn-sm" onclick="CertificateViewer.openCertificate(${c.id})">
            <i class="fi fi-rr-print"></i> View & Print Certificate
          </button>
          <button class="btn btn-outline btn-sm" onclick="CertificateViewer.openVerifier('${c.certificate_code}')">
            <i class="fi fi-rr-search"></i> Verify QR / ID
          </button>
        </div>
      </div>
    `).join('');
  },

  async renderAssignmentsView() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Practical Assignments & Lab Deliverables</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Submit your source code, JetBot model weights, and Jupyter notebooks</p>
        </div>
      </div>
      <div class="card">
        <div id="student-assignments-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading assignments...</div>
        </div>
      </div>
    `;

    const data = await API.get('/api/assignments');
    const rows = (data || []).map(a => `
      <tr>
        <td>
          <div style="font-weight: 700;">${a.title}</div>
          <div class="text-secondary" style="font-size: 0.8rem;">${a.description || 'Hands-on practical assignment'}</div>
        </td>
        <td><strong>${a.course_title}</strong></td>
        <td><span class="badge badge-purple">${a.max_points} Points</span></td>
        <td><span class="badge ${a.submission_status === 'submitted' ? 'badge-success' : 'badge-warning'}">${a.submission_status || 'Pending'}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="Student.openSubmitAssignmentModal(${a.id}, '${a.title.replace(/'/g, "\\'")}')">
            ${a.submission_status === 'submitted' ? 'Resubmit' : '<i class="fi fi-rr-cloud-upload-alt"></i> Submit Assignment'}
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('student-assignments-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Course</th>
            <th>Max Points</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5" class="text-center">No assignments pending for your courses</td></tr>'}</tbody>
      </table>
    `;
  },

  openSubmitAssignmentModal(assignmentId, title) {
    App.showModal(`
      <div class="modal-header">
        <h3>Submit Assignment: ${title}</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Submission Content / Python Code / Solution URL</label>
          <textarea id="assign-submission-text" class="form-textarea" style="min-height: 140px;" placeholder="Paste your solution code, GitHub repo link, or brief description..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Upload Dataset / Model Weights / Notebook (.ipynb, .pth, .py, .pdf)</label>
          <input type="file" id="assign-file-input" class="form-input" />
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="Student.executeSubmitAssignment(${assignmentId})">Submit Assignment ✓</button>
      </div>
    `);
  },

  async executeSubmitAssignment(assignmentId) {
    const text = document.getElementById('assign-submission-text').value.trim();
    const fileInput = document.getElementById('assign-file-input');

    let fileUrl = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await API.upload('/api/files/upload', formData);
        fileUrl = uploadRes.file_url;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await API.post(`/api/assignments/${assignmentId}/submit`, {
        submission_text: text,
        file_url: fileUrl
      });
      API.toast('Assignment submitted successfully!', 'success');
      App.closeModal();
      this.renderAssignmentsView();
    } catch (err) {
      console.error(err);
    }
  },

  async renderResultsView() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>My Performance & Evaluation Transcript</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Official score breakdown, attempt history, and instructor rubric feedback</p>
        </div>
      </div>
      <div class="card">
        <div id="student-results-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading examination results...</div>
        </div>
      </div>
    `;

    const results = await API.get('/api/results/my-results');
    const rows = (results || []).map(r => `
      <tr>
        <td>
          <div style="font-weight: 700;">${r.assessment_title}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${r.course_title}</div>
        </td>
        <td>Attempt #${r.attempt_number}</td>
        <td><span class="font-mono font-bold">${r.score} / ${r.max_score}</span></td>
        <td><span class="font-mono font-bold ${r.passed ? 'text-success' : 'text-danger'}">${r.percentage}%</span></td>
        <td>
          <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
            ${r.passed ? 'PASSED' : 'FAILED'}
          </span>
        </td>
        <td><span class="text-secondary" style="font-size: 0.8rem;">${r.feedback || 'Automated evaluation completed'}</span></td>
      </tr>
    `).join('');

    document.getElementById('student-results-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Attempt</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Verdict</th>
            <th>Rubric Feedback</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No examination attempts on record</td></tr>'}</tbody>
      </table>
    `;
  },

  async renderNotificationsView() {
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Campus & Course Notifications</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Updates regarding enrolled courses, published assessments, and grades</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="App.markAllNotificationsRead(); Student.renderNotificationsView();">
          Mark All as Read
        </button>
      </div>

      <div class="card" id="student-notifs-list" style="padding: 0;">
        <div style="padding: 2rem; text-align: center;">Loading notifications...</div>
      </div>
    `;

    const data = await API.get('/api/notifications');
    const items = (data.notifications || []).map(n => `
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); background: ${n.is_read ? 'transparent' : 'var(--primary-light)'};">
        <div class="flex items-center justify-between" style="margin-bottom: 4px;">
          <div style="font-weight: 700; font-size: 0.92rem;">${n.title}</div>
          <span class="font-mono text-muted" style="font-size: 0.72rem;">${n.created_at}</span>
        </div>
        <p class="text-secondary" style="font-size: 0.85rem;">${n.message}</p>
      </div>
    `).join('');

    document.getElementById('student-notifs-list').innerHTML = items || '<div class="p-4 text-center text-muted">No notifications received.</div>';
  },

  renderProfileView() {
    const user = Auth.getUser();
    const container = document.getElementById('student-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Student Academic Profile</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Your institutional registration and credentials</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="card">
          <h3 style="margin-bottom: 1.25rem;">Academic Details</h3>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" value="${user ? `${user.first_name} ${user.last_name}` : ''}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Institutional Email</label>
            <input type="text" class="form-input" value="${user ? user.email : ''}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Enrolled University / College</label>
            <input type="text" class="form-input" value="${user ? user.college_name : ''}" readonly />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input type="text" class="form-input font-mono" value="${user ? (user.roll_number || 'N/A') : ''}" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <input type="text" class="form-input" value="${user ? (user.department || 'Engineering') : ''}" readonly />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom: 1.25rem;">Security & Password</h3>
          <form onsubmit="event.preventDefault(); Student.updatePassword();">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" id="profile-old-pass" class="form-input" required value="Password@123" />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" id="profile-new-pass" class="form-input" required placeholder="Min 8 characters" />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Update Password
            </button>
          </form>
        </div>
      </div>
    `;
  },

  async updatePassword() {
    const oldPass = document.getElementById('profile-old-pass').value;
    const newPass = document.getElementById('profile-new-pass').value;
    try {
      await API.post('/api/auth/change-password', { old_password: oldPass, new_password: newPass });
      API.toast('Password changed successfully!', 'success');
    } catch (err) {
      console.error(err);
    }
  }
};