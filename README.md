# OpenWrt Menuconfig SSH

通过 GitHub Actions 为 OpenWrt、ImmortalWrt 或 Lean LEDE 创建多个独立 SSH 后台，只保存 `.config`，不编译固件。

## 可选读取已有配置

把已有配置放到仓库。文件名不限制扩展名，可以使用数字、中文、内部空格、括号和 `@`：

```text
config/
└── qihoo-360t7-ubi.config
```

运行 Workflow 时：

```text
已有配置文件：qihoo-360t7-ubi.config
```

只填写文件名，不填写 `config/`。

可以省略末尾的 `.config`：

```text
输入：001.menuconfig-session-1
实际读取：config/001.menuconfig-session-1.config
```

读取顺序：

```text
先精确查找输入的文件名
→ 找不到时自动追加 .config
```

如果仓库同时存在 `stable` 和 `stable.config`，填写 `stable` 时优先读取无扩展名文件。

留空表示不读取已有配置，直接启动新的 `make menuconfig`。

读取已有配置时，工作流会在启动菜单前复制：

```text
config/qihoo-360t7-ubi.config
→ source/.config
```

因此 `make menuconfig` 会显示已有配置。

## 使用

进入：

```text
Actions
→ OpenWrt Menuconfig SSH / 多源码配置
→ Run workflow
```

选择：

- **源码 / 分支**
- **已有配置文件**：可留空；填写 `config/` 目录中的任意单个文件名
- **保存并上传 `.config` 后编译固件**：默认开启，可取消
- **SSH 后台数量**：默认 `2`，最高 `5`

等待 Job 启动后，打开：

```text
源码-分支 SSH N
→ 开启受限 SSH 后台
```

复制日志中的 SSH 命令并连接。

登录后手动进入 Screen `11`：

```bash
screen -d -r 11
```

Screen 中已经运行：

```bash
make menuconfig
```

配置完成后：

1. `Save` 为 `.config`
2. 退出 `menuconfig`
3. 检查配置：

```bash
ls -lh ~/source/.config
```

4. 通知工作流：

```bash
sudo touch /continue
```

工作流每 5 秒检查一次完成标记；“仍在等待”日志每 600 秒输出一次。

读取已有配置时，Artifact 还会包含：

```text
loaded-original.config
```

便于与最终 `.config` 比较。

## 断线恢复

重新连接同一个 SSH 地址，然后执行：

```bash
screen -d -r 11
```

## 详细文档

- [配置文件目录说明](config/README.md)
- [首次设置、Git 上传和 SSH 公钥](docs/SETUP.md)
- [MobaXterm、私钥、Clash Verge 7897 代理](docs/MOBAXTERM.md)
- [Screen 11 与断线恢复](docs/SCREEN.md)
- [Workflow 选项、运行过程与文件说明](docs/WORKFLOW.md)


## 可选编译固件

Run workflow 中：

```text
保存并上传 .config 后编译固件
```

默认开启。

执行顺序固定为：

```text
检查并整理 .config
→ 上传 config Artifact
→ 可选执行 make
→ 上传固件和编译日志
```

因此后续编译失败时，前面的 `.config` 仍然已经保存。

默认并行参数根据 Runner 的 CPU 数自动计算：

```bash
CPU_COUNT="$(nproc)"
BUILD_JOBS="$CPU_COUNT"
make -j"$(nproc)"
```

并行编译失败时自动执行一次：

```bash
make -j1 V=s
```

取消编译选项后，只上传配置，不执行固件编译。

编译 Artifact 包括：

```text
bin/targets/**
BUILD_INFO.txt
build.log
build-verbose.log（发生重试时）
.config
SOURCE_INFO.txt
```

注意：每个 SSH 后台都是独立 Runner。后台数量为 `4` 且启用编译时，会分别进行四次独立编译。


## Actions 运行标题

Actions 总列表会使用“已有配置文件”输入作为标题前缀。

例如：

```text
001.menuconfig-session-1.config｜ImmortalWrt / master｜编译固件
```

取消编译时：

```text
001.menuconfig-session-1.config｜ImmortalWrt / master｜仅保存配置
```

没有填写已有配置文件时：

```text
新建配置｜ImmortalWrt / master｜编译固件
```

进入运行详情后，各 SSH Job 也会显示配置输入名：

```text
001.menuconfig-session-1.config｜immortalwrt-master SSH 1
001.menuconfig-session-1.config｜immortalwrt-master SSH 2
```

标题显示的是 Run workflow 中填写的内容。省略 `.config` 时，标题也保持省略；实际文件仍按“精确名称优先，找不到后自动追加 `.config`”读取。


## hanwckf ImmortalWrt MT798x

源码下拉框新增：

```text
ImmortalWrt MT798x (hanwckf) / openwrt-21.02
```

仓库：

```text
https://github.com/hanwckf/immortalwrt-mt798x
```

该源码使用浅克隆，但目标目录仍统一为：

```text
$GITHUB_WORKSPACE/source
```

实际形式：

```bash
git clone --depth=1 \
  --branch openwrt-21.02 \
  --single-branch \
  https://github.com/hanwckf/immortalwrt-mt798x.git \
  "$GITHUB_WORKSPACE/source"
```

后续 feeds、`.config`、Screen 11、menuconfig 和编译流程与其他源码一致。

源码自带 `defconfig/`，当前不会自动复制，避免覆盖用户从本项目 `config/` 目录选择的配置。

## 统一编译参数

所有源码统一执行：

```bash
make -j"$(nproc)"
```

并行失败后：

```bash
make -j1 V=s
```


## MT798x 连接提示

选择：

```text
ImmortalWrt MT798x (hanwckf) / openwrt-21.02
```

时，连接说明会按三类显示适用机型：

```text
MT7981 / AX3000
MT7986
MT7986 / 256M Low Memory
```

设备预设配置也只按这三类整理；其中 MT7986 类包含 AX4200、AX6000 和 AX7800。提示仅提供命令，不会自动覆盖 `.config`。

## 固件逐个上传

配置完成后，Artifact 前缀按以下格式生成：

```text
配置文件名（去掉末尾 .config）-运行号-Session号
```

例如读取：

```text
006.immortalwrt.config
```

在第 16 次运行、Session 1 中生成：

```text
006.immortalwrt-16-1
```

配置先上传为：

```text
006.immortalwrt-16-1-config
```

编译完成后，`bin/targets/` 中除构建资料外的每个固件文件都会成为一个独立 Artifact：

```text
006.immortalwrt-16-1-原始固件文件名
```

以下内容合并到：

```text
006.immortalwrt-16-1-build-info
```

包含：

```text
ARTIFACT_INDEX.txt
BUILD_INFO.txt
SOURCE_INFO.txt
build.log
build-verbose.log
.config
*.buildinfo
*.manifest
profiles.json
sha256sums
```

`packages/` 不会作为固件上传。每个固件 Artifact 内只包含一个原始文件。


## SSH 后台数量

Run workflow 可选 `1`～`5` 个 SSH 后台，默认 `2` 个。

这些后台仍属于同一次 Matrix Workflow Run。点击 **Cancel workflow** 会取消本次运行中的全部 SSH Job，不能只取消其中一个。
