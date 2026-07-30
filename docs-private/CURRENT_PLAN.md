# 当前方案（v19）

## 目标

- 支持 OpenWrt、ImmortalWrt、Lean LEDE
- 源码/分支由 Workflow 下拉框选择
- SSH 后台数量 `1～16`，默认 `4`
- 每个 Job 独立克隆源码并处理 feeds
- 只运行 `make menuconfig`
- 上传各自 `.config`
- 不编译固件

## 输入

```text
source_branch：源码 / 分支
sessions：1～16，默认 4
launch_mode：自动启动 menuconfig（默认）/ 只创建 Screen 11
```

## Screen

固定名：

```text
11
```

默认模式：

```bash
screen -dmS 11 bash -lc 'cd "$HOME/source" && make menuconfig; exec bash'
```

Shell 模式：

```bash
screen -dmS 11 bash -lc 'cd "$HOME/source"; exec bash'
```

## SSH 自动接入

使用 `~/.bashrc`：

```bash
exec screen -d -r 11
```

禁止依赖 action-tmate 的内部二进制路径或 Socket。

## tmate

```yaml
uses: mxschmitt/action-tmate@v3.24
with:
  detached: true
  limit-access-to-actor: true
  connect-timeout-seconds: 180
```

## 完成

```bash
ls -lh ~/source/.config
sudo touch /continue
exit
```

工作流每 `180` 秒检查一次。

## 上传

```text
.config
menuconfig-session-N.config
SOURCE_INFO.txt
```

## 禁止增加

```text
普通 make
make -j
make world
make download
固件 Release
R2 上传
自动提交 .config
```


## v6 时间设置

```text
/continue 检查间隔：180 秒
tmate 最大连接等待：180 秒
```

注意：

```text
action-tmate 内部每约 5 秒重复打印 SSH 地址的频率不可通过当前 Workflow 参数修改。
```

之前的 `120 秒` 只改到了 `/continue` 检查和连接等待，并没有控制 tmate 内部日志打印频率。


## v7 `.gitignore`

仓库根目录新增：

```text
.gitignore
```

主要用于防止误提交：

- 本地克隆的 OpenWrt / ImmortalWrt / LEDE 源码目录
- `.config` 和其他本地配置文件
- 构建目录、下载目录和日志
- ZIP 压缩包
- `.env`、私钥和密钥文件
- 编辑器缓存与系统文件

以下项目文件不得被忽略：

```text
.github/
README.md
docs/
docs-private/
.gitignore
```


## v8 Screen 启动策略

Screen 名继续使用：

```text
11
```

用户真实 Actions 已证明：

```bash
screen -d -r 11
```

可以正常进入，因此数字命名不是故障原因。

默认模式不再在 Screen 尚未接入时立即运行 ncurses。新流程：

```text
Screen 11 Detached
→ 等待首次 SSH 接入
→ 启动 make menuconfig
→ 退出后保留 Bash
```

自动接入仍通过 `~/.bashrc` 尝试。失败时统一提示：

```bash
screen -d -r 11
```

诊断日志：

```text
/tmp/screen-11-status.log
```


## v9 最终 Screen 行为

废弃所有 SSH 自动接入、`.bashrc` 自动执行、ready 标记和延迟启动逻辑。

固定行为：

```bash
screen -dmS 11 bash -lc 'cd "$HOME/source" && make menuconfig; exec bash'
```

SSH 登录后停留在普通 Shell，由用户手动执行：

```bash
screen -d -r 11
```

此时应看到已经启动的 `make menuconfig`。

不要重新加入自动进入 Screen 的逻辑。


## v10：从仓库可选读取已有 `.config`

新增：

```text
config/
└── README.md
```

用户把配置文件放在 `config/`，Run workflow 的 `config_file` 只填写文件名。

规则：

```text
留空 = 不读取
填写 xxx.config = 复制 config/xxx.config 到 source/.config
```

复制完成后才创建 Screen `11` 并运行 `make menuconfig`。

读取已有配置时额外保存：

```text
loaded-original.config
```

不要增加自动 `make defconfig`，也不要改变 v9 的手动进入 Screen 方式。


## v11：取消配置文件名格式限制

`config_file` 不再要求：

- 以 `.config` 结尾
- 使用纯英文
- 使用固定字符集合
- 以英文或数字开头

支持：

```text
001.menuconfig-session-1.config
360T7 UBI.config
中文配置.config
backup@2026.config
test(1).config
stable
```

只禁止目录路径和特殊目录名：

```text
/
\
.
..
```

输入框前后空白会自动清理。


## v12：自动补全 `.config`

读取顺序：

```text
精确匹配
→ 找不到时尝试 <输入>.config
```

同时记录 `config_input` 和实际 `config_file`。


## v13：完成标记每 5 秒检查

等待用户完成的循环由：

```bash
sleep 180
```

改为：

```bash
sleep 5
```

用户执行：

```bash
sudo touch /continue
```

后，最迟约 5 秒进入后续处理。

不要修改 `connect-timeout-seconds: 180`，它是 tmate 的连接等待时间，不是完成标记检查间隔。


## v14：检查与提示分离

```text
/continue 检查：每 5 秒
“仍在等待”日志：每 120 秒
```

使用 Bash 内置 `SECONDS` 计算日志输出间隔。

不要把检查间隔重新改成 120 秒。


## v15：可选完整编译

新增布尔输入：

```text
build_firmware=true
```

默认编译，可取消。

严格顺序：

```text
先上传 config Artifact
→ 后执行 make
```

编译参数：

```bash
make -j$(($(nproc)+1))
```

失败时：

```bash
make -j1 V=s
```

完成标记每 5 秒检查，等待日志每 600 秒输出。


## v16：运行标题显示配置输入名

Actions 运行标题格式：

```text
config_file｜source_branch｜编译状态
```

`config_file` 留空时显示“新建配置”。

各 SSH Job 名称也带配置输入名。Artifact 名称保持原有安全格式。


## v17：新增 immortalwrt-mt798x

新增 `hanwckf/immortalwrt-mt798x` 的 `openwrt-21.02`。

新源使用 `--depth=1`，所有源码最终目录仍为 `source`。

不自动复制源码 `defconfig/`。

所有源码统一：

```bash
make -j"$(nproc)"
```


## v18：本地文件忽略规则

根目录 `.gitignore` 增加：

```gitignore
# 本地压缩包、TXT 文件
/*.zip
/*.txt

# 本地私有配置
/config-private/
```

作用范围：

- 只忽略仓库根目录的 `.zip`
- 只忽略仓库根目录的 `.txt`
- 忽略整个根目录 `config-private/`
- 不影响正式的 `config/`
- 不影响子目录中的 `.txt`


## v19：MT798x 提示和逐个固件 Artifact

连接提示按三类整理：

```text
MT7981
MT7986
MT7986 256M Low Memory
```

MT7986 合并 AX4200、AX6000 和 AX7800。

Artifact 前缀使用：

```text
配置基础名-运行号-Session号
```

每个固件单独上传，小型构建资料和日志进入 `-build-info`。
