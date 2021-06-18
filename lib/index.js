#!/usr/bin/env node
const { Command } = require('commander');
const { execSync } = require('child_process');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const util = require('util');
const fs_readfile = util.promisify(fs.readFile);
const fs_writefile = util.promisify(fs.writeFile);

const program = new Command();
program
    .option('-n, --name <string>', 'specify package.name', '')
    .option('-a, --author <string>', 'specify package.author', '')
    .option('-v, --version <string>', 'specify package.version', '0.1.0')
    .option('-d, --description <string>', 'specify package.description', '')
    .action(async (opts)=>{
        await fse.copy(
            path.join(__dirname, '../template'),
            process.cwd()
        );

        await Promise.all([
            'package.json',
            'README.md'
        ].map(async fname=>{
            const fpath = path.join(process.cwd(), fname);
            const org = await fs_readfile(fpath, 'utf8');
            const after = org.replace('scaffolding_name', opts.name)
                .replace('scaffolding_version', opts.version)
                .replace('scaffolding_description', opts.description)
                .replace('scaffolding_author', opts.author);
            await fs_writefile(fpath, after, 'utf8');
        }));

        await fse.rename('temp.eslintrc.json', '.eslintrc.json');
        execSync('npm install',{stdio: [process.stdin, process.stdout, process.stderr]});
    });

program.parse();