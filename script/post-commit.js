const {exec, execSync} = require('child_process');

exec('git show :package.json', (error, stdout, stderr) => {
    execSync(
        `git tag v${JSON.parse(stdout).version} && git push --tags`,
        {stdio: [process.stdin, process.stdout, process.stderr]}
    );
});
