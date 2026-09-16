/**
 * Interactive Course Learning Player Controller
 */
const Player = {
  currentCourseData: null,
  currentContentId: null,
  progressData: null,

  async openPlayer(courseId, initialContentId = null) {
    App.showView('player-view');

    const container = document.getElementById('player-view-container');
    container.innerHTML = `<div style="padding: 4rem; text-align: center;"><div class="spinner"></div> Loading course materials...</div>`;

    try {
      const data = await API.get(`/api/courses/${courseId}`);
      this.currentCourseData = data;

      // Fetch student progress
      const prog = await API.get(`/api/progress/course/${courseId}`);
      this.progressData = prog;

      // Determine target lesson:
      // Priority 1: explicitly passed initialContentId from URL
      // Priority 2: saved lesson in localStorage
      // Priority 3: first uncompleted lesson
      // Priority 4: first available lesson
      let targetContentId = initialContentId;
      if (!targetContentId) {
        const saved = localStorage.getItem(`player_last_lesson_${courseId}`);
        if (saved) targetContentId = parseInt(saved);
      }

      if (!targetContentId) {
        for (const m of data.modules) {
          if (m.contents && m.contents.length > 0) {
            for (const c of m.contents) {
              if (!targetContentId) targetContentId = c.id;
              if (prog.completed_items && !prog.completed_items[c.id]) {
                targetContentId = c.id;
                break;
              }
            }
          }
        }
      }

      this.currentContentId = targetContentId;
      this.renderPlayerUI();
      if (this.currentContentId) {
        this.loadContent(this.currentContentId);
      }
    } catch (err) {
      console.error(err);
      API.toast('Failed to load course player', 'error');
    }
  },

  renderPlayerUI() {
    const data = this.currentCourseData;
    const prog = this.progressData;
    const container = document.getElementById('player-view-container');

    const modulesHtml = data.modules.map((m, mIdx) => {
      const contentsHtml = (m.contents || []).map(c => {
        const isCompleted = prog.completed_items && prog.completed_items[c.id] && prog.completed_items[c.id].is_completed;
        const isActive = c.id === this.currentContentId;

        let icon = '<i class="fi fi-rr-document"></i>';
        if (c.content_type === 'video') icon = '<i class="fi fi-rr-play-alt" style="color: var(--primary);"></i>';
        if (c.content_type === 'coding') icon = '<i class="fi fi-rr-laptop-code" style="color: var(--accent-emerald);"></i>';
        if (c.content_type === 'assignment') icon = '<i class="fi fi-rr-cloud-upload-alt" style="color: #d97706;"></i>';
        if (c.content_type === 'jetbot') icon = '<i class="fi fi-rr-robot" style="color: var(--nvidia-green);"></i>';

        return `
          <div class="player-lesson-item ${isActive ? 'active' : ''}" onclick="Player.loadContent(${c.id})" id="lesson-item-${c.id}">
            <div class="lesson-check-icon ${isCompleted ? 'completed' : ''}" id="lesson-check-${c.id}">
              ${isCompleted ? '<i class="fi fi-rr-check" style="font-size: 0.65rem;"></i>' : ''}
            </div>
            <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-flex; align-items: center; gap: 6px;">${icon} ${c.title}</span>
            <span class="font-mono text-muted" style="font-size: 0.7rem;">${c.duration_minutes}m</span>
          </div>
        `;
      }).join('');

      return `
        <div class="player-module-item">
          <div class="player-module-title-bar">
            <span>Module ${mIdx + 1}: ${m.title}</span>
            <span style="font-size: 0.75rem;" class="text-muted">▾</span>
          </div>
          <div class="player-lesson-list">
            ${contentsHtml || '<div class="text-muted p-2" style="font-size: 0.75rem;">No lessons</div>'}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="player-layout">
        <!-- Sidebar Navigation -->
        <aside class="player-sidebar">
          <div class="player-sidebar-header">
            <button class="btn btn-outline btn-sm" onclick="App.navigate('my-courses')" style="margin-bottom: 0.85rem; width: 100%;">
              ← Exit to Dashboard
            </button>
            <h3 style="font-size: 1.05rem; line-height: 1.25; margin-bottom: 0.5rem;">${data.course.title}</h3>
            <div class="flex justify-between" style="font-size: 0.75rem; margin-bottom: 4px;">
              <span class="text-muted">Course Completion</span>
              <span class="font-mono" id="player-progress-pct" style="font-weight: 700;">${Math.round(prog.progress_percentage)}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${prog.status === 'completed' ? 'success' : ''}" id="player-progress-bar" style="width: ${prog.progress_percentage}%;"></div>
            </div>
          </div>

          <div class="player-module-list">
            ${modulesHtml}
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="player-stage">
          <div id="player-stage-body" class="player-content-body">
            <div style="padding: 3rem; text-align: center;">Select a lesson to begin</div>
          </div>

          <!-- Bottom Action Bar -->
          <footer class="player-footer-bar">
            <button class="btn btn-secondary" onclick="Player.navigatePrev()">
              ← Previous Lesson
            </button>
            <div class="flex items-center gap-3">
              <button class="btn btn-success" id="mark-complete-btn" onclick="Player.markCurrentComplete()">
                ✓ Mark as Complete & Next →
              </button>
            </div>
            <button class="btn btn-secondary" onclick="Player.navigateNext()">
              Next Lesson →
            </button>
          </footer>
        </main>
      </div>
    `;
  },

  async loadContent(contentId) {
    this.currentContentId = contentId;
    if (this.currentCourseData && this.currentCourseData.course) {
      const cId = this.currentCourseData.course.id;
      localStorage.setItem(`player_last_lesson_${cId}`, contentId);
      const newRoute = `player/${cId}/lesson/${contentId}`;
      localStorage.setItem('platform_current_route', newRoute);
      if (window.location.hash !== `#/${newRoute}`) {
        window.location.hash = `#/${newRoute}`;
      }
    }

    // Highlight active in sidebar
    document.querySelectorAll('.player-lesson-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`lesson-item-${contentId}`);
    if (activeEl) activeEl.classList.add('active');

    const stage = document.getElementById('player-stage-body');
    stage.innerHTML = `<div style="padding: 2rem; text-align: center;"><div class="spinner"></div> Loading content...</div>`;

    try {
      const content = await API.get(`/api/content/${contentId}`);
      stage.innerHTML = this.renderContentBodyHTML(content);
    } catch (err) {
      console.error(err);
      stage.innerHTML = `<div class="card p-4 text-center text-muted">Error loading lesson.</div>`;
    }
  },

  renderContentBodyHTML(content) {
    const type = content.content_type;
    const fileUrl = content.file_url;
    const isPdf = type === 'pdf' || (fileUrl && fileUrl.toLowerCase().endsWith('.pdf'));

    if (isPdf && fileUrl) {
      const filename = fileUrl.split('/').pop() || 'document.pdf';
      return `
        <div style="max-width: 980px; margin: 0 auto;">
          <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.25rem;"><i class="fi fi-rr-document"></i> ${content.title}</h2>
              <div class="text-muted" style="font-size: 0.82rem;">Official Course PDF & Reading Material • ${content.duration_minutes} Mins</div>
            </div>
            <a href="${fileUrl}" target="_blank" download class="btn btn-primary btn-sm">
              <i class="fi fi-rr-download"></i> Download PDF Document
            </a>
          </div>

          <div class="card" style="padding: 0.5rem; overflow: hidden; background: #0f172a; border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
            <iframe src="${fileUrl}#view=FitH" style="width: 100%; height: 680px; border: none; border-radius: var(--radius-md); background: #ffffff;"></iframe>
          </div>

          ${content.content_data ? `
            <div class="card" style="padding: 1.5rem;">
              <h4 style="margin-bottom: 0.5rem;">Instructor Notes & Instructions</h4>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">${this.formatMarkdownToHtml(content.content_data)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (type === 'video') {
      const videoSrc = content.content_data && content.content_data.startsWith('http')
        ? content.content_data
        : (content.file_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

      return `
        <div style="max-width: 960px; margin: 0 auto;">
          <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
            <div>
              <h2 style="margin-bottom: 0.25rem;"><i class="fi fi-rr-play-alt" style="color: var(--primary);"></i> ${content.title}</h2>
              <div class="text-muted" style="font-size: 0.82rem;"><i class="fi fi-rr-clock"></i> Duration: ${content.duration_minutes} Minutes • Video Lecture</div>
            </div>
            ${fileUrl ? `
              <a href="${fileUrl}" target="_blank" download class="btn btn-outline btn-sm">
                <i class="fi fi-rr-download"></i> Download Video
              </a>
            ` : ''}
          </div>
          
          <div class="video-container" style="border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg);">
            <video controls autoplay poster="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800" style="width: 100%; max-height: 520px; background: #000;">
              <source src="${videoSrc}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>

          ${content.content_data && !content.content_data.startsWith('http') ? `
            <div class="card" style="margin-top: 1.5rem; padding: 1.5rem;">
              <h4 style="margin-bottom: 0.5rem;">Lesson Notes</h4>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">${this.formatMarkdownToHtml(content.content_data)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (type === 'document') {
      return `
        <div class="markdown-body" style="max-width: 960px; margin: 0 auto;">
          <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
            <div>
              <h2 style="margin-bottom: 0.25rem;"><i class="fi fi-rr-document"></i> ${content.title}</h2>
              <div class="text-muted" style="font-size: 0.82rem;">Reading Time: ${content.duration_minutes} Mins</div>
            </div>
            ${fileUrl ? `
              <a href="${fileUrl}" target="_blank" download class="btn btn-primary btn-sm">
                <i class="fi fi-rr-download"></i> Download Attached File
              </a>
            ` : ''}
          </div>

          ${fileUrl ? `
            <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; background: var(--primary-light); border: 1px solid rgba(55, 125, 255, 0.25);">
              <div class="flex items-center gap-3">
                <span style="font-size: 2rem; color: var(--primary);"><i class="fi fi-rr-box-alt"></i></span>
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem;">Attached Course Material Resource</div>
                  <div class="text-muted font-mono" style="font-size: 0.78rem;">${fileUrl.split('/').pop()}</div>
                </div>
              </div>
              <a href="${fileUrl}" target="_blank" download class="btn btn-primary">
                <i class="fi fi-rr-download"></i> Download File
              </a>
            </div>
          ` : ''}

          <div class="card" style="padding: 2rem; background: var(--bg-secondary);">
            ${this.formatMarkdownToHtml(content.content_data || 'No content provided.')}
          </div>
        </div>
      `;
    }

    if (type === 'coding') {
      let codeData = { instructions: 'Complete the Python coding exercise below.', starter_code: 'print("Hello World")', test_cases: [] };
      try {
        if (content.content_data) {
          codeData = JSON.parse(content.content_data);
        }
      } catch (e) {}

      // Retrieve saved user code from localStorage if student has already written code
      const savedCode = localStorage.getItem(`code_draft_${content.id}`);
      const initialCode = savedCode !== null ? savedCode : (codeData.starter_code || '');

      return `
        <div style="max-width: 980px; margin: 0 auto;">
          <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
            <div>
              <h2 style="margin-bottom: 0.25rem;"><i class="fi fi-rr-laptop-code" style="color: var(--accent-emerald);"></i> ${content.title}</h2>
              <div class="text-muted" style="font-size: 0.82rem;">Interactive Python Code Lab & Automated Test Runner</div>
            </div>
            ${fileUrl ? `
              <a href="${fileUrl}" target="_blank" download class="btn btn-outline btn-sm">
                <i class="fi fi-rr-download"></i> Download Lab Code (.py / .ipynb)
              </a>
            ` : ''}
          </div>
          
          <div class="card" style="margin-bottom: 1rem; padding: 1.25rem;">
            <h4>Exercise Instructions</h4>
            <p class="text-secondary" style="font-size: 0.88rem; margin-top: 4px;">${codeData.instructions}</p>
          </div>

          <div class="code-sandbox">
            <div class="code-sandbox-header">
              <span class="font-mono text-muted" style="font-size: 0.8rem;">main.py (Python 3.9)</span>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" onclick="Player.runCodeSandbox()">▶ Run Code</button>
                <button class="btn btn-primary btn-sm" onclick="Player.runCodeTests()">✓ Run Test Cases</button>
              </div>
            </div>
            <textarea id="player-code-editor" class="code-editor-area" spellcheck="false" oninput="localStorage.setItem('code_draft_${content.id}', this.value)">${initialCode}</textarea>
            <div class="code-output-area" id="player-code-output">Terminal output will appear here...</div>
          </div>
          <input type="hidden" id="player-code-testcases" value='${JSON.stringify(codeData.test_cases || [])}' />
        </div>
      `;
    }

    if (type === 'jetbot') {
      return JetBotSimulator.renderPanel(content);
    }

    return `
      <div class="markdown-body" style="max-width: 960px; margin: 0 auto;">
        <h2>${content.title}</h2>
        <div class="card" style="padding: 2rem;">
          ${content.content_data || 'Lesson Content'}
        </div>
      </div>
    `;
  },

  formatMarkdownToHtml(md) {
    if (!md) return '';
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
    }

    if (type === 'jetbot') {
      return JetBotSimulator.renderPanel(content);
    }

    return `
      <div class="markdown-body" style="max-width: 960px; margin: 0 auto;">
        <h2>${content.title}</h2>
        <div class="card" style="padding: 2rem;">
          ${content.content_data || 'Lesson Content'}
        </div>
      </div>
    `;
  },

  formatMarkdownToHtml(md) {
    if (!md) return '';
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\`\`\`python([\s\S]*?)\`\`\`/gim, '<pre><code class="language-python">$1</code></pre>')
      .replace(/\`\`\`([\s\S]*?)\`\`\`/gim, '<pre><code>$1</code></pre>')
      .replace(/\`([^\`]+)\`/gim, '<code class="font-mono" style="background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">$1</code>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  },

  async runCodeSandbox() {
    const code = document.getElementById('player-code-editor').value;
    const outputEl = document.getElementById('player-code-output');
    outputEl.innerHTML = '<span style="color: var(--secondary);">Executing Python subprocess...</span>';

    try {
      const res = await API.post('/api/sandbox/run', { code });
      if (res.status === 'success') {
        outputEl.innerHTML = `<span style="color: #10b981;">[Exit 0 • ${res.execution_time_ms}ms]\n${res.stdout || '<Empty stdout>'}</span>`;
      } else {
        outputEl.innerHTML = `<span style="color: #f43f5e;">[Error]\n${res.stderr || res.stdout}</span>`;
      }
    } catch (err) {
      outputEl.innerHTML = `<span style="color: #f43f5e;">Execution failed: ${err.message}</span>`;
    }
  },

  async runCodeTests() {
    const code = document.getElementById('player-code-editor').value;
    const rawTests = document.getElementById('player-code-testcases').value;
    const testCases = JSON.parse(rawTests || '[]');
    const outputEl = document.getElementById('player-code-output');

    if (testCases.length === 0) {
      this.runCodeSandbox();
      return;
    }

    outputEl.innerHTML = '<span style="color: var(--secondary);">Running automated test suite...</span>';
    try {
      const res = await API.post('/api/sandbox/test', { code, test_cases: testCases });
      let lines = `Test Results: ${res.passed_tests}/${res.total_tests} Passed (${res.score_percentage}%)\n\n`;
      res.results.forEach(r => {
        lines += `Test #${r.test_case}: ${r.passed ? '✓ PASSED' : '✗ FAILED'} (Input: "${r.input}" | Expected: "${r.expected_output}" | Actual: "${r.actual_output}")\n`;
      });

      if (res.all_passed) {
        outputEl.innerHTML = `<span style="color: #10b981;">${lines}\n🎉 All test cases verified successfully!</span>`;
        API.toast('All test cases passed!', 'success');
      } else {
        outputEl.innerHTML = `<span style="color: #f43f5e;">${lines}</span>`;
      }
    } catch (err) {
      outputEl.innerHTML = `<span style="color: #f43f5e;">Testing error: ${err.message}</span>`;
    }
  },

  async markCurrentComplete() {
    if (!this.currentContentId) return;

    try {
      const res = await API.post('/api/progress/mark-complete', {
        content_id: this.currentContentId,
        is_completed: true,
        time_spent_seconds: 120
      });

      // Update sidebar tick
            <p class="text-secondary" style="margin: 0.5rem 0 1.5rem;">
              You have completed 100% of the training program. Your verified certificate has been issued and registered.
            </p>
            <div class="badge badge-amber font-mono" style="font-size: 1rem; padding: 0.5rem 1rem;">
              ${res.certificate.certificate_code}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Continue</button>
            <button class="btn btn-primary" onclick="App.closeModal(); CertificateViewer.openCertificate(${res.certificate.id});">
              <i class="fi fi-rr-print"></i> View Certificate
            </button>
          </div>
        `);
      } else {
        this.navigateNext();
      }
    } catch (err) {
      console.error(err);
    }
  },

  navigateNext() {
    const allContents = [];
    this.currentCourseData.modules.forEach(m => {
      if (m.contents) allContents.push(...m.contents);
    });

    const currentIndex = allContents.findIndex(c => c.id === this.currentContentId);
    if (currentIndex >= 0 && currentIndex < allContents.length - 1) {
      this.loadContent(allContents[currentIndex + 1].id);
    } else {
      API.toast('You have reached the end of the course lessons!', 'info');
    }
  },

  navigatePrev() {
    const allContents = [];
    this.currentCourseData.modules.forEach(m => {
      if (m.contents) allContents.push(...m.contents);
    });

    const currentIndex = allContents.findIndex(c => c.id === this.currentContentId);
    if (currentIndex > 0) {
      this.loadContent(allContents[currentIndex - 1].id);
    }
  }
};
