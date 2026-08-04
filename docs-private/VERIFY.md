# v20 验收清单

## 静态检查

- [x] YAML 可解析
- [x] 默认后台 `4`
- [x] 支持 `1～16`
- [x] `max-parallel: 16`
- [x] Screen 名为 `11`
- [x] 默认自动启动 menuconfig
- [x] action-tmate 固定 `v3.24`
- [x] detached 模式
- [x] `connect-timeout-seconds: 180`
- [x] 限制到触发用户公钥
- [x] 每 `180` 秒检查
- [x] 删除 `command -v tmate`
- [x] 删除 `/tmp/tmate.sock`
- [x] 删除 `send-keys`
- [x] 不包含固件编译步骤

## 真实 Actions

- [ ] 使用 1 个后台启动
- [ ] Screen 创建成功
- [ ] SSH 地址正常输出
- [ ] 等待步骤运行
- [ ] SSH 登录后自动进入 Screen `11`
- [ ] menuconfig 可操作
- [ ] 断线重连可恢复
- [ ] `.config` 保存成功
- [ ] `/continue` 被检测
- [ ] Artifact 上传成功
- [ ] Post tmate 正常结束


## 时间行为验证

- [ ] `/continue` 首次检查约在 180 秒后
- [ ] 后续检查间隔约为 180 秒
- [ ] 未连接时 tmate 最大等待约 180 秒
- [ ] 已知 action-tmate 日志仍可能每约 5 秒打印一次 SSH 地址


## `.gitignore` 验证

- [x] 根目录存在 `.gitignore`
- [x] 忽略本地源码目录
- [x] 忽略 `.config` 与本地产物
- [x] 忽略 ZIP、日志和环境文件
- [x] 忽略常见私钥文件名
- [x] 不忽略 `.github/`
- [x] 不忽略 `README.md`
- [x] 不忽略 `docs/`
- [x] 不忽略 `docs-private/`


## v8 Screen/menuconfig 验证

- [x] 数字会话名 `11` 已由用户真实 Actions 验证可进入
- [x] 启动脚本在 Screen Detached 时不调用 `make menuconfig`
- [x] Ready 标记出现后调用 `make menuconfig`
- [x] 自动接入脚本调用 `screen -d -r 11`
- [x] 状态栏包含 `Screen 11`
- [x] 诊断日志路径固定为 `/tmp/screen-11-status.log`
- [ ] 真实 Actions：首次 SSH 接入后自动显示 menuconfig
- [ ] 真实 Actions：手动接入也能触发 menuconfig
- [ ] 真实 Actions：断线重连恢复正常


## v9 精简验证

- [x] 已删除 `launch_mode`
- [x] 已删除 `.bashrc` 自动接入
- [x] 已删除 ready marker
- [x] 已删除 Attached 检测
- [x] 已删除自动进入脚本
- [x] Screen 名固定为 `11`
- [x] Screen 内立即执行 `make menuconfig`
- [x] README 明确要求手动 `screen -d -r 11`
- [ ] 真实 Actions：SSH 登录后 `screen -ls` 能看到 `11`
- [ ] 真实 Actions：`screen -d -r 11` 能看到 menuconfig


## v10 已有配置验证

- [x] 存在 `config/README.md`
- [x] `config_file` 留空时不读取
- [x] 有效 `.config` 文件可以复制到 `source/.config`
- [x] 原始配置保存为 `loaded-original.config`
- [x] 错误扩展名会失败
- [x] `../xxx.config` 会失败
- [x] `config/xxx.config` 会失败
- [x] 不存在的文件会失败
- [x] 空文件会失败
- [x] Screen 在配置复制之后创建
- [x] 不会自动进入 Screen
- [x] 不会预先执行 `make defconfig`
- [x] Artifact 包含可选原始配置
- [ ] 真实 Actions：有效配置进入 menuconfig 后选项状态正确
- [ ] 真实 Actions：多 Runner 分别读取独立副本


## v11 文件名验证

