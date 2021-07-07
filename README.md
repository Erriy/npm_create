# npm_create

## 简介

把经常使用的 npm 的配置做成了脚手架

## 支持功能

- 根据 npm/git 配置自动生成 author、version、license 字段
- 根据 git 仓库信息自动生成 homepage、bugs、repository 字段
- 根据版本号修改自动打标签并发布到 npmjs（需要 github 仓库配置 secrets.NPM_TOKEN）
- 配置 commitlint，自动检查 commit 信息是否合规
- 配置 eslint 和 prettier，做语法检查和格式化

## 注意事项

- **auto-publish 后会自动打标签并将当前分支和标签推送到 github**，酌情使用，默认关闭

## 使用方法

1. 在 github 上创建仓库并将仓库克隆到本地

2. 进入仓库执行以下命令

   ```shell
   # 注意以下命令不要忘记@erriy后的 --，否则选项将会变成npm init的选项，无法传递到脚手架当中
   # 查看使用方法
   npm init @erriy -- -h
   # 使用默认配置自动创建和自动发布功能（注意提前在github仓库配置secrets.NPM_TOKEN）
   npm init @erriy -- --auto-publish
   ```

## todo

- [x] 使用 npm config 中的 author.{name,email}
- [x] 使用 commitizen 自动校验 commit 信息是否符合标准
- [x] 自动解析 git 仓库地址
- [x] 完善本文档
- [x] 修改 version 后自动推送到 npmjs
