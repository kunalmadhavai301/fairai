import './style.css';

const API_BASE = 'http://127.0.0.1:8000';

interface Target {
  id: number;
  name: string;
  type: string;
  environment?: string;
  health_status?: string;
  last_latency_ms?: number;
  config: Record<string, any>;
  created_at?: string;
}

interface Scan {
  id: number;
  target_id: number;
  status: string;
  security_score?: number;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
}

interface Finding {
  id: number;
  scan_id: number;
  description: string;
  severity: string;
  location?: string;
  status?: string;
  details?: Record<string, any>;
}

interface Posture {
  overall_score: number;
  risk_level: string;
  total_targets: number;
  total_scans: number;
  total_findings: number;
  findings_breakdown: { critical: number; high: number; medium: number; low: number };
  posture_status: string;
}

interface AuditLog {
  id: number;
  action: string;
  details?: Record<string, any>;
  timestamp: string;
}

let activeTab = 'dashboard';
let targets: Target[] = [];
let scans: Scan[] = [];
let playbooks: any[] = [];
let auditLogs: AuditLog[] = [];
let posture: Posture | null = null;
let terminalLogs: string[] = [
  '[SYSTEM] Sentinel AI Command Center Initialized',
  '[SYSTEM] Live Monitoring Active: Polling interval 3000ms'
];

async function fetchData() {
  try {
    const tRes = await fetch(`${API_BASE}/targets/`);
    if (tRes.ok) targets = await tRes.json();
    const sRes = await fetch(`${API_BASE}/scans/`);
    if (sRes.ok) scans = await sRes.json();
    const pRes = await fetch(`${API_BASE}/posture`);
    if (pRes.ok) posture = await pRes.json();
    const pbRes = await fetch(`${API_BASE}/playbooks`);
    if (pbRes.ok) playbooks = await pbRes.json();
    const aRes = await fetch(`${API_BASE}/audit-logs`);
    if (aRes.ok) auditLogs = await aRes.json();
  } catch (e) {
    console.error('API error:', e);
  }
  render();
}

// Auto-refresh live data every 3 seconds for dynamic status updates
setInterval(fetchData, 3000);

function logTerminal(msg: string) {
  const time = new Date().toLocaleTimeString();
  terminalLogs.push(`[${time}] ${msg}`);
  if (terminalLogs.length > 50) terminalLogs.shift();
}

function renderSidebar() {
  return `
    <div class="sidebar">
      <div class="brand">
        <div class="brand-icon">S</div>
        <div class="brand-title">SENTINEL AI</div>
      </div>
      <ul class="nav-menu">
        <li class="nav-item ${activeTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">📊 SOC Dashboard</li>
        <li class="nav-item ${activeTab === 'targets' ? 'active' : ''}" onclick="switchTab('targets')">🎯 Target Intelligence</li>
        <li class="nav-item ${activeTab === 'scans' ? 'active' : ''}" onclick="switchTab('scans')">🔍 Security Audits</li>
        <li class="nav-item ${activeTab === 'playbooks' ? 'active' : ''}" onclick="switchTab('playbooks')">📋 Attack Playbooks</li>
        <li class="nav-item ${activeTab === 'audit-logs' ? 'active' : ''}" onclick="switchTab('audit-logs')">📜 Audit Trail</li>
      </ul>
    </div>
  `;
}

