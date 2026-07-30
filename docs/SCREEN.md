# Screen 11 与断线恢复

工作流会自动创建名为：

```text
11
```

的 Screen 会话，并在其中执行：

```bash
cd ~/source
make menuconfig
```

## 登录后进入 Screen

SSH 登录后不会自动进入 Screen。

手动执行：

```bash
screen -d -r 11
```

即可看到 `make menuconfig` 界面。

底部状态栏会显示：

```text
Screen 11
```

## 断线后恢复

只要对应 Actions Job 仍在运行：

1. 使用原来的 tmate SSH 地址重新连接
2. 执行：

```bash
screen -d -r 11
```

## 常用命令

查看会话：

```bash
screen -ls
```

进入或接管：

```bash
screen -d -r 11
```

临时分离但保留界面：

```text
先按 Ctrl+A
松开
再按 D
```

## 保存并完成

在 menuconfig 中：

```text
Save
→ .config
→ Exit
```

检查：

```bash
ls -lh ~/source/.config
```

通知工作流：

```bash
sudo touch /continue
```

Screen 可以防止 MobaXterm、SSH 或本地网络短暂断开造成界面丢失，但不能防止 Actions 被取消、Job 超时或 Runner 被销毁。


## 已有配置

Workflow 填写已有配置文件名后，会先复制为：

```text
~/source/.config
```

然后才在 Screen `11` 内启动：

```bash
make menuconfig
```

因此执行：

```bash
screen -d -r 11
```

后看到的是已有配置对应的菜单状态。
