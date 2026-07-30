# 故障记录

## v4：SSH 默认接入 Screen 11 失败

### 现象

步骤：

```text
SSH 默认接入 Screen 11
```

失败日志：

```bash
TMATE_BIN="$(command -v tmate)"
Error: Process completed with exit code 1.
```

后续等待、检查和上传步骤被跳过。

### 根因

v4 错误假设：

1. action-tmate 使用的 `tmate` 会留在后续步骤的 `PATH`
2. tmate Socket 固定为 `/tmp/tmate.sock`
3. 后续步骤可以直接操作 action 内部会话

这些不是 action-tmate 承诺的公共接口。

### v5 修复

删除：

```text
command -v tmate
/tmp/tmate.sock
send-keys
```

改为在启动 tmate 前写入 `~/.bashrc`，SSH 登录后自动：

```bash
exec screen -d -r 11
```

### 待验证

- tmate 登录 Shell 是否读取 `~/.bashrc`
- 是否自动进入 Screen `11`
- 退出 Screen 后 SSH/tmate 是否及时结束
- Artifact 是否正常上传


## v5：误把 `/continue` 检查间隔当成 tmate 日志刷新频率

### 现象

用户看到 action-tmate 日志每约 5 秒重复：

```text
Waiting for client to connect...
Notice: SSH: ssh ...
```

而文档曾说明“每 2 分钟检查一次”，容易理解为 SSH 地址每 2 分钟刷新一次。

### 原因

两个计时器用途不同：

```text
sleep 120
```

只控制 `/continue` 的检查间隔。

```text
connect-timeout-seconds
```

只控制 tmate 最长等待客户端连接的时间。

它们都不控制 action-tmate 内部每约 5 秒输出一次 SSH 地址的行为。

### v6 修改

```text
sleep 180
connect-timeout-seconds: 180
```

即：

- `/continue` 每 3 分钟检查
- tmate 最大等待 3 分钟
- 内部日志仍可能每约 5 秒输出


## v7：补充 `.gitignore` 防止本地文件误提交

### 背景

项目原先没有根目录 `.gitignore`，执行：

```bash
git add .
```

时存在误提交本地源码、`.config`、ZIP、日志或密钥文件的风险。

### 处理

v7 新增 `.gitignore`，忽略本地源码目录、配置产物、压缩包、日志、环境文件、常见私钥文件名和编辑器缓存。

### 注意

`.gitignore` 只阻止尚未被 Git 跟踪的文件。已经提交或暂存过的文件需要另外取消跟踪。


## v7：Screen 已进入，但 menuconfig 未显示

### 现象

SSH 登录后看到 Bash 提示符，用户认为没有进入 Screen。

截图底部实际出现：

```text
0:bash*
```

并且手动执行：

```bash
screen -d -r 11
```

可以成功进入。

### 判断

Screen `11` 创建和数字命名都正常。底部状态栏证明 SSH 自动接入也曾成功。

问题集中在：

```text
make menuconfig 在 SSH 客户端接入前已经启动并退出
```

或 menuconfig 启动时没有合适的终端状态。

### v8 修复

- Screen 先 Detached 等待
- 首次自动或手动 Attached 后才运行 `make menuconfig`
- 状态栏明确显示 `Screen 11`
- 记录 `/tmp/screen-11-status.log`
- 自动接入失败时固定使用 `screen -d -r 11`


## v8：自动进入和延迟启动过于复杂

### 现象

自动接入和延迟启动逻辑增加了状态判断、ready 标记、脚本和诊断文件，但真实运行中仍出现 Screen 消失或无法按预期进入的情况。

### v9 决策

按用户要求退回最简单、可控的流程：

```text
Actions 创建 Screen 11 并运行 menuconfig
→ SSH 登录普通 Shell
→ 用户手动 screen -d -r 11
```

删除所有自动进入相关代码。


## v10：Workflow 原先无法读取仓库中的配置文件

### 原因

v9 只克隆 OpenWrt 系源码，没有执行 `actions/checkout` 检出当前工具仓库，因此即使仓库增加 `config/`，Runner 也无法读取。

### 处理

v10 增加：

```yaml
uses: actions/checkout@v5
```

随后可在源码下载完成后读取：

```text
$GITHUB_WORKSPACE/config/<文件名>
```

并复制为：

```text
$GITHUB_WORKSPACE/source/.config
```


## v10：合法配置文件名被格式校验拒绝

### 现象

用户使用：

```text
001.menuconfig-session-1.config
```

工作流错误地进入“配置文件名无效”分支。

### v11 处理

删除扩展名和字符白名单校验，不再推测什么文件名才是“标准配置名”。

只检查：

- 是否包含目录分隔符
- 是否为 `.` 或 `..`
- 文件是否存在
- 文件是否为空

同时清理输入框前后空格。


## v11：省略 `.config` 后找不到文件

用户输入 `001.menuconfig-session-1`，实际文件是
`001.menuconfig-session-1.config`。v12 在精确查找失败后自动尝试追加 `.config`。


## v12：执行 `/continue` 后等待时间过长

### 现象

等待循环每 180 秒才检查一次完成标记。用户执行：

```bash
sudo touch /continue
```

后，可能还要等待接近 3 分钟。

### v13 处理

将完成标记检查间隔改为 5 秒。tmate 的 180 秒连接等待时间保持不变。


## v13：检查频率和日志频率相同

### 现象

v13 每 5 秒检查一次 `/continue`，同时也可能频繁输出等待状态，日志过密。

### v14 处理

将行为拆分：

```text
完成标记检查：每 5 秒
等待状态输出：每 120 秒
```

响应速度不变，日志显著减少。


## v14：只能保存配置，不能选择继续编译

### v15 处理

Run workflow 增加默认开启的完整编译选项。

配置文件先单独上传，随后才运行 `make`。因此编译失败、超时或空间不足时，已经生成的 `.config` 仍可下载。

同时将等待状态日志从 120 秒调整为 600 秒，完成标记仍每 5 秒检查。


## v15：Actions 运行记录难以区分

所有运行都显示相同 Workflow 名称，不容易看出使用了哪份配置。

v16 新增 `run-name`，显示配置输入名、源码/分支和编译状态，并在各 SSH Job 名称中加入配置输入名。


## v16：未支持 hanwckf/immortalwrt-mt798x

v17 新增 `openwrt-21.02`，并通过指定 Git 克隆目标目录，把其上游示例目录统一为项目标准的 `source`。

同时将全部源码的并行编译从 `nproc + 1` 改为 `make -j$(nproc)`。


## v18：固件全部放在一个大 Artifact

### 现象

只需要其中一个镜像时，仍要下载包含所有固件和资料的大包。

### v19 处理

- 每个固件文件独立上传
- 名称带配置基础名、运行号和 Session
- 构建资料和日志合并为 `build-info`
- 生成 `ARTIFACT_INDEX.txt` 记录文件名、大小、SHA256 和上传状态

同时精简 MT798x 连接提示，按 MT7981、MT7986、MT7986 256M Low Memory 三类显示。
