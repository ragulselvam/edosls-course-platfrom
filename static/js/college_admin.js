/**
 * College Admin Portal Controller - Student Management, View-Only Curriculum, and Assessments
 */
const CollegeAdmin = {
  async renderDashboard() {
    const container = document.getElementById('college-admin-content');
    if (!container) return;

    const user = Auth.getUser() || {};
    const collegeName = user.college_name || 'Campus Portal';

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.75rem;">
        <div>
          <h2>${collegeName} • Campus Dashboard</h2>
          <p class="text-secondary" style="font-size: 0.85rem; margin-top: 4px;">Institutional student enrollments, academic progress, and assessment performance</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" onclick="CollegeAdmin.openBulkImportModal()">Bulk Import</button>
          <button class="btn btn-primary" onclick="CollegeAdmin.openAddStudentModal()">+ Add Student</button>
        </div>
      </div>

      <div id="ca-stats-grid" class="stats-grid">
        <div class="card" style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading campus metrics...</div>
      </div>

      <div class="grid grid-cols-2 gap-6" style="margin-bottom: 1.75rem;">
        <!-- Course Progress & Popularity -->
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <div>
              <h3 class="card-title">Curriculum & Student Progress</h3>
              <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Enrolled students and average completion per course</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('courses')">View Courses</button>
          </div>
          <div id="ca-course-progress-container" style="padding: 1.25rem;">
            <div class="text-muted text-center p-4">Loading curriculum analytics...</div>
          </div>
        </div>

        <!-- Assessment Performance & Pass Rate -->
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <div>
              <h3 class="card-title">Assessment & Exam Scores</h3>
              <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Average score and pass rates across examinations</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('assessments')">View Exams</button>
          </div>
          <div id="ca-assessment-chart-container" style="padding: 1.25rem;">
            <div class="text-muted text-center p-4">Loading assessment analytics...</div>
          </div>
        </div>
      </div>

      <!-- Recent Students Registered -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <div>
            <h3 class="card-title">Recent Student Registrations</h3>
            <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Latest students enrolled in this college</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('students')">View All Students</button>
        </div>
        <div id="ca-recent-students-table" class="table-container">
          <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading students...</div>
        </div>
      </div>
    `;

    try {
      const data = await API.get('/api/reports/college-admin-dashboard');
      const m = data.metrics || {};

      // Render Stat Cards
      const statsGrid = document.getElementById('ca-stats-grid');
      if (statsGrid) {
        statsGrid.innerHTML = `
          <div class="stat-card stat-primary">
            <div>
              <div class="stat-label">Total Students</div>
              <div class="stat-value">${m.total_students || 0}</div>
              <div class="stat-trend">${m.active_students || 0} Active Accounts</div>
            </div>
            <div class="stat-icon-wrapper"><i class="fi fi-rr-users"></i></div>
          </div>
          <div class="stat-card stat-emerald">
            <div>
              <div class="stat-label">Active Courses</div>
              <div class="stat-value">${m.total_courses || 0}</div>
              <div class="stat-trend">${m.published_courses || 0} Published & Live</div>
            </div>
            <div class="stat-icon-wrapper"><i class="fi fi-rr-book-alt"></i></div>
          </div>
          <div class="stat-card stat-sky">
            <div>
              <div class="stat-label">Total Enrollments</div>
              <div class="stat-value">${m.total_enrollments || 0}</div>
              <div class="stat-trend">${m.completed_enrollments || 0} Completed (${m.completion_rate || 0}%)</div>
            </div>
            <div class="stat-icon-wrapper"><i class="fi fi-rr-user-check"></i></div>
          </div>
          <div class="stat-card stat-amber">
            <div>
              <div class="stat-label">Exam Pass Rate</div>
              <div class="stat-value">${m.pass_rate || 0}%</div>
              <div class="stat-trend">${m.total_certificates || 0} Issued Certificates</div>
            </div>
            <div class="stat-icon-wrapper"><i class="fi fi-rr-award"></i></div>
          </div>
        `;
      }

      // Course Progress Container
      const courseContainer = document.getElementById('ca-course-progress-container');
      if (courseContainer) {
        const courses = data.course_enrollment_chart || [];
        if (courses.length > 0) {
          const courseHtml = courses.map(c => {
            const avg = Math.round(c.avg_progress || 0);
            return `
              <div style="margin-bottom: 1rem;">
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.85rem;">
                  <span style="font-weight: 600;">${c.title}</span>
                  <span class="text-muted font-mono">${c.enrollments_count || 0} Enrolled • ${avg}% avg</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${avg}%;"></div>
                </div>
              </div>
            `;
          }).join('');
          courseContainer.innerHTML = courseHtml;
        } else {
          courseContainer.innerHTML = '<div class="text-muted p-4 text-center">No active course enrollments yet.</div>';
        }
      }

      // Assessment Performance
      const assessContainer = document.getElementById('ca-assessment-chart-container');
      if (assessContainer) {
        const assessments = data.assessment_chart || [];
        if (assessments.length > 0) {
          const assessHtml = assessments.map(a => {
            const pass = Math.round(a.pass_rate || 0);
            const avgScore = Math.round(a.avg_score || 0);
            return `
              <div style="margin-bottom: 1rem;">
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.85rem;">
                  <span style="font-weight: 600;">${a.title}</span>
                  <span class="text-muted font-mono">${a.submissions_count || 0} Taken • ${pass}% Pass (${avgScore}% Avg)</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill ${pass >= 60 ? 'success' : ''}" style="width: ${pass}%;"></div>
                </div>
              </div>
            `;
          }).join('');
          assessContainer.innerHTML = assessHtml;
        } else {
          assessContainer.innerHTML = '<div class="text-muted p-4 text-center">No assessments completed yet.</div>';
        }
      }

      // Recent Registrations Table
      const regTable = document.getElementById('ca-recent-students-table');
      if (regTable) {
        const regs = data.recent_registrations || [];
        const regRows = regs.map(s => `
          <tr>
            <td>
              <div style="font-weight: 700;">${s.first_name} ${s.last_name}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${s.email}</div>
            </td>
            <td><span class="badge badge-primary font-mono">${s.roll_number}</span></td>
            <td>${s.department}</td>
            <td>Year ${s.year_of_study}</td>
            <td class="font-mono text-muted" style="font-size: 0.75rem;">${s.created_at ? s.created_at.split(' ')[0] : ''}</td>
          </tr>
        `).join('');

        regTable.innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Year</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>${regRows || '<tr><td colspan="5" class="text-center">No students registered yet</td></tr>'}</tbody>
          </table>
        `;
      }
    } catch (e) {
      console.error('Failed to load college admin dashboard metrics:', e);
    }
  },

  async renderStudentsView() {
    const container = document.getElementById('college-admin-content');
    
    // Fetch courses for dropdown
    const courses = await API.get('/api/courses');
    this.cachedCollegeCourses = courses || [];
    this.selectedCollegeCourseId = '';

    container.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 4px;">Student Management Directory</h2>
        <p class="text-secondary" style="font-size: 0.85rem;">Enrolled college students, academic profiles, course progress, and accounts</p>
      </div>
      
      <!-- Filter Toolbar Matching Reference Design -->
      <div class="filter-toolbar-row">
        
        <!-- Choose Course Pill Dropdown -->
        <div class="pill-filter-group" style="position: relative;">
          <span class="pill-filter-label">Choose course:</span>
          
          <button type="button" id="ca-course-pill-trigger" class="pill-dropdown-trigger" onclick="CollegeAdmin.toggleCourseDropdownMenu(event)">
            <span class="pill-dropdown-icon">
              <img src="/static/img/logo.png" alt="Course" style="width: 18px; height: 18px; border-radius: 4px; object-fit: cover;" />
            </span>
            <span id="ca-course-pill-label" style="font-weight: 600;">All Courses</span>
            <span class="pill-dropdown-arrow">▾</span>
          </button>

          <!-- Floating Pill Dropdown Menu -->
          <div id="ca-course-pill-menu" class="pill-dropdown-menu" style="display: none;" onclick="event.stopPropagation()">
            <div style="padding: 4px 8px 6px; border-bottom: 1px solid var(--border-color); margin-bottom: 4px;">
              <input type="text" id="ca-course-search-filter" class="form-input" placeholder="Search course..." style="font-size: 0.78rem; padding: 4px 8px; height: 28px; border-radius: 6px;" oninput="CollegeAdmin.filterCourseDropdownList(this.value)" />
            </div>
            
            <button type="button" class="pill-dropdown-item selected" data-id="" onclick="CollegeAdmin.selectCourseFilter('', 'All Courses', '')">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.9rem;">⚡</span>
                <div>
                  <div style="font-weight: 600;">All Courses</div>
                  <div class="text-muted" style="font-size: 0.72rem;">All Course IDs</div>
                </div>
              </div>
              <span class="badge badge-sm badge-primary">ALL</span>
            </button>

            <div id="ca-course-dropdown-items">
              ${this.cachedCollegeCourses.map(c => `
                <button type="button" class="pill-dropdown-item" data-id="${c.id}" onclick="CollegeAdmin.selectCourseFilter('${c.id}', '${c.title.replace(/'/g, "\\'")}', '${c.code || ''}')">
                  <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                    <span class="badge badge-primary font-mono" style="font-size: 0.72rem; padding: 2px 6px;">ID: ${c.id}</span>
                    <div style="min-width: 0; text-align: left;">
                      <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.title}</div>
                      <div class="text-muted" style="font-size: 0.72rem;">${c.code || 'Course'}</div>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Department Filter -->
        <div class="pill-filter-group">
          <span class="pill-filter-label">Department:</span>
          <select id="student-dept-filter" class="pill-select-input" onchange="CollegeAdmin.filterStudents()">
            <option value="">All Departments</option>
            <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
            <option value="Robotics & Automation">Robotics & Automation</option>
            <option value="Computer Science & Engineering">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
          </select>
        </div>

        <!-- Search Input -->
    `;

    // Global document click listener for college admin dropdown
    if (!this._hasCollegePillDropdownListener) {
      document.addEventListener('click', (e) => {
        const trigger = document.getElementById('ca-course-pill-trigger');
        const menu = document.getElementById('ca-course-pill-menu');
        if (menu && trigger && !trigger.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
          trigger.classList.remove('active');
        }
      });
      this._hasCollegePillDropdownListener = true;
    }

    this.loadStudentsTable();
  },

  toggleCourseDropdownMenu(event) {
    event.stopPropagation();
    const trigger = document.getElementById('ca-course-pill-trigger');
    const menu = document.getElementById('ca-course-pill-menu');
    if (!menu || !trigger) return;

    const isOpen = menu.style.display === 'flex' || menu.style.display === 'block';
    if (isOpen) {
      menu.style.display = 'none';
      trigger.classList.remove('active');
    } else {
      menu.style.display = 'flex';
      trigger.classList.add('active');
      const search = document.getElementById('ca-course-search-filter');
      if (search) {
        search.value = '';
        this.filterCourseDropdownList('');
        setTimeout(() => search.focus(), 50);
      }
    }
  },

  filterCourseDropdownList(query) {
    const term = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('#ca-course-dropdown-items .pill-dropdown-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = (!term || text.includes(term)) ? 'flex' : 'none';
    });
  },

  selectCourseFilter(courseId, courseTitle, courseCode) {
    this.selectedCollegeCourseId = courseId || '';
    
    // Update trigger UI
    const label = document.getElementById('ca-course-pill-label');
    const trigger = document.getElementById('ca-course-pill-trigger');
    const menu = document.getElementById('ca-course-pill-menu');

    if (label) {
      label.textContent = courseId ? courseTitle : 'All Courses';
    }
    if (menu) {
      menu.style.display = 'none';
    }
    if (trigger) {
      trigger.classList.remove('active');
      if (courseId) {
        trigger.style.borderColor = 'var(--primary)';
        trigger.style.background = 'rgba(99, 102, 241, 0.08)';
      } else {
        trigger.style.borderColor = 'var(--border-color)';
        trigger.style.background = 'var(--bg-surface)';
      }
    }

    // Highlight selected item in menu
    const items = document.querySelectorAll('#ca-course-pill-menu .pill-dropdown-item');
    items.forEach(item => {
      const id = item.getAttribute('data-id');
      if (String(id) === String(courseId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this.filterStudents();
  },

  async loadStudentsTable(search = '', dept = '', courseId = '') {
    const params = {};
    if (search) params.search = search;
    if (dept) params.department = dept;
    if (courseId) params.course_id = courseId;

    const students = await API.get('/api/students', params);
    const rows = students.map(s => `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 0.95rem;">${s.first_name} ${s.last_name}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${s.email}</div>
        </td>
        <td><span class="badge badge-primary font-mono">${s.roll_number}</span></td>
        <td>${s.department}</td>
        <td>Year ${s.year_of_study} (${s.batch || '2024-2028'})</td>
        <td><span class="badge badge-purple">${s.enrolled_courses_count || 0} Courses</span></td>
        <td><span class="badge badge-amber">${s.certificates_count || 0} Certs</span></td>
        <td>
          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm" onclick="CollegeAdmin.viewStudentProfile(${s.student_id})">View Profile</button>
            <button class="btn btn-danger btn-sm" onclick="CollegeAdmin.deleteStudent(${s.student_id}, '${s.first_name} ${s.last_name}')">✕</button>
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('ca-students-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Roll Number</th>
            <th>Department</th>
            <th>Cohort</th>
            <th>Enrolled</th>
            <th>Certificates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7" class="text-center">No students found</td></tr>'}</tbody>
      </table>
    `;
  },

  filterStudents() {
    const search = document.getElementById('student-search-input') ? document.getElementById('student-search-input').value : '';
    const dept = document.getElementById('student-dept-filter') ? document.getElementById('student-dept-filter').value : '';
    const courseId = this.selectedCollegeCourseId || '';
    this.loadStudentsTable(search, dept, courseId);
  },

  resetStudentFilters() {
    this.selectedCollegeCourseId = '';
    const label = document.getElementById('ca-course-pill-label');
    const trigger = document.getElementById('ca-course-pill-trigger');
    const searchInput = document.getElementById('student-search-input');
    const deptFilter = document.getElementById('student-dept-filter');

    if (label) label.textContent = 'All Courses';
    if (trigger) {
      trigger.style.borderColor = 'var(--border-color)';
      trigger.style.background = 'var(--bg-surface)';
      trigger.classList.remove('active');
    }
    if (searchInput) searchInput.value = '';
    if (deptFilter) deptFilter.value = '';

    const items = document.querySelectorAll('#ca-course-pill-menu .pill-dropdown-item');
    items.forEach(item => {
      if (item.getAttribute('data-id') === '') {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this.loadStudentsTable();
  },

  openAddStudentModal() {
    App.showModal(`
      <div class="modal-header">
        <h3>Add New Student</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <form onsubmit="CollegeAdmin.handleAddStudent(event)">
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input type="text" class="form-input" name="first_name" required placeholder="Alex" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input type="text" class="form-input" name="last_name" required placeholder="Rivera" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Roll Number *</label>
              <input type="text" class="form-input font-mono" name="roll_number" required placeholder="e.g. AIT-2024-005" style="text-transform: uppercase;" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-input" name="email" required placeholder="student@college.edu" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <input type="text" class="form-input" name="department" required placeholder="e.g. AI & Robotics" />
            </div>
            <div class="form-group">
              <label class="form-label">Year of Study</label>
              <select class="form-select" name="year_of_study">
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Initial Password</label>
            <input type="password" class="form-input" name="password" value="Student@123" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Student</button>
        </div>
      </form>
    `);
  },

  async handleAddStudent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      roll_number: formData.get('roll_number'),
      email: formData.get('email'),
      department: formData.get('department'),
      year_of_study: parseInt(formData.get('year_of_study')),
      password: formData.get('password') || 'Student@123'
    };

    try {
      await API.post('/api/students', body);
      API.toast('Student added successfully!', 'success');
      App.closeModal();
      this.renderStudentsView();
    } catch (err) {
      console.error(err);
    }
  },

  openBulkImportModal() {
    App.showModal(`
      <div class="modal-header">
        <h3>Bulk Student Import</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          Paste CSV records below or use the default template. Format: <br>
          <code class="font-mono" style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">first_name, last_name, roll_number, email, department, year</code>
        </p>
        <textarea id="bulk-csv-input" class="form-textarea font-mono" style="height: 160px;" placeholder="David, Miller, CS-201, david@college.edu, Computer Science, 2
Sarah, Connor, CS-202, sarah@college.edu, AI & Robotics, 3
James, Holden, CS-203, james@college.edu, Autonomous Systems, 1"></textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="CollegeAdmin.handleBulkImport()">Import Students</button>
      </div>
    `);
  },

  async handleBulkImport() {
    const rawText = document.getElementById('bulk-csv-input').value.trim();
    if (!rawText) {
      API.toast('Please enter CSV data', 'warning');
      return;
    }

    const lines = rawText.split('\n');
    const students = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 4) {
        students.push({
          first_name: parts[0],
          last_name: parts[1] || 'Student',
          roll_number: parts[2],
          email: parts[3],
          department: parts[4] || 'Engineering',
          year_of_study: parseInt(parts[5]) || 1,
          password: 'Student@123'
        });
      }
    }

    if (students.length === 0) {
      API.toast('No valid records parsed from CSV', 'error');
      return;
    }

    try {
      const res = await API.post('/api/students/bulk-import', { students });
      API.toast(res.message, 'success');
      App.closeModal();
      this.renderStudentsView();
    } catch (err) {
      console.error(err);
    }
  },

  async viewStudentProfile(studentId) {
    const data = await API.get(`/api/students/${studentId}`);
    const s = data.student;

    const enrollRows = data.enrollments.map(e => `
      <tr>
        <td><strong>${e.course_title}</strong> (${e.course_code})</td>
        <td>
          <span class="badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}">${e.status}</span>
        </td>
        <td>${Math.round(e.progress_percentage)}%</td>
        <td>${e.certificate_code ? `<span class="badge badge-amber font-mono">${e.certificate_code}</span>` : '—'}</td>
      </tr>
    `).join('');

    App.showModal(`
      <div class="modal-header">
        <h3>Student Profile: ${s.first_name} ${s.last_name}</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.5rem;">
          <div><span class="text-muted">Roll Number:</span> <strong>${s.roll_number}</strong></div>
          <div><span class="text-muted">Email:</span> <strong>${s.email}</strong></div>
          <div><span class="text-muted">Department:</span> <strong>${s.department}</strong></div>
          <div><span class="text-muted">Year / Batch:</span> <strong>Year ${s.year_of_study} (${s.batch})</strong></div>
        </div>

        <h4 style="margin-bottom: 0.75rem;">Course Enrollments & Progress</h4>
        <div class="table-container" style="margin-bottom: 1rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>${enrollRows || '<tr><td colspan="4" class="text-center">Not enrolled in any courses</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  async deleteStudent(studentId, name) {
    App.showDangerConfirmModal({
      title: 'Are you sure?',
      warningBanner: "Unexpected bad things will happen if you don't read this!",
      itemName: name,
      itemType: 'student',
      description: `This action <strong>CANNOT</strong> be undone. This will permanently remove student account <strong>${name}</strong> and delete all enrollment history, test results, and attendance records.`,
      confirmButtonText: 'I understand, delete this student',
      onConfirm: async () => {
        await API.delete(`/api/students/${studentId}`);
        API.toast(`Student '${name}' removed.`, 'info');
        this.renderStudentsView();
      }
    });
  },

  // =========================================================================
  // COURSE CURRICULUM & CATALOG (VIEW-ONLY FOR COLLEGE ADMIN)
  // =========================================================================
  async renderCoursesView() {
    const container = document.getElementById('college-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Course Curriculum & Catalog</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Assigned institutional training programs, syllabus structure, and enrolled student metrics</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-primary" onclick="CollegeAdmin.openCreateCourseModal()">
            <i class="fi fi-rr-plus"></i> + Create Course
          </button>
        </div>
      </div>

      <div class="card">
        <div id="ca-courses-table" class="table-container">
          <div style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading courses...</div>
        </div>
      </div>
    `;

    try {
      const courses = await API.get('/api/courses');
      const rows = (courses || []).map(c => {
        const isAssigned = c.trainer_id || (c.trainer_name && c.trainer_name !== 'Not Assigned');
        const trainerDisplay = isAssigned ? `
          <div class="flex items-center gap-2">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;">
              ${(c.trainer_name || 'T').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${c.trainer_name}</div>
              <div class="text-muted" style="font-size: 0.72rem;">${c.trainer_email || 'Assigned Trainer'}</div>
            </div>
          </div>
        ` : `
          <span class="badge" style="background: rgba(148, 163, 184, 0.12); color: var(--text-muted); border: 1px dashed rgba(148, 163, 184, 0.4); font-size: 0.78rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fi fi-rr-user-slash" style="font-size: 0.72rem;"></i> Not Assigned
          </span>
        `;

        return `
          <tr>
            <td><span class="badge badge-primary font-mono">${c.code}</span></td>
            <td>
              <div class="flex items-center gap-3">
                <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 50px; height: 35px; border-radius: 4px; object-fit: cover;" />
                <div>
                  <div style="font-weight: 700;">${c.title}</div>
                  <div class="text-muted" style="font-size: 0.75rem;">${c.category} • ${c.duration || '6 Weeks'} • <span style="color: var(--primary); font-weight: 600;"><i class="fi fi-rr-users-alt" style="font-size: 0.7rem;"></i> ${c.batch || 'All Batches'}</span></div>
                </div>
              </div>
            </td>
            <td><span class="badge badge-purple">${c.module_count || 0} Modules (${c.content_count || 0} Lessons)</span></td>
            <td><span class="badge badge-info font-mono">${c.enrollment_count || 0} Students</span></td>
            <td>${trainerDisplay}</td>
            <td>
              <span class="badge ${c.is_published ? 'badge-success' : 'badge-warning'}">
                ${c.is_published ? 'Active & Published' : 'Draft'}
              </span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button class="btn btn-outline btn-sm" onclick="CollegeAdmin.viewCourseDetails(${c.id})">
                  <i class="fi fi-rr-eye"></i> View Syllabus
                </button>
                <button class="btn btn-primary btn-sm" onclick="App.openShareCourseModal(${c.id})" title="Share Registration Link to Students">
                  <i class="fi fi-rr-share"></i> Share Link
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      document.getElementById('ca-courses-table').innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course / Class</th>
              <th>Structure</th>
              <th>Students</th>
              <th>Trainer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" class="text-center">No courses assigned to your institution yet</td></tr>'}</tbody>
        </table>
      `;
    } catch (err) {
      console.error(err);
      document.getElementById('ca-courses-table').innerHTML = `
        <div class="p-4 text-center text-danger">Failed to load courses: ${err.message || err}</div>
      `;
    }
  },

  async viewCourseDetails(courseId) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>Loading Course Details...</h3>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="text-align: center; padding: 3rem;">
        <div class="spinner"></div>
      </div>
    `, 'modal-lg');

    try {
      const data = await API.get(`/api/courses/${courseId}`);
      const c = data.course;
      const modules = data.modules || [];
      const assessments = data.assessments || [];

      const modulesHtml = modules.map((m, mIdx) => `
        <div class="card" style="margin-bottom: 0.75rem; padding: 1rem 1.25rem; background: var(--bg-tertiary);">
          <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem; margin-bottom: 0.35rem;">
            Module ${mIdx + 1}: ${m.title}
          </div>
          ${m.description ? `<p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 0.5rem;">${m.description}</p>` : ''}
          ${(m.contents && m.contents.length > 0) ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${m.contents.map((cnt, cIdx) => {
                let icon = '<i class="fi fi-rr-document"></i>';
                if (cnt.content_type === 'video') icon = '<i class="fi fi-rr-play-alt" style="color: var(--primary);"></i>';
                if (cnt.content_type === 'coding') icon = '<i class="fi fi-rr-laptop-code" style="color: var(--accent-emerald);"></i>';
                if (cnt.content_type === 'jetbot') icon = '<i class="fi fi-rr-robot" style="color: var(--nvidia-green);"></i>';
                if (cnt.content_type === 'pdf') icon = '<i class="fi fi-rr-document" style="color: #64748b;"></i>';
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--bg-card); border-radius: 6px; font-size: 0.82rem; border: 1px solid var(--border-color);">
                    <div class="flex items-center gap-2">
                      <span>${icon}</span>
                      <strong style="color: var(--text-primary);">${cIdx + 1}. ${cnt.title}</strong>
                      <span class="badge badge-primary font-mono" style="font-size: 0.65rem;">${cnt.content_type}</span>
                    </div>
                    <span class="text-muted font-mono" style="font-size: 0.75rem;"><i class="fi fi-rr-clock"></i> ${cnt.duration_minutes} min</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div class="text-muted" style="font-size: 0.78rem;">No lessons added to this module yet.</div>'}
        </div>
      `).join('');

      App.showModal(`
        <div class="modal-header">
          <div>
            <h3>${c.title}</h3>
            <span class="badge badge-primary font-mono">${c.code}</span>
            <span class="badge ${c.is_published ? 'badge-success' : 'badge-warning'}" style="margin-left: 4px;">
              ${c.is_published ? 'Published' : 'Draft'}
            </span>
            <span class="badge badge-secondary font-mono" style="margin-left: 4px;"><i class="fi fi-rr-users-alt"></i> Batch: ${c.batch || 'All Batches'}</span>
            ${!c.college_id ? '<span class="badge badge-success font-mono" style="margin-left: 4px;"><i class="fi fi-rr-globe"></i> All Colleges</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-sm" onclick="App.openShareCourseModal(${c.id})" title="Share Registration Link to Students">
              <i class="fi fi-rr-share"></i> Share Link
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.downloadSyllabusPDF(${c.id})" title="Download / Print Official Syllabus as PDF">
              <i class="fi fi-rr-download"></i> Download Syllabus PDF
            </button>
            <button class="icon-btn" onclick="App.closeModal()">✕</button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Course Header Card -->
          <div class="card" style="margin-bottom: 1.25rem; padding: 1.25rem; display: flex; gap: 1.25rem; align-items: center;">
            <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 140px; height: 95px; border-radius: 8px; object-fit: cover;" />
            <div style="flex: 1;">
              <p style="font-size: 0.88rem; margin-bottom: 0.6rem;">${c.description || 'Comprehensive training, lectures, and interactive materials.'}</p>
              <div class="flex items-center gap-3" style="flex-wrap: wrap; font-size: 0.8rem;">
                <span><strong>Category:</strong> ${c.category}</span>
                <span>•</span>
                <span><strong>Level:</strong> ${c.level || 'Beginner'}</span>
                <span>•</span>
                <span><strong>Duration:</strong> ${c.duration || '6 Weeks'}</span>
                <span>•</span>
                <span><strong>Target Batch:</strong> <span class="badge badge-secondary font-mono" style="font-size: 0.75rem;">${c.batch || 'All Batches'}</span></span>
                <span>•</span>
                <span><strong>Instructor:</strong> ${c.instructor_name || 'Assigned Faculty'}</span>
              </div>
            </div>
          </div>

          ${c.learning_objectives ? `
            <div class="card" style="margin-bottom: 1.25rem; padding: 1rem 1.25rem;">
              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fi fi-rr-bullseye-arrow"></i> Learning Objectives</h4>
              <div style="font-size: 0.82rem; line-height: 1.5; white-space: pre-line;">${c.learning_objectives}</div>
            </div>
          ` : ''}

          <!-- Modules Syllabus Section -->
          <div style="margin-bottom: 1.25rem;">
            <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
              <h4 style="font-size: 1rem;"><i class="fi fi-rr-book-alt"></i> Curriculum Modules & Lessons (${modules.length} Modules)</h4>
              <span class="badge badge-purple">${modules.reduce((acc, m) => acc + (m.contents ? m.contents.length : 0), 0)} Total Lessons</span>
            </div>
            ${modulesHtml || '<div class="text-muted p-4 text-center">No modules configured for this course yet.</div>'}
          </div>

          <!-- Assessments Section if any -->
          ${assessments.length > 0 ? `
            <div class="card" style="padding: 1rem 1.25rem;">
              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fi fi-rr-diploma"></i> Attached Assessments & Exams</h4>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${assessments.map(a => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: var(--bg-card); border-radius: 6px; font-size: 0.82rem; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">${a.title}</strong>
                    <span class="badge badge-success font-mono" style="font-size: 0.7rem;">${a.assessment_type} • ${a.duration_minutes}m • Pass: ${a.passing_score}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        </div>
      `, 'modal-lg');
    } catch (err) {
      console.error(err);
      App.showModal(`
        <div class="modal-header">
          <h3>Error Loading Details</h3>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body p-4 text-danger">
          Failed to load course details: ${err.message || err}
        </div>
      `);
    }
  },

  async openCreateCourseModal() {
    let trainerOptions = '';
    try {
      const trainers = await API.get('/api/admins/trainers');
      trainerOptions = (trainers || []).map(t => `<option value="${t.id}">${t.full_name} (${t.email})</option>`).join('');
    } catch (e) {
      trainerOptions = '<option value="">No trainers available</option>';
    }

    App.showModal(`
      <form onsubmit="CollegeAdmin.submitCreateCourse(event)">
        <div class="modal-header">
          <div>
            <h3>Create New Course</h3>
            <span class="text-secondary" style="font-size: 0.82rem;">Add a new course curriculum to your college portal</span>
          </div>
          <button type="button" class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body" style="padding: 1.4rem;">
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Course Title <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="ca-ncc-title" class="form-input" placeholder="e.g. Advanced Machine Learning" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Course Code <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="ca-ncc-code" class="form-input font-mono" placeholder="e.g. CS-401" style="text-transform: uppercase;" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Target Batch</label>
              <select id="ca-ncc-batch" class="form-select" style="width: 100%;">
                <option value="All Batches">All Batches</option>
                <option value="2021-2025">2021-2025</option>
                <option value="2022-2026">2022-2026</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
              </select>
            </div>
            <label class="form-label" style="font-weight: 600;">Course Description</label>
            <textarea id="ca-ncc-desc" class="form-textarea" style="height: 70px;" placeholder="Summary of topics covered, outcomes, and prerequisites..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Thumbnail Image URL</label>
              <input type="url" id="ca-ncc-thumb" class="form-input" value="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Initial Status</label>
              <select id="ca-ncc-status" class="form-select" style="width: 100%;">
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Active & Visible)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding: 1rem 1.4rem; background: var(--bg-surface-elevated, transparent);">
          <button type="button" class="btn btn-secondary btn-sm" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" id="ca-btn-create-course">
            <i class="fi fi-rr-check"></i> Create Course
          </button>
        </div>
      </form>
    `, 'modal-lg');
  },

  async submitCreateCourse(event) {
    if (event) event.preventDefault();
    const user = Auth.getUser();
    const collegeId = user ? user.college_id : null;

    const title = document.getElementById('ca-ncc-title')?.value.trim();
    const code = document.getElementById('ca-ncc-code')?.value.trim().toUpperCase();
    const batch = document.getElementById('ca-ncc-batch')?.value || 'All Batches';
    const category = document.getElementById('ca-ncc-category')?.value || 'Computer Science';
    const level = document.getElementById('ca-ncc-level')?.value || 'Beginner';
    const duration = document.getElementById('ca-ncc-duration')?.value.trim() || '6 Weeks';
    const trainerVal = document.getElementById('ca-ncc-trainer')?.value;
    const trainerId = trainerVal ? parseInt(trainerVal) : null;
    const description = document.getElementById('ca-ncc-desc')?.value.trim() || '';
    const thumbnail = document.getElementById('ca-ncc-thumb')?.value.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600';
    const statusVal = document.getElementById('ca-ncc-status')?.value || 'draft';

    if (!title || !code) {
      API.toast('Please enter both Course Title and Course Code.', 'warning');
      return;
    }

    const btn = document.getElementById('ca-btn-create-course');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Creating...';
    }

    try {
      const course = await API.post('/api/courses', {
        title,
        code,
        college_id: collegeId,
        category,
        level,
        duration,
        batch,
        description,
        thumbnail_url: thumbnail,
        status: statusVal,
        is_published: statusVal === 'published',
        visibility: 'college'
      });

      if (trainerId && course && course.id) {
        await API.post(`/api/courses/${course.id}/assign-trainer`, {
          trainer_id: trainerId,
          notes: 'Assigned by College Admin during course creation'
        }).catch(err => console.warn('Trainer assign warning:', err));
      }

      API.toast(`Course "${title}" created successfully!`, 'success');
      App.closeModal();
      await this.renderCoursesView();
    } catch (err) {
      console.error(err);
      API.toast(err.message || 'Failed to create course', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-check"></i> Create Course';
      }
    }
  },

  async openEditCourseModal(courseId) {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      const c = data.course;
      const isPub = c.is_published;
      let trainerOptions = '';
      try {
        const trainers = await API.get('/api/admins/trainers');
        trainerOptions = (trainers || []).map(t => `<option value="${t.id}" ${t.id === c.trainer_id ? 'selected' : ''}>${t.full_name} (${t.email})</option>`).join('');
      } catch (e) {
        trainerOptions = '<option value="">No trainers</option>';
      }

      App.showModal(`
        <form onsubmit="CollegeAdmin.submitEditCourse(event, ${c.id})">
          <div class="modal-header">
            <div>
              <h3>Edit Course: ${c.code}</h3>
              <span class="text-secondary" style="font-size: 0.82rem;">Update course metadata and training settings</span>
            </div>
            <button type="button" class="icon-btn" onclick="App.closeModal()">✕</button>
          </div>

          <div class="modal-body" style="padding: 1.4rem;">
            <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Course Title</label>
                <input type="text" id="ca-ecc-title" class="form-input" value="${(c.title || '').replace(/"/g, '&quot;')}" required />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Course Code</label>
                <input type="text" id="ca-ecc-code" class="form-input font-mono" value="${c.code || ''}" required />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Target Batch</label>
                <select id="ca-ecc-batch" class="form-select" style="width: 100%;">
                  <option value="All Batches" ${c.batch === 'All Batches' ? 'selected' : ''}>All Batches</option>
                  <option value="2021-2025" ${c.batch === '2021-2025' ? 'selected' : ''}>2021-2025</option>
                  <option value="2022-2026" ${c.batch === '2022-2026' ? 'selected' : ''}>2022-2026</option>
                  <option value="2023-2027" ${c.batch === '2023-2027' ? 'selected' : ''}>2023-2027</option>
                  <option value="2024-2028" ${c.batch === '2024-2028' ? 'selected' : ''}>2024-2028</option>
                  <option value="2025-2029" ${c.batch === '2025-2029' ? 'selected' : ''}>2025-2029</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Assigned Trainer</label>
                <select id="ca-ecc-trainer" class="form-select" style="width: 100%;">
                  <option value="">-- Select Trainer --</option>
                  ${trainerOptions}
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="font-weight: 600;">Description</label>
              <textarea id="ca-ecc-desc" class="form-textarea" style="height: 70px;">${c.description || ''}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Thumbnail Image URL</label>
                <input type="url" id="ca-ecc-thumb" class="form-input" value="${(c.thumbnail_url || '').replace(/"/g, '&quot;')}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Status</label>
                <select id="ca-ecc-status" class="form-select" style="width: 100%;">
                  <option value="draft" ${!isPub ? 'selected' : ''}>Draft (Private)</option>
                  <option value="published" ${isPub ? 'selected' : ''}>Published (Active & Visible)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding: 1rem 1.4rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" id="ca-btn-save-course">
              <i class="fi fi-rr-check"></i> Save Changes
            </button>
          </div>
        </form>
      `, 'modal-lg');
    } catch (err) {
      console.error(err);
      API.toast('Failed to load course for editing', 'error');
    }
  },

  async submitEditCourse(event, courseId) {
    if (event) event.preventDefault();
    const user = Auth.getUser();
    const collegeId = user ? user.college_id : null;

    const title = document.getElementById('ca-ecc-title')?.value.trim();
    const code = document.getElementById('ca-ecc-code')?.value.trim().toUpperCase();
    const batch = document.getElementById('ca-ecc-batch')?.value || 'All Batches';
    const category = document.getElementById('ca-ecc-category')?.value || 'Computer Science';
    const level = document.getElementById('ca-ecc-level')?.value || 'Beginner';
    const duration = document.getElementById('ca-ecc-duration')?.value.trim() || '6 Weeks';
    const trainerVal = document.getElementById('ca-ecc-trainer')?.value;
    const trainerId = trainerVal ? parseInt(trainerVal) : null;
    const description = document.getElementById('ca-ecc-desc')?.value.trim() || '';
    const thumbnail = document.getElementById('ca-ecc-thumb')?.value.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600';
    const statusVal = document.getElementById('ca-ecc-status')?.value || 'draft';

    if (!title || !code) {
      API.toast('Please enter both Course Title and Course Code.', 'warning');
      return;
    }

    const btn = document.getElementById('ca-btn-save-course');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Saving...';
    }

    try {
      await API.put(`/api/courses/${courseId}`, {
        title,
        code,
        college_id: collegeId,
        category,
        level,
        duration,
        batch,
        description,
        thumbnail_url: thumbnail,
        status: statusVal,
        is_published: statusVal === 'published',
        visibility: 'college'
      });

      if (trainerId) {
        await API.post(`/api/courses/${courseId}/assign-trainer`, {
          trainer_id: trainerId,
          notes: 'Assigned by College Admin during course update'
        }).catch(err => console.warn('Trainer assign warning:', err));
      }

      API.toast(`Course "${title}" updated successfully!`, 'success');
      App.closeModal();
      await this.renderCoursesView(this.currentCourseFilter || 'all');
    } catch (err) {
      console.error(err);
      API.toast(err.message || 'Failed to update course', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-check"></i> Save Changes';
      }
    }
  },

  async deleteCourse(courseId, courseTitle) {
    App.showDangerConfirmModal({
      title: 'Delete Course Curriculum',
      warningBanner: 'Warning: This will permanently delete this course and all associated modules and enrollments.',
      description: `You are about to delete <strong>${courseTitle}</strong>. This action is irreversible.`,
      itemName: courseTitle,
      itemType: 'course',
      confirmButtonText: 'I understand, delete this course',
      onConfirm: async () => {
        try {
          await API.delete(`/api/courses/${courseId}`);
          API.toast(`Course "${courseTitle}" deleted successfully.`, 'success');
          App.closeModal();
          await this.renderCoursesView(this.currentCourseFilter || 'all');
        } catch (err) {
          console.error(err);
          API.toast(err.message || 'Failed to delete course', 'error');
        }
      }
    });
  },

  // =========================================================================
  // ENROLLMENTS & ASSESSMENTS & RESULTS
  // =========================================================================
  async renderEnrollmentsView() {
    const container = document.getElementById('college-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Student Course Enrollments & Progress</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Track individual student completion %, scores, and certificates</p>
        </div>
      </div>
      <div class="card">
        <div id="ca-enrollments-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading enrollments...</div>
        </div>
      </div>
    `;

    const enrollments = await API.get('/api/enrollments');
    const rows = enrollments.map(e => `
      <tr>
        <td>
          <div style="font-weight: 700;">${e.first_name} ${e.last_name}</div>
          <div class="text-muted font-mono" style="font-size: 0.75rem;">${e.roll_number} • ${e.department}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${e.course_title}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${e.course_code}</div>
        </td>
        <td>
          <div style="width: 140px;">
            <div class="flex justify-between" style="font-size: 0.72rem; margin-bottom: 2px;">
              <span>${Math.round(e.progress_percentage)}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${e.status === 'completed' ? 'success' : ''}" style="width: ${e.progress_percentage}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${e.status === 'completed' ? 'badge-success' : (e.status === 'in_progress' ? 'badge-primary' : 'badge-warning')}">
            ${e.status}
          </span>
        </td>
        <td>${e.certificate_code ? `<span class="badge badge-amber font-mono">${e.certificate_code}</span>` : '—'}</td>
        <td class="font-mono text-muted" style="font-size: 0.75rem;">${e.enrolled_at ? e.enrolled_at.split(' ')[0] : ''}</td>
      </tr>
    `).join('');

    document.getElementById('ca-enrollments-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Certificate Code</th>
            <th>Enrolled Date</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No enrollments recorded yet</td></tr>'}</tbody>
      </table>
    `;
  },

  async renderAssessmentsView() {
    const container = document.getElementById('college-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Assessment & Examination Center</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Manage MCQ, coding questions, practical tasks, and grading evaluations</p>
        </div>
        <button class="btn btn-primary" onclick="CollegeAdmin.openCreateAssessmentModal()">+ Create Assessment</button>
      </div>

      <div class="card">
        <div id="ca-assessments-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading assessments...</div>
        </div>
      </div>
    `;

    const assessments = await API.get('/api/assessments');
    const rows = assessments.map(a => `
      <tr>
        <td>
          <div style="font-weight: 700;">${a.title}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${a.course_title} (${a.course_code})</div>
        </td>
        <td><span class="badge badge-purple font-mono">${a.assessment_type}</span></td>
        <td>${a.question_count || 0} Questions (${a.total_points || 0} pts)</td>
        <td>${a.time_limit_minutes} mins</td>
        <td><span class="badge badge-success">Pass: ${a.passing_percentage}%</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="CollegeAdmin.viewSubmissions(${a.id})">Submissions & Grades</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('ca-assessments-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Assessment Title</th>
            <th>Type</th>
            <th>Questions</th>
            <th>Time Limit</th>
            <th>Passing Criteria</th>
            <th>Grading</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No assessments created</td></tr>'}</tbody>
      </table>
    `;
  },

  async openCreateAssessmentModal() {
    const courses = await API.get('/api/courses');
    const courseOptions = courses.map(c => `<option value="${c.id}">${c.title} (${c.code})</option>`).join('');

    App.showModal(`
      <div class="modal-header">
        <h3>Create New Technical Assessment</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <form onsubmit="CollegeAdmin.handleCreateAssessment(event)">
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Select Course *</label>
              <select class="form-select" name="course_id" required>
                ${courseOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assessment Type *</label>
              <select class="form-select" name="assessment_type">
                <option value="mcq">Multiple Choice Questions (MCQ)</option>
                <option value="coding">Coding & Algorithm Sandbox</option>
                <option value="jetbot_practical">NVIDIA JetBot / AI Practical</option>
                <option value="hybrid">Comprehensive Hybrid Exam</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Assessment Title *</label>
            <input type="text" class="form-input" name="title" required placeholder="e.g. Mid-term Autonomous Robotics Evaluation" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Time Limit (Minutes)</label>
              <input type="number" class="form-input" name="time_limit_minutes" value="45" />
            </div>
            <div class="form-group">
              <label class="form-label">Passing Percentage (%)</label>
              <input type="number" class="form-input" name="passing_percentage" value="65" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Assessment</button>
        </div>
      </form>
    `);
  },

  async handleCreateAssessment(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      course_id: parseInt(fd.get('course_id')),
      title: fd.get('title'),
      assessment_type: fd.get('assessment_type'),
      time_limit_minutes: parseInt(fd.get('time_limit_minutes')),
      passing_percentage: parseFloat(fd.get('passing_percentage')),
      max_attempts: 3,
      is_published: true,
      questions: [
        {
          question_text: "What is the primary sensor utilized for visual perception on NVIDIA JetBot?",
          question_type: "mcq",
          options: ["Sony IMX219 CSI Camera", "Ultrasonic HC-SR04", "Laser Rangefinder", "Infrared Phototransistor"],
          correct_answers: [0],
          points: 50.0
        },
        {
          question_text: "Write a Python function to compute thresholding for bounding box coordinates.",
          question_type: "coding",
          code_template: "def filter_box(conf):\n    return conf > 0.5\n",
          points: 50.0
        }
      ]
    };

    try {
      await API.post('/api/assessments', body);
      API.toast('Assessment created with question bank!', 'success');
      App.closeModal();
      this.renderAssessmentsView();
    } catch (err) {
      console.error(err);
    }
  },

  async viewSubmissions(assessmentId) {
    const results = await API.get('/api/results', { assessment_id: assessmentId });

    const rows = results.map(r => `
      <tr>
        <td>
          <div style="font-weight: 700;">${r.first_name} ${r.last_name}</div>
          <div class="text-muted font-mono" style="font-size: 0.75rem;">${r.roll_number}</div>
        </td>
        <td><span class="badge badge-info">Attempt #${r.attempt_number || 1}</span></td>
        <td><strong>${r.score}</strong> / ${r.max_score} (${r.percentage}%)</td>
        <td>
          <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
            ${r.passed ? 'PASSED' : 'FAILED'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="CollegeAdmin.openManualGradeModal(${r.submission_id}, ${r.score})">Grade / Adjust</button>
        </td>
      </tr>
    `).join('');

    App.showModal(`
      <div class="modal-header">
        <h3>Assessment Submissions & Gradebook</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Attempt</th>
                <th>Score</th>
                <th>Verdict</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" class="text-center">No submissions received yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  openManualGradeModal(submissionId, currentScore) {
    App.showModal(`
      <div class="modal-header">
        <h3>Manual Instructor Grading</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Score Awarded</label>
          <input type="number" id="grade-score-input" class="form-input" value="${currentScore}" step="0.5" />
        </div>
        <div class="form-group">
          <label class="form-label">Instructor Feedback</label>
          <textarea id="grade-feedback-input" class="form-textarea" placeholder="Detailed rubric comments..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="CollegeAdmin.submitGrade(${submissionId})">Save Grade</button>
      </div>
    `);
  },

  async submitGrade(submissionId) {
    const score = parseFloat(document.getElementById('grade-score-input').value);
    const feedback = document.getElementById('grade-feedback-input').value;

    try {
      await API.post('/api/results/manual-grade', { submission_id: submissionId, score, feedback });
      API.toast('Grade and feedback updated!', 'success');
      App.closeModal();
    } catch (err) {
      console.error(err);
    }
  },

  async renderResultsView() {
    const container = document.getElementById('college-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Assessment Results & Instructor Grading</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Review submissions, automated evaluations, and manual rubric grades</p>
        </div>
      </div>
      <div class="card">
        <div id="ca-results-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading submission records...</div>
        </div>
      </div>
    `;

    const data = await API.get('/api/results/recent');
    const rows = (data || []).map(r => `
      <tr>
        <td>
          <div style="font-weight: 700;">${r.first_name} ${r.last_name}</div>
          <div class="text-muted font-mono" style="font-size: 0.72rem;">Roll: ${r.roll_number || 'N/A'}</div>
        </td>
        <td><strong>${r.assessment_title}</strong></td>
        <td><span class="font-mono font-bold">${r.score} / ${r.max_score}</span> (${Math.round(r.percentage)}%)</td>
        <td>
          <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
            ${r.passed ? 'PASSED' : 'FAILED'}
          </span>
        </td>
        <td><span class="text-muted" style="font-size: 0.78rem;">${r.evaluated_at || r.created_at || 'Just now'}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="CollegeAdmin.openManualGradeModal(${r.submission_id}, ${r.score})">
            Adjust Grade ✍️
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('ca-results-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Assessment</th>
            <th>Score</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No student results recorded yet</td></tr>'}</tbody>
      </table>
    `;
  },

  async renderCertificatesView() {
    const container = document.getElementById('college-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Issued Student Certificates</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Verifiable completion credentials awarded to students in your college</p>
        </div>
      </div>
      <div class="card">
        <div id="ca-certs-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading certificates...</div>
        </div>
      </div>
    `;

    const certs = await API.get('/api/certificates');
    const rows = certs.map(c => `
      <tr>
        <td>
          <div style="font-weight: 700;">${c.first_name} ${c.last_name}</div>
          <div class="text-muted font-mono" style="font-size: 0.72rem;">Roll: ${c.roll_number || 'N/A'}</div>
        </td>
        <td><strong>${c.course_title}</strong> (${c.course_code})</td>
        <td><span class="badge badge-amber font-mono">${c.certificate_code}</span></td>
        <td>${c.issue_date}</td>
        <td>${c.signature_name}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="CertificateViewer.openCertificate(${c.id})">
            <i class="fi fi-rr-print"></i> View / Print
          </button>
          <button class="btn btn-outline btn-sm" onclick="CertificateViewer.openVerifier('${c.certificate_code}')">
            <i class="fi fi-rr-search"></i> Verify QR
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('ca-certs-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Recipient Student</th>
            <th>Completed Course</th>
            <th>Certificate Code</th>
            <th>Issue Date</th>
            <th>Signer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No certificates issued yet for your college</td></tr>'}</tbody>
      </table>
    `;
  },

  async renderReportsView() {
    const container = document.getElementById('college-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Institutional Learning & Completion Reports</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Comprehensive analytics on enrollment, pass performance, and active cohorts</p>
        </div>
      </div>
      <div id="ca-full-reports">
        <div class="card p-4 text-center">Loading institutional reports...</div>
      </div>
    `;

    try {
      const data = await API.get('/api/reports/college-admin-dashboard');
      const s = data.metrics || data.stats || {};
      const courses = (data.charts && data.charts.course_enrollments) || data.course_popularity || [];

      const reportsEl = document.getElementById('ca-full-reports');
      reportsEl.innerHTML = `
        <div class="grid grid-cols-4 gap-4" style="margin-bottom: 1.5rem;">
          <div class="card stat-card">
            <div class="stat-label">Total Students</div>
            <div class="stat-value">${s.total_students || 0}</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Total Courses</div>
            <div class="stat-value">${s.total_courses || 0}</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Total Enrollments</div>
            <div class="stat-value">${s.total_enrollments || 0}</div>
          </div>
          <div class="card stat-card">
            <div class="stat-label">Certificates Issued</div>
            <div class="stat-value">${s.total_certificates || 0}</div>
          </div>
        </div>

        <div class="card" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Course Enrollment Distribution</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Enrollments</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                ${courses.length > 0 ? courses.map(c => `
                  <tr>
                    <td><strong>${c.title || c.course_title || 'Course'}</strong></td>
                    <td><span class="badge badge-primary font-mono">${c.category || 'General'}</span></td>
                    <td>${c.count || c.enrollments || 0} Students</td>
                    <td><span class="badge badge-success">${c.completion_rate || '85%'}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="4" class="text-center">No enrollment metrics recorded yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      const reportsEl = document.getElementById('ca-full-reports');
      if (reportsEl) reportsEl.innerHTML = `<div class="card p-4 text-center text-danger">Failed to load reports: ${err.message || err}</div>`;
    }
  },

  async renderNotificationsView() {
    const container = document.getElementById('college-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Announcements & Alerts</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">System notifications and student broadcast history</p>
        </div>
        <button class="btn btn-primary" onclick="CollegeAdmin.openBroadcastModal()">
          <i class="fi fi-rr-paper-plane"></i> Send Announcement
        </button>
      </div>
      <div class="card" id="ca-notifs-container">
        <div class="p-4 text-center">Loading notifications...</div>
      </div>
    `;

    try {
      const data = await API.get('/api/notifications');
      const notifs = data.notifications || [];
      const el = document.getElementById('ca-notifs-container');
      if (!el) return;

      if (notifs.length === 0) {
        el.innerHTML = '<div class="p-4 text-center text-muted">No notifications found.</div>';
        return;
      }

      el.innerHTML = notifs.map(n => `
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.25rem;">${n.title}</div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.35rem;">${n.message}</p>
            <span class="text-muted font-mono" style="font-size: 0.72rem;">${new Date(n.created_at || Date.now()).toLocaleString()}</span>
          </div>
          <span class="badge ${n.is_read ? 'badge-secondary' : 'badge-primary'}">${n.is_read ? 'Read' : 'New'}</span>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
      const el = document.getElementById('ca-notifs-container');
      if (el) el.innerHTML = `<div class="p-4 text-center text-danger">Failed to load: ${e.message || e}</div>`;
    }
  },

  openBroadcastModal() {
    App.showModal(`
      <form onsubmit="CollegeAdmin.submitBroadcast(event)">
        <div class="modal-header">
          <h3>Broadcast Announcement</h3>
          <button type="button" class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.4rem;">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Announcement Title</label>
            <input type="text" id="ca-broadcast-title" class="form-input" placeholder="e.g. Midterm Examination Schedule Released" required />
          </div>
          <div class="form-group">
            <label class="form-label">Message Content</label>
            <textarea id="ca-broadcast-msg" class="form-textarea" rows="4" placeholder="Type announcement details for your enrolled students..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fi fi-rr-paper-plane"></i> Send Announcement</button>
        </div>
      </form>
    `);
  },

  async submitBroadcast(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('ca-broadcast-title')?.value.trim();
    const message = document.getElementById('ca-broadcast-msg')?.value.trim();
    if (!title || !message) return;

    try {
      await API.post('/api/notifications/broadcast', { title, message });
      API.toast('Announcement broadcast sent successfully!', 'success');
      App.closeModal();
      this.renderNotificationsView();
    } catch (err) {
      API.toast(err.message || 'Failed to send announcement', 'error');
    }
  },

  renderSettingsView() {
    const user = Auth.getUser() || {};
    const container = document.getElementById('college-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Account & Institution Settings</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Manage your administrator profile and security credentials</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="card" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Administrator Profile</h3>
          <div style="margin-bottom: 0.75rem;">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" value="${user.full_name || ''}" readonly />
          </div>
          <div style="margin-bottom: 0.75rem;">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" value="${user.email || ''}" readonly />
          </div>
          <div style="margin-bottom: 0.75rem;">
            <label class="form-label">Assigned College</label>
            <input type="text" class="form-input" value="${user.college_name || 'Autonomous Institution'}" readonly />
          </div>
        </div>

        <div class="card" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Change Password</h3>
          <form onsubmit="CollegeAdmin.changePassword(event)">
            <div style="margin-bottom: 0.75rem;">
              <label class="form-label">Current Password</label>
              <input type="password" id="ca-old-pass" class="form-input" placeholder="••••••••••••" required />
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label class="form-label">New Password</label>
              <input type="password" id="ca-new-pass" class="form-input" placeholder="••••••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Update Password</button>
          </form>
        </div>
      </div>
    `;
  },

  async changePassword(e) {
    if (e) e.preventDefault();
    const oldPass = document.getElementById('ca-old-pass')?.value;
    const newPass = document.getElementById('ca-new-pass')?.value;
    if (!oldPass || !newPass) return;

    try {
      await API.post('/api/auth/change-password', { old_password: oldPass, new_password: newPass });
      API.toast('Password updated successfully!', 'success');
      document.getElementById('ca-old-pass').value = '';
      document.getElementById('ca-new-pass').value = '';
    } catch (err) {
      API.toast(err.message || 'Failed to update password', 'error');
    }
  }
};






























































































































































































































































































