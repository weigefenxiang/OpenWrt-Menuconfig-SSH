# AI 接手指南

## 从哪里开始

第一步完整阅读：

```text
.github/workflows/menuconfig-ssh.yml
```

重点步骤：

1. `创建 Screen 11`
2. `配置 SSH 自动进入 Screen 11`
3. `开启受限 SSH 后台`
4. `显示连接说明`
5. `等待用户完成（每 3 分钟检查）`
6. `.config` 检查与上传

接着阅读：

```text
docs-private/CURRENT_PLAN.md
docs-private/BUG_HISTORY.md
docs-private/VERIFY.md
README.md
docs/SCREEN.md
docs/WORKFLOW.md
```

## 下一步要做什么

v8 已完成静态修复，下一步必须真实运行 Actions 验证：

1. 选择 `sessions = 1`
2. 保持 `自动启动 menuconfig`
3. 确认不再出现 `command -v tmate`
4. SSH 登录后确认自动进入 Screen `11`
5. 保存 `.config`
6. 执行 `sudo touch /continue`
7. 执行 `exit`
8. 最多等待约三分钟
9. 确认 Artifact 上传
10. 确认 Post action-tmate 正常结束

## 禁止回退

不要加入：

```bash
TMATE_BIN="$(command -v tmate)"
tmate -S /tmp/tmate.sock ...
```

v4 已因此真实失败。

## 维护规则

- README 保持精简
- 用户教程放 `docs/`
- AI 和维护资料放 `docs-private/`
- 不添加固件编译
- 新故障更新 `BUG_HISTORY.md`
- 方案变化更新 `CURRENT_PLAN.md`


## v6 特别提醒

不要把这三件事混为一谈：

1. `sleep 180`：每 3 分钟检查 `/continue`
2. `connect-timeout-seconds: 180`：tmate 最长连接等待 3 分钟
3. action-tmate 内部每约 5 秒打印 SSH 地址：当前 Workflow 无法调整

用户已经明确要求：今后任何修改都必须先给方案，等待用户回复 `1` 后再执行。


## v7 `.gitignore` 维护要求

修改 `.gitignore` 前必须确认不会误伤：

```text
.github/
README.md
docs/
docs-private/
```

不要把 `docs-private/` 加入忽略规则，因为它虽然不真正私密，但承担项目维护和 AI 交接用途。

如果某个敏感文件已经被 Git 跟踪，仅修改 `.gitignore` 不够，还需要：

```bash
git rm --cached 文件名
```

如果私钥曾经进入 Git 历史，必须废弃并重新生成。


## v8 接手重点

用户真实运行已经确认：

- `screen -d -r 11` 可用
- Screen 数字名称 `11` 没有问题
- 截图底部 `0:bash*` 表示已经在 Screen 中
- 问题是 menuconfig 没有留在界面中

v8 将 `make menuconfig` 延迟到 Screen 首次 Attached 后再启动。

下一位 AI 应首先验证：

1. SSH 登录后是否出现 `Screen 11` 状态栏
2. 是否在首次接入后启动 menuconfig
3. 自动接入失败时手动 `screen -d -r 11` 是否会触发 menuconfig
4. `/tmp/screen-11-status.log` 是否记录终端和退出码


## v9 接手重点

当前用户明确要求：

- 不自动进入 Screen
- Actions 先创建稳定的 Screen `11`
- Screen 中立即运行 `make menuconfig`
- SSH 登录后用户手动执行 `screen -d -r 11`

已删除：

```text
launch_mode 输入
~/.bashrc 自动接入
screen ready marker
Attached 检测
screen-11-entry.sh
自动进入诊断逻辑
```

下一个 AI 不要重新加入这些自动进入功能。


## v10 接手重点

新增了仓库级 `config/` 配置目录。

Workflow 必须先使用 `actions/checkout` 检出本仓库，否则 Runner 中无法读取 `config/`。

`config_file` 设计为单个可选字符串：

- 留空：不读取
- 填写文件名：读取

禁止改成动态下拉框，因为 GitHub `workflow_dispatch` 不能在页面打开时动态扫描仓库文件。

