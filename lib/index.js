#!/usr/bin/env node
const { Command } = require('commander');
const { execSync, exec } = require('child_process');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const util = require('util');
const fs_readfile = util.promisify(fs.readFile);
const fs_writefile = util.promisify(fs.writeFile);

function shell_stdout (cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            return resolve(stdout);
        });
    });
}

async function shell_result (cmd) {
    const out = (await shell_stdout(cmd)).replace('\n', '').replace('\r', '');
    return '' !== out ? out : undefined;
}

async function github_path () {
    const url = await shell_result('git remote get-url origin');
    const r = /^(?:https:\/\/|git@)github.com[:/](?<path>.*).git$/.exec(url);
    return r ? r.groups.path : undefined;
}

async function default_author () {
    let author = '';

    async function generate_author_info (name_cmd, email_cmd) {
        let info = '';
        const name = await shell_result(name_cmd);
        if(name.length > 0) {
            info = name;
            const email = await shell_result(email_cmd);
            if(email.length > 0) {
                info += ` <${email}>`;
            }
        }
        return info;
    }

    author = await generate_author_info('npm config get init.author.name', 'npm config get init.author.email');
    if('' === author) {
        author = await generate_author_info('git config --get user.name', 'git config --get user.email');
    }
    return author;
}

async function default_version () {
    return await shell_result('npm config get init.version');
}

async function default_license () {
    return await shell_result('npm config get init.license');
}

async function generate_package_info (opts) {
    // todo 处理repository、bugs、homepage字段
    const name = opts.name ? opts.name : path.basename(process.cwd());
    const author = opts.author ? opts.author : await default_author();
    const version = opts.version ? opts.version : await default_version();
    const license = opts.license ? opts.license : await default_license();

    let homepage = undefined;
    let bugs = undefined;
    let repository = undefined;

    const gh_path = await github_path();
    if(gh_path) {
        const url = `https://github.com/${gh_path}`;
        bugs = {url: url + '/issues'};
        homepage = url + '#readme';
        repository = {
            type: 'git',
            url : `git+${url}.git`
        };

    }

    return Object.assign({
        name,
        author,
        version,
        license,
        homepage,
        bugs,
        repository,
    }, require(path.join(__dirname, '../template/package.json')));
}

const program = new Command();
program
    .option('-n, --name <string>', '指定项目名称，默认为当前目录名称')
    .option('-a, --author <string>', '指定作者信息，获取顺序：author指定->npm config->git config->留空')
    .option('-v, --version <string>', '指定版本号，获取顺序：version指定->npm config->0.1.0')
    .option('-l, --license <string>', '指定license，获取顺序：license指定->npm config->留空')
    .option('-d, --description <string>', '指定描述信息', '')
    .option('-p, --auto-publish', '修改修改版本后自动打标签并发布到npmjs(基于github workflow，需要提前在github仓库配置secrets.NPM_TOKEN)', false)
    .action(async (opts)=>{
        const pkg = await generate_package_info(opts);

        // 复制模板文件
        await fse.copy(
            path.join(__dirname, '../template'),
            process.cwd()
        );
        // 处理auto-publish
        if(opts.autoPublish) {
            pkg.gitHooks['post-commit'] = 'node script/post-commit.js';
            await Promise.all([
                'script',
                '.github'
            ].map(fname=>(fse.copy(
                path.join(__dirname, '..', fname),
                path.join(process.cwd(), fname)
            ))));
        }
        // 处理package.json
        await fs_writefile(path.join(process.cwd(), 'package.json'), JSON.stringify(pkg, null, 2));
        // 处理readme
        await Promise.all([
            'README.md'
        ].map(async fname=>{
            const fpath = path.join(process.cwd(), fname);
            const org = await fs_readfile(fpath, 'utf8');
            const after = org.replace('scaffolding_name', pkg.name)
                .replace('scaffolding_description', opts.description);
            await fs_writefile(fpath, after, 'utf8');
        }));

        // 修改eslintrc文件名
        await fse.rename('temp.eslintrc.json', '.eslintrc.json');
        execSync('npm install',{stdio: [process.stdin, process.stdout, process.stderr]});
    });

program.parse();