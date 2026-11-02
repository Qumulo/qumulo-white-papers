const USERNAME = 'Qumulo';
const REPO = 'qumulo-white-papers';

function toTitleCase(pathStr) {
  return pathStr
    .split('/')
    .map(segment =>
      segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    )
    .join(' / ');
}

async function loadTree() {
  const container = document.getElementById('file-list');

  try {
    // 1. Fetch repo metadata to determine the default branch
    const repoRes = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}`);
    if (!repoRes.ok) {
      throw new Error(`Repo not accessible (${repoRes.status} ${repoRes.statusText}). Confirm the repository is Public.`);
    }
    const repoData = await repoRes.json();
    const branch = repoData.default_branch;

    // 2. Fetch full repository tree recursively
    const treeUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/git/trees/${branch}?recursive=1`;
    const res = await fetch(treeUrl);
    if (!res.ok) throw new Error(`Could not load tree (${res.status} ${res.statusText})`);
    const data = await res.json();

    // 3. Filter down to PDF files
    const pdfFiles = (data.tree || []).filter(
      item => item.type === 'blob' && item.path.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      container.innerHTML = '<p class="status-msg">No PDF files found in repository.</p>';
      return;
    }

    // 4. Group by directory path
    const groups = {};
    pdfFiles.forEach(file => {
      const parts = file.path.split('/');
      const fileName = parts.pop();
      const folder = parts.join('/') || 'General Documents';

      if (!groups[folder]) groups[folder] = [];
      groups[folder].push({ name: fileName, path: file.path, size: file.size });
    });

    // 5. Render directory cards
    container.innerHTML = Object.keys(groups).sort().map(folder => `
      <div class="folder-card">
        <div class="folder-header">
          <span class="folder-title">📁 ${toTitleCase(folder)}</span>
          <span class="file-badge">
            ${groups[folder].length} ${groups[folder].length === 1 ? 'file' : 'files'}
          </span>
        </div>
        <ul class="file-list">
          ${groups[folder].map(file => {
            const cleanName = decodeURIComponent(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
            const sizeMb = file.size ? `(${(file.size / (1024 * 1024)).toFixed(2)} MB)` : '';
            const fileUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${branch}/${encodeURI(file.path)}`;

            return `
              <li class="file-item">
                <span class="file-name">
                  ${cleanName} <span class="file-size">${sizeMb}</span>
                </span>
                <a href="${fileUrl}" target="_blank" class="btn-open">Open</a>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p class="status-msg error">Failed to scan repository: ${err.message}</p>`;
  }
}

loadTree();
