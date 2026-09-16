/**
 * Timed Technical Assessment & Examination Runner with State Persistence
 */
const AssessmentRunner = {
  currentAssessment: null,
  answers: {},
  codeSubmission: "",
  timerInterval: null,
  remainingSeconds: 0,

  async startExam(assessmentId) {
    App.showView('assessment-view');
    window.location.hash = `#/exam/${assessmentId}`;
    localStorage.setItem('platform_current_route', `exam/${assessmentId}`);

    const container = document.getElementById('assessment-view-container');
    container.innerHTML = `<div style="padding: 4rem; text-align: center;"><div class="spinner"></div> Loading examination environment...</div>`;

    try {
      const data = await API.get(`/api/assessments/${assessmentId}`);
      this.currentAssessment = data;

      // Check for saved exam draft from previous session / refresh
      const savedDraftStr = localStorage.getItem(`exam_draft_${assessmentId}`);
      let savedDraft = null;
      if (savedDraftStr) {
        try { savedDraft = JSON.parse(savedDraftStr); } catch (e) {}
      }

      if (savedDraft) {
        this.answers = savedDraft.answers || {};
        this.codeSubmission = savedDraft.codeSubmission || "";
        const elapsedSinceSave = Math.floor((Date.now() - (savedDraft.lastSaved || Date.now())) / 1000);
        const savedRemaining = typeof savedDraft.remainingSeconds === 'number' ? savedDraft.remainingSeconds : (data.time_limit_minutes || 30) * 60;
        this.remainingSeconds = Math.max(1, savedRemaining - elapsedSinceSave);
        API.toast('Resumed active examination with previously saved answers.', 'info');
      } else {
        this.answers = {};
        this.codeSubmission = "";
        this.remainingSeconds = (data.time_limit_minutes || 30) * 60;
      }

      this.renderExamInterface();
      this.startTimer();
    } catch (err) {
      console.error(err);
      API.toast('Failed to load assessment', 'error');
    }
  },

  saveDraft() {
    if (this.currentAssessment) {
      localStorage.setItem(`exam_draft_${this.currentAssessment.id}`, JSON.stringify({
        answers: this.answers,
        codeSubmission: this.codeSubmission,
        remainingSeconds: this.remainingSeconds,
        lastSaved: Date.now()
      }));
    }
  },

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerDisplay = document.getElementById('exam-timer-display');

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds % 5 === 0) {
        this.saveDraft();
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        API.toast('Time is up! Submitting exam...', 'warning');
        this.submitExam(true);
        return;
      }

      const mins = Math.floor(this.remainingSeconds / 60);
      const secs = this.remainingSeconds % 60;
      if (timerDisplay) {
        timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  },

  renderExamInterface() {
    const a = this.currentAssessment;
    const container = document.getElementById('assessment-view-container');

    const questionsHtml = a.questions.map((q, idx) => {
      let inputSection = '';

      if (q.question_type === 'mcq') {
        inputSection = (q.options || []).map((opt, optIdx) => {
          const isSelected = String(this.answers[q.id]) === String(optIdx);
          return `
            <label class="question-option-label ${isSelected ? 'selected' : ''}" onclick="AssessmentRunner.selectSingleChoice(${q.id}, '${optIdx}')" id="q-${q.id}-opt-${optIdx}">
              <input type="radio" name="question_${q.id}" value="${optIdx}" ${isSelected ? 'checked' : ''} style="display: none;" />
              <span class="step-circle" style="width: 24px; height: 24px; font-size: 0.75rem;">${String.fromCharCode(65 + optIdx)}</span>
              <span>${opt}</span>
            </label>
          `;
        }).join('');
      } else if (q.question_type === 'multi_select') {
        inputSection = (q.options || []).map((opt, optIdx) => {
          const arr = this.answers[q.id] || [];
          const isSelected = arr.includes(String(optIdx));
          return `
            <label class="question-option-label ${isSelected ? 'selected' : ''}" onclick="AssessmentRunner.toggleMultiChoice(${q.id}, '${optIdx}')" id="q-${q.id}-opt-${optIdx}">
              <input type="checkbox" name="question_${q.id}" value="${optIdx}" ${isSelected ? 'checked' : ''} style="display: none;" />
              <span class="step-circle" style="width: 24px; height: 24px; font-size: 0.75rem;">${String.fromCharCode(65 + optIdx)}</span>
              <span>${opt}</span>
            </label>
          `;
        }).join('');
      } else if (q.question_type === 'coding') {
        const initialCode = this.answers[q.id] || this.codeSubmission || q.code_template || '# Write Python solution here\n';
        inputSection = `
          <div class="code-sandbox">
            <div class="code-sandbox-header">
              <span class="font-mono text-muted">solution.py</span>
              <button class="btn btn-secondary btn-sm" onclick="AssessmentRunner.testQuestionCode(${q.id})">▶ Test Code</button>
            </div>
            <textarea id="q-code-${q.id}" class="code-editor-area" oninput="AssessmentRunner.updateCode(${q.id}, this.value)">${initialCode}</textarea>
            <div class="code-output-area" id="q-output-${q.id}">Output will appear here...</div>
          </div>
        `;
      }

      return `
        <div class="question-card">
          <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
            <span class="badge badge-primary">Question ${idx + 1} of ${a.questions.length}</span>
            <span class="badge badge-purple">${q.points} Points</span>
          </div>
          <h3 style="font-size: 1.1rem; line-height: 1.4; margin-bottom: 1.25rem;">${q.question_text}</h3>
          <div>${inputSection}</div>
        </div>
      `;
    }).join('');

    const initialMins = Math.floor(this.remainingSeconds / 60);
    const initialSecs = this.remainingSeconds % 60;

    container.innerHTML = `
      <div class="assessment-layout">
        <!-- Sticky Exam Header -->
        <div class="assessment-header">
          <div>
            <h3 style="font-size: 1.15rem;">${a.title}</h3>
            <div class="text-muted" style="font-size: 0.78rem;">${a.course_title} • Passing Threshold: ${a.passing_percentage}%</div>
          </div>
          <div class="flex items-center gap-4">
            <div class="exam-timer">
              <i class="fi fi-rr-clock"></i> <span id="exam-timer-display">${initialMins.toString().padStart(2, '0')}:${initialSecs.toString().padStart(2, '0')}</span>
            </div>
            <button class="btn btn-success" onclick="AssessmentRunner.confirmSubmit()">
              <i class="fi fi-rr-check"></i> Submit Examination
            </button>
          </div>
        </div>

        <!-- Questions List -->
        <div>
          ${questionsHtml || '<div class="card p-4 text-center">No questions in this assessment.</div>'}
        </div>
      </div>
    `;
  },

  selectSingleChoice(questionId, optIdx) {
    this.answers[questionId] = String(optIdx);
    document.querySelectorAll(`[id^="q-${questionId}-opt-"]`).forEach(el => el.classList.remove('selected'));
    const selectedEl = document.getElementById(`q-${questionId}-opt-${optIdx}`);
    if (selectedEl) selectedEl.classList.add('selected');
    this.saveDraft();
  },

  toggleMultiChoice(questionId, optIdx) {
    if (!this.answers[questionId] || !Array.isArray(this.answers[questionId])) {
      this.answers[questionId] = [];
    }
    const arr = this.answers[questionId];
    const idx = arr.indexOf(String(optIdx));
    if (idx > -1) {
      arr.splice(idx, 1);
      document.getElementById(`q-${questionId}-opt-${optIdx}`).classList.remove('selected');
    } else {
      arr.push(String(optIdx));
      document.getElementById(`q-${questionId}-opt-${optIdx}`).classList.add('selected');
    }
    this.saveDraft();
  },

  updateCode(questionId, code) {
    this.answers[questionId] = code;
    this.codeSubmission = code;
    this.saveDraft();
  },

  async testQuestionCode(questionId) {
    const code = document.getElementById(`q-code-${questionId}`).value;
    const outputEl = document.getElementById(`q-output-${questionId}`);
    outputEl.innerHTML = '<span style="color: var(--secondary);">Running Python code...</span>';

    try {
      const res = await API.post('/api/sandbox/run', { code });
      outputEl.innerHTML = res.status === 'success'
        ? `<span style="color: #10b981;">${res.stdout || '<Code ran successfully with no output>'}</span>`
        : `<span style="color: #f43f5e;">${res.stderr || res.stdout}</span>`;
    } catch (err) {
      outputEl.innerHTML = `<span style="color: #f43f5e;">${err.message}</span>`;
    }
  },

  confirmSubmit() {
    if (confirm('Are you ready to submit your assessment? Automated grading will evaluate your answers immediately.')) {
      this.submitExam();
    }
  },

  async submitExam(isForcedTimeout = false) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    try {
      const res = await API.post('/api/assessments/submit', {
        assessment_id: this.currentAssessment.id,
        answers: this.answers,
        code_submission: this.codeSubmission
      });

      // Clear persisted exam draft on successful submission
      if (this.currentAssessment) {
        localStorage.removeItem(`exam_draft_${this.currentAssessment.id}`);
      }

      this.renderExamResult(res);
    } catch (err) {
      console.error(err);
      API.toast('Submission failed', 'error');
    }
  },

  renderExamResult(res) {
    const container = document.getElementById('assessment-view-container');
    const isPassed = res.passed;

    container.innerHTML = `
      <div class="assessment-layout" style="text-align: center; padding: 3rem 1rem;">
        <div class="card" style="max-width: 600px; margin: 0 auto; padding: 2.5rem;">
          <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">
            ${isPassed ? '🎉' : '⚠️'}
          </div>
          <h2>${isPassed ? 'Assessment Passed!' : 'Assessment Incomplete'}</h2>
          <p class="text-secondary" style="margin: 0.5rem 0 1.5rem;">
            ${isPassed ? 'Congratulations! You achieved the required score.' : 'You did not achieve the required passing threshold. Review feedback below.'}
          </p>

          <div class="card" style="padding: 1.5rem; background: var(--bg-tertiary); margin-bottom: 1.5rem;">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <div class="text-muted" style="font-size: 0.75rem;">SCORE</div>
                <div class="font-mono" style="font-size: 1.5rem; font-weight: 800;">${res.score} / ${res.max_score}</div>
              </div>
              <div>
                <div class="text-muted" style="font-size: 0.75rem;">PERCENTAGE</div>
                <div class="font-mono" style="font-size: 1.5rem; font-weight: 800; color: ${isPassed ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
                  ${res.percentage}%
                </div>
              </div>
              <div>
                <div class="text-muted" style="font-size: 0.75rem;">VERDICT</div>
                <div style="margin-top: 4px;">
                  <span class="badge ${isPassed ? 'badge-success' : 'badge-danger'}" style="font-size: 0.85rem;">
                    ${isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button class="btn btn-primary" onclick="App.navigate('dashboard')">
              Return to Dashboard
            </button>
            <button class="btn btn-outline" onclick="App.navigate('certificates')">
              View Certificates
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
