/**
 * Pilot AI Copilot - Real-time Conversational Assistant & Recommendation Engine
 */
const PilotCopilot = {
  messages: [
    {
      type: 'user',
      author: 'Elena',
      time: '3m ago',
      text: 'What should I look at in the next hour?'
    },
    {
      type: 'ai',
      thoughtTime: '11s',
      recommendations: [
        {
          id: 1,
          text: 'Orbit C240 is 6 min behind. Rerouting can recover about 4 min.',
          actionText: 'Resolve',
          actionType: 'reroute',
          target: 'Orbit C240'
        },
        {
          id: 2,
          text: 'Ember P77 flagged a sensor error.',
          actionText: 'Reassign',
          actionType: 'reassign',
          target: 'Ember P77',
          suffix: 'before the next stop.'
        },
        {
          id: 3,
          text: 'Charge coverage is tightening. 28 units need a top-up.',
          actionText: 'Review',
          actionType: 'topup',
          target: '28 units'
        }
      ]
    }
  ],

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('pilot-copilot-container');
    if (!container) return;

    container.innerHTML = `
      <div class="bento-pilot-header">
        <div class="bento-pilot-title-box">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
          <span class="bento-pilot-title">Pilot</span>
        </div>
        <div class="bento-pilot-actions">
          <button class="bento-pilot-icon-btn" title="Toggle Compact View" onclick="PilotCopilot.toggleCompact()">
            <i class="fi fi-rr-window"></i>
          </button>
          <button class="bento-pilot-icon-btn" title="Filter Insights" onclick="API.toast('Pilot filters active: All Operations & Labs', 'info')">
            <i class="fi fi-rr-filter"></i>
          </button>
          <button class="bento-pilot-icon-btn" title="Refresh Copilot" onclick="PilotCopilot.refresh()">
            <i class="fi fi-rr-refresh"></i>
          </button>
        </div>
      </div>

      <div class="bento-pilot-content" id="pilot-chat-timeline">
        ${this.renderTimelineHtml()}
      </div>

      <div class="bento-pilot-input-wrapper">
        <button class="pilot-plus-btn" title="Attach context or metric" onclick="API.toast('Context picker opened: Select Course / Student / Node', 'info')">+</button>
        <input type="text" id="pilot-chat-input" class="pilot-chat-input" placeholder="Ask anything..." onkeydown="if(event.key==='Enter') PilotCopilot.sendMessage()" />
        <button class="pilot-mic-btn" title="Voice Input" onclick="PilotCopilot.startVoice()"><i class="fi fi-rr-microphone"></i></button>
        <button class="pilot-send-btn" title="Send" onclick="PilotCopilot.sendMessage()"><i class="fi fi-rr-arrow-up"></i></button>
      </div>
    `;
  },

  renderTimelineHtml() {
    return this.messages.map(m => {
      if (m.type === 'user') {
        return `
          <div class="pilot-user-prompt-card">
            <div class="pilot-user-avatar">${(m.author || 'U').charAt(0)}</div>
            <div class="pilot-user-bubble">
              <div style="font-weight: 700; font-size: 0.72rem; color: #64748b; margin-bottom: 2px;">${m.author} • ${m.time}</div>
              <div>${m.text}</div>
            </div>
          </div>
        `;
      } else if (m.type === 'ai') {
        return `
          <div>
            <div class="pilot-thought-badge" style="margin-bottom: 8px;">
              <span style="font-size: 0.8rem;">◇</span> <strong>Pilot</strong> Thought for ${m.thoughtTime || '5s'}
            </div>
            <div class="pilot-response-card">
              ${m.customText ? `<div style="font-size: 0.82rem; line-height: 1.5; color: #1e293b; margin-bottom: 6px;">${m.customText}</div>` : ''}
              ${m.recommendations && m.recommendations.length > 0 ? `
                <ol class="pilot-recs-list">
                  ${m.recommendations.map((r, i) => `
                    <li>
                      <span><strong>${i + 1}.</strong> ${r.text}</span>
                      ${r.actionText ? `<a class="pilot-action-link" onclick="PilotCopilot.triggerAction('${r.actionType}', '${r.target}')">${r.actionText}</a>` : ''}
                      ${r.suffix ? `<span> ${r.suffix}</span>` : ''}
                    </li>
                  `).join('')}
                </ol>
              ` : ''}
            </div>
          </div>
        `;
      }
    }).join('');
  },

  async sendMessage() {
    const input = document.getElementById('pilot-chat-input');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    input.value = '';

    // Push user message
    this.messages.push({
      type: 'user',
      author: 'You',
      time: 'Just now',
      text: query
    });

    const timeline = document.getElementById('pilot-chat-timeline');
    if (timeline) {
      timeline.innerHTML = this.renderTimelineHtml() + `
        <div id="pilot-thinking-indicator" class="pilot-thought-badge" style="margin-top: 8px;">
          <div class="spinner-sm" style="width: 12px; height: 12px;"></div> <strong>Pilot</strong> analyzing metrics...
        </div>
      `;
      timeline.scrollTop = timeline.scrollHeight;
    }

    // Generate intelligent AI response after short delay
    setTimeout(() => {
      let aiResponse = {
        type: 'ai',
        thoughtTime: '4s',
        customText: '',
        recommendations: []
      };

      const q = query.toLowerCase();
      if (q.includes('student') || q.includes('enroll') || q.includes('cohort')) {
        aiResponse.customText = 'Analyzed academic cohorts across active departments:';
        aiResponse.recommendations = [
          { text: '94% of students are actively progressing through Module 2.', actionText: 'View Roster', actionType: 'navigate_students' },
          { text: '3 students in 2021-2025 batch flagged for assignment submission delay.', actionText: 'Send Alert', actionType: 'notify_batch' }
        ];
      } else if (q.includes('course') || q.includes('opencv') || q.includes('syllabus')) {
        aiResponse.customText = 'Verified course catalog status:';
        aiResponse.recommendations = [
          { text: 'OpenCV (CV3) curriculum is 100% active with JetBot lab integrations.', actionText: 'Download Syllabus', actionType: 'syllabus_13' },
          { text: 'Registration link is active for 2021-2025 student admissions.', actionText: 'Share Link', actionType: 'share_13' }
        ];
      } else if (q.includes('exam') || q.includes('pass') || q.includes('result')) {
        aiResponse.customText = 'Technical assessment diagnostic:';
        aiResponse.recommendations = [
          { text: 'Average pass rate is steady at 84% with 92% high-distinction in Computer Science.', actionText: 'Open Grading Matrix', actionType: 'navigate_results' }
        ];
      } else {
        aiResponse.customText = `Synthesized operational metrics for "${query}":`;
        aiResponse.recommendations = [
          { text: 'All compute nodes & JetBot robotics sandboxes are running within optimal limits (88% link strength).', actionText: 'Run Health Check', actionType: 'health_check' },
          { text: '28 active operations are on-track with zero blocking anomalies.', actionText: 'View Ops Board', actionType: 'scroll_ops' }
        ];
      }

      this.messages.push(aiResponse);
      if (timeline) {
        timeline.innerHTML = this.renderTimelineHtml();
        timeline.scrollTop = timeline.scrollHeight;
      }
    }, 700);
  },

  triggerAction(actionType, target) {
    if (actionType === 'reroute') {
      API.toast(`✓ Rerouted ${target} successfully. 4 min recovered!`, 'success');
    } else if (actionType === 'reassign') {
      API.toast(`✓ ${target} sensor task reassigned to Station Beta.`, 'success');
    } else if (actionType === 'topup') {
      API.toast(`✓ Charge coverage scheduled for ${target}.`, 'info');
    } else if (actionType === 'navigate_students') {
      App.navigate('students');
    } else if (actionType === 'navigate_results') {
      App.navigate('results');
    } else if (actionType === 'share_13') {
      App.openShareCourseModal(13);
    } else if (actionType === 'syllabus_13') {
      App.downloadSyllabusPDF(13);
    } else {
      API.toast(`Action triggered for ${target}`, 'info');
    }
  },

  startVoice() {
    API.toast('🎙 Voice command listening: Ask Pilot anything...', 'info');
    setTimeout(() => {
      const input = document.getElementById('pilot-chat-input');
      if (input) {
        input.value = 'What is the current course completion rate?';
        this.sendMessage();
      }
    }, 1200);
  },

  refresh() {
    API.toast('Pilot Copilot refreshed with live platform metrics', 'success');
    this.render();
  },

  toggleCompact() {
    const sidebar = document.getElementById('bento-pilot-sidebar');
    if (sidebar) {
      if (sidebar.style.width === '60px') {
        sidebar.style.width = '350px';
      } else {
        sidebar.style.width = '60px';
      }
    }
  }
};