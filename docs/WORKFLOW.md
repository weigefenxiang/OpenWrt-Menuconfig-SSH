# Workflow 说明

## Run workflow 选项

### 源码 / 分支

源码和分支合并到一个下拉框。

### 已有配置文件

这是可选字符串输入框。

留空：

```text
不读取已有配置
```

填写：

```text
001.menuconfig-session-1.config
```

表示读取：

```text
config/001.menuconfig-session-1.config
```

文件名不强制以 `.config` 结尾，可以包含：

- 数字开头
- 中文
- 内部空格
- 点、下划线、短横线
- 括号
- `@`
- 其他普通文件名字符

输入框前后的空格会自动清理。

只保留以下限制：

- 必须是 `config/` 根目录中的单个文件名
- 不能包含 `/`
- 不能包含 `\`
- 不能是 `.` 或 `..`
- 文件必须存在
- 文件不能为空

不要填写完整路径或 `config/` 前缀。

### SSH 后台数量

```text
1～16
```

默认：

```text
4
```

每个后台都是独立 Runner、独立源码目录、独立 Screen 和独立 `.config`。

## 每个 Job 的过程

1. 检出本配置仓库
2. 安装 `menuconfig` 依赖和 GNU Screen
3. 克隆所选 OpenWrt 系源码
4. 更新并安装 feeds
5. 可选复制 `config/<文件名>` 到 `source/.config`
6. 可选保存 `source/loaded-original.config`
7. 创建 Screen `11`
8. 在 Screen `11` 内运行 `make menuconfig`
9. 启动受限 tmate SSH
10. 用户登录后手动执行 `screen -d -r 11`
11. 每 5 秒检查一次 `/continue`，每 600 秒输出一次等待状态
12. 校验并上传 `.config`

不会在启动菜单前运行：

```bash
make defconfig
```

这样用户进入菜单时直接看到仓库中保存的已有配置。

## 完成标记

保存 `.config` 后执行：

```bash
sudo touch /continue
```

## Artifact

未读取已有配置：

```text
.config
menuconfig-session-N.config
SOURCE_INFO.txt
```

读取已有配置：

```text
.config
menuconfig-session-N.config
loaded-original.config
SOURCE_INFO.txt
```

`SOURCE_INFO.txt` 会记录：

```text
config_file
config_loaded
config_original_sha256
config_sha256
config_changed
```

## 不会执行

工作流不会执行固件编译：

```bash
make
make -j
make world
make download
```

只运行：

```bash
make menuconfig
```


## v12 自动补全 `.config`

已有配置文件输入按以下顺序解析：

```text
精确文件名优先
→ 精确文件不存在时尝试追加 .config
```

例如：

```text
输入：001.menuconfig-session-1
读取：config/001.menuconfig-session-1.config
```

`SOURCE_INFO.txt` 会记录：

```text
config_input=用户填写内容
config_file=实际读取文件名
```


## v13 完成标记检查间隔

等待循环改为：

```bash
sleep 5
```

执行：

```bash
sudo touch /continue
```

后，通常会在 5 秒内被工作流检测到并进入配置校验与 Artifact 上传步骤。

tmate 的连接等待时间仍保持：

```text
connect-timeout-seconds: 180
```

该值与 `/continue` 检查间隔无关。


## v14 检查频率与日志频率分离

完成标记检查：

```text
每 5 秒
```

等待状态日志：

```text
每 120 秒
```

实现逻辑：

```bash
last_report=$SECONDS

while true; do
  if [ -f /continue ] || [ -f "$GITHUB_WORKSPACE/continue" ]; then
    echo "检测到完成标记：$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    break
  fi

  if (( SECONDS - last_report >= 120 )); then
    echo "仍在等待：$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    last_report=$SECONDS
  fi

  sleep 5
