const { execSync } = require('node:child_process');

function registerGitHandlers(ipcMain, projectRoot) {
  const run = (cmd) => {
    return execSync(cmd, { cwd: projectRoot, encoding: 'utf-8', timeout: 30000 }).trim();
  };

  ipcMain.handle('git:status', async () => {
    try {
      const output = run('git status --porcelain');
      return {
        hasChanges: output.length > 0,
        files: output.split('\n').filter(Boolean),
      };
    } catch (err) {
      return { hasChanges: false, files: [], error: err.message };
    }
  });

  ipcMain.handle('git:commitAndPush', async (_event, message, dryRun) => {
    try {
      const status = run('git status --porcelain');
      if (!status) {
        return { success: false, message: 'No changes to commit.' };
      }

      const commitMsg = message || `Content update — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
      const log = [];

      if (dryRun) {
        log.push('[DRY RUN] git add -A');
        log.push(`[DRY RUN] git commit -m "${commitMsg}"`);
        log.push('[DRY RUN] git push');
        return { success: true, message: 'Dry run complete.', log };
      }

      run('git add -A');
      log.push('git add -A');

      run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      log.push(`git commit -m "${commitMsg}"`);

      run('git push');
      log.push('git push');

      return { success: true, message: 'Pushed successfully.', log };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = { registerGitHandlers };
