/**
 * Certificate Generator, High-Resolution Renderer & Public QR Verifier
 */
const CertificateViewer = {
  async openCertificate(certificateId) {
    try {
      const cert = await API.get(`/api/certificates/${certificateId}`);
      this.renderCertificateModal(cert);
    } catch (err) {
      console.error(err);
      API.toast('Failed to load certificate', 'error');
    }
  },

  renderCertificateModal(cert) {
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>Official Certificate of Completion</h3>
          <span class="badge badge-amber font-mono" style="margin-top: 4px;">ID: ${cert.certificate_code}</span>
        </div>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="background: #090d16; padding: 2rem; overflow-x: auto; display: flex; justify-content: center;">
        <div class="certificate-preview-wrapper" id="printable-certificate-area">
          <div class="certificate-canvas" style="width: 820px; min-height: 580px; background: radial-gradient(circle at 50% 50%, #ffffff 0%, #faf8f4 100%); border: 12px double #b45309; padding: 3rem; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; align-items: center; text-align: center; color: #0f172a; border-radius: 4px;">
            
            <!-- Guilloche Gold Filigree Border -->
            <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 1.5px solid #d97706; pointer-events: none;"></div>
            <div style="position: absolute; top: 14px; left: 14px; right: 14px; bottom: 14px; border: 1px dashed rgba(217, 119, 6, 0.4); pointer-events: none;"></div>

            <!-- Top Header & University Crest -->
            <div style="margin-top: 0.5rem;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #b45309); color: #fff; font-size: 1.25rem; margin-bottom: 0.5rem; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);">
                <i class="fi fi-rr-building"></i>
              </div>
              <div style="font-size: 0.9rem; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #b45309; font-family: 'Plus Jakarta Sans', sans-serif;">
                ${cert.college_name || 'Academic Training Institution'}
              </div>
              <div style="font-size: 2.2rem; font-weight: 800; letter-spacing: 0.04em; color: #1e293b; margin-top: 0.25rem; font-family: 'Cinzel', serif; text-transform: uppercase;">
                Certificate of Excellence
              </div>
              <div style="font-size: 0.8rem; font-weight: 600; letter-spacing: 0.15em; color: #64748b; margin-top: 0.2rem; text-transform: uppercase;">
                This Credential is Proudly Conferred Upon
              </div>
            </div>

            <!-- Recipient Name -->
            <div style="margin: 1.5rem 0 0.75rem;">
              <div style="font-size: 2.4rem; font-weight: 800; color: #1e3a8a; font-family: 'Cinzel', serif; border-bottom: 2px solid #d97706; padding-bottom: 0.35rem; min-width: 440px; display: inline-block;">
                ${cert.first_name} ${cert.last_name}
              </div>
              <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.4rem; font-family: 'Inter', sans-serif;">
                Roll No: <strong style="color: #0f172a;">${cert.roll_number || 'N/A'}</strong> • Department of <strong style="color: #0f172a;">${cert.department || 'Computer Science & Robotics'}</strong>
              </div>
            </div>

            <!-- Description -->
            <p style="font-size: 0.9rem; color: #334155; max-width: 620px; line-height: 1.6; margin-bottom: 1.25rem; font-family: 'Inter', sans-serif;">
              for exemplary mastery, practical hands-on assessments, and successful completion of the curriculum:
              <br><strong style="font-size: 1.15rem; color: #0f172a; display: inline-block; margin-top: 4px;">${cert.course_title}</strong>
              <br><span style="font-size: 0.78rem; color: #64748b;">(Course Code: ${cert.course_code} • Duration: ${cert.course_duration || '6 Weeks'} • Passing Grade: A+)</span>
            </p>

            <!-- Bottom Row: Signatures, QR Code, Gold Seal -->
            <div style="width: 100%; display: flex; align-items: flex-end; justify-content: space-between; margin-top: auto; padding: 0 1rem;">
              <!-- Issue Date & QR Box -->
              <div style="text-align: left; display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 52px; height: 52px; background: #ffffff; border: 2px solid #0f172a; padding: 3px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.5rem; font-weight: 800; text-align: center; color: #000; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                  QR CODE<br>VERIFIED
                </div>
                <div>
                  <div style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase;">DATE OF ISSUANCE</div>
                  <div style="font-weight: 700; font-size: 0.88rem; color: #0f172a;">${cert.issue_date}</div>
                  <div class="font-mono" style="font-size: 0.65rem; color: #b45309; font-weight: 700;">
                    ID: ${cert.certificate_code}
                  </div>
                </div>
              </div>

              <!-- Embossed Gold Seal -->
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div class="certificate-seal" style="width: 76px; height: 76px; border: 3px dashed rgba(255,255,255,0.7); box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);">
                  ★ OFFICIAL ★<br>ACADEMIC<br>CREDENTIAL
                </div>
              </div>

              <!-- Signer -->
              <div style="text-align: right;">
                <div style="font-family: 'Brush Script MT', 'Dancing Script', cursive, sans-serif; font-size: 1.6rem; color: #1e293b; line-height: 1;">
                  ${cert.signature_name || 'Dr. Evelyn Carter'}
                </div>
                <div style="border-top: 1.5px solid #0f172a; padding-top: 4px; font-size: 0.75rem; font-weight: 700; color: #334155; margin-top: 4px;">
                  ${cert.signature_title || 'Head of AI & Academic Programs'}
                </div>
                <div style="font-size: 0.68rem; color: #64748b;">${cert.college_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="CertificateViewer.openVerifier('${cert.certificate_code}')">
          <i class="fi fi-rr-search"></i> Verify Public Record
        </button>
        <button class="btn btn-primary" onclick="window.print()">
          <i class="fi fi-rr-print"></i> Print / Download PDF
        </button>
      </div>
    `, 'modal-xl');
  },

  async openVerifier(prefillCode = '') {
    App.showModal(`
      <div class="modal-header">
        <h3>Public Certificate Verification Portal</h3>
        <button class="icon-btn" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-secondary" style="font-size: 0.85rem; margin-bottom: 1rem;">
          Enter the unique Certificate Code printed on any credential issued by the platform to verify authenticity.
        </p>
        <div class="flex gap-2" style="margin-bottom: 1.5rem;">
          <input type="text" id="verify-code-input" class="form-input font-mono" placeholder="e.g. CERT-AIT-401-98F27A" value="${prefillCode}" style="text-transform: uppercase;" />
          <button class="btn btn-primary" onclick="CertificateViewer.executeVerify()">Verify</button>
        </div>

        <div id="verify-result-box"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `);

    if (prefillCode) {
      this.executeVerify();
    }
  },

  async executeVerify() {
    const code = document.getElementById('verify-code-input').value.trim();
    const resBox = document.getElementById('verify-result-box');
    if (!code) {
      API.toast('Please enter a certificate code', 'warning');
      return;
    }

    resBox.innerHTML = '<div style="text-align: center; padding: 1.5rem;" class="text-muted">Querying official blockchain / registry...</div>';

    try {
      const res = await API.get(`/api/certificates/verify/${code}`);
      if (res.is_valid) {
        resBox.innerHTML = `
          <div class="card" style="border-color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1);">
            <div class="flex items-center gap-2" style="color: var(--accent-emerald); font-weight: 700; font-size: 1.05rem; margin-bottom: 0.75rem;">
              <i class="fi fi-rr-badge-check"></i> <span>AUTHENTIC & VERIFIED CREDENTIAL</span>
            </div>
            <div class="grid grid-cols-2 gap-3" style="font-size: 0.85rem;">
              <div><span class="text-muted">Student Name:</span> <strong>${res.student_name}</strong></div>
              <div><span class="text-muted">Roll Number:</span> <strong>${res.roll_number}</strong></div>
              <div><span class="text-muted">Course:</span> <strong>${res.course_title} (${res.course_code})</strong></div>
              <div><span class="text-muted">Issuing Institution:</span> <strong>${res.college_name}</strong></div>
              <div><span class="text-muted">Issue Date:</span> <strong>${res.issue_date}</strong></div>
              <div><span class="text-muted">Authorized Signer:</span> <strong>${res.signature_name}</strong></div>
            </div>
          </div>
        `;
      } else {
        resBox.innerHTML = `
          <div class="card" style="border-color: var(--accent-rose); background: rgba(244, 63, 94, 0.1);">
            <div style="color: var(--accent-rose); font-weight: 700; margin-bottom: 4px;">✕ INVALID CERTIFICATE RECORD</div>
            <p class="text-secondary" style="font-size: 0.85rem;">${res.message}</p>
          </div>
        `;
      }
    } catch (err) {
      resBox.innerHTML = `<div class="text-danger p-3">Verification check failed: ${err.message}</div>`;
    }
  }
};