done
```

因此执行：

```bash
sudo touch /continue
```

后，通常会在 5 秒内进入后续步骤，不需要等到下一次 120 秒日志刷新。


## v15 可选固件编译

Run workflow 新增：

```text
保存并上传 .config 后编译固件
```

默认：

```text
true
```

顺序必须保持：

```text
.config 校验
→ config Artifact 上传成功
→ 可选固件编译
→ build Artifact 上传
```

不能把编译步骤移到配置 Artifact 之前。

### 编译参数

首次执行：

```bash
CPU_COUNT="$(nproc)"
BUILD_JOBS="$CPU_COUNT"
make -j"$(nproc)"
```

并行失败后执行：

```bash
make -j1 V=s
```

第二次用于输出完整错误并尝试完成增量构建。

### 失败处理

编译步骤使用 `continue-on-error: true`，保证随后仍能上传日志；最后的“检查编译结果”步骤会在编译失败时把 Job 标记为失败。

配置 Artifact 已在此之前上传，不会因编译失败丢失。

### 输出

配置 Artifact：

```text
.config
menuconfig-session-N.config
loaded-original.config（存在时）
SOURCE_INFO.txt
```

编译 Artifact：

```text
bin/targets/**
BUILD_INFO.txt
build.log
build-verbose.log（存在时）
.config
SOURCE_INFO.txt
```

### 等待频率

```text
完成标记检查：每 5 秒
等待状态输出：每 600 秒
```


## v16 运行标题

Workflow 顶层增加：

```yaml
run-name: "${{ inputs.config_file || '新建配置' }}｜${{ inputs.source_branch }}｜${{ inputs.build_firmware && '编译固件' || '仅保存配置' }}"
```

Actions 总列表示例：

```text
001.menuconfig-session-1.config｜ImmortalWrt / master｜编译固件
```

各 SSH Job 示例：

```text
001.menuconfig-session-1.config｜immortalwrt-master SSH 1
```

未填写 `config_file` 时显示“新建配置”。

标题使用用户填写的原始内容，不会等待后续脚本解析真实文件名。Artifact 名称仍使用源码、分支、运行号和 Session 编号，不直接使用用户文件名。


## v17：新增 hanwckf ImmortalWrt MT798x

新增组合：

```text
ImmortalWrt MT798x (hanwckf) / openwrt-21.02
```

解析结果：

```text
source_name=immortalwrt-mt798x
repository=https://github.com/hanwckf/immortalwrt-mt798x.git
branch=openwrt-21.02
clone_mode=depth1
source_directory=source
```

上游示例目录名虽然是 `immortalwrt-mt798x`，本项目直接克隆到：

```text
$GITHUB_WORKSPACE/source
```

后续步骤不得使用：

```bash
cd immortalwrt-mt798x
```

源码自带 `defconfig/`，当前不自动复制。

所有源码统一编译：

```bash
make -j"$(nproc)"
```

失败后：

```bash
make -j1 V=s
```


## v19：MT798x 提示与逐文件 Artifact

### MT798x 提示

仅 `immortalwrt-mt798x` 显示，分为：

```text
MT7981 / AX3000
MT7986（AX4200、AX6000、AX7800）
MT7986 / 256M Low Memory
```

机型列表使用人工换行，保持终端可读性；不使用大量等号分隔。

### Artifact 前缀

在“检查并整理 `.config`”步骤中生成：

```text
ARTIFACT_PREFIX=配置基础名-运行号-Session号
```

读取 `006.immortalwrt.config` 时示例：

```text
006.immortalwrt-16-1
```

没有读取已有配置时使用：

```text
new-config-16-1
```

### 上传顺序

```text
配置 Artifact
→ 可选 make
→ 固件逐个上传
→ build-info Artifact
→ 恢复最终成功或失败状态
```

逐文件上传器：

```text
tools/artifact-uploader/upload-firmware.mjs
```

它扫描 `source/bin/targets/`，排除：

```text
packages/
*.buildinfo
*.manifest
profiles.json
sha256sums
```

剩余每个文件单独上传，并写入 `ARTIFACT_INDEX.txt`。

构建失败时，存在的部分固件仍会尝试上传，随后 Job 最终保持失败状态。

## v20：SSH 数量调整

```text
默认：2
最少：1
最大：5
```

Matrix 并发上限为 `5`。继续使用现有 Matrix 架构；手动取消 Workflow 时，全部 SSH Job 会同时取消。
