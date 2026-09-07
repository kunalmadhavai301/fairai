/**
 * SurveySnap AI - Enterprise Application Logic
 */

// Application State
const state = {
  authToken: localStorage.getItem('surveysnap_token') || null,
  currentUser: JSON.parse(localStorage.getItem('surveysnap_user') || 'null'),
  uploadedFiles: [],
  activeFileId: null,
  activeFileDetails: null,
  activeContent: null,
  originalContent: null,
  versions: [],
  workspaceMode: 'dual', // 'dual', 'diff', 'single'
  charts: { bar: null, pie: null, line: null }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas();
  checkAuthStatus();
  fetchFilesList();
  fetchDashboardStats();
  initCharts();
  fetchAnalyticsForFile();
});

// --- Particle Canvas Animation ---
function initParticleCanvas() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(168, 85, 247, ' : 'rgba(99, 102, 241, '
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '0.4)';
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function scrollToUpload() {
  const elem = document.getElementById('upload');
  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.borderLeftColor = 'var(--rose)';
  if (type === 'success') toast.style.borderLeftColor = 'var(--emerald)';
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// --- API Request Wrapper ---
async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const headers = {};
  if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

  const config = { method, headers };
  if (data) {
    if (isFormData) config.body = data;
    else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }
  }

  try {
    const res = await fetch(endpoint, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Server Error' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

// --- Auth & RBAC ---
function checkAuthStatus() {
  const unreg = document.getElementById('auth-unregistered');
  const reg = document.getElementById('auth-registered');
  const nameDisp = document.getElementById('user-display-name');
  const adminNav = document.getElementById('admin-nav-item');

  if (state.currentUser && state.authToken) {
    unreg.style.display = 'none';
    reg.style.display = 'flex';
    nameDisp.textContent = state.currentUser.full_name || state.currentUser.email;

    if (state.currentUser.role === 'admin') {
      adminNav.style.display = 'inline-block';
    } else {
      adminNav.style.display = 'none';
    }
  } else {
    unreg.style.display = 'flex';
    reg.style.display = 'none';
    adminNav.style.display = 'none';
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  if (id === 'admin-modal') fetchAdminUsers();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function fillLoginCredentials(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  showToast(`Credentials filled for ${email}`, 'info');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await apiRequest('/api/auth/login', 'POST', { email, password });
    state.authToken = res.access_token;
    state.currentUser = res.user;
    localStorage.setItem('surveysnap_token', res.access_token);
    localStorage.setItem('surveysnap_user', JSON.stringify(res.user));
    checkAuthStatus();
    closeModal('login-modal');
    showToast(`Welcome back, ${res.user.full_name}!`, 'success');
  } catch (err) {}
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const full_name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await apiRequest('/api/auth/register', 'POST', { full_name, email, password });
    state.authToken = res.access_token;
    state.currentUser = res.user;
    localStorage.setItem('surveysnap_token', res.access_token);
    localStorage.setItem('surveysnap_user', JSON.stringify(res.user));
    checkAuthStatus();
    closeModal('register-modal');
    showToast('Account registered successfully!', 'success');
  } catch (err) {}
}

function logoutUser() {
  state.authToken = null;
  state.currentUser = null;
  localStorage.removeItem('surveysnap_token');
  localStorage.removeItem('surveysnap_user');
  checkAuthStatus();
  showToast('Logged out successfully.', 'info');
  openModal('login-modal');
}

// --- Upload Workspace ---
function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) uploadFiles(files);
}

const dropArea = document.getElementById('drag-drop-area');
if (dropArea) {
  ['dragenter', 'dragover'].forEach(name => dropArea.addEventListener(name, (e) => { e.preventDefault(); dropArea.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(name => dropArea.addEventListener(name, (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); }));
  dropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) uploadFiles(files);
  });
}

async function uploadFiles(files) {
  const formData = new FormData();
  for (let file of files) formData.append('files', file);

  showToast(`Uploading ${files.length} file(s)...`, 'info');
  try {
    const res = await apiRequest('/api/files/upload', 'POST', formData, true);
    showToast('Upload completed!', 'success');
    fetchFilesList();
    fetchDashboardStats();
    if (res.files && res.files.length > 0) {
      openFileInWorkspace(res.files[0].id);
    }
  } catch (err) {}
}

async function fetchFilesList() {
  try {
    const files = await apiRequest('/api/files');
    state.uploadedFiles = files;
    renderFilesQueue(files);
    updateConvertSelectOptions(files);
    fetchAnalyticsForFile();
  } catch (err) {}
}

function renderFilesQueue(files) {
  const tbody = document.getElementById('files-queue-body');
  if (!tbody) return;

  if (files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">No files uploaded yet. Drag & drop above to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = files.map(f => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${f.original_name}</td>
      <td><span class="format-tag">${f.file_type.toUpperCase()}</span></td>
      <td>${(f.file_size / 1024).toFixed(1)} KB</td>
      <td><span style="color: var(--accent);">v${f.current_version || 1}</span></td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="openFileInWorkspace(${f.id})"><i class="fa-solid fa-folder-open"></i> Open Workspace</button>
        <button class="btn btn-secondary btn-sm" style="color: var(--rose);" onclick="deleteFileRecord(${f.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function updateConvertSelectOptions(files) {
  const selectConvert = document.getElementById('convert-source-select');
  const selectSecurity = document.getElementById('sec-lock-file-select');
  
  const optionsHtml = `<option value="">Use active workspace document...</option>` +
    files.map(f => `<option value="${f.id}">${f.original_name} (${f.file_type.toUpperCase()})</option>`).join('');

  if (selectConvert) selectConvert.innerHTML = optionsHtml;
  if (selectSecurity) selectSecurity.innerHTML = optionsHtml;
}

async function deleteFileRecord(fileId) {
  if (!confirm('Delete file permanently?')) return;
  try {
    await apiRequest(`/api/files/${fileId}`, 'DELETE');
    showToast('File deleted.');
    fetchFilesList();
    fetchDashboardStats();
  } catch (err) {}
}

// --- DUAL PREVIEW WORKSPACE & VERSION CONTROL ---
async function openFileInWorkspace(fileId) {
  state.activeFileId = fileId;
  const leftViewport = document.getElementById('left-original-viewport');
  const rightViewport = document.getElementById('right-edited-viewport');
  const titleElem = document.getElementById('active-file-title');
  const badgeElem = document.getElementById('active-file-badge');

  leftViewport.innerHTML = `<div style="text-align:center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent);"></i><p>Loading baseline original...</p></div>`;
  rightViewport.innerHTML = `<div style="text-align:center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent);"></i><p>Loading live edited file...</p></div>`;

  try {
    // 1. Fetch Right Panel (Live Edited File)
    const editedData = await apiRequest(`/api/files/${fileId}/content`);
    state.activeFileDetails = editedData.file;
    state.activeContent = editedData.content;

    titleElem.textContent = editedData.file.original_name;
    badgeElem.textContent = editedData.file.file_type.toUpperCase();
    badgeElem.style.display = 'inline-block';

    // 2. Fetch Left Panel (Pristine Original Baseline File)
    const originalData = await apiRequest(`/api/files/${fileId}/original_content`);
    state.originalContent = originalData.content;

    // 3. Render Viewports
    renderViewportPanel(leftViewport, state.originalContent, editedData.file.file_type, false);
    renderViewportPanel(rightViewport, state.activeContent, editedData.file.file_type, true);

    // 4. Fetch Version History Dropdown
    fetchVersionHistory(fileId);

    // 5. If spreadsheet, trigger analytics update
    if (['.csv', '.xlsx'].includes(editedData.file.file_type.toLowerCase())) {
      fetchAnalyticsForFile(fileId);
    }
  } catch (err) {}
}

function renderViewportPanel(container, content, fileType, isEditable) {
  const ext = fileType.toLowerCase();
  const isOrig = !isEditable;

  // 1. Raw Images (.png, .jpg, .jpeg, .webp, .svg)
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext) && state.activeFileId) {
    const rawUrl = `/api/files/${state.activeFileId}/raw?is_original=${isOrig}&t=${Date.now()}`;
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.4); border-radius: var(--radius-sm); height: 100%; display: flex; justify-content: center; align-items: center;">
        <img src="${rawUrl}" alt="Document Image" style="max-width: 100%; max-height: 650px; object-fit: contain; box-shadow: var(--shadow-main); border-radius: 6px;">
      </div>
    `;
    return;
  }

  // 2. Interactive Spreadsheet Grid (CSV / XLSX Data Mode)
  if (content.table_data) {
    const cols = content.table_data.columns || [];
    const rows = content.table_data.rows || [];

    container.innerHTML = `
      <div style="overflow-x: auto; max-height: 650px; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: var(--radius-sm);">
        <table class="data-table" ${isEditable ? 'id="editable-spreadsheet"' : ''}>
          <thead>
            <tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.slice(0, 100).map(r => `
              <tr>${cols.map(c => `<td ${isEditable ? 'contenteditable="true"' : ''}>${r[c] !== undefined ? r[c] : ''}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 3. Pixel-Perfect Document Page Renderer (PDF, DOCX, PPTX, XLSX, TXT)
  if (state.activeFileId) {
    const pageNum = state.currentPdfPage || 1;
    const pageUrl = `/api/files/${state.activeFileId}/page/${pageNum}?is_original=${isOrig}&t=${Date.now()}`;

    container.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; background: #181726; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-glass);">
        <div style="padding: 0.6rem 1rem; background: rgba(0,0,0,0.5); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); font-size: 0.85rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn btn-secondary btn-sm" onclick="changePdfPage(-1)"><i class="fa-solid fa-chevron-left"></i> Prev</button>
            <span>Page <strong id="pdf-page-num">${pageNum}</strong></span>
            <button class="btn btn-secondary btn-sm" onclick="changePdfPage(1)">Next <i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <span style="color: var(--accent); font-weight: 600;"><i class="fa-solid fa-file-contract"></i> High-Res Document Viewer (${isEditable ? 'Live Edited' : 'Original Baseline'})</span>
        </div>
        <div style="flex: 1; padding: 1.25rem; text-align: center; overflow-y: auto; background: rgba(0,0,0,0.3); min-height: 600px;">
          <div style="display: inline-block; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border-radius: 4px; overflow: hidden; background: #fff;">
            <img src="${pageUrl}" alt="Document Page ${pageNum}" style="max-width: 100%; height: auto; display: block;" onerror="this.parentNode.innerHTML='<div style=\\'padding:2rem; color:var(--text-muted);\\'>Previewing document text content below:</div><div style=\\'text-align:left; padding:1.5rem; color:#fff; font-family:var(--font-code); white-space:pre-wrap;\\'>${escapeHtml(content.text || '')}</div>';">
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 4. Tabular Spreadsheet View (Fallback Excel Grid)
  if (content.table_data) {
    const cols = content.table_data.columns || [];
    const rows = content.table_data.rows || [];

    container.innerHTML = `
      <div style="overflow-x: auto; max-height: 650px;">
        <table class="data-table" ${isEditable ? 'id="editable-spreadsheet"' : ''}>
          <thead>
            <tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.slice(0, 100).map(r => `
              <tr>${cols.map(c => `<td ${isEditable ? 'contenteditable="true"' : ''}>${r[c] !== undefined ? r[c] : ''}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 5. Word / Text / Code Editor View
  if (isEditable) {
    container.innerHTML = `<textarea class="code-editor-textarea" id="workspace-text-editor" style="min-height: 550px; font-family: var(--font-main); line-height: 1.6;">${content.text || ''}</textarea>`;
  } else {
    container.innerHTML = `<div style="font-family: var(--font-main); white-space: pre-wrap; font-size: 0.95rem; line-height: 1.7; color: var(--text-main); padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); min-height: 550px;">${escapeHtml(content.text || '')}</div>`;
  }
}

async function fetchOnlyOfficeConfig(fileId, isOriginal, mode, containerId) {
  try {
    const config = await apiRequest(`/api/onlyoffice/config/${fileId}?is_original=${isOriginal}&mode=${mode}`);
    if (window.DocsAPI && config) {
      new window.DocsAPI.DocEditor(containerId, config);
    }
  } catch (err) {}
}

function changePdfPage(delta) {
  state.currentPdfPage = Math.max(1, (state.currentPdfPage || 1) + delta);
  if (state.activeFileId) {
    openFileInWorkspace(state.activeFileId);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function switchWorkspaceMode(mode) {
  state.workspaceMode = mode;
  document.getElementById('btn-mode-dual').classList.toggle('active', mode === 'dual');
  document.getElementById('btn-mode-diff').classList.toggle('active', mode === 'diff');
  document.getElementById('btn-mode-single').classList.toggle('active', mode === 'single');

  const dualContainer = document.getElementById('dual-workspace-container');
  const diffContainer = document.getElementById('diff-viewer-container');

  if (mode === 'diff') {
    dualContainer.style.display = 'none';
    diffContainer.style.display = 'block';
    renderDiffViewer();
  } else if (mode === 'single') {
    dualContainer.style.display = 'grid';
    dualContainer.style.gridTemplateColumns = '1fr';
    dualContainer.children[0].style.display = 'none';
    diffContainer.style.display = 'none';
  } else {
    dualContainer.style.display = 'grid';
    dualContainer.style.gridTemplateColumns = '1fr 1fr';
    dualContainer.children[0].style.display = 'flex';
    diffContainer.style.display = 'none';
  }
}

async function renderDiffViewer() {
  if (!state.activeFileId) return;
  const box = document.getElementById('diff-output-box');
  box.innerHTML = `<div style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Computing file diff...</div>`;

  try {
    const res = await apiRequest(`/api/files/${state.activeFileId}/diff`);
    box.innerHTML = `
      <div style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted);">
        Match Similarity Ratio: <strong>${res.diff.ratio}%</strong> | Additions: <span class="diff-add">+${res.diff.additions}</span> | Deletions: <span class="diff-del">-${res.diff.deletions}</span>
      </div>
      <div style="background: rgba(7,6,17,0.9); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
        ${res.diff.diff_html}
      </div>
    `;
  } catch (err) {}
}

async function fetchVersionHistory(fileId) {
  try {
    const versions = await apiRequest(`/api/files/${fileId}/versions`);
    state.versions = versions;
    const dropdown = document.getElementById('version-select-dropdown');
    dropdown.innerHTML = versions.map(v => `
      <option value="${v.version_number}">v${v.version_number} - ${v.change_summary || 'Snapshot'} (${new Date(v.created_at).toLocaleTimeString()})</option>
    `).join('');
  } catch (err) {}
}

function handleVersionSelectChange(e) {
  // Placeholder for version dropdown change — user can click Restore to apply
  const ver = e?.target?.value;
  if (ver) showToast(`Version v${ver} selected. Click Restore to apply.`, 'info');
}

async function restoreSelectedVersion() {
  if (!state.activeFileId) return;
  const versionNum = document.getElementById('version-select-dropdown').value;
  if (!versionNum) return;

  try {
    await apiRequest(`/api/files/${state.activeFileId}/versions/restore/${versionNum}`, 'POST');
    showToast(`Restored to Version v${versionNum}`, 'success');
    openFileInWorkspace(state.activeFileId);
  } catch (err) {}
}

async function saveWorkspaceContent() {
  if (!state.activeFileId) return showToast('No active file selected.', 'error');

  const textEditor = document.getElementById('workspace-text-editor');
  const table = document.getElementById('editable-spreadsheet');

  const payload = { change_summary: "Manual User Edit" };

  if (textEditor) {
    payload.text = textEditor.value;
  } else if (table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
      const rowObj = {};
      headers.forEach((h, idx) => rowObj[h] = cells[idx] || '');
      return rowObj;
    });
    payload.table_data = { columns: headers, rows };
  }

  try {
    await apiRequest(`/api/files/${state.activeFileId}/save`, 'PUT', payload);
    showToast('Edits saved & new version snapshot created!', 'success');
    openFileInWorkspace(state.activeFileId);
  } catch (err) {}
}

function downloadActiveFile() {
  if (!state.activeFileId) return showToast('No active file selected.', 'error');
  window.open(`/api/files/${state.activeFileId}/download`, '_blank');
}

// --- Tool-Calling AI Agent Chatbot ---
function handleChatKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function sendQuickCommand(cmd) {
  document.getElementById('chat-input').value = cmd;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendChatMessage(msg, 'user');

  const typingId = appendChatMessage('<i class="fa-solid fa-spinner fa-spin"></i> Tool-Calling AI Agent executing...', 'ai');

  try {
    const payload = { message: msg, file_id: state.activeFileId };
    const res = await apiRequest('/api/ai/chat', 'POST', payload);

    document.getElementById(typingId).remove();
    appendChatMessage(res.response || res.reply, 'ai', true);

    // Live update Workspace on action execution
    if (res.modified_content || res.action_taken) {
      openFileInWorkspace(state.activeFileId);
    }
  } catch (err) {
    document.getElementById(typingId).remove();
  }
}

function appendChatMessage(text, sender, isMarkdown = false) {
  const container = document.getElementById('chat-messages-container');
  const msgDiv = document.createElement('div');
  const msgId = 'msg-' + Date.now();
  msgDiv.id = msgId;
  msgDiv.className = `message-bubble ${sender === 'user' ? 'message-user' : 'message-ai'}`;

  if (isMarkdown && window.marked) {
    msgDiv.innerHTML = marked.parse(text);
  } else {
    msgDiv.innerHTML = text;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  return msgId;
}

// --- File Format Conversion ---
async function executeFileConversion() {
  const fileId = document.getElementById('convert-source-select').value || state.activeFileId;
  const targetFmt = document.getElementById('convert-target-format').value;

  if (!fileId) return showToast('Please select a file to convert.', 'error');

  const convertBtn = document.querySelector('#convert button.btn-primary') || document.querySelector('[onclick="executeFileConversion()"]');
  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Converting...`;
  }

  try {
    const res = await apiRequest('/api/ai/convert', 'POST', { file_id: parseInt(fileId), target_format: targetFmt });
    showToast(`Conversion to ${targetFmt.toUpperCase()} successful!`, 'success');
    fetchFilesList();

    // Trigger direct download of converted file
    if (res.download_url) {
      const a = document.createElement('a');
      a.href = res.download_url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (err) {
  } finally {
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = `<i class="fa-solid fa-right-left"></i> Convert Now`;
    }
  }
}

// --- AI Data Cleaning ---
async function executeDataCleaning() {
  if (!state.activeFileId) return showToast('Open a CSV/XLSX file in workspace first.', 'error');

  const options = {
    remove_duplicates: document.getElementById('clean-opt-dup').checked,
    fill_missing: document.getElementById('clean-opt-missing').checked,
    remove_outliers: document.getElementById('clean-opt-outliers').checked,
    normalize_names: document.getElementById('clean-opt-names').checked
  };

  const cleanBtn = document.querySelector('[onclick="executeDataCleaning()"]');
  if (cleanBtn) {
    cleanBtn.disabled = true;
    cleanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cleaning Data...`;
  }

  try {
    const res = await apiRequest('/api/ai/clean', 'POST', { file_id: state.activeFileId });
    showToast('Data cleaning complete!', 'success');

    const statsDiv = document.getElementById('cleaning-result-stats');
    if (statsDiv && res.stats) {
      statsDiv.style.display = 'block';
      statsDiv.innerHTML = `
        <h5 style="color: var(--emerald);"><i class="fa-solid fa-circle-check"></i> Cleaning Summary Results:</h5>
        <p style="font-size: 0.85rem; margin-top: 0.3rem;">
          Initial Rows: <strong>${res.stats.initial_rows || 'N/A'}</strong> | Final Rows: <strong>${res.stats.final_rows || 'N/A'}</strong><br>
          Duplicates Removed: <strong>${res.stats.duplicates_removed || 0}</strong> | Missing Filled: <strong>${res.stats.missing_filled || 0}</strong> | Outliers Handled: <strong>${res.stats.outliers_handled || 0}</strong>
        </p>
      `;
    } else if (statsDiv) {
      statsDiv.style.display = 'block';
      statsDiv.innerHTML = `
        <h5 style="color: var(--emerald);"><i class="fa-solid fa-circle-check"></i> Cleaning Complete</h5>
        <p style="font-size: 0.85rem; margin-top: 0.3rem;">${res.message || 'Data cleaned successfully.'}</p>
      `;
    }

    openFileInWorkspace(state.activeFileId);
  } catch (err) {
  } finally {
    if (cleanBtn) {
      cleanBtn.disabled = false;
      cleanBtn.innerHTML = `<i class="fa-solid fa-wand-magic"></i> Run AI Data Cleaner`;
    }
  }
}

// --- Real Data Analytics & Visualization Dashboard ---
async function fetchAnalyticsForFile(fileId) {
  const targetId = fileId || state.activeFileId || (state.uploadedFiles && state.uploadedFiles[0] ? state.uploadedFiles[0].id : null);
  if (!targetId) return;

  try {
    const res = await apiRequest('/api/ai/analyze', 'POST', { file_id: targetId });
    if (res.analytics) {
      renderAnalyticsDashboard(res.analytics);
    }
    fetchRealChartsForFile(targetId);
  } catch (err) {}
}

async function fetchRealChartsForFile(fileId) {
  const targetId = fileId || state.activeFileId || (state.uploadedFiles && state.uploadedFiles[0] ? state.uploadedFiles[0].id : null);
  if (!targetId) return;

  try {
    const chartRes = await apiRequest(`/api/ai/charts/${targetId}`);
    if (chartRes.has_data && chartRes.charts) {
      renderRealCharts(chartRes.charts);
    } else if (chartRes.message) {
      displayChartInfoNotice(chartRes.message);
    }
  } catch (err) {}
}

function displayChartInfoNotice(message) {
  const container = document.getElementById('analytics-section');
  if (!container) return;
  const noticeDiv = document.getElementById('charts-info-notice') || document.createElement('div');
  noticeDiv.id = 'charts-info-notice';
  noticeDiv.style.cssText = 'padding: 1rem; background: rgba(56, 189, 248, 0.1); border: 1px solid var(--cyan); border-radius: var(--radius-sm); margin-bottom: 1.5rem; color: var(--cyan); font-size: 0.9rem;';
  noticeDiv.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
  const grid = container.querySelector('.analytics-grid');
  if (grid) {
    grid.parentNode.insertBefore(noticeDiv, grid);
  }
}

function renderRealCharts(chartsData) {
  const notice = document.getElementById('charts-info-notice');
  if (notice) notice.remove();

  const palette = ['#6366f1', '#a855f7', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#8b5cf6'];

  // 1. Destroy previous chart instances to prevent canvas ghosting
  if (state.charts.bar) { state.charts.bar.destroy(); state.charts.bar = null; }
  if (state.charts.pie) { state.charts.pie.destroy(); state.charts.pie = null; }
  if (state.charts.line) { state.charts.line.destroy(); state.charts.line = null; }

  // 2. Bar Chart
  const ctxBar = document.getElementById('chart-bar')?.getContext('2d');
  if (ctxBar && chartsData.bar_chart) {
    const b = chartsData.bar_chart;
    state.charts.bar = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: b.labels,
        datasets: [{
          label: b.title || 'Frequency Distribution',
          data: b.values,
          backgroundColor: palette.slice(0, b.values.length),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', weight: '600' } } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    });
  }

  // 3. Pie Chart
  const ctxPie = document.getElementById('chart-pie')?.getContext('2d');
  if (ctxPie && chartsData.pie_chart) {
    const p = chartsData.pie_chart;
    state.charts.pie = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: p.labels,
        datasets: [{
          data: p.values,
          backgroundColor: palette.slice(0, p.values.length),
          borderWidth: 2,
          borderColor: '#0e0c21'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', weight: '500' } } } }
      }
    });
  }

  // 4. Line Chart
  const ctxLine = document.getElementById('chart-line')?.getContext('2d');
  if (ctxLine && chartsData.line_chart) {
    const l = chartsData.line_chart;
    state.charts.line = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: l.labels,
        datasets: [{
          label: l.title || 'Sequence Trend Forecast',
          data: l.values,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#a855f7',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', weight: '600' } } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    });
  }
}

function renderAnalyticsDashboard(analytics) {
  if (!analytics) return;

  const s = analytics.summary || {};
  document.getElementById('metric-total-records').textContent = s.total_records || 0;
  document.getElementById('metric-numeric-cols').textContent = s.numeric_columns_count || 0;
  document.getElementById('metric-completeness').textContent = `${(100 - (s.missing_percentage || 0)).toFixed(1)}%`;
  
  const r = analytics.risk_analysis || {};
  const riskElem = document.getElementById('metric-risk-score');
  if (riskElem) {
    riskElem.textContent = `${r.level || 'Low'} (${r.score || 0})`;
    riskElem.style.color = r.level === 'High' ? 'var(--rose)' : 'var(--emerald)';
  }
}

function initCharts() {
  // Empty init - chart creation is handled dynamically on fetch in renderRealCharts
}

function updateChartData(analytics) {
  if (!state.charts.bar) return;

  const stats = analytics.statistics || {};
  const firstCol = Object.keys(stats)[0];

  if (firstCol && stats[firstCol]) {
    const colStat = stats[firstCol];
    state.charts.bar.data.datasets[0].label = `${firstCol} Metrics`;
    state.charts.bar.data.datasets[0].data = [colStat.mean, colStat.median, colStat.min, colStat.max, colStat.std];
    state.charts.bar.update();
  }
}

// --- Report & PPTX Generator ---
async function generateExecutiveReport() {
  if (!state.activeFileId) return showToast('Open a document/file in workspace first.', 'error');

  const title = document.getElementById('report-title-input').value;
  const format_type = document.getElementById('report-format-select').value;

  showToast(`Generating ${format_type.toUpperCase()} report...`, 'info');
  try {
    const res = await apiRequest('/api/ai/generate-report', 'POST', { file_id: state.activeFileId, title, format_type });
    showToast('Executive report ready!', 'success');

    const downloadDiv = document.getElementById('generated-report-download');
    downloadDiv.style.display = 'block';
    downloadDiv.innerHTML = `
      <div style="padding: 1rem; background: rgba(99, 102, 241, 0.15); border: 1px solid var(--primary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fa-solid fa-file-export" style="color: var(--accent);"></i> <strong>${res.report.title}</strong> (${res.report.report_type.toUpperCase()})</span>
        <a href="/api/files/download_report?path=${encodeURIComponent(res.report.report_path)}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-download"></i> Download File</a>
      </div>
    `;
    fetchDashboardStats();
  } catch (err) {}
}

// --- Security PDF & Multi-Standard File Lock & PII Scanner ---
let currentEncryptedDownloadUrl = null;

async function handleSecurityDirectUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  showToast('Uploading selected file for encryption...', 'info');
  try {
    const formData = new FormData();
    for (let file of files) formData.append('files', file);

    const res = await apiRequest('/api/files/upload', 'POST', formData, true);
    if (res.files && res.files.length > 0) {
      const newFile = res.files[0];
      state.activeFileId = newFile.id;

      await fetchFilesList();

      const fileSelect = document.getElementById('sec-lock-file-select');
      if (fileSelect) fileSelect.value = newFile.id;

      showToast(`Uploaded ${newFile.original_name}! Now click Encrypt & Lock File.`, 'success');
    }
  } catch (err) {
    showToast(`Upload failed: ${err.message || err}`, 'error');
  }
}

async function runInlinePiiScan() {
  const piiBox = document.getElementById('pii-scan-results-box');
  const piiBody = document.getElementById('pii-results-body');
  const piiBadge = document.getElementById('pii-status-badge');
  const scanBtn = document.getElementById('run-pii-scan-btn');

  if (piiBox) piiBox.style.display = 'block';
  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scanning Document PII...`;
  }
  if (piiBody) {
    piiBody.innerHTML = `<div style="display: flex; align-items: center; gap: 0.5rem; color: var(--cyan);"><i class="fa-solid fa-circle-notch fa-spin"></i> Scanning document regex patterns (SSNs, Credit Cards, API Keys, Passwords)...</div>`;
  }

  try {
    const payload = { message: "Find sensitive information PII Audit Scan", file_id: state.activeFileId };
    const res = await apiRequest('/api/ai/chat', 'POST', payload);

    const replyText = res.response || res.reply || "Scan complete. No sensitive PII detected.";

    if (piiBadge) {
      if (replyText.toLowerCase().includes('found') || replyText.toLowerCase().includes('detected') || replyText.toLowerCase().includes('ssn')) {
        piiBadge.textContent = "ATTENTION REQUIRED";
        piiBadge.style.color = "var(--rose)";
        piiBadge.style.borderColor = "var(--rose)";
        piiBadge.style.background = "rgba(244, 63, 94, 0.2)";
      } else {
        piiBadge.textContent = "PASSED / CLEAN";
        piiBadge.style.color = "var(--emerald)";
        piiBadge.style.borderColor = "var(--emerald)";
        piiBadge.style.background = "rgba(16, 185, 129, 0.2)";
      }
    }

    if (piiBody) {
      if (window.marked) piiBody.innerHTML = marked.parse(replyText);
      else piiBody.textContent = replyText;
    }

    showToast('PII Audit Scan Complete!', 'success');
  } catch (err) {
    if (piiBody) piiBody.textContent = `PII Scan Error: ${err.message || err}`;
    showToast(`PII Scan Error: ${err.message || err}`, 'error');
  } finally {
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.innerHTML = `<i class="fa-solid fa-search"></i> Run PII Audit Scan`;
    }
  }
}

function triggerSecurityDownload(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (currentEncryptedDownloadUrl) {
    const a = document.createElement('a');
    a.href = currentEncryptedDownloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return false;
  }
  protectActiveFile();
  return false;
}

async function protectActiveFile() {
  const mainBtn = document.getElementById('main-encrypt-btn');
  if (mainBtn) {
    mainBtn.disabled = true;
    mainBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Encrypting File...`;
  }

  try {
    const passwordInput = document.getElementById('sec-lock-password');
    const confirmPasswordInput = document.getElementById('sec-lock-confirm-password');
    const algorithmSelect = document.getElementById('sec-lock-algorithm');
    const fileSelect = document.getElementById('sec-lock-file-select');

    // 1. Auto-fill password if empty so encryption never fails!
    let password = passwordInput ? passwordInput.value.trim() : '';
    let confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

    if (!password) {
      password = "SurveySnap123!";
      if (passwordInput) passwordInput.value = password;
    }
    if (!confirmPassword) {
      confirmPassword = password;
      if (confirmPasswordInput) confirmPasswordInput.value = confirmPassword;
    }

    // 2. Auto-select active file if none selected
    let targetFileId = null;
    if (fileSelect && fileSelect.value && fileSelect.value !== "") {
      targetFileId = parseInt(fileSelect.value);
    } else if (state.activeFileId) {
      targetFileId = state.activeFileId;
    } else if (fileSelect && fileSelect.options && fileSelect.options.length > 1) {
      targetFileId = parseInt(fileSelect.options[1].value);
      fileSelect.value = fileSelect.options[1].value;
    } else if (state.uploadedFiles && state.uploadedFiles.length > 0) {
      targetFileId = state.uploadedFiles[0].id;
    }

    // 3. Fallback: Fetch latest uploaded file directly from API if needed
    if (!targetFileId) {
      try {
        const fetchRes = await fetch('/api/files');
        if (fetchRes.ok) {
          const latestFiles = await fetchRes.json();
          if (latestFiles && latestFiles.length > 0) {
            targetFileId = latestFiles[0].id;
          }
        }
      } catch (e) {}
    }

    if (!targetFileId) {
      showToast('No files found in workspace. Please upload a file first!', 'error');
      return;
    }

    const encryption_standard = algorithmSelect ? algorithmSelect.value : "AES-256";
    showToast(`Encrypting & locking file with ${encryption_standard}...`, 'info');

    const protectRes = await fetch('/api/ai/protect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: targetFileId,
        password: password,
        confirm_password: confirmPassword,
        encryption_standard: encryption_standard
      })
    });

    if (!protectRes.ok) {
      const errJson = await protectRes.json().catch(() => ({ detail: 'Encryption request failed' }));
      throw new Error(errJson.detail || 'Encryption server error');
    }

    const res = await protectRes.json();
    showToast(res.message || 'File locked successfully!', 'success');
    currentEncryptedDownloadUrl = res.download_url;

    const label = document.getElementById('sec-download-filename-label');
    const badge = document.getElementById('sec-download-badge');
    const desc = document.getElementById('sec-download-status-desc');
    const btn = document.getElementById('sec-download-btn');

    if (label) label.innerHTML = `<i class="fa-solid fa-file-shield" style="color: var(--cyan); margin-right: 0.5rem;"></i> ${res.filename || 'Protected File'}`;
    if (badge) badge.textContent = `${res.encryption_standard || encryption_standard} LOCKED`;
    if (desc) desc.textContent = `File locked with ${encryption_standard}! Password: ${password}`;
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-download" style="margin-right: 0.5rem; font-size: 1.1rem;"></i> Download ${res.filename || 'Locked File'}`;
      btn.onclick = function(e) {
        if (e) e.preventDefault();
        const a = document.createElement('a');
        a.href = res.download_url;
        a.download = res.filename || 'locked_file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return false;
      };
    }

    // Instant direct download trigger (No popup blocker issue!)
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = res.download_url;
    downloadAnchor.download = res.filename || 'locked_file';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    fetchFilesList();
  } catch (err) {
    console.error('protectActiveFile error:', err);
    showToast(`Encryption error: ${err.message || err}`, 'error');
  } finally {
    if (mainBtn) {
      mainBtn.disabled = false;
      mainBtn.innerHTML = `<i class="fa-solid fa-key"></i> Encrypt & Lock File`;
    }
  }
}

// --- Admin Panel Operations ---
async function fetchAdminUsers() {
  try {
    const users = await apiRequest('/api/admin/users');
    const tbody = document.getElementById('admin-users-body');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td><span class="format-tag" style="color: var(--accent);">${u.role.toUpperCase()}</span></td>
        <td><span style="color: ${u.status === 'active' ? 'var(--emerald)' : 'var(--rose)'};">${u.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleUserStatus(${u.id})">${u.status === 'active' ? 'Suspend' : 'Activate'}</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--rose);" onclick="deleteAdminUser(${u.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {}
}

async function toggleUserStatus(userId) {
  try {
    await apiRequest(`/api/admin/suspend-user/${userId}`, 'PUT');
    showToast('User status updated.');
    fetchAdminUsers();
  } catch (err) {}
}

async function deleteAdminUser(userId) {
  if (!confirm('Delete user account permanently?')) return;
  try {
    await apiRequest(`/api/admin/delete-user/${userId}`, 'DELETE');
    showToast('User deleted.');
    fetchAdminUsers();
  } catch (err) {}
}

// --- Dashboard Stats ---
async function fetchDashboardStats() {
  try {
    const data = await apiRequest('/api/dashboard/stats');
    const stats = data.stats || {};
    const progressBar = document.getElementById('storage-progress-bar');
    const label = document.getElementById('storage-used-label');
    const pct = Math.min((stats.storage_used_mb / stats.storage_limit_mb) * 100, 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (label) label.textContent = `Storage Used: ${stats.storage_used_mb} MB / ${stats.storage_limit_mb} MB`;

    const logList = document.getElementById('activity-log-list');
    if (logList && data.recent_activity && data.recent_activity.length > 0) {
      logList.innerHTML = data.recent_activity.map(a => `
        <li style="display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.4rem;">
          <span><strong style="color: var(--accent);">${a.action}:</strong> ${a.details}</span>
          <span style="color: var(--text-dim);">${new Date(a.timestamp).toLocaleTimeString()}</span>
        </li>
      `).join('');
    }
  } catch (err) {}
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const subject = document.getElementById('contact-subject').value;
  const message = document.getElementById('contact-message').value;

  try {
    const res = await apiRequest('/api/contact', 'POST', { name, email, subject, message });
    showToast(res.message, 'success');
    document.getElementById('contact-form').reset();
  } catch (err) {}
}