function renderDashboard() {
  const score = posture ? posture.overall_score : 100;
  const critical = posture ? posture.findings_breakdown.critical : 0;
  const high = posture ? posture.findings_breakdown.high : 0;

  return `
    <div class="header-bar">
      <div>
        <h1 class="page-title">AI Security Operations Center (SOC)</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Real-Time Posture, Target Diagnostics & Threat Intelligence</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" onclick="switchTab('playbooks')">📋 Playbooks</button>
        <button class="btn" onclick="switchTab('targets')">+ Register AI Target</button>
      </div>
    </div>
    
    <div class="grid-stats">
      <div class="stat-card" style="border-left: 4px solid ${score >= 85 ? 'var(--success-green)' : 'var(--danger-red)'}">
        <div class="stat-label">AI Security Posture Score</div>
        <div class="stat-value" style="color: ${score >= 85 ? 'var(--success-green)' : 'var(--danger-red)'}">${score}/100</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Targets</div>
        <div class="stat-value" style="color: var(--accent-cyan)">${targets.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Security Audits</div>
        <div class="stat-value" style="color: var(--accent-blue)">${scans.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Critical / High Risks</div>
        <div class="stat-value" style="color: var(--danger-red)">${critical + high}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      <div class="card">
        <h2 class="card-title">Target Health & Security Inventory</h2>
        <table>
          <thead>
            <tr>
              <th>Target Name</th>
              <th>Environment</th>
              <th>Health Status</th>
              <th>Latency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${targets.map(t => `
              <tr>
                <td><strong>${t.name}</strong> <span style="font-size: 12px; color: var(--text-muted);">(${t.type})</span></td>
                <td><span class="badge badge-warning">${t.environment || 'development'}</span></td>
                <td><span class="badge ${t.health_status === 'HEALTHY' ? 'badge-success' : 'badge-danger'}">${t.health_status || 'HEALTHY'}</span></td>
                <td><code>${t.last_latency_ms ? t.last_latency_ms + ' ms' : 'N/A'}</code></td>
                <td>
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="testConnection(${t.id})">Test Conn</button>
                  <button class="btn" style="padding: 4px 10px; font-size: 12px;" onclick="startScan(${t.id})">Run Audit</button>
                </td>
              </tr>
            `).join('')}
            ${targets.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No targets registered. Click "+ Register AI Target".</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <div class="card" style="background: var(--bg-primary); box-shadow: var(--neo-inset-md);">
        <h2 class="card-title" style="color: var(--accent-cyan); font-size: 16px;">📟 Live Security Terminal</h2>
        <div style="height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #38bdf8; font-family: monospace;">
          ${terminalLogs.map(log => `<div>${log}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTargets() {
  return `
    <div class="header-bar">
      <h1 class="page-title">Target Intelligence & Configuration</h1>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
      <div class="card">
        <h2 class="card-title">Register Target Endpoint</h2>
        <form onsubmit="handleCreateTarget(event)">
          <div class="form-group">
            <label>Target Name</label>
            <input type="text" id="t-name" class="form-control" placeholder="e.g. Production Llama3 Endpoint" required />
          </div>
          <div class="form-group">
            <label>Environment</label>
            <select id="t-env" class="form-control">
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div class="form-group">
            <label>Target Type</label>
            <select id="t-type" class="form-control">
              <option value="ollama">Ollama (Local LLM)</option>
              <option value="openai">OpenAI API Compatible</option>
              <option value="custom_rest">Custom REST API</option>
              <option value="agent">AI Agent Endpoint</option>
              <option value="rag">RAG Pipeline Endpoint</option>
            </select>
          </div>
          <div class="form-group">
            <label>Base URL / Endpoint</label>
            <input type="text" id="t-url" class="form-control" placeholder="http://localhost:11434" required />
          </div>
          <div class="form-group">
            <label>Model Identifier</label>
            <input type="text" id="t-model" class="form-control" placeholder="gemma3:1b" />
          </div>
          <button type="submit" class="btn" style="width: 100%; margin-top: 8px;">Save Target Intelligence</button>
        </form>
      </div>

      <div class="card">
        <h2 class="card-title">Registered Targets</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Env</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${targets.map(t => `
              <tr>
                <td>#${t.id}</td>
                <td><strong>${t.name}</strong></td>
                <td><span class="badge badge-warning">${t.environment || 'development'}</span></td>
                <td>${t.type}</td>
                <td><span class="badge ${t.health_status === 'HEALTHY' ? 'badge-success' : 'badge-danger'}">${t.health_status || 'HEALTHY'}</span></td>
                <td>
                  <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="testConnection(${t.id})">Test</button>
                  <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="deleteTarget(${t.id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPlaybooks() {
  return `
    <div class="header-bar">
      <h1 class="page-title">Attack Playbooks & Standardized Suites</h1>
    </div>
    <div class="grid-stats">
      ${playbooks.map(pb => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span class="badge badge-success" style="margin-bottom: 12px;">${pb.category}</span>
            <h2 class="card-title" style="font-size: 18px; margin-bottom: 10px;">${pb.name}</h2>
            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 20px; line-height: 1.5;">${pb.description}</p>
          </div>
          <button class="btn" onclick="switchTab('targets')">Execute Playbook</button>
        </div>
      `).join('')}
      ${playbooks.length === 0 ? '<div class="card"><p style="color: var(--text-muted);">Loading Playbooks...</p></div>' : ''}
    </div>
  `;
}

function renderScans() {
  return `
    <div class="header-bar">
      <h1 class="page-title">Security Audits & Vulnerability Assessments</h1>
    </div>
    <div class="card">
      <h2 class="card-title">Audit History</h2>
      <table>
        <thead>
          <tr>
            <th>Scan ID</th>
            <th>Target</th>
            <th>Status</th>
            <th>Pass Rate</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${scans.map(s => `
            <tr>
              <td>#${s.id}</td>
              <td>Target #${s.target_id}</td>
              <td><span class="badge ${s.status === 'completed' ? 'badge-success' : s.status === 'failed' ? 'badge-danger' : 'badge-warning'}">${s.status}</span></td>
              <td><strong>${s.result && s.result.pass_rate !== undefined ? s.result.pass_rate + '%' : 'Pending'}</strong></td>
              <td>${s.started_at ? new Date(s.started_at).toLocaleString() : 'N/A'}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="viewScanFindings(${s.id})">View Findings</button>
              </td>
            </tr>
          `).join('')}
          ${scans.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No security audits executed yet.</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuditTrail() {
  return `
    <div class="header-bar">
      <h1 class="page-title">Governance & Audit Trail</h1>
    </div>
    <div class="card">
      <h2 class="card-title">System Audit Log</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Action Event</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${auditLogs.map(log => `
            <tr>
              <td>#${log.id}</td>
              <td><span class="badge badge-warning">${log.action}</span></td>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          `).join('')}
          ${auditLogs.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Audit log is initialized and recording events.</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;
}

function render() {
  const app = document.querySelector('#app');
  if (!app) return;

  let content = '';
  if (activeTab === 'dashboard') content = renderDashboard();
  else if (activeTab === 'targets') content = renderTargets();
  else if (activeTab === 'playbooks') content = renderPlaybooks();
  else if (activeTab === 'scans') content = renderScans();
  else if (activeTab === 'audit-logs') content = renderAuditTrail();
  else content = `<div class="header-bar"><h1 class="page-title">${activeTab.toUpperCase()}</h1></div><div class="card"><p>Module active and operational.</p></div>`;

  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      ${content}
    </div>
  `;
}

(window as any).switchTab = (tab: string) => {
  activeTab = tab;
  render();
};

(window as any).closeModal = () => {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
};

(window as any).handleCreateTarget = async (e: Event) => {
  e.preventDefault();
  const name = (document.getElementById('t-name') as HTMLInputElement).value;
  const env = (document.getElementById('t-env') as HTMLSelectElement).value;
  const type = (document.getElementById('t-type') as HTMLSelectElement).value;
  const url = (document.getElementById('t-url') as HTMLInputElement).value;
  const model = (document.getElementById('t-model') as HTMLInputElement).value;

  const res = await fetch(`${API_BASE}/targets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, environment: env, type, config: { base_url: url, model } })
  });

  if (res.ok) {
    logTerminal(`Target registered: ${name} (${env})`);
    showCustomAlert('Target Added', `Target '${name}' has been successfully registered into Target Intelligence.`);
    fetchData();
  } else {
    showCustomAlert('Registration Failed', 'Failed to register target. Check if the target name is unique.', true);
  }
};

(window as any).testConnection = async (id: number) => {
  logTerminal(`Testing connection for Target #${id}...`);
  const res = await fetch(`${API_BASE}/targets/${id}/test`, { method: 'POST' });
  const data = await res.json();
  logTerminal(`Target #${id} connection test: ${data.success ? 'SUCCESS' : 'FAILED'} (${data.latency_ms}ms)`);

  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-overlay';

  const hasError = !!data.error;
  const statusColor = data.success ? (hasError ? 'var(--warning-yellow)' : 'var(--success-green)') : 'var(--danger-red)';
  const statusIcon = data.success ? (hasError ? '⚠️' : '⚡') : '❌';
  const statusTitle = data.success ? (hasError ? 'Connected with Diagnostics Warning' : 'Target Connected Successfully') : 'Target Connection Failed';

  modalContainer.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title" style="color: ${statusColor}">
          <span>${statusIcon}</span>
          <span>${statusTitle}</span>
        </div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>

      <div class="modal-grid">
        <div class="modal-stat">
          <div class="modal-stat-label">HTTP Response Code</div>
          <div class="modal-stat-val" style="color: ${statusColor}">${data.status_code || 'N/A'} OK</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Measured Latency</div>
          <div class="modal-stat-val" style="color: var(--accent-cyan)">${data.latency_ms} ms</div>
        </div>
      </div>

      ${hasError ? `
        <div class="modal-notice ${data.success ? '' : 'error'}">
          <strong>Diagnostic Output:</strong><br/>
          ${data.error}
        </div>
      ` : `
        <div class="modal-notice success">
          <strong>Verified Active:</strong> Endpoint responded cleanly and is ready for security auditing.
        </div>
      `}

      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn" onclick="closeModal(); startScan(${id});">Launch Security Scan</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);
  fetchData();
};

function showCustomAlert(title: string, message: string, isError: boolean = false) {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-box" style="width: 440px;">
      <div class="modal-header">
        <div class="modal-title" style="color: ${isError ? 'var(--danger-red)' : 'var(--accent-cyan)'}">
          <span>${isError ? '❌' : 'ℹ️'}</span>
          <span>${title}</span>
        </div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <p style="color: var(--text-main); font-size: 14px; margin-bottom: 24px; line-height: 1.6;">${message}</p>
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn" onclick="closeModal()">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);
}

(window as any).startScan = async (targetId: number) => {
  logTerminal(`Initiating Security Audit on Target #${targetId}...`);
  const res = await fetch(`${API_BASE}/scans/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId })
  });
  if (res.ok) {
    logTerminal(`Scan launched for Target #${targetId}`);
    showCustomAlert('Audit Started', `Security Scan has been queued for Target #${targetId}. Check the Live Terminal and Security Audits tab for updates.`);
    fetchData();
  }
};

(window as any).deleteTarget = async (id: number) => {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal-box" style="width: 440px;">
      <div class="modal-header">
        <div class="modal-title" style="color: var(--danger-red)">
          <span>⚠️</span>
          <span>Confirm Target Deletion</span>
        </div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <p style="color: var(--text-main); font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
        Are you sure you want to delete Target #${id}? All associated security scans and findings will be permanently removed.
      </p>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn" style="background: var(--danger-red);" onclick="executeDeleteTarget(${id})">Delete Target</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);
};

(window as any).executeDeleteTarget = async (id: number) => {
  (window as any).closeModal();
  await fetch(`${API_BASE}/targets/${id}`, { method: 'DELETE' });
  logTerminal(`Target #${id} deleted`);
  fetchData();
};

(window as any).viewScanFindings = async (scanId: number) => {
  const res = await fetch(`${API_BASE}/scans/${scanId}/findings`);
  if (res.ok) {
    const data = await res.json();
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-overlay';
    modalContainer.innerHTML = `
      <div class="modal-box" style="width: 600px;">
        <div class="modal-header">
          <div class="modal-title" style="color: var(--accent-cyan)">
            <span>🔍</span>
            <span>Scan #${scanId} Findings (${data.length})</span>
          </div>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
          ${data.map((f: any) => `
            <div style="background: var(--bg-primary); box-shadow: var(--neo-inset-sm); border: 1px solid var(--border-subtle); padding: 14px 18px; border-radius: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="badge ${f.severity === 'critical' || f.severity === 'high' ? 'badge-danger' : 'badge-warning'}">${f.severity.toUpperCase()}</span>
                <span style="font-size: 12px; color: var(--text-muted);">${f.location || 'OWASP-LLM'}</span>
              </div>
              <p style="font-size: 13px; color: var(--text-main); line-height: 1.4;">${f.description}</p>
            </div>
          `).join('')}
          ${data.length === 0 ? '<p style="color: var(--text-muted); text-align: center;">No security vulnerabilities detected in this scan.</p>' : ''}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn" onclick="closeModal()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalContainer);
  }
};

fetchData();
