/**
 * Super Admin Portal Controller
 */
const SuperAdmin = {
  cachedColleges: [],

  async renderDashboard() {
    const container = document.getElementById('super-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.75rem;">
        <div>
          <h2>Super Admin Global Dashboard</h2>
          <p class="text-secondary" style="font-size: 0.85rem; margin-top: 4px;">System-wide aggregate statistics, multi-college health, and governance</p>
        </div>
        <button class="btn btn-primary" onclick="SuperAdmin.openCreateCollegeModal()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add New College
        </button>
      </div>

      <div id="sa-stats-grid" class="stats-grid">
        <div class="card" style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading platform metrics...</div>
      </div>

      <div class="grid grid-cols-2 gap-6" style="margin-bottom: 1.75rem;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">College Organizations Breakdown</h3>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('colleges')">Manage All</button>
          </div>
          <div id="sa-colleges-breakdown" class="table-container">
            <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading colleges...</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent System Audit Trail</h3>
            <span class="badge badge-info">Real-time Logs</span>
          </div>
          <div id="sa-audit-logs-list" style="max-height: 380px; overflow-y: auto;">
            <div style="padding: 1.5rem; text-align: center;" class="text-muted">Loading audit logs...</div>
          </div>
        </div>
      </div>
    `;

    try {
      const data = await API.get('/api/reports/super-admin-dashboard');
      const m = data.metrics;

      // Render Stat Cards
      document.getElementById('sa-stats-grid').innerHTML = `
        <div class="stat-card">
          <div>
            <div class="stat-label">Total Colleges</div>
            <div class="stat-value">${m.total_colleges}</div>
            <div class="stat-trend">${m.active_colleges} Active Institutions</div>
          </div>
          <div class="stat-icon-wrapper">🏛️</div>
        </div>
        <div class="stat-card stat-emerald">
          <div>
            <div class="stat-label">Total Students</div>
            <div class="stat-value">${m.total_students}</div>
            <div class="stat-trend">Across All Colleges</div>
          </div>
          <div class="stat-icon-wrapper">🎓</div>
        </div>
        <div class="stat-card stat-sky">
          <div>
            <div class="stat-label">Total Courses</div>
            <div class="stat-value">${m.total_courses}</div>
            <div class="stat-trend">${m.published_courses} Published & Live</div>
          </div>
          <div class="stat-icon-wrapper">📚</div>
        </div>
        <div class="stat-card stat-amber">
          <div>
            <div class="stat-label">Certificates Issued</div>
            <div class="stat-value">${m.total_certificates}</div>
            <div class="stat-trend">${m.global_completion_rate}% Completion Rate</div>
          </div>
          <div class="stat-icon-wrapper">🏆</div>
        </div>
      `;

      // Render Colleges Table
      const colRows = data.colleges_breakdown.map(c => `
        <tr>
          <td>
            <div style="font-weight: 700;">${c.name}</div>
            <div class="text-muted" style="font-size: 0.75rem;">Code: <span class="badge badge-primary">${c.code}</span></div>
          </td>
          <td><span class="badge badge-purple">${c.student_count} Students</span></td>
          <td>${c.course_count} Courses</td>
          <td>${c.certificate_count} Certs</td>
          <td>
            <span class="badge ${c.is_active ? 'badge-success' : 'badge-danger'}">
              ${c.is_active ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="SuperAdmin.toggleCollegeStatus(${c.id})">
              ${c.is_active ? 'Disable' : 'Enable'}
            </button>
          </td>
        </tr>
      `).join('');

      document.getElementById('sa-colleges-breakdown').innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>College Organization</th>
              <th>Students</th>
              <th>Courses</th>
              <th>Certs</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${colRows || '<tr><td colspan="6" class="text-center">No colleges registered</td></tr>'}</tbody>
        </table>
      `;

      // Render Recent Audits
      const auditRows = data.recent_audits.map(a => `
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; font-size: 0.85rem;">
              <span class="badge badge-info font-mono" style="margin-right: 6px;">${a.action}</span>
              ${a.resource_type} ${a.resource_id ? `#${a.resource_id}` : ''}
            </div>
            <div class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">
              By: ${a.user_email || 'System'} | ${a.college_name || 'Global'}
            </div>
          </div>
          <div class="text-muted font-mono" style="font-size: 0.72rem;">${a.created_at ? a.created_at.split(' ')[1] : ''}</div>
        </div>
      `).join('');

      document.getElementById('sa-audit-logs-list').innerHTML = auditRows || '<div class="text-muted p-4">No audit logs recorded.</div>';

    } catch (e) {
      console.error(e);
    }
  },

  async renderCollegesView() {
    const container = document.getElementById('super-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Colleges & Universities Directory</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Manage isolated multi-tenant college institutions, branding, and access status</p>
        </div>
        <button class="btn btn-primary" onclick="SuperAdmin.openCreateCollegeModal()">
          <i class="fi fi-rr-plus"></i> Add New College
        </button>
      </div>

      <div class="card">
        <div id="sa-colleges-full-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading colleges...</div>
        </div>
      </div>
    `;

    const colleges = await API.get('/api/colleges');
    const rows = (colleges || []).map(c => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <img src="${c.logo_url || 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80'}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" />
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">${c.name}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${c.contact_email || c.address || 'Active Institution'}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-primary font-mono">${c.code}</span></td>
        <td><span class="badge badge-purple">${c.student_count || 0} Students</span></td>
        <td><span class="badge badge-info">${c.admin_count || 0} Admins</span></td>
        <td>${c.course_count || 0} Courses</td>
        <td>
          <span class="badge ${c.is_active ? 'badge-success' : 'badge-danger'}">
            ${c.is_active ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="SuperAdmin.toggleCollegeStatus(${c.id})">
              ${c.is_active ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="SuperAdmin.deleteCollege(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('sa-colleges-full-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>College Organization</th>
            <th>Code</th>
            <th>Enrolled Students</th>
            <th>Admins</th>
            <th>Courses</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7" class="text-center p-4 text-muted">No colleges found. Click "+ Add New College" above to create an institution.</td></tr>'}</tbody>
      </table>
    `;
  },

  // =========================================================================
  // TRAINERS MANAGEMENT & COURSE ALLOCATION VIEW (Super Admin)
  // =========================================================================

  async renderTrainersView() {
    const container = document.getElementById('super-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2>Trainers & Course Allocation</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Manage faculty & industry trainers, monitor class workload, and assign instructors to courses</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline" onclick="SuperAdmin.openQuickAssignModal()" title="Assign any trainer to a class">
            <i class="fi fi-rr-link"></i> Assign Trainer to Class
          </button>
          <button class="btn btn-primary" onclick="SuperAdmin.openCreateTrainerModal()" title="Register a new trainer account">
            <i class="fi fi-rr-user-add"></i> + Create New Trainer
          </button>
        </div>
      </div>

      <!-- Metric KPI Cards -->
      <div class="grid grid-cols-4 gap-4" style="margin-bottom: 1.5rem;" id="sa-trainers-kpi-container">
        <div class="card" style="padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(99, 102, 241, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            <i class="fi fi-rr-chalkboard-user"></i>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Total Trainers</div>
            <div style="font-size: 1.5rem; font-weight: 800;" id="kpi-total-trainers">-</div>
          </div>
        </div>
        <div class="card" style="padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            <i class="fi fi-rr-check-circle"></i>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Active Trainers</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-emerald);" id="kpi-active-trainers">-</div>
          </div>
        </div>
        <div class="card" style="padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            <i class="fi fi-rr-book-alt"></i>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Assigned Classes</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6;" id="kpi-assigned-courses">-</div>
          </div>
        </div>
        <div class="card" style="padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(245, 158, 11, 0.12); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            <i class="fi fi-rr-exclamation"></i>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Unassigned Classes</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #f59e0b;" id="kpi-unassigned-courses">-</div>
          </div>
        </div>
      </div>

      <!-- Main Content Card with Sub-tabs & Search -->
      <div class="card">
        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <!-- Sub-tabs -->
          <div class="flex items-center gap-2">
            <button class="btn btn-sm ${this.currentTrainersTab !== 'matrix' ? 'btn-primary' : 'btn-outline'}" id="tab-btn-trainers-dir" onclick="SuperAdmin.switchTrainersTab('directory')">
              <i class="fi fi-rr-users"></i> Trainer Directory & Workload
            </button>
            <button class="btn btn-sm ${this.currentTrainersTab === 'matrix' ? 'btn-primary' : 'btn-outline'}" id="tab-btn-trainers-mat" onclick="SuperAdmin.switchTrainersTab('matrix')">
              <i class="fi fi-rr-list-check"></i> Course Assignment Matrix
            </button>
          </div>

          <!-- Search & Filter -->
          <div class="flex items-center gap-2" style="flex-grow: 1; max-width: 500px; justify-content: flex-end;">
            <div class="input-icon-wrapper" style="position: relative; width: 100%; max-width: 260px;">
              <input type="text" id="sa-trainers-search" class="form-input" placeholder="Search trainers or classes..." oninput="SuperAdmin.filterTrainersView()" style="padding-left: 2rem; width: 100%;" />
              <i class="fi fi-rr-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
            </div>
            <select id="sa-trainers-college-filter" class="form-select" onchange="SuperAdmin.filterTrainersView()" style="max-width: 180px;">
              <option value="">All Campuses</option>
            </select>
          </div>
        </div>

        <div id="sa-trainers-content-area" class="table-container">
          <div style="padding: 3rem; text-align: center;">
            <div class="spinner"></div>
            <div style="margin-top: 0.8rem; color: var(--text-muted);">Loading trainers and course allocations...</div>
          </div>
        </div>
      </div>
    `;

    this.currentTrainersTab = this.currentTrainersTab || 'directory';
    await this.fetchAndRenderTrainersData();
  },

  async fetchAndRenderTrainersData() {
    try {
      const [trainers, courses, colleges] = await Promise.all([
        API.get('/api/courses/trainers?include_inactive=true'),
        API.get('/api/courses'),
        API.get('/api/colleges').catch(() => [])
      ]);

      this.cachedTrainersList = trainers || [];
      this.cachedCoursesList = courses || [];
      this.cachedCollegesList = colleges || [];

      // Update College Filter Dropdown
      const collegeSelect = document.getElementById('sa-trainers-college-filter');
      if (collegeSelect) {
        const currentVal = collegeSelect.value;
        const optionsHtml = ['<option value="">All Campuses</option>']
          .concat((colleges || []).map(col => `<option value="${col.id}" ${String(currentVal) === String(col.id) ? 'selected' : ''}>${col.name} (${col.code})</option>`))
          .join('');
        collegeSelect.innerHTML = optionsHtml;
      }

      // Compute & Update KPIs
      const totalTrainers = this.cachedTrainersList.length;
      const activeTrainers = this.cachedTrainersList.filter(t => t.is_active).length;
      const assignedCourses = this.cachedCoursesList.filter(c => c.trainer_id || (c.trainer_name && c.trainer_name !== 'Not Assigned')).length;
      const unassignedCourses = this.cachedCoursesList.filter(c => !c.trainer_id && (!c.trainer_name || c.trainer_name === 'Not Assigned')).length;

      const elTotal = document.getElementById('kpi-total-trainers');
      const elActive = document.getElementById('kpi-active-trainers');
      const elAssigned = document.getElementById('kpi-assigned-courses');
      const elUnassigned = document.getElementById('kpi-unassigned-courses');

      if (elTotal) elTotal.innerText = totalTrainers;
      if (elActive) elActive.innerText = activeTrainers;
      if (elAssigned) elAssigned.innerText = assignedCourses;
      if (elUnassigned) elUnassigned.innerText = unassignedCourses;

      this.updateTrainersTableContent();
    } catch (err) {
      console.error(err);
      const contentArea = document.getElementById('sa-trainers-content-area');
      if (contentArea) {
        contentArea.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: var(--accent-rose);">Failed to load trainers data: ${err.message || err}</div>`;
      }
    }
  },

  switchTrainersTab(tab) {
    this.currentTrainersTab = tab;
    const btnDir = document.getElementById('tab-btn-trainers-dir');
    const btnMat = document.getElementById('tab-btn-trainers-mat');
    if (btnDir && btnMat) {
      if (tab === 'directory') {
        btnDir.className = 'btn btn-sm btn-primary';
        btnMat.className = 'btn btn-sm btn-outline';
      } else {
        btnDir.className = 'btn btn-sm btn-outline';
        btnMat.className = 'btn btn-sm btn-primary';
      }
    }
    this.updateTrainersTableContent();
  },

  filterTrainersView() {
    this.updateTrainersTableContent();
  },

  updateTrainersTableContent() {
    const contentArea = document.getElementById('sa-trainers-content-area');
    if (!contentArea) return;

    const searchTerm = (document.getElementById('sa-trainers-search')?.value || '').toLowerCase().trim();
    const collegeIdFilter = document.getElementById('sa-trainers-college-filter')?.value;

    const trainers = this.cachedTrainersList || [];
    const courses = this.cachedCoursesList || [];

    if (this.currentTrainersTab === 'directory') {
      // Filter trainers
      let filtered = trainers.filter(t => {
        const matchesSearch = !searchTerm || 
          `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm) ||
          (t.email || '').toLowerCase().includes(searchTerm) ||
          (t.college_name || '').toLowerCase().includes(searchTerm);

        const matchesCollege = !collegeIdFilter || String(t.college_id) === String(collegeIdFilter);
        return matchesSearch && matchesCollege;
      });

      const rows = filtered.map(t => {
        const initials = `${(t.first_name || 'T')[0] || ''}${(t.last_name || '')[0] || ''}`.toUpperCase() || 'TR';
        
        // Find assigned courses for this trainer
        const assignedList = courses.filter(c => c.trainer_id === t.id);
        const courseChips = assignedList.length > 0 
          ? assignedList.map(c => `
              <span class="badge badge-primary font-mono" style="font-size: 0.7rem; margin: 2px; cursor: pointer;" onclick="SuperAdmin.openAssignTrainerModal(${c.id})" title="View assignment for ${c.title}">
                ${c.code}
              </span>
            `).join('')
          : '<span class="text-muted" style="font-size: 0.75rem; font-style: italic;">No classes currently assigned</span>';

        return `
          <tr>
            <td>
              <div class="flex items-center gap-3">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0;">
                  ${initials}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem;">${t.first_name} ${t.last_name}</div>
                  <div class="text-muted" style="font-size: 0.75rem;">${t.email} ${t.phone ? '• ' + t.phone : ''}</div>
                </div>
              </div>
            </td>
            <td>
              ${t.college_id ? `
                <span class="badge badge-info font-mono">${t.college_code || 'COL'}</span>
                <span style="font-size: 0.85rem; margin-left: 4px;">${t.college_name}</span>
              ` : `
                <span class="badge badge-success font-mono"><i class="fi fi-rr-globe"></i> ALL</span>
                <span style="font-size: 0.85rem; margin-left: 4px; font-weight: 600; color: var(--accent-emerald);">Platform Global</span>
              `}
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="badge ${t.is_active ? 'badge-success' : 'badge-danger'}">
                  ${t.is_active ? 'Active' : 'Suspended'}
                </span>
                <button class="btn btn-outline btn-sm" onclick="SuperAdmin.toggleTrainerStatus(${t.id})" style="padding: 2px 6px; font-size: 0.68rem;" title="${t.is_active ? 'Deactivate Trainer' : 'Activate Trainer'}">
                  ${t.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </td>
            <td>
              <div style="margin-bottom: 4px;">
                <span class="badge ${assignedList.length > 0 ? 'badge-sky' : 'badge-warning'}" style="font-weight: 600;">
                  ${assignedList.length} Class${assignedList.length === 1 ? '' : 'es'}
                </span>
              </div>
              <div style="display: flex; flex-wrap: wrap; max-width: 320px;">
                ${courseChips}
              </div>
            </td>
            <td style="text-align: right;">
              <div class="flex items-center justify-end gap-2">
                <button class="btn btn-primary btn-sm" onclick="SuperAdmin.openQuickAssignModal(${t.id})" title="Assign this trainer to a course" style="white-space: nowrap; font-weight: 600;">
                  <i class="fi fi-rr-link"></i> Assign to Class
                </button>
                <button class="btn btn-danger btn-sm" onclick="SuperAdmin.deleteTrainer(${t.id}, '${(t.first_name + ' ' + t.last_name).replace(/'/g, "\\'")}')" title="Delete trainer account">
                  ✕
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      contentArea.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Trainer / Instructor</th>
              <th>Campus Affiliation</th>
              <th>Status</th>
              <th>Assigned Classes & Workload</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">No trainers found matching your filters. Click "+ Create New Trainer" to add one.</td></tr>'}
          </tbody>
        </table>
      `;
    } else {
      // Course Assignment Matrix Tab
      let filteredCourses = courses.filter(c => {
        const matchesSearch = !searchTerm ||
          (c.title || '').toLowerCase().includes(searchTerm) ||
          (c.code || '').toLowerCase().includes(searchTerm) ||
          (c.trainer_name || '').toLowerCase().includes(searchTerm) ||
          (c.category || '').toLowerCase().includes(searchTerm);

        const matchesCollege = !collegeIdFilter || String(c.college_id) === String(collegeIdFilter);
        return matchesSearch && matchesCollege;
      });

      const rows = filteredCourses.map(c => {
        const isAssigned = c.trainer_id || (c.trainer_name && c.trainer_name !== 'Not Assigned');
        const trainerDisplay = isAssigned ? `
          <div class="flex items-center gap-2">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;">
              ${(c.trainer_name || 'T').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${c.trainer_name}</div>
              <div class="text-muted" style="font-size: 0.72rem;">${c.trainer_email || 'Assigned Instructor'}</div>
            </div>
          </div>
        ` : `
          <span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px dashed rgba(245, 158, 11, 0.4); font-size: 0.76rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fi fi-rr-user-slash" style="font-size: 0.75rem;"></i> Not Assigned
          </span>
        `;

        return `
          <tr>
            <td><span class="badge badge-primary font-mono">${c.code}</span></td>
            <td>
              <div class="flex items-center gap-3">
                <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 45px; height: 32px; border-radius: 4px; object-fit: cover;" />
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem;">${c.title}</div>
                  <div class="text-muted" style="font-size: 0.74rem;">${c.category} • ${c.duration || '6 Weeks'}</div>
                </div>
              </div>
            </td>
            <td>
              ${!c.college_id ? `
                <span class="badge badge-success font-mono">ALL</span>
                <span style="font-size: 0.85rem; margin-left: 4px;">Global</span>
              ` : `
                <span class="badge badge-info font-mono">${c.college_code || 'COL'}</span>
                <span style="font-size: 0.85rem; margin-left: 4px;">${c.college_name || 'Campus'}</span>
              `}
            </td>
            <td>${trainerDisplay}</td>
            <td style="text-align: right;">
              <button class="btn btn-primary btn-sm" onclick="SuperAdmin.openAssignTrainerModal(${c.id})" title="Assign or change instructor" style="font-weight: 600; white-space: nowrap;">
                <i class="fi fi-rr-user-add"></i> ${isAssigned ? 'Change Trainer' : 'Assign Trainer'}
              </button>
            </td>
          </tr>
        `;
      }).join('');

      contentArea.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Class / Curriculum</th>
              <th>Target College</th>
              <th>Current Assigned Trainer</th>
              <th style="text-align: right;">Allocation Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">No classes found matching your filters.</td></tr>'}
          </tbody>
        </table>
      `;
    }
  },

  async toggleTrainerStatus(trainerId) {
    try {
      const res = await API.put(`/api/courses/trainers/${trainerId}/toggle-status`, {});
      API.toast(res.message || 'Trainer status updated successfully', 'success');
      await this.fetchAndRenderTrainersData();
    } catch (err) {
      console.error(err);
      API.toast(err.message || 'Failed to update trainer status', 'error');
    }
  },

  async deleteTrainer(trainerId, trainerName) {
    const confirmed = confirm(`Are you sure you want to delete trainer account "${trainerName}"? This will permanently remove the account and unassign them from any active classes.`);
    if (!confirmed) return;

    try {
      const res = await API.delete(`/api/courses/trainers/${trainerId}`);
      API.toast(res.message || 'Trainer deleted successfully', 'success');
      await this.fetchAndRenderTrainersData();
    } catch (err) {
      console.error(err);
      API.toast(err.message || 'Failed to delete trainer', 'error');
    }
  },

  async openQuickAssignModal(preselectedTrainerId = null, preselectedCourseId = null) {
    try {
      App.showModal(`
        <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
          <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
            <i class="fi fi-rr-link" style="color: var(--primary);"></i> Quick Course & Trainer Allocation
          </h3>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 2.5rem; text-align: center;">
          <div class="spinner"></div>
          <div style="margin-top: 1rem; color: var(--text-muted);">Loading courses and trainer roster...</div>
        </div>
      `, 'modal-md');

      const [courses, trainers] = await Promise.all([
        API.get('/api/courses'),
        API.get('/api/courses/trainers')
      ]);

      const courseOptions = (courses || []).map(c => {
        const isSelected = preselectedCourseId && String(c.id) === String(preselectedCourseId);
        const assignedNote = (c.trainer_name && c.trainer_name !== 'Not Assigned') ? `(Current: ${c.trainer_name})` : `(Unassigned)`;
        return `
          <option value="${c.id}" ${isSelected ? 'selected' : ''}>
            [${c.code}] ${c.title} — ${assignedNote}
          </option>
        `;
      }).join('');

      const trainerOptions = (trainers || []).map(t => {
        const isSelected = preselectedTrainerId && String(t.id) === String(preselectedTrainerId);
        const workload = `${t.assigned_courses_count || 0} active class${t.assigned_courses_count === 1 ? '' : 'es'}`;
        return `
          <option value="${t.id}" ${isSelected ? 'selected' : ''} data-name="${t.first_name} ${t.last_name}">
            ${t.first_name} ${t.last_name} (${t.college_code || 'GLOBAL'}) — [${workload}]
          </option>
        `;
      }).join('');

      App.showModal(`
        <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
          <div>
            <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Course Allocation Hub</div>
            <h3 style="margin: 2px 0 0 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
              <i class="fi fi-rr-link" style="color: var(--primary);"></i> Assign Trainer to Class
            </h3>
          </div>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>

        <form id="sa-quick-assign-form" onsubmit="event.preventDefault(); SuperAdmin.submitQuickAssign();">
          <div class="modal-body" style="padding: 1.4rem;">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" style="font-weight: 600;">Select Target Class / Course <span style="color: var(--accent-rose);">*</span></label>
              <select id="quick-assign-course-id" class="form-select" style="width: 100%; padding: 9px 12px;" required>
                <option value="">-- Select Course --</option>
                ${courseOptions}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 4px;">
                <label class="form-label" style="font-weight: 600; margin: 0;">Select Trainer to Assign <span style="color: var(--accent-rose);">*</span></label>
                <button type="button" class="btn btn-outline btn-sm" onclick="SuperAdmin.openCreateTrainerModal()" style="font-size: 0.75rem; padding: 2px 8px; color: var(--primary); font-weight: 600;">
                  <i class="fi fi-rr-plus"></i> + Create New Trainer
                </button>
              </div>
              <select id="quick-assign-trainer-id" class="form-select" style="width: 100%; padding: 9px 12px;" required>
                <option value="">-- Choose a Trainer --</option>
                ${trainerOptions}
              </select>
              <div class="text-muted" style="font-size: 0.72rem; margin-top: 4px;">
                Only active trainers and instructors are listed.
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label" style="font-weight: 600;">Assignment Notes (Optional)</label>
              <input type="text" id="quick-assign-notes" class="form-input" placeholder="e.g. Lead Instructor for Fall 2026 Term" style="width: 100%; font-size: 0.85rem;" />
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding: 1rem 1.4rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-quick-assign">
              <i class="fi fi-rr-check"></i> Confirm Assignment
            </button>
          </div>
        </form>
      `, 'modal-md');
    } catch (err) {
      console.error(err);
      API.toast('Failed to load allocation roster: ' + (err.message || err), 'error');
    }
  },

  async submitQuickAssign() {
    const courseSelect = document.getElementById('quick-assign-course-id');
    const trainerSelect = document.getElementById('quick-assign-trainer-id');
    const notesInput = document.getElementById('quick-assign-notes');
    const submitBtn = document.getElementById('btn-submit-quick-assign');

    const courseId = courseSelect?.value;
    const trainerId = trainerSelect?.value;
    const notes = notesInput?.value?.trim() || null;

    if (!courseId || !trainerId) {
      API.toast('Please select both a course and a trainer', 'warning');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-sm"></span> Assigning...';
    }

    try {
      const res = await API.post(`/api/courses/${courseId}/assign-trainer`, {
        trainer_id: parseInt(trainerId),
        notes: notes
      });

      API.toast(res.message || 'Trainer assigned successfully!', 'success');
      App.closeModal();

      if (App.currentRoute === 'trainers') {
        await this.fetchAndRenderTrainersData();
      } else {
        await this.renderGlobalCoursesView();
      }
    } catch (err) {
      console.error(err);
      API.toast(err.message || 'Failed to assign trainer', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fi fi-rr-check"></i> Confirm Assignment';
      }
    }
  },

  async renderAdminsView() {
    const container = document.getElementById('super-admin-content');
    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>College Administrators</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Assign and manage institutional administrators for each college tenant</p>
        </div>
        <button class="btn btn-primary" onclick="SuperAdmin.openCreateAdminModal()">
          + Assign New College Admin
        </button>
      </div>

      <div class="card">
        <div id="sa-admins-table" class="table-container">
          <div style="padding: 2rem; text-align: center;">Loading administrators...</div>
        </div>
      </div>
    `;

    const admins = await API.get('/api/admins');
    const rows = admins.map(a => `
      <tr>
        <td>
          <div style="font-weight: 700;">${a.first_name} ${a.last_name}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${a.email}</div>
        </td>
        <td>
          <span class="badge badge-primary font-mono">${a.college_code}</span>
          <span style="font-size: 0.85rem; margin-left: 6px;">${a.college_name}</span>
        </td>
        <td>${a.designation || 'Administrator'}</td>
        <td>${a.department || 'Academic Affairs'}</td>
        <td>
          <span class="badge ${a.is_active ? 'badge-success' : 'badge-danger'}">
            ${a.is_active ? 'Active' : 'Suspended'}
          </span>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="SuperAdmin.deleteAdmin(${a.user_id}, '${a.email}')">Remove</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('sa-admins-table').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Administrator</th>
            <th>Assigned College</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="text-center">No administrators registered</td></tr>'}</tbody>
      </table>
    `;
  },

  async openCreateCollegeModal() {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>Create New College Organization</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Register a new institutional tenant in the system.</p>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <form id="create-college-form" onsubmit="SuperAdmin.handleCreateCollege(event)">
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">College / Institution Name *</label>
              <input type="text" class="form-input" name="name" required placeholder="e.g. Bannari Amman Institute of Technology" />
            </div>
            <div class="form-group">
              <label class="form-label">College Code *</label>
              <input type="text" class="form-input font-mono" name="code" required placeholder="e.g. BIT" style="text-transform: uppercase;" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Official Domain (Optional)</label>
              <input type="text" class="form-input" name="domain" placeholder="e.g. bitsathy.ac.in" />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Email (Optional)</label>
              <input type="email" class="form-input" name="contact_email" placeholder="dean@bitsathy.ac.in" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Logo Image URL (Optional)</label>
            <input type="url" class="form-input" name="logo_url" placeholder="https://images.unsplash.com/photo-..." />
          </div>
  async renderGlobalCoursesView() {
    const container = document.getElementById('super-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Global Course Curriculum & Catalog</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Create, structure modules, upload materials, and publish training programs across all colleges</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline" onclick="SuperAdmin.openCreateTrainerModal()" title="Register a new trainer account">
            <i class="fi fi-rr-user-add"></i> + Create Trainer
          </button>
          <button class="btn btn-primary" onclick="SuperAdmin.openCreateCourseModal()">
            <i class="fi fi-rr-plus"></i> Create New Course
          </button>
        </div>
      </div>

      <div class="card">
        <div id="sa-global-courses-table" class="table-container">
          <div style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading courses...</div>
        </div>
      </div>
    `;

    try {
      const courses = await API.get('/api/courses');
      const rows = (courses || []).map(c => {
        const isAssigned = c.trainer_id || (c.trainer_name && c.trainer_name !== 'Not Assigned');
        const trainerDisplay = isAssigned ? `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;">
                ${(c.trainer_name || 'T').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
              </div>
              <div style="min-width: 0;">
                <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${c.trainer_name}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${c.trainer_email || 'Assigned Trainer'}</div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button class="btn btn-outline btn-sm" onclick="SuperAdmin.openAssignTrainerModal(${c.id})" style="padding: 2px 6px; font-size: 0.7rem;" title="Change Trainer">
                <i class="fi fi-rr-edit"></i>
              </button>
              <button class="btn btn-outline btn-sm" onclick="SuperAdmin.openCreateTrainerModal(${c.id})" style="padding: 2px 6px; font-size: 0.7rem; color: var(--primary);" title="Create New Trainer & Assign to this Class">
                + New
              </button>
            </div>
          </div>
        ` : `
          <div>
            <span class="badge" style="background: rgba(148, 163, 184, 0.12); color: var(--text-muted); border: 1px dashed rgba(148, 163, 184, 0.4); font-size: 0.76rem; padding: 3px 6px; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fi fi-rr-user-slash" style="font-size: 0.7rem;"></i> Not Assigned
            </span>
            <div class="flex items-center gap-1" style="margin-top: 5px;">
            <label class="form-label">Assign to College *</label>
            <select class="form-select" name="college_id" required>
              ${options}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input type="text" class="form-input" name="first_name" required placeholder="Jane" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input type="text" class="form-input" name="last_name" required placeholder="Doe" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Admin Email *</label>
            <input type="email" class="form-input" name="email" required placeholder="admin@college.edu" />
          </div>
          <div class="form-group">
            <label class="form-label">Initial Password *</label>
            <input type="password" class="form-input" name="password" required value="Password@123" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Department</label>
              <input type="text" class="form-input" name="department" placeholder="e.g. Computer Science" />
            </div>
            <div class="form-group">
              <label class="form-label">Designation</label>
              <input type="text" class="form-input" name="designation" placeholder="e.g. Dean of Studies" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Admin Account</button>
        </div>
      </form>
    `);
  },

  async handleCreateAdmin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = {
      college_id: parseInt(formData.get('college_id')),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      password: formData.get('password'),
      department: formData.get('department'),
      designation: formData.get('designation')
    };

    try {
      await API.post('/api/admins', body);
      API.toast('College Admin created successfully!', 'success');
      App.closeModal();
      this.renderAdminsView();
    } catch (err) {
      console.error(err);
    }
  },

  async toggleCollegeStatus(collegeId) {
    try {
      const res = await API.patch(`/api/colleges/${collegeId}/toggle-status`);
      API.toast(res.message, 'success');
      this.renderCollegesView();
    } catch (err) {
      console.error(err);
    }
  },

  async deleteCollege(collegeId, name) {
    App.showDangerConfirmModal({
      title: 'Are you sure?',
      warningBanner: "Unexpected bad things will happen if you don't read this!",
      itemName: name,
      itemType: 'college',
      description: `This action <strong>CANNOT</strong> be undone. This will permanently delete the <strong>${name}</strong> tenant, including all associated students, faculty, departments, and course records.`,
      confirmButtonText: 'I understand, delete this college',
      onConfirm: async () => {
        await API.delete(`/api/colleges/${collegeId}`);
        API.toast(`College '${name}' deleted successfully.`, 'info');
        this.renderCollegesView();
      }
    });
  },

  async deleteAdmin(userId, email) {
    if (!confirm(`Remove admin account '${email}'?`)) return;
    try {
      await API.delete(`/api/admins/${userId}`);
      API.toast('Admin deleted.', 'info');
      this.renderAdminsView();
    } catch (err) {
      console.error(err);
    }
  },

  async renderGlobalStudentsView() {
    const container = document.getElementById('super-admin-content');
    
    // Load courses and colleges for filter dropdowns
    const [colleges, courses] = await Promise.all([
      API.get('/api/colleges'),
      API.get('/api/courses')
    ]);

    this.cachedGlobalCourses = courses || [];
    this.cachedGlobalColleges = colleges || [];
    this.selectedGlobalCourseId = '';

    container.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 4px;">Global Students Directory</h2>
        <p class="text-secondary" style="font-size: 0.85rem;">Inspect enrolled students across all registered colleges and universities</p>
      </div>
      
      <!-- Filter Toolbar Matching Reference Design -->
      <div class="filter-toolbar-row">
        
        <!-- Choose Course Pill Dropdown -->
        <div class="pill-filter-group" style="position: relative;">
          <span class="pill-filter-label">Choose course:</span>
          
          <button type="button" id="sa-course-pill-trigger" class="pill-dropdown-trigger" onclick="SuperAdmin.toggleCourseDropdownMenu(event)">
            <span class="pill-dropdown-icon">
              <img src="/static/img/logo.png" alt="Course" style="width: 18px; height: 18px; border-radius: 4px; object-fit: cover;" />
            </span>
            <span id="sa-course-pill-label" style="font-weight: 600;">All Courses</span>
            <span class="pill-dropdown-arrow">▾</span>
          </button>

          <!-- Floating Pill Dropdown Menu -->
          <div id="sa-course-pill-menu" class="pill-dropdown-menu" style="display: none;" onclick="event.stopPropagation()">
            <div style="padding: 4px 8px 6px; border-bottom: 1px solid var(--border-color); margin-bottom: 4px;">
              <input type="text" id="sa-course-search-filter" class="form-input" placeholder="Search course..." style="font-size: 0.78rem; padding: 4px 8px; height: 28px; border-radius: 6px;" oninput="SuperAdmin.filterCourseDropdownList(this.value)" />
            </div>
            
            <button type="button" class="pill-dropdown-item selected" data-id="" onclick="SuperAdmin.selectCourseFilter('', 'All Courses', '')">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.9rem;">⚡</span>
                <div>
                  <div style="font-weight: 600;">All Courses</div>
                  <div class="text-muted" style="font-size: 0.72rem;">All Course IDs</div>
                </div>
              </div>
              <span class="badge badge-sm badge-primary">ALL</span>
            </button>

            <div id="sa-course-dropdown-items">
              ${this.cachedGlobalCourses.map(c => `
                <button type="button" class="pill-dropdown-item" data-id="${c.id}" onclick="SuperAdmin.selectCourseFilter('${c.id}', '${c.title.replace(/'/g, "\\'")}', '${c.code || ''}')">
                  <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                    <span class="badge badge-primary font-mono" style="font-size: 0.72rem; padding: 2px 6px;">ID: ${c.id}</span>
                    <div style="min-width: 0; text-align: left;">
                      <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.title}</div>
                      <div class="text-muted" style="font-size: 0.72rem;">${c.code || 'Course'} • ${c.college_name || 'Global'}</div>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Institution Filter -->
        <div class="pill-filter-group">
          <span class="pill-filter-label">Institution:</span>
          <select id="sa-student-college-filter" class="pill-select-input" onchange="SuperAdmin.fetchGlobalStudentsTable()">
            <option value="">All Institutions</option>
            ${this.cachedGlobalColleges.map(col => `<option value="${col.id}">${col.name} (${col.code})</option>`).join('')}
          </select>
        </div>

        <!-- Search Input -->
        <div style="position: relative;">
          <input type="text" id="sa-student-search-input" class="pill-search-input" placeholder="Search name, roll..." oninput="SuperAdmin.fetchGlobalStudentsTable()" />
          <span style="position: absolute; left: 12px; top: 9px; color: var(--text-muted); font-size: 0.82rem; pointer-events: none;">
            <i class="fi fi-rr-search"></i>
          </span>
        </div>

        <!-- Reset Button -->
        <button type="button" class="pill-reset-btn" onclick="SuperAdmin.resetGlobalStudentsFilter()" title="Reset all filters">
          <i class="fi fi-rr-refresh"></i> Reset
        </button>
      </div>

      <!-- Active Filter Banner Area -->
      <div id="sa-student-filter-banner" style="display: none; margin-bottom: 1rem;"></div>

      <div class="card">
        <div id="sa-global-students-table" class="table-container">
          <div style="padding: 2rem; text-align: center;"><div class="spinner-sm"></div> Loading global students...</div>
        </div>
      </div>
    `;

    // Global document click listener to close dropdown when clicking outside
    if (!this._hasPillDropdownListener) {
      document.addEventListener('click', (e) => {
        const trigger = document.getElementById('sa-course-pill-trigger');
        const menu = document.getElementById('sa-course-pill-menu');
        if (menu && trigger && !trigger.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
          trigger.classList.remove('active');
        }
      });
      this._hasPillDropdownListener = true;
    }

    await this.fetchGlobalStudentsTable();
  },

  toggleCourseDropdownMenu(event) {
    event.stopPropagation();
    const trigger = document.getElementById('sa-course-pill-trigger');
    const menu = document.getElementById('sa-course-pill-menu');
    if (!menu || !trigger) return;

    const isOpen = menu.style.display === 'flex' || menu.style.display === 'block';
    if (isOpen) {
      menu.style.display = 'none';
      trigger.classList.remove('active');
    } else {
      menu.style.display = 'flex';
      trigger.classList.add('active');
      const search = document.getElementById('sa-course-search-filter');
      if (search) {
        search.value = '';
        this.filterCourseDropdownList('');
        setTimeout(() => search.focus(), 50);
      }
    }
  },

  filterCourseDropdownList(query) {
    const term = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('#sa-course-dropdown-items .pill-dropdown-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = (!term || text.includes(term)) ? 'flex' : 'none';
    });
  },

  selectCourseFilter(courseId, courseTitle, courseCode) {
    this.selectedGlobalCourseId = courseId || '';
    
    // Update trigger UI
    const label = document.getElementById('sa-course-pill-label');
    const trigger = document.getElementById('sa-course-pill-trigger');
    const menu = document.getElementById('sa-course-pill-menu');

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
    const items = document.querySelectorAll('#sa-course-pill-menu .pill-dropdown-item');
    items.forEach(item => {
      const id = item.getAttribute('data-id');
      if (String(id) === String(courseId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this.fetchGlobalStudentsTable();
  },

  async fetchGlobalStudentsTable() {
    const tableContainer = document.getElementById('sa-global-students-table');
    const bannerContainer = document.getElementById('sa-student-filter-banner');
    if (!tableContainer) return;

    const courseId = this.selectedGlobalCourseId || '';
    const collegeSelect = document.getElementById('sa-student-college-filter');
    const searchInput = document.getElementById('sa-student-search-input');

    const collegeId = collegeSelect ? collegeSelect.value : '';
    const search = searchInput ? searchInput.value.trim() : '';

    tableContainer.innerHTML = '<div style="padding: 2rem; text-align: center;"><div class="spinner-sm"></div> Fetching students...</div>';

    try {
      const q = new URLSearchParams();
      if (courseId) q.append('course_id', courseId);
      if (collegeId) q.append('college_id', collegeId);
      if (search) q.append('search', search);

      const students = await API.get('/api/students?' + q.toString());

      // Update Active Filter Banner
      if (bannerContainer) {
        if (courseId) {
          const selectedCourse = this.cachedGlobalCourses.find(c => String(c.id) === String(courseId));
          const courseTitle = selectedCourse ? selectedCourse.title : `ID ${courseId}`;
          const courseCode = selectedCourse ? selectedCourse.code : '';
          bannerContainer.style.display = 'block';
          bannerContainer.innerHTML = `
            <div style="background: rgba(99, 102, 241, 0.08); border: 1.5px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-primary font-mono" style="font-weight: 700; font-size: 0.82rem;">Course ID: ${courseId}</span>
                <span>Filtered by Course: <strong>${courseTitle}</strong> ${courseCode ? `(${courseCode})` : ''}</span>
                <span class="badge badge-info" style="margin-left: 4px;">${students.length} Student${students.length === 1 ? '' : 's'} Enrolled</span>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="SuperAdmin.selectCourseFilter('', 'All Courses', '')" style="font-size: 0.78rem; padding: 3px 10px; color: var(--primary);">
                Clear Course Filter ✕
              </button>
            </div>
          `;
        } else {
          bannerContainer.style.display = 'none';
        }
      }

      const rows = students.map(s => `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${s.first_name} ${s.last_name}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${s.email}</div>
          </td>
          <td>
            <span class="badge badge-primary font-mono">${s.college_code}</span>
            <span style="font-size: 0.85rem; margin-left: 4px;">${s.college_name}</span>
          </td>
          <td><span class="badge badge-purple font-mono">${s.roll_number}</span></td>
          <td>${s.department}</td>
          <td>Year ${s.year_of_study}</td>
          <td><span class="badge badge-info font-mono">${s.enrolled_courses_count || 0} Courses</span></td>
          <td><span class="badge badge-amber font-mono">${s.certificates_count || 0} Certs</span></td>
          <td style="text-align: right;">
            <button class="btn btn-ghost btn-sm" onclick="SuperAdmin.viewStudentProfileModal(${s.student_id})" title="Inspect Student Profile" style="padding: 4px 8px;">
              <i class="fi fi-rr-eye"></i> View
            </button>
          </td>
        </tr>
      `).join('');

      tableContainer.innerHTML = `
        <table class="data-table">
        this.cachedColleges = colleges || [];
      } catch (e) {
        colleges = [];
      }
    }

    let courseTitle = '';
    if (targetCourseId) {
      try {
        const course = await API.get(`/api/courses/${targetCourseId}`);
        courseTitle = course ? course.title : '';
      } catch (e) {
        console.warn(e);
      }
    }

    const collegeOptions = colleges.map(col => `
      <option value="${col.id}">${col.name} (${col.code || 'COL'})</option>
    `).join('');

    App.showModal(`
      <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
        <div>
          <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Super Admin User Management</div>
          <h3 style="margin: 2px 0 0 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
            <i class="fi fi-rr-user-add" style="color: var(--primary);"></i> Create New Trainer Account
          </h3>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>

      <form id="sa-create-trainer-form" onsubmit="event.preventDefault(); SuperAdmin.submitCreateTrainer(${targetCourseId}, ${fromStudio});">
        <div class="modal-body" style="padding: 1.4rem; max-height: 75vh; overflow-y: auto;">
          ${targetCourseId && courseTitle ? `
            <div style="background: var(--primary-light); border: 1.5px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 14px; margin-bottom: 1.25rem; font-size: 0.84rem; display: flex; align-items: center; gap: 8px;">
              <i class="fi fi-rr-info" style="color: var(--primary); font-size: 1.1rem;"></i>
              <div>
                Creating this trainer will allow you to assign them directly to <strong>${courseTitle}</strong>.
              </div>
            </div>
          ` : ''}

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">First Name <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="new-trainer-first-name" class="form-input" placeholder="e.g. Elena" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Last Name <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="new-trainer-last-name" class="form-input" placeholder="e.g. Rostova" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Email Address <span style="color: var(--accent-rose);">*</span></label>
              <input type="email" id="new-trainer-email" class="form-input" placeholder="e.g. elena.trainer@platform.edu" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Phone Number (Optional)</label>
              <input type="tel" id="new-trainer-phone" class="form-input" placeholder="e.g. +1 555-0199" />
          <td>
            <span class="badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}">${e.status}</span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="progress-bar" style="flex: 1; height: 6px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                <div style="width: ${Math.round(e.progress_percentage)}%; height: 100%; background: var(--primary);"></div>
              </div>
              <span style="font-size: 0.8rem; font-weight: 600;">${Math.round(e.progress_percentage)}%</span>
            </div>
          </td>
          <td>${e.certificate_code ? `<span class="badge badge-amber font-mono">${e.certificate_code}</span>` : '—'}</td>
        </tr>
      `).join('');

      App.showModal(`
        <div class="modal-header">
          <h3>Student Profile: ${s.first_name} ${s.last_name}</h3>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.5rem; background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
            <div><span class="text-muted" style="font-size: 0.8rem;">Roll Number:</span> <strong class="font-mono">${s.roll_number}</strong></div>
            <div><span class="text-muted" style="font-size: 0.8rem;">Email:</span> <strong>${s.email}</strong></div>
            <div><span class="text-muted" style="font-size: 0.8rem;">Institution:</span> <strong>${s.college_name} (${s.college_code})</strong></div>
            <div><span class="text-muted" style="font-size: 0.8rem;">Department:</span> <strong>${s.department}</strong></div>
            <div><span class="text-muted" style="font-size: 0.8rem;">Year / Batch:</span> <strong>Year ${s.year_of_study} (${s.batch || '—'})</strong></div>
            <div><span class="text-muted" style="font-size: 0.8rem;">Joined:</span> <strong>${new Date(s.created_at).toLocaleDateString()}</strong></div>
          </div>

          <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
            <i class="fi fi-rr-book-alt" style="color: var(--primary);"></i> Enrolled Courses & Learning Progress
          </h4>
          <div class="table-container" style="margin-bottom: 1rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Course (ID & Title)</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>${enrollRows || '<tr><td colspan="4" class="text-center">Not enrolled in any courses yet</td></tr>'}</tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        </div>
      `, 'modal-lg');
    } catch (err) {
      console.error(err);
      API.toast('Failed to load student profile', 'error');
    }
  },

  // =========================================================================
  // GLOBAL COURSE CREATION WIZARD & CURRICULUM MANAGEMENT
  // =========================================================================
  saveWizardState() {
    if (this.activeCourseWizard && this.activeCourseWizard.course) {
      sessionStorage.setItem('super_admin_course_wizard_state', JSON.stringify({
        courseId: this.activeCourseWizard.course.id,
        step: this.activeWizardStep || 1,
        isOpen: true,
        title: this.activeCourseWizard.course.title || 'Untitled Course'
      }));
    }
  },

  clearWizardState() {
    sessionStorage.removeItem('super_admin_course_wizard_state');
  },

  closeWizardModal() {
    this.clearWizardState();
    App.closeModal();
    this.renderGlobalCoursesView();
  },

  async resumeCourseWizard(courseId) {
    this.clearWizardState();
    this.startCourseWizard(courseId);
  },

  async renderGlobalCoursesView() {
    this.clearWizardState();
    const container = document.getElementById('super-admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between" style="margin-bottom: 1.5rem;">
        <div>
          <h2>Global Course Curriculum & Catalog</h2>
          <p class="text-secondary" style="font-size: 0.85rem;">Create, structure modules, upload materials, and publish training programs across all colleges</p>
        </div>
        <button class="btn btn-primary" onclick="SuperAdmin.startCourseWizard()">
          <i class="fi fi-rr-plus"></i> Create New Course
        </button>
      </div>

      <div class="card">
        <div id="sa-global-courses-table" class="table-container">
          <div style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading courses...</div>
        </div>
      </div>
    `;

    try {
      const courses = await API.get('/api/courses');
      const rows = (courses || []).map(c => `
        <tr>
          <td><span class="badge badge-primary font-mono">${c.code}</span></td>
          <td>
            <div class="flex items-center gap-3">
              <img src="${c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}" style="width: 50px; height: 35px; border-radius: 4px; object-fit: cover;" />
              <div>
                <div style="font-weight: 700;">${c.title}</div>
      trainers = await API.get('/api/courses/trainers');
    } catch (e) {
      trainers = [];
    }

    const collegeOptions = (colleges || []).map(col => `
      <option value="${col.id}">[${col.code}] ${col.name}</option>
    `).join('');

    const trainerOptions = (trainers || []).map(t => `
      <option value="${t.id}">${t.first_name} ${t.last_name} (${t.college_code || 'GLOBAL'})</option>
    `).join('');

    App.showModal(`
      <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
        <div>
          <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Curriculum & Classes</div>
          <h3 style="margin: 2px 0 0 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
            <i class="fi fi-rr-book-alt" style="color: var(--primary);"></i> Create New Course / Class
          </h3>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>

      <form id="sa-create-course-form" onsubmit="SuperAdmin.submitCreateCourse(event)">
        <div class="modal-body" style="padding: 1.4rem; max-height: 75vh; overflow-y: auto;">
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Course Title <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="ncc-title" class="form-input" placeholder="e.g. Artificial Intelligence & Robotics" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Course Code <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="ncc-code" class="form-input font-mono" placeholder="e.g. AI-201" style="text-transform: uppercase;" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Target Institution</label>
              <select id="ncc-college" class="form-select" style="width: 100%;">

      document.getElementById('sa-global-courses-table').innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Title</th>
              <th>Target College</th>
              <th>Structure</th>
              <th>Enrollments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" class="text-center">No courses created yet. Click "Create New Course" above.</td></tr>'}</tbody>
        </table>
      `;
    } catch (err) {
      console.error(err);
      document.getElementById('sa-global-courses-table').innerHTML = `
        <div class="p-4 text-center text-danger">Failed to load global courses: ${err.message || err}</div>
      `;
    }
  },

  // =========================================================================
  // MODERN COURSE STUDIO & CURRICULUM BUILDER (Figma LMS Style)
  // =========================================================================

  async startCourseWizard(courseId = null) {
    this.activeStudioTab = 'content';
    this.activeCourseStudio = null;

    try {
      const [colleges, trainers] = await Promise.all([
        API.get('/api/colleges').catch(() => []),
        API.get('/api/courses/trainers').catch(() => [])
      ]);
      this.cachedColleges = colleges || [];
      this.cachedTrainers = trainers || [];

      if (courseId) {
        const data = await API.get(`/api/courses/${courseId}`);
        this.activeCourseStudio = data;
      } else {
        // Create initial draft course so the studio opens immediately ready with Section 1
        const draft = await API.post('/api/courses', {
          title: 'Figma UI UX Design Essentials',
          code: 'FIGMA-101',
          description: 'Master Figma UI/UX design workflows, wireframing, interactive prototyping, and component design systems.',
          category: 'Computer Science',
          level: 'Beginner',
          duration: '6 Weeks',
          instructor_name: 'Dr. Jane Doe',
          thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
          learning_objectives: '1. Master Figma Auto-Layout & Component Variants\n2. Design High-Fidelity UI Systems\n3. Build Interactive Prototypes with Usability Testing',
          batch: 'All Batches',
          visibility: 'public',
          passing_percentage: 60,
          certificate_enabled: true,
          status: 'draft'
        });

        // Create Section 1 by default to replicate screenshot perfectly
        await API.post(`/api/modules/course/${draft.id}`, {
          title: 'Section 1',
          description: ''
        });

        this.activeCourseStudio = await API.get(`/api/courses/${draft.id}`);
      }

      App.showView('course-studio-view');
      this.renderCourseStudio();
    } catch (err) {
      console.error(err);
      API.toast('Failed to initialize Course Studio', 'error');
    }
  },

  async editCourseWizard(courseId) {
    this.startCourseWizard(courseId);
  },

  closeCourseStudio() {
    this.activeCourseStudio = null;
    App.showView('super-admin-view');
    this.renderGlobalCoursesView();
  },

  async reloadStudioData() {
    if (!this.activeCourseStudio || !this.activeCourseStudio.course) return;
    const courseId = this.activeCourseStudio.course.id;
    this.activeCourseStudio = await API.get(`/api/courses/${courseId}`);
    this.renderCourseStudio();
  },

  setStudioTab(tab) {
    if (this.activeStudioTab === 'landing') {
      this.persistLandingPageFormState();
    } else if (this.activeStudioTab === 'settings') {
      this.persistSettingsFormState();
    }
    this.activeStudioTab = tab;
    this.renderCourseStudio();
  },

  persistLandingPageFormState() {
    const form = document.getElementById('studio-landing-form');
    if (!form || !this.activeCourseStudio || !this.activeCourseStudio.course) return;
    const fd = new FormData(form);
    const c = this.activeCourseStudio.course;

    const rawCollegeId = fd.get('college_id');
    let collegeId = null;
    if (rawCollegeId && rawCollegeId !== 'all' && rawCollegeId !== '0') {
      collegeId = parseInt(rawCollegeId);
    }

    const rawBatch = fd.get('batch');
    let batch = rawBatch;
    if (rawBatch === 'custom') {
      batch = (fd.get('custom_batch') || '').trim() || 'All Batches';
    }

    const payload = {
      college_id: collegeId,
      title: (fd.get('title') || c.title || '').trim(),
      code: (fd.get('code') || c.code || '').trim().toUpperCase(),
      description: fd.get('description') || '',
      category: fd.get('category') || c.category || 'Computer Science',
      level: fd.get('level') || c.level || 'Beginner',
      duration: fd.get('duration') || c.duration || '6 Weeks',
      instructor_name: fd.get('instructor_name') || c.instructor_name || '',
      thumbnail_url: fd.get('thumbnail_url') || c.thumbnail_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
      learning_objectives: fd.get('learning_objectives') || '',
      batch: batch || 'All Batches',
      enrollment_type: c.enrollment_type || 'open',
      visibility: fd.get('visibility') || (collegeId ? 'college' : 'public'),
      passing_percentage: c.passing_percentage || 60,
      certificate_enabled: c.certificate_enabled !== 0,
      status: c.status || 'draft'
    };

    API.put(`/api/courses/${c.id}`, payload).then(res => {
      this.activeCourseStudio.course = { ...this.activeCourseStudio.course, ...payload };
    }).catch(err => console.error(err));
  },

  persistSettingsFormState() {
    const form = document.getElementById('studio-settings-form');
    if (!form || !this.activeCourseStudio || !this.activeCourseStudio.course) return;
    const fd = new FormData(form);
    const c = this.activeCourseStudio.course;

  async openEditCourseModal(courseId) {
    App.showModal(`
      <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
        <h3 style="margin: 0; font-size: 1.15rem;">Loading Course Details...</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 2.5rem; text-align: center;">
        <div class="spinner"></div>
      </div>
    `, 'modal-lg');

    try {
      const [data, colleges, trainers] = await Promise.all([
        API.get(`/api/courses/${courseId}`),
        API.get('/api/colleges').catch(() => []),
        API.get('/api/courses/trainers').catch(() => [])
      ]);

      const c = data.course || data;
      this.cachedColleges = colleges || [];

      const collegeOptions = (colleges || []).map(col => `
        <option value="${col.id}" ${c.college_id === col.id ? 'selected' : ''}>[${col.code}] ${col.name}</option>
      `).join('');

      const trainerOptions = (trainers || []).map(t => `
        <option value="${t.id}" ${c.trainer_id === t.id ? 'selected' : ''}>${t.first_name} ${t.last_name} (${t.college_code || 'GLOBAL'})</option>
      `).join('');

      const batches = ['All Batches', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'];
      const batchOptions = batches.map(b => `
        <option value="${b}" ${(c.batch || 'All Batches') === b ? 'selected' : ''}>${b}</option>
      `).join('');

      App.showModal(`
        <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding: 1.1rem 1.4rem;">
          <div>
            <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Edit Course Settings</div>
            <h3 style="margin: 2px 0 0 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
              <i class="fi fi-rr-edit" style="color: var(--primary);"></i> Edit Course: ${c.title}
            </h3>
          </div>
          <button class="icon-btn" onclick="App.closeModal()">✕</button>
        </div>

        <form id="sa-edit-course-form" onsubmit="SuperAdmin.submitEditCourse(event, ${courseId})">
          <div class="modal-body" style="padding: 1.4rem; max-height: 75vh; overflow-y: auto;">
            <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Course Title <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="ecc-title" class="form-input" value="${(c.title || '').replace(/"/g, '&quot;')}" required />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Course Code <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="ecc-code" class="form-input font-mono" value="${(c.code || '').replace(/"/g, '&quot;')}" style="text-transform: uppercase;" required />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Target Institution</label>
                <select id="ecc-college" class="form-select" style="width: 100%;">
                  <option value="" ${!c.college_id ? 'selected' : ''}>All Colleges (Universal Global Curriculum)</option>
                  ${collegeOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Target Batch</label>
                <select id="ecc-batch" class="form-select" style="width: 100%;">
                  ${batchOptions}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3" style="margin-bottom: 1rem;">
      console.error(err);
      API.toast('Failed to update published status', 'error');
    }
  },

  previewCourseAsStudent() {
    if (!this.activeCourseStudio || !this.activeCourseStudio.course) return;
    const courseId = this.activeCourseStudio.course.id;
    Player.openPlayer(courseId);
  },

  async saveStudioDraft() {
    if (this.activeStudioTab === 'landing') this.persistLandingPageFormState();
    if (this.activeStudioTab === 'settings') this.persistSettingsFormState();
    API.toast('✓ All changes saved as draft.', 'success');
  },

  async nextStudioTab() {
    if (this.activeStudioTab === 'content') {
      this.setStudioTab('landing');
    } else if (this.activeStudioTab === 'landing') {
      this.persistLandingPageFormState();
      this.setStudioTab('settings');
    } else if (this.activeStudioTab === 'settings') {
      this.persistSettingsFormState();
      if (!this.activeCourseStudio.course.is_published) {
        if (confirm('Ready to publish this course live to learners?')) {
          await this.toggleStudioPublish();
        } else {
          API.toast('Course saved as draft.', 'info');
        }
      }
      this.closeCourseStudio();
    }
  },

  renderCourseStudio() {
    const container = document.getElementById('course-studio-container');
    if (!container || !this.activeCourseStudio) return;

    const { course, modules = [], assessments = [] } = this.activeCourseStudio;
    const tab = this.activeStudioTab || 'content';

    container.innerHTML = `
      <div class="course-studio-wrapper">
        
        <!-- 1. Top Navigation Bar -->
        <header class="studio-topbar">
          <!-- Back Link -->
          <button class="studio-back-link" onclick="SuperAdmin.closeCourseStudio()" title="Return to Classes & Courses">
            <i class="fi fi-rr-arrow-left"></i>
            <span>Courses</span>
          </button>

          <!-- 3-Step Stepper -->
          <div class="studio-stepper">
            <!-- Step 1: Content -->
            <div class="studio-step-node ${tab === 'content' ? 'active' : (tab === 'landing' || tab === 'settings' ? 'completed' : '')}" onclick="SuperAdmin.setStudioTab('content')">
              <div class="studio-step-dot">
                <div class="studio-step-dot-inner"></div>
              </div>
              <span>Content</span>
            </div>

            <div class="studio-step-line"></div>

            <!-- Step 2: Landing page -->
            <div class="studio-step-node ${tab === 'landing' ? 'active' : (tab === 'settings' ? 'completed' : '')}" onclick="SuperAdmin.setStudioTab('landing')">
              <div class="studio-step-dot">
                <div class="studio-step-dot-inner"></div>
              </div>
              <span>Landing page</span>
            </div>

            <div class="studio-step-line"></div>

            <!-- Step 3: Settings -->
            <div class="studio-step-node ${tab === 'settings' ? 'active' : ''}" onclick="SuperAdmin.setStudioTab('settings')">
              <div class="studio-step-dot">
                <div class="studio-step-dot-inner"></div>
              </div>
              <span>Settings</span>
            </div>
          </div>

          <!-- Top Right Actions -->
          <div class="studio-top-actions">
            <button class="btn-studio-preview" onclick="SuperAdmin.previewCourseAsStudent()" title="Preview course as a learner">
              <i class="fi fi-rr-eye"></i>
              <span>View as student</span>
            </button>
            <button class="btn-studio-publish ${course.is_published ? 'published' : ''}" onclick="SuperAdmin.toggleStudioPublish()">
              <span>${course.is_published ? 'Published' : 'Publish'}</span>
            </button>
          </div>
        </header>

        <!-- 2. Main Studio Body -->
        <main class="studio-main-body">

          <!-- Course Title Header with Pencil Edit -->
          <div class="studio-title-header">
            <h1 class="studio-title-text" id="studio-title-display">${course.title || 'Untitled Course'}</h1>
            <button class="studio-title-edit-btn" onclick="SuperAdmin.editStudioCourseTitle()" title="Rename course title">
              <i class="fi fi-rr-pencil"></i>
            </button>
          </div>

          <!-- TAB 1: CONTENT (Curriculum Builder) -->
          <div class="studio-tab-panel ${tab === 'content' ? 'active' : ''}" id="studio-tab-content">
            ${this.getStudioContentTabHTML(modules)}
          </div>

          <!-- TAB 2: LANDING PAGE -->
          <div class="studio-tab-panel ${tab === 'landing' ? 'active' : ''}" id="studio-tab-landing">
            ${this.getStudioLandingTabHTML(course)}
          </div>

          <!-- TAB 3: SETTINGS -->
          <div class="studio-tab-panel ${tab === 'settings' ? 'active' : ''}" id="studio-tab-settings">
            ${this.getStudioSettingsTabHTML(course)}
          </div>

        </main>

        <!-- 3. Bottom Sticky Footer -->
        <footer class="studio-footer">
          <button class="studio-footer-cancel-btn" onclick="SuperAdmin.closeCourseStudio()">
            Cancel
          </button>
          <div class="studio-footer-right">
            <button class="btn-studio-draft" onclick="SuperAdmin.saveStudioDraft()">
              Save as draft
            </button>
            <button class="btn-studio-next" onclick="SuperAdmin.nextStudioTab()">
              <span>${tab === 'settings' ? (course.is_published ? 'Save Settings' : 'Publish Course') : 'Next'}</span>
              <i class="fi fi-rr-angle-small-right"></i>
            </button>
          </div>
        </footer>

      </div>
    `;
  },

  getStudioContentTabHTML(modules) {
    const modulesHTML = modules.length === 0 ? `
      <div class="card p-6 text-center" style="margin-bottom: 1.5rem; background: var(--bg-card); border-radius: 14px;">
        <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem;"><i class="fi fi-rr-folder"></i></div>
        <h4 style="font-weight: 700; margin-bottom: 0.25rem;">No Sections Created</h4>
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">Click below to add your first curriculum section.</p>
        <button class="btn btn-primary btn-sm" onclick="SuperAdmin.promptAddStudioSection()"><i class="fi fi-rr-plus"></i> Add Section</button>
      </div>
    ` : modules.map((m, idx) => {
      const contents = m.contents || [];
      const filesCount = contents.length;

      return `
        <div class="studio-section-card" id="studio-section-${m.id}">
          
          <!-- Section Head -->
          <div class="studio-section-head">
            <div class="studio-section-head-left">
              <span class="studio-drag-handle" title="Section drag handle">≡</span>
              <div class="studio-section-title-wrap">
                <h3 class="studio-section-title">${m.title || `Section ${idx + 1}`}</h3>
                <span class="studio-section-files-count">${filesCount} files</span>
              </div>
            </div>
            <div>
              <button class="studio-section-menu-btn" onclick="SuperAdmin.promptSectionMenu(${m.id}, '${(m.title || '').replace(/'/g, "\\'")}')" title="Section Options">
                <i class="fi fi-rr-menu-dots-vertical"></i>
              </button>
            </div>
          </div>

          <!-- Section Body -->
          ${filesCount === 0 ? `
            <!-- Empty State / Quick-Add Grid matching screenshot -->
            <div class="studio-content-box">
              <div class="studio-content-empty-title">Add your content here</div>
              <div class="studio-content-empty-desc">Add videos, PDFs, tests or any other links here!</div>
              
              <div class="studio-content-tiles-row">
                <!-- 1. Video -->
                <button type="button" class="studio-content-tile tile-video" onclick="SuperAdmin.openAddVideoModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-video-camera-alt"></i>
                  </div>
                  <span class="studio-tile-label">Video</span>
                </button>

                <!-- 2. Files -->
                <button type="button" class="studio-content-tile tile-files" onclick="SuperAdmin.openAddFileModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-document"></i>
                  </div>
                  <span class="studio-tile-label">Files</span>
                </button>

                <!-- 3. Link -->
                <button type="button" class="studio-content-tile tile-link" onclick="SuperAdmin.openAddLinkModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-link-alt"></i>
                  </div>
                  <span class="studio-tile-label">Link</span>
                </button>

                <!-- 4. Test -->
                <button type="button" class="studio-content-tile tile-test" onclick="SuperAdmin.openAddTestModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-clipboard-list-check"></i>
                  </div>
                  <span class="studio-tile-label">Test</span>
                </button>

                <!-- 5. Polls -->
                <button type="button" class="studio-content-tile tile-polls" onclick="SuperAdmin.openAddPollModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-chart-histogram"></i>
                  </div>
                  <span class="studio-tile-label">Polls</span>
                </button>

                <!-- 6. YouTube -->
                <button type="button" class="studio-content-tile tile-youtube" onclick="SuperAdmin.openAddYouTubeModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-play-alt"></i>
                  </div>
                  <span class="studio-tile-label">YouTube</span>
                </button>

                <!-- 7. Assessment -->
                <button type="button" class="studio-content-tile tile-assessment" onclick="SuperAdmin.openAddAssessmentModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-memo-circle-check"></i>
                  </div>
                  <span class="studio-tile-label">Assessment</span>
                </button>

                <!-- 8. Copy resource -->
                <button type="button" class="studio-content-tile tile-copy" onclick="SuperAdmin.openCopyResourceModal(${m.id})">
                  <div class="studio-tile-icon-box">
                    <i class="fi fi-rr-copy-alt"></i>
                  </div>
                  <span class="studio-tile-label">Copy resource</span>
                </button>
              </div>
            </div>
          ` : `
            <!-- Populated Lessons List -->
            <div class="studio-lessons-list">
              ${contents.map((c, cIdx) => {
                let iconClass = 'fi fi-rr-document';
                let iconBg = '#f1f5f9';
                let iconColor = '#64748b';

                if (c.content_type === 'video') {
                  iconClass = 'fi fi-rr-video-camera-alt';
                  iconBg = '#f3e8ff';
                  iconColor = '#7c3aed';
                } else if (c.content_type === 'pdf') {
                  iconClass = 'fi fi-rr-document';
                  iconBg = '#ffe4e6';
                  iconColor = '#e11d48';
                } else if (c.content_type === 'link') {
                  iconClass = 'fi fi-rr-link-alt';
                  iconBg = '#e0f2fe';
                  iconColor = '#0284c7';
                } else if (c.content_type === 'quiz' || c.content_type === 'test') {
                  iconClass = 'fi fi-rr-clipboard-list-check';
                  iconBg = '#fef3c7';
                  iconColor = '#d97706';
                } else if (c.content_type === 'poll' || c.content_type === 'polls') {
                  iconClass = 'fi fi-rr-chart-histogram';
                  iconBg = '#dcfce7';
                  iconColor = '#16a34a';
                } else if (c.content_type === 'youtube') {
                  iconClass = 'fi fi-rr-play-alt';
                  iconBg = '#fee2e2';
                  iconColor = '#dc2626';
                } else if (c.content_type === 'assessment' || c.content_type === 'coding') {
                  iconClass = 'fi fi-rr-laptop-code';
                  iconBg = '#e0e7ff';
                  iconColor = '#4338ca';
                }

                return `
                  <div class="studio-lesson-row">
                    <div class="studio-lesson-left">
                      <span class="studio-drag-handle" style="font-size: 1rem;">≡</span>
                      <div class="studio-lesson-icon" style="background: ${iconBg}; color: ${iconColor};">
                        <i class="${iconClass}"></i>
                      </div>
                      <div style="min-width: 0; flex: 1;">
                        <div class="studio-lesson-title">${c.title}</div>
                        <div class="text-muted" style="font-size: 0.72rem; margin-top: 1px;">
                          ${c.content_type.toUpperCase()} • ${c.duration_minutes || 10} min
                          ${c.file_url ? ' • <span style="color: #059669;">Attached Resource</span>' : ''}
                        </div>
                      </div>
                    </div>
                    <div class="studio-lesson-right">
                      <button type="button" class="icon-btn danger-action" onclick="SuperAdmin.deleteStudioContent(${c.id})" title="Delete lesson" style="width: 28px; height: 28px;">
                        <i class="fi fi-rr-trash"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Compact Quick Add Bar below items -->
            <div class="studio-quick-add-bar">
              <span class="text-muted" style="font-size: 0.78rem; font-weight: 600; margin-right: 4px;">+ Quick Add:</span>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddVideoModal(${m.id})"><i class="fi fi-rr-video-camera-alt" style="color: #7c3aed;"></i> Video</button>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddFileModal(${m.id})"><i class="fi fi-rr-document" style="color: #e11d48;"></i> File / PDF</button>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddLinkModal(${m.id})"><i class="fi fi-rr-link-alt" style="color: #0284c7;"></i> Link</button>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddTestModal(${m.id})"><i class="fi fi-rr-clipboard-list-check" style="color: #d97706;"></i> Quiz</button>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddYouTubeModal(${m.id})"><i class="fi fi-rr-play-alt" style="color: #dc2626;"></i> YouTube</button>
              <button class="btn-studio-mini-add" onclick="SuperAdmin.openAddAssessmentModal(${m.id})"><i class="fi fi-rr-memo-circle-check" style="color: #4338ca;"></i> Assessment</button>
            </div>
          `}

        </div>
      `;
    }).join('');

    return `
      <!-- Sections List -->
      <div id="studio-sections-container">
        ${modulesHTML}
      </div>

      <!-- + New Section Button Card -->
      <div class="studio-new-section-card">
        <button type="button" class="btn-studio-new-section" onclick="SuperAdmin.promptAddStudioSection()">
          <i class="fi fi-rr-plus"></i>
          <span>New section</span>
        </button>
      </div>

      <!-- Certificate Banner Card -->
      <div class="studio-cert-card">
        <div class="studio-cert-left">
          <div class="studio-cert-icon-box">
            <i class="fi fi-rr-diploma"></i>
          </div>
          <div>
            <h4 class="studio-cert-title">Add a course completion certificate</h4>
            <p class="studio-cert-subtitle">Give learners a certificate when they finish your course</p>
          </div>
        </div>
        <button type="button" class="btn-studio-cert" onclick="SuperAdmin.openStudioCertificateSelector()">
          <i class="fi fi-rr-award"></i>
          <span>Choose template</span>
        </button>
      </div>
    `;
  },

  getStudioLandingTabHTML(course) {
    const c = course || {};
    const collegeOptions = (this.cachedColleges || []).map(col => `
      <option value="${col.id}" ${c.college_id === col.id ? 'selected' : ''}>
        [${col.code}] ${col.name}
      </option>
    `).join('');

    const standardBatches = ['All Batches', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'];
    const currentBatch = c.batch || 'All Batches';
    const isCustomBatch = !standardBatches.includes(currentBatch);

    return `
      <form id="studio-landing-form" onchange="SuperAdmin.persistLandingPageFormState()">
        
        <!-- Basic Info Card -->
        <div class="studio-form-card">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Course Details & Overview</h3>
          
          <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Course Title *</label>
              <input type="text" class="form-input" name="title" required value="${c.title || ''}" placeholder="e.g. Figma UI UX Design Essentials" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Course Code *</label>
              <input type="text" class="form-input font-mono" name="code" required value="${c.code || ''}" placeholder="e.g. FIGMA-101" style="text-transform: uppercase;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">Course Description</label>
            <textarea class="form-textarea" name="description" style="height: 90px;" placeholder="Comprehensive summary of course syllabus, prerequisites, and learning outcomes...">${c.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-3 gap-4" style="margin-bottom: 1.25rem;">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category">
                <option value="Computer Science" ${c.category === 'Computer Science' ? 'selected' : ''}>Computer Science & Design</option>
                <option value="Artificial Intelligence & Robotics" ${c.category && c.category.includes('Robotics') ? 'selected' : ''}>AI & Robotics</option>
                <option value="Cloud Computing" ${c.category && c.category.includes('Cloud') ? 'selected' : ''}>Cloud Computing</option>
                <option value="Data Science" ${c.category && c.category.includes('Data') ? 'selected' : ''}>Data Science</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Difficulty Level</label>
              <select class="form-select" name="level">
                <option value="Beginner" ${c.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                <option value="Intermediate" ${c.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="Advanced" ${c.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Duration</label>
              <input type="text" class="form-input" name="duration" value="${c.duration || '6 Weeks'}" placeholder="e.g. 6 Weeks / 30 Hours" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Instructor / Author Name</label>
              <input type="text" class="form-input" name="instructor_name" value="${c.instructor_name || ''}" placeholder="Dr. Jane Doe" />
            </div>
            <div class="form-group">
              <label class="form-label">Thumbnail Image URL</label>
              <input type="url" class="form-input" name="thumbnail_url" value="${c.thumbnail_url || ''}" placeholder="https://images.unsplash.com/..." />
            </div>
          </div>
        </div>

        <!-- Target Availability Card -->
        <div class="studio-form-card">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Target Audience & Institutional Availability</h3>
          
          <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">College Institution Restriction *</label>
              <select class="form-select" name="college_id">
                <option value="all" ${!c.college_id ? 'selected' : ''}>🌐 All Colleges (Global Platform Curriculum)</option>
                <optgroup label="Or Restrict to a Specific College Organization">
                  ${collegeOptions}
                </optgroup>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Target Student Batch *</label>
              <select class="form-select" name="batch" id="studio-batch-select" onchange="SuperAdmin.handleWizardBatchChange(this.value)">
                <option value="All Batches" ${currentBatch === 'All Batches' ? 'selected' : ''}>🎓 All Batches (Open to All Students)</option>
                <option value="2021-2025" ${currentBatch === '2021-2025' ? 'selected' : ''}>Batch 2021-2025 (4th Year / Finalists)</option>
                <option value="2022-2026" ${currentBatch === '2022-2026' ? 'selected' : ''}>Batch 2022-2026 (3rd Year)</option>
                <option value="2023-2027" ${currentBatch === '2023-2027' ? 'selected' : ''}>Batch 2023-2027 (2nd Year)</option>
                <option value="2024-2028" ${currentBatch === '2024-2028' ? 'selected' : ''}>Batch 2024-2028 (1st Year Freshers)</option>
                <option value="2025-2029" ${currentBatch === '2025-2029' ? 'selected' : ''}>Batch 2025-2029 (Upcoming Batch)</option>
                <option value="custom" ${isCustomBatch ? 'selected' : ''}>Custom Batch Name...</option>
              </select>
              <input type="text" class="form-input" id="wizard-custom-batch-input" name="custom_batch" 
                style="margin-top: 6px; display: ${isCustomBatch ? 'block' : 'none'};" 
                value="${isCustomBatch ? currentBatch : ''}" 
                placeholder="e.g. 2020-2024, AI-Cohort-1" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Key Learning Objectives (One per line)</label>
            <textarea class="form-textarea" name="learning_objectives" style="height: 80px;" placeholder="1. Master Figma Auto-Layout&#10;2. Design High-Fidelity Design Systems">${c.learning_objectives || ''}</textarea>
          </div>
        </div>

      </form>
    `;
  },

  getStudioSettingsTabHTML(course) {
    const c = course || {};
    const trainerOptions = (this.cachedTrainers || []).map(tr => `
      <option value="${tr.id}" ${c.trainer_id === tr.id ? 'selected' : ''}>
        ${tr.first_name} ${tr.last_name} (${tr.email}) ${tr.assigned_courses_count ? `• ${tr.assigned_courses_count} courses` : ''}
      </option>
    `).join('');

    return `
      <form id="studio-settings-form" onchange="SuperAdmin.persistSettingsFormState()">
        
        <!-- Course Policies Card -->
        <div class="studio-form-card">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Enrollment & Visibility Controls</h3>
          
          <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
            <div class="form-group">
              <label class="form-label">Enrollment Mode</label>
              <select class="form-select" name="enrollment_type">
                <option value="open" ${c.enrollment_type === 'open' ? 'selected' : ''}>Open (One-click Student Registration)</option>
                <option value="approval_required" ${c.enrollment_type === 'approval_required' ? 'selected' : ''}>Approval Required (Institution Admin Confirms)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Catalog Visibility</label>
              <select class="form-select" name="visibility">
                <option value="public" ${c.visibility === 'public' ? 'selected' : ''}>Public (Visible Across All Campuses)</option>
                <option value="college" ${c.visibility === 'college' ? 'selected' : ''}>College Only (Restricted Tenant Isolation)</option>
              </select>
            </div>
          </div>

          <!-- Trainer Assignment -->
          <div class="form-group">
            <div class="flex items-center justify-between" style="margin-bottom: 6px;">
              <label class="form-label" style="font-weight: 700; margin-bottom: 0;">Assigned Trainer / Class Instructor (Super Admin Only)</label>
              <button type="button" class="btn btn-outline btn-sm" onclick="SuperAdmin.openCreateTrainerModal(null, true)" style="font-size: 0.72rem; padding: 2px 8px; color: var(--primary); font-weight: 600;">
                <i class="fi fi-rr-plus"></i> + Create Trainer
              </button>
            </div>
            <select class="form-select" name="trainer_id" id="studio-settings-trainer-select" onchange="if(this.value==='__create_new__'){ this.value='none'; SuperAdmin.openCreateTrainerModal(null, true); }">
              <option value="none" ${!c.trainer_id ? 'selected' : ''}>-- No Trainer Assigned --</option>
              <option value="__create_new__" style="color: var(--primary); font-weight: 700;">➕ [ + Create New Trainer Account... ]</option>
              ${trainerOptions}
            </select>
            <div class="text-muted" style="font-size: 0.78rem; margin-top: 4px;">
              The assigned trainer will manage student assessments, attendance, and live technical coaching.
            </div>
          </div>
        </div>

        <!-- Grading & Certification Card -->
        <div class="studio-form-card">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Grading & Verified Credentials</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Passing Grade Threshold (%)</label>
              <input type="number" class="form-input" name="passing_percentage" value="${c.passing_percentage || 60}" min="10" max="100" />
            </div>
            <div class="form-group">
              <label class="form-label">Issue Verified Digital Certificate on Completion?</label>
              <select class="form-select" name="certificate_enabled">
                <option value="1" ${c.certificate_enabled !== 0 ? 'selected' : ''}>Yes (Generate QR-Verified Academic Certificate)</option>
                <option value="0" ${c.certificate_enabled === 0 ? 'selected' : ''}>No (Course is non-certificate)</option>
              </select>
            </div>
          </div>
        </div>

      </form>
    `;
  },

  // Section Management Methods
  async promptAddStudioSection() {
    if (!this.activeCourseStudio || !this.activeCourseStudio.course) return;
    const courseId = this.activeCourseStudio.course.id;
    const currentModulesCount = (this.activeCourseStudio.modules || []).length;
    const defaultTitle = `Section ${currentModulesCount + 1}`;
    const title = prompt('Enter Section Name:', defaultTitle);
    if (!title || !title.trim()) return;

    try {
      await API.post(`/api/modules/course/${courseId}`, {
        title: title.trim(),
        description: ''
      });
      API.toast('Section created.', 'success');
      await this.reloadStudioData();
    } catch (err) {
      console.error(err);
      API.toast('Failed to create section', 'error');
    }
  },

  promptSectionMenu(moduleId, sectionTitle) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>Section: ${sectionTitle}</h3>
          <span class="text-muted" style="font-size: 0.75rem;">Manage Curriculum Section</span>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn btn-outline" style="justify-content: flex-start;" onclick="App.closeModal(); SuperAdmin.editStudioSectionTitle(${moduleId}, '${sectionTitle}')">
          <i class="fi fi-rr-pencil"></i> Rename Section
        </button>
        <button class="btn btn-danger" style="justify-content: flex-start;" onclick="App.closeModal(); SuperAdmin.deleteStudioSection(${moduleId})">
          <i class="fi fi-rr-trash"></i> Delete Section and All Contents
        </button>
      </div>
    `, 'modal-sm');
  },

  async editStudioSectionTitle(moduleId, currentTitle) {
    const newTitle = prompt('Rename Section:', currentTitle);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

    try {
      await API.put(`/api/modules/${moduleId}`, {
        title: newTitle.trim(),
        description: '',
        sort_order: 0
      });
      API.toast('Section renamed.', 'success');
      await this.reloadStudioData();
    } catch (err) {
      console.error(err);
      API.toast('Failed to rename section', 'error');
    }
  },

  async deleteStudioSection(moduleId, sectionTitle = 'Section') {
    App.showDangerConfirmModal({
      title: 'Delete Section?',
      warningBanner: "All lessons, files, and materials in this section will be removed!",
      itemName: sectionTitle,
      itemType: 'section',
      description: `This action <strong>CANNOT</strong> be undone. This will permanently delete <strong>${sectionTitle}</strong> and all associated resources inside it.`,
      confirmButtonText: 'I understand, delete this section',
      onConfirm: async () => {
        await API.delete(`/api/modules/${moduleId}`);
        API.toast('Section deleted.', 'info');
        await this.reloadStudioData();
      }
    });
  },

  async deleteStudioContent(contentId, contentTitle = 'this lesson') {
    App.showDangerConfirmModal({
      title: 'Delete Content Item?',
      warningBanner: "This action cannot be undone!",
      itemName: contentTitle,
      itemType: 'item',
      description: `This will permanently delete <strong>${contentTitle}</strong> from this section.`,
      confirmButtonText: 'Delete item',
      onConfirm: async () => {
        await API.delete(`/api/content/${contentId}`);
        API.toast('Content item deleted.', 'info');
        await this.reloadStudioData();
      }
    });
  },

  // Modals for Content Creation
  openAddVideoModal(moduleId) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3><i class="fi fi-rr-video-camera-alt" style="color: #7c3aed;"></i> Add Video Lecture</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Upload an MP4 video or paste a video stream CDN URL.</p>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form id="studio-video-form" onsubmit="event.preventDefault(); SuperAdmin.submitStudioVideo(${moduleId});">
          <div class="form-group">
            <label class="form-label">Lesson Title *</label>
            <input type="text" class="form-input" id="sv-title" required placeholder="e.g. 01: Introduction & Interface Navigation" />
          </div>
          <div class="form-group">
            <label class="form-label">Video Stream URL (MP4, CDN, or Direct Video Link) *</label>
            <input type="url" class="form-input font-mono" id="sv-url" required value="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" placeholder="https://..." />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Duration (Minutes)</label>
              <input type="number" class="form-input" id="sv-duration" value="15" min="1" max="600" />
            </div>
            <div class="form-group">
              <label class="form-label">Mandatory for Completion?</label>
              <select class="form-select" id="sv-mandatory">
                <option value="1">Yes (Required)</option>
                <option value="0">No (Supplementary)</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="SuperAdmin.submitStudioVideo(${moduleId})">Add Video Lesson</button>
      </div>
    `, 'modal-md');
  },

  async submitStudioVideo(moduleId) {
    const title = (document.getElementById('sv-title').value || '').trim();
    const url = (document.getElementById('sv-url').value || '').trim();
    const duration = parseInt(document.getElementById('sv-duration').value) || 15;
    const isMandatory = document.getElementById('sv-mandatory').value === '1';

    if (!title || !url) {
      API.toast('Please provide a title and video URL', 'warning');
      return;
    }

    try {
      await API.post('/api/content', {
        module_id: moduleId,
        title,
        content_type: 'video',
        content_data: url,
        file_url: url,
        duration_minutes: duration,
        is_mandatory: isMandatory
      });
      API.toast(`Added video '${title}'`, 'success');
      App.closeModal();
      await this.reloadStudioData();
    } catch (err) {
      console.error(err);
      API.toast('Failed to add video lesson', 'error');
    }
  },

  openAddFileModal(moduleId) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3><i class="fi fi-rr-document" style="color: #e11d48;"></i> Upload Files & Course Notes</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Attach PDF documents, slide presentations, or code notebooks.</p>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form id="studio-file-form" onsubmit="event.preventDefault(); SuperAdmin.submitStudioFile(${moduleId});">
          
          <div class="upload-dropzone" id="studio-file-dropzone" onclick="document.getElementById('sf-input').click()">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #e11d48;"><i class="fi fi-rr-cloud-upload-alt"></i></div>
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem;">
              Click to select or drag and drop course file here
            </div>
            <div class="text-muted" style="font-size: 0.78rem;">
              Supported: <strong>.pdf, .docx, .pptx, .ipynb, .py, .zip, .csv</strong> (Max 100MB)
            </div>
            <input type="file" id="sf-input" style="display: none;" onchange="SuperAdmin.handleStudioFileSelected(this)" />
          </div>

          <div id="sf-preview" style="display: none; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label">Lesson / File Title *</label>
            <input type="text" class="form-input" id="sf-title" required placeholder="e.g. Design Systems & Auto-Layout Workbook.pdf" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Duration / Study Time (Minutes)</label>
              <input type="number" class="form-input" id="sf-duration" value="20" min="1" max="600" />
            </div>
            <div class="form-group">
              <label class="form-label">Resource Type</label>
              <select class="form-select" id="sf-type">
                <option value="pdf">PDF Document</option>
                <option value="document">Presentation / Document</option>
                <option value="coding">Source Code / Notebook</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="SuperAdmin.submitStudioFile(${moduleId})">Upload & Attach</button>
      </div>
    `, 'modal-md');
  },

  handleStudioFileSelected(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const filename = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const cleanedTitle = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const titleInput = document.getElementById('sf-title');
    if (titleInput && !titleInput.value) titleInput.value = cleanedTitle;

    const preview = document.getElementById('sf-preview');
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = `
        <div class="upload-file-chip">
          <div class="flex items-center gap-3">
            <span style="font-size: 1.5rem;">📄</span>
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">${filename}</div>
              <div class="text-muted font-mono" style="font-size: 0.72rem;">${sizeMb} MB • Ready to upload</div>
            </div>
          </div>
          <span class="badge badge-success">✓ Ready</span>
        </div>
      `;
    }
  },

  async submitStudioFile(moduleId) {
    const title = (document.getElementById('sf-title').value || '').trim();
    const type = document.getElementById('sf-type').value || 'pdf';
    const duration = parseInt(document.getElementById('sf-duration').value) || 20;
    const fileInput = document.getElementById('sf-input');

    if (!title) {
      API.toast('Please enter a file title', 'warning');
      return;
    }

    let fileUrl = null;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        const uploadRes = await API.upload(fileInput.files[0], 'courses');
        fileUrl = uploadRes.url;
      } catch (err) {
        console.error(err);
        API.toast('Upload failed, creating entry with placeholder URL', 'warning');
        fileUrl = `/uploads/courses/${fileInput.files[0].name}`;
      }
    } else {
      fileUrl = `/uploads/courses/document_${Date.now()}.pdf`;
    }

    try {
      await API.post('/api/content', {
        module_id: moduleId,
        title,
        content_type: type,
        content_data: `# ${title}\nAttached study material`,
        file_url: fileUrl,
        duration_minutes: duration,
        is_mandatory: true
      });
      API.toast(`Uploaded '${title}'`, 'success');
      App.closeModal();
      await this.reloadStudioData();
    } catch (err) {
      console.error(err);
      API.toast('Failed to save file content', 'error');
    }
  },

  openAddLinkModal(moduleId) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3><i class="fi fi-rr-link-alt" style="color: #0284c7;"></i> Add External Web Link</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Share official documentation, design templates, or external resources.</p>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form id="studio-link-form" onsubmit="event.preventDefault(); SuperAdmin.submitStudioLink(${moduleId});">
          <div class="form-group">
            <label class="form-label">Link Resource Title *</label>
            <input type="text" class="form-input" id="sl-title" required placeholder="e.g. Official Figma Community UI Kit & Assets" />
          </div>
          <div class="form-group">
            <label class="form-label">Destination URL *</label>
            <input type="url" class="form-input font-mono" id="sl-url" required placeholder="https://figma.com/@community" value="https://figma.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Reading Time (Minutes)</label>
            <input type="number" class="form-input" id="sl-duration" value="10" min="1" max="180" />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="SuperAdmin.submitStudioLink(${moduleId})">Add Link Resource</button>
      </div>
    `, 'modal-md');
  },

  async submitStudioLink(moduleId) {
    const title = (document.getElementById('sl-title').value || '').trim();
    const url = (document.getElementById('sl-url').value || '').trim();
    const duration = parseInt(document.getElementById('sl-duration').value) || 10;

    if (!title || !url) {
      API.toast('Please provide a title and valid URL', 'warning');
      return;
    }

    try {
      await API.post('/api/content', {
        module_id: moduleId,
        title,
        content_type: 'link',
        content_data: url,
        file_url: url,
        duration_minutes: duration,
        is_mandatory: false
      });
      API.toast(`Added link '${title}'`, 'success');
      App.closeModal();
      await this.reloadStudioData();
    } catch (err) {
      console.error(err);
      API.toast('Failed to add link', 'error');
    }
  },

  openAddTestModal(moduleId) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3><i class="fi fi-rr-clipboard-list-check" style="color: #d97706;"></i> Create Quiz / Test</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 2px;">Create an interactive knowledge check MCQ quiz for learners.</p>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form id="studio-test-form" onsubmit="event.preventDefault(); SuperAdmin.submitStudioTest(${moduleId});">
          <div class="form-group">
            <label class="form-label">Quiz Title *</label>
            <input type="text" class="form-input" id="st-title" required placeholder="e.g. Module 1 Checkpoint: Auto-Layout & Constraints Quiz" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Duration (Minutes)</label>
              <input type="number" class="form-input" id="st-duration" value="15" min="1" max="180" />
            </div>
            <div class="form-group">
              <label class="form-label">Passing Percentage (%)</label>
              <input type="number" class="form-input" id="st-passing" value="70" min="10" max="100" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Quiz Instructions & Overview</label>
            <textarea class="form-textarea" id="st-instructions" style="height: 70px;" placeholder="Complete all questions to unlock the next chapter...">Test your understanding of Figma constraints, component instances, and responsive frame properties.</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="SuperAdmin.submitStudioTest(${moduleId})">Create Quiz</button>
      </div>
    `, 'modal-md');
  },

  async submitStudioTest(moduleId) {
    const title = (document.getElementById('st-title').value || '').trim();
    const duration = parseInt(document.getElementById('st-duration').value) || 15;
    const passing = parseInt(document.getElementById('st-passing').value) || 70;
    const instructions = document.getElementById('st-instructions').value;

    if (!title) {
      API.toast('Please enter a quiz title', 'warning');
      return;
    }

    try {