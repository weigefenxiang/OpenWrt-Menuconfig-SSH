# config 配置目录

把需要复用的 OpenWrt 配置文件放在本目录。

文件名不强制使用 `.config` 扩展名，也不限制为纯英文。

允许示例：

```text
001.menuconfig-session-1.config
360T7 UBI.config
中文配置.config
backup@2026.config
test(1).config
stable
```

运行 Actions 时，在“已有配置文件”输入框中只填写文件名：

```text
001.menuconfig-session-1.config
```

输入框前后的空格会自动清理，例如：

```text
  001.menuconfig-session-1.config
```

会按以下文件读取：

```text
001.menuconfig-session-1.config
```

不要填写目录或路径：

```text
config/001.menuconfig-session-1.config
../001.menuconfig-session-1.config
/subdir/file
C:\config\file
```

留空表示不读取已有配置，直接启动新的 `make menuconfig`。

读取成功后，工作流会复制：

```text
config/<文件名>
```

到源码目录：

```text
source/.config
```

并额外保存：

```text
source/loaded-original.config
```

要求：

- 文件必须位于 `config/` 根目录
- 文件必须真实存在
- 文件不能为空
- 文件名不能包含 `/` 或 `\`
- 文件名不能是 `.` 或 `..`

原始配置和最终保存的配置会一起上传，方便比较。


## 可省略 `.config`

若仓库文件为：

```text
001.menuconfig-session-1.config
```

Run workflow 可以只填写：

```text
001.menuconfig-session-1
```

工作流按以下顺序查找：

```text
config/001.menuconfig-session-1
→ config/001.menuconfig-session-1.config
```

精确文件名优先。仓库同时存在 `stable` 和 `stable.config` 时，填写 `stable` 会读取无扩展名文件。