安全限制：

- 只允许基本文件名
- 必须以 `.config` 结尾
- 禁止路径
- 文件必须存在且非空

Screen 行为保持：

```text
Actions 在 Screen 11 中运行 make menuconfig
SSH 登录后手动 screen -d -r 11
```


## v11 配置文件名规则

不要重新增加 `.config` 扩展名限制或英文字符限制。

当前规则：

- 允许任意普通单文件名
- 自动去除输入前后空白
- 禁止 `/` 和 `\`
- 禁止 `.` 与 `..`
- 文件必须位于 `config/` 根目录
- 文件必须存在且非空

复制时必须保持变量双引号，并使用：

```bash
cp -- "$CONFIG_SOURCE" .config
```

以兼容空格、中文和以短横线开头的文件名。


## v12 文件解析规则

必须保持：

1. 精确文件名优先。
2. 精确文件不存在时追加 `.config`。
3. 两种都不存在才失败。

不能无条件追加扩展名，否则真实无扩展名文件无法读取。


## v13 等待策略

`/continue` 和 `$GITHUB_WORKSPACE/continue` 每 5 秒检查一次。

必须区分：

```text
sleep 5
```

用于完成标记轮询。

```text
connect-timeout-seconds: 180
```

用于 tmate 连接等待。

后续不要把二者一起改成 5 秒。


## v14 等待循环

必须保持两个独立频率：

- 完成标记检查：5 秒
- 等待状态日志：120 秒

关键变量：

```bash
last_report=$SECONDS
```

每轮仍然：

```bash
sleep 5
```

只有达到 120 秒时才输出“仍在等待”。


## v15 接手重点

1. `build_firmware` 默认必须为 `true`。
2. config Artifact 必须位于编译步骤之前。
3. 编译失败必须仍上传日志。
4. 最后的检查步骤必须恢复失败状态。
5. 并行度根据 `nproc + 1` 自动计算。
6. 失败后只重试一次 `make -j1 V=s`。
7. 只上传 `bin/targets/**`，不要上传整个 `build_dir` 或 `staging_dir`。
8. 完成标记每 5 秒检查，“仍在等待”每 600 秒输出。


## v16 标题规则

必须保持：

- 顶层 `run-name` 显示 `inputs.config_file`
- 空值显示“新建配置”
- 显示 `inputs.source_branch`
- 显示“编译固件”或“仅保存配置”
- 各 SSH Job 名称显示配置输入名
- Artifact 名称不得直接使用用户文件名

标题显示用户输入，不显示脚本后续解析出的实际文件名。


## v17 接手重点

新源：

```text
repository=https://github.com/hanwckf/immortalwrt-mt798x.git
branch=openwrt-21.02
clone_mode=depth1
```

所有源码目录必须统一为 `$GITHUB_WORKSPACE/source`。

不要增加 `cd immortalwrt-mt798x`，不要自动复制源码 `defconfig/`。

所有源码统一使用：

```bash
make -j"$(nproc)"
```

不要恢复 `nproc + 1`。


## v18 `.gitignore` 规则

必须保留：

```gitignore
/*.zip
/*.txt
/config-private/
```

说明：

- `/*.txt` 只匹配仓库根目录 TXT
- `/config-private/` 只匹配根目录私有配置目录
- 不要改成 `config/`
- 不要写 Windows 反斜杠 `\config-private`


## v19 接手重点

1. MT798x 连接提示只分三类。
2. 机型列表采用适度人工换行，保持美观。
3. 不自动执行任何 `cp -f defconfig/... .config`。
4. `.config` Artifact 必须继续位于 `make` 之前。
5. `ARTIFACT_PREFIX` 来自实际解析的配置文件名，而不是源码名。
6. 每个固件文件一个 Artifact。
7. `packages/`、buildinfo、manifest、profiles.json 和 sha256sums 不作为固件。
8. 资料和日志统一进入 `-build-info`。
9. 动态上传失败后仍要上传 `ARTIFACT_INDEX.txt`，最后恢复 Job 失败状态。
10. `@actions/artifact` 固定为 6.2.2，不要使用浮动版本。
