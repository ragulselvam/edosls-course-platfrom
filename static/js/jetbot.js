/**
 * NVIDIA JetBot & AI Robotics Practical Training Simulation Module
 */
const JetBotSimulator = {
  telemetryInterval: null,

  renderPanel(content) {
    let payload = {
      task_title: "JetBot Autonomous Collision Avoidance & YOLO Vision",
      instructions: "Implement the real-time inference loop using the camera frame to control motor throttle and steering.",
      starter_script: `from jetbot import Robot, Camera\nimport torch\n\nrobot = Robot()\ncamera = Camera.instance(width=224, height=224)\n\n# Autonomous loop\ndef execute(change):\n    image = change['new']\n    # Model prediction\n    prediction = model(preprocess(image))\n    if prediction > 0.6:\n        robot.left = -0.3\n        robot.right = 0.3 # Turn\n    else:\n        robot.left = 0.4\n        robot.right = 0.4 # Drive\n\ncamera.observe(execute, names='value')\n`
    };

    try {
      if (content.content_data) {
        payload = { ...payload, ...JSON.parse(content.content_data) };
      }
    } catch (e) {}

    return `
      <div style="max-width: 1000px; margin: 0 auto;">
        <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
          <div>
            <h2><i class="fi fi-rr-robot" style="color: var(--nvidia-green);"></i> ${content.title}</h2>
            <div class="text-secondary" style="font-size: 0.85rem; margin-top: 2px;">
              NVIDIA JetBot / Jetson Orin Nano Edge AI Practical Testbench
            </div>
          </div>
          <span class="badge badge-success font-mono">Jetson TensorRT / CUDA Active</span>
        </div>

        <div class="jetbot-simulator-card" style="margin-bottom: 1.5rem;">
          <div class="grid grid-cols-2 gap-6">
            <!-- Simulated Camera Feed -->
            <div>
              <div class="flex justify-between" style="font-size: 0.75rem; margin-bottom: 6px;">
                <span class="font-mono text-muted">CSI CAMERA STREAM (224x224 @ 30 FPS)</span>
                <span style="color: var(--nvidia-green); font-weight: 700;">● LIVE TELEMETRY</span>
              </div>
              <div class="jetbot-camera-view" id="jetbot-camera-feed">
                <!-- Background camera simulation -->
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;" />
                <!-- Bounding boxes overlay -->
                <div class="yolo-box" style="top: 80px; left: 140px; width: 90px; height: 110px;">
                  traffic_cone (94%)
                </div>
                <div class="yolo-box" style="top: 40px; left: 300px; width: 60px; height: 60px; border-color: #38bdf8; color: #38bdf8;">
                  stop_sign (96%)
                </div>
              </div>
            </div>

            <!-- Real-time Telemetry Gauges -->
            <div class="flex flex-col justify-between">
              <div>
                <h4 style="color: var(--nvidia-green); margin-bottom: 0.5rem;">Hardware & Neural Model Telemetry</h4>
                <div class="telemetry-gauge-grid">
                  <div class="telemetry-gauge">
                    <div class="text-muted" style="font-size: 0.7rem;">LEFT MOTOR</div>
                    <div class="font-mono" id="gauge-left-motor" style="font-size: 1.25rem; font-weight: 700; color: #fff;">0.35 m/s</div>
                  </div>
                  <div class="telemetry-gauge">
                    <div class="text-muted" style="font-size: 0.7rem;">RIGHT MOTOR</div>
                    <div class="font-mono" id="gauge-right-motor" style="font-size: 1.25rem; font-weight: 700; color: #fff;">0.35 m/s</div>
                  </div>
                  <div class="telemetry-gauge">
                    <div class="text-muted" style="font-size: 0.7rem;">INFERENCE TIME</div>
                    <div class="font-mono" style="font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald);">14.2 ms</div>
                  </div>
                  <div class="telemetry-gauge">
                    <div class="text-muted" style="font-size: 0.7rem;">STEERING ANGLE</div>
                    <div class="font-mono" id="gauge-steering" style="font-size: 1.25rem; font-weight: 700; color: #38bdf8;">0.00°</div>
                  </div>
                </div>
              </div>

              <!-- Upload Custom Model / Notebook -->
              <div class="card" style="padding: 0.85rem; background: rgba(0,0,0,0.4); margin-top: 1rem;">
                <div class="text-muted" style="font-size: 0.72rem; margin-bottom: 4px;">UPLOAD DATASET / PYTORCH MODEL / JUPYTER NOTEBOOK (.pth, .pt, .onnx, .ipynb):</div>
                <div class="flex items-center gap-2">
                  <input type="file" id="jetbot-file-upload" class="form-input" style="padding: 0.35rem; font-size: 0.75rem;" />
                  <button class="btn btn-secondary btn-sm" onclick="JetBotSimulator.uploadModelFile()">Upload</button>
                </div>
                <div id="jetbot-upload-status" class="text-muted font-mono" style="font-size: 0.72rem; margin-top: 4px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- JetBot Python Control Script Editor -->
        <div class="code-sandbox">
          <div class="code-sandbox-header">
            <span class="font-mono" style="color: var(--nvidia-green); font-weight: 700;">jetbot_controller.py</span>
            <button class="btn btn-nvidia btn-sm" onclick="JetBotSimulator.simulateRoboticsLoop(${content.id})">
              🚀 Run Autonomous Simulation & Grade
            </button>
          </div>
          <textarea id="jetbot-code-editor" class="code-editor-area" style="min-height: 200px;" spellcheck="false">${payload.starter_script}</textarea>
          <div class="code-output-area" id="jetbot-output">
            Click 'Run Autonomous Simulation & Grade' to execute the JetBot perception and motor control pipeline...
          </div>
        </div>
      </div>
    `;
  },

  async uploadModelFile() {
    const fileInput = document.getElementById('jetbot-file-upload');
    const statusEl = document.getElementById('jetbot-upload-status');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      API.toast('Please select a file to upload', 'warning');
      return;
    }

    const file = fileInput.files[0];
    statusEl.innerHTML = `Uploading ${file.name}...`;

    try {
      const res = await API.upload(file, 'robotics');
      statusEl.innerHTML = `✓ Uploaded: <span style="color: #10b981;">${res.filename}</span> (${Math.round(res.size_bytes / 1024)} KB)`;
      API.toast(`Uploaded ${res.filename} to Jetson storage!`, 'success');
    } catch (err) {
      statusEl.innerHTML = `<span style="color: #f43f5e;">Upload failed</span>`;
    }
  },

  async simulateRoboticsLoop(contentId) {
    const script = document.getElementById('jetbot-code-editor').value;
    const outputEl = document.getElementById('jetbot-output');
    outputEl.innerHTML = '<span style="color: var(--nvidia-green);">[Jetson Engine] Initializing PyTorch CUDA context, camera pipeline, and motor telemetry...</span>';

    try {
      const res = await API.post('/api/sandbox/jetbot-simulate', {
        assessment_id: 1,
        python_script: script,
        camera_task_type: "yolo_object_detection"
      });

      // Animate telemetry gauges
      let tIdx = 0;
      if (this.telemetryInterval) clearInterval(this.telemetryInterval);
      this.telemetryInterval = setInterval(() => {
        if (!res.telemetry || tIdx >= res.telemetry.length) {
          clearInterval(this.telemetryInterval);
          return;
        }
        const sample = res.telemetry[tIdx];
        const leftEl = document.getElementById('gauge-left-motor');
        const rightEl = document.getElementById('gauge-right-motor');
        const steerEl = document.getElementById('gauge-steering');
        if (leftEl) leftEl.innerText = `${sample.left_motor_speed} m/s`;
        if (rightEl) rightEl.innerText = `${sample.right_motor_speed} m/s`;
        if (steerEl) steerEl.innerText = `${(sample.steering_angle * 57.3).toFixed(1)}°`;
        tIdx++;
      }, 300);

      let text = `================ JETSON ROBOTICS SIMULATION REPORT ================\n`;
      text += `Status: ${res.passed ? '✓ PASSED (Score: ' + res.score + '/100)' : '✗ NEEDS IMPROVEMENT (Score: ' + res.score + '/100)'}\n`;
      text += `Benchmark: ${res.fps_benchmark}\n`;
      text += `Perception Feedback: ${res.feedback}\n\n`;
      text += `YOLO Detections:\n`;
      res.detected_objects.forEach(obj => {
        text += ` - [Object: ${obj.label}] Confidence: ${(obj.confidence * 100).toFixed(1)}% | BoundingBox: [${obj.bbox.join(', ')}]\n`;
      });

      outputEl.innerHTML = `<span style="color: ${res.passed ? '#10b981' : '#f59e0b'};">${text}</span>`;
      API.toast(`JetBot Simulation Score: ${res.score}%`, res.passed ? 'success' : 'info');
    } catch (err) {
      outputEl.innerHTML = `<span style="color: #f43f5e;">Simulation error: ${err.message}</span>`;
    }
  }
};