- [x] `001.menuconfig-session-1.config` 可读取
- [x] 数字开头可读取
- [x] 中文文件名可读取
- [x] 内部空格可读取
- [x] 括号和 `@` 可读取
- [x] 无扩展名文件可读取
- [x] 输入框前后空格会清理
- [x] `/` 路径被拒绝
- [x] `\` 路径被拒绝
- [x] `.` 和 `..` 被拒绝
- [x] 不存在文件会失败
- [x] 空文件会失败


## v12 自动补全验证

- [x] 完整文件名可读取
- [x] 省略 `.config` 可自动补全
- [x] 真实无扩展名文件优先
- [x] 两种都不存在时失败
- [x] 记录输入名和实际文件名


## v13 等待循环验证

- [x] 等待步骤名称显示每 5 秒检查
- [x] `/continue` 轮询使用 `sleep 5`
- [x] `$GITHUB_WORKSPACE/continue` 仍可作为完成标记
- [x] 连接说明显示每 5 秒检查
- [x] `connect-timeout-seconds` 仍为 180
- [x] 未改变 Screen 11 行为
- [x] 未增加 `make defconfig`
- [x] 未增加固件编译


## v14 等待循环验证

- [x] `/continue` 每 5 秒检查
- [x] `$GITHUB_WORKSPACE/continue` 每 5 秒检查
- [x] “仍在等待”每 120 秒输出
- [x] 检测到标记后立即退出循环
- [x] 时间统一显示 UTC
- [x] tmate 连接超时仍为 180 秒
- [x] Screen 11 行为未改变
- [x] 未增加 `make defconfig`
- [x] 未增加固件编译


## v15 编译验证

- [x] `build_firmware` 默认开启
- [x] 可以取消固件编译
- [x] config Artifact 严格位于编译步骤之前
- [x] 并行度使用 `nproc + 1`
- [x] 并行失败后执行 `make -j1 V=s`
- [x] 编译失败仍上传日志
- [x] 最终步骤会将失败状态恢复为 Job 失败
- [x] 固件仅上传 `bin/targets/**`
- [x] 完成标记每 5 秒检查
- [x] 等待状态每 600 秒输出
- [x] Screen 11 行为未改变
- [x] 已有配置读取行为未改变
- [ ] 真实 Actions：取消编译时只生成 config Artifact
- [ ] 真实 Actions：默认编译可生成 build Artifact
- [ ] 真实 Actions：编译失败仍能下载日志


## v16 标题验证

- [x] 顶层存在 `run-name`
- [x] 有配置输入时显示输入文件名
- [x] 未填写配置时显示“新建配置”
- [x] 标题包含源码和分支
- [x] 标题包含编译状态
- [x] 各 SSH Job 名称包含配置输入名
- [x] Artifact 名称未使用用户文件名
- [x] 已有配置读取、等待、Screen 11 和编译逻辑未改变
- [ ] 真实 Actions：总列表标题显示正确
- [ ] 真实 Actions：各 SSH Job 名称显示正确


## v17 新源码验证

- [x] 下拉框包含 hanwckf MT798x
- [x] 仓库地址和 `openwrt-21.02` 正确
- [x] 新源使用 `--depth=1`
- [x] 所有源码统一到 `$GITHUB_WORKSPACE/source`
- [x] 不存在特殊 `cd immortalwrt-mt798x`
- [x] feeds 在统一目录执行
- [x] 不自动复制源码 `defconfig/`
- [x] 用户已有配置读取逻辑不变
- [x] 所有源码统一 `make -j$(nproc)`
- [x] 失败后仍为 `make -j1 V=s`
- [x] `.config` 仍先上传再编译
- [ ] 真实 Actions：新源克隆和 feeds 成功
- [ ] 真实 Actions：新源能进入 menuconfig
- [ ] 真实 Actions：有效配置可完成编译


## v18 `.gitignore` 验证

- [x] 根目录 `test.zip` 被忽略
- [x] 根目录 `test.txt` 被忽略
- [x] 根目录 `config-private/` 被忽略
- [x] `config/` 不被忽略
- [x] `docs/test.txt` 不被忽略
- [x] Workflow 文件未修改
- [x] Screen、源码、配置读取和编译逻辑未修改


## v19 验收

- [x] MT798x 机型提示位于预设命令之前
- [x] MT7986 合并 AX4200、AX6000、AX7800
- [x] 低内存预设独立显示
- [x] 机型列表保持适度人工换行
- [x] 仅 hanwckf 源显示 MT798x 提示
- [x] 不自动执行 defconfig 复制命令
- [x] Artifact 前缀包含配置基础名、运行号、Session
- [x] `.config` 先上传再编译
- [x] 固件逐个成为独立 Artifact
- [x] `packages/` 和构建资料不作为固件上传
- [x] build-info 包含索引、日志和构建资料
- [x] 索引记录大小与 SHA256
- [x] 动态上传失败后最终 Job 失败
- [x] YAML 和 Node.js 语法通过
- [x] 模拟固件扫描和命名通过
- [ ] 真实 Actions：逐个 Artifact 上传成功
- [ ] 真实 Actions：下载项名称与配置对应

## v20 验收

- [x] sessions 默认值为 2
- [x] sessions 选项仅为 1～5
- [x] max-parallel 为 5
- [x] 未新增独立 Worker Workflow
- [x] v19 其他功能未改变
