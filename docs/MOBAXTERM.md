# MobaXterm 连接教程

## 1. 从 Actions 日志取得地址

日志类似：

```text
SSH: ssh ABCDEFGHIJK@sfo2.tmate.io
```

对应：

```text
用户名：ABCDEFGHIJK
服务器：sfo2.tmate.io
端口：22
```

每个 Job 的地址不同。

## 2. 创建 SSH Session

打开：

```text
Session
→ SSH
```

填写：

```text
Remote host：sfo2.tmate.io
Specify username：@ 前面的字符串
Port：22
```

进入：

```text
Advanced SSH settings
→ Use private key
```

选择本地私钥：

```text
C:\Users\你的用户名\.ssh\id_ed25519
```

不要选择：

```text
id_ed25519.pub
```

## 3. Clash Verge 代理 7897

先确认 Clash Verge 正在运行，并且本地代理端口为：

```text
7897
```

编辑 MobaXterm Session，在该 Session 的代理或 Network settings 中设置：

```text
代理类型：SOCKS5
代理服务器：127.0.0.1
代理端口：7897
```

不同版本可能显示为：

```text
Connect through proxy
SOCKS proxy
SOCKS5 proxy
```

若无法连接，检查：

- Clash Verge 是否已启动
- 节点是否可用
- 端口是否仍是 `7897`
- 是否选择 `SOCKS5`
- Windows 防火墙是否拦截

## 4. 开启 Keepalive

打开：

```text
Settings
→ Configuration
→ SSH
```

勾选：

```text
Enable SSH keepalive
```

Keepalive 可以减少空闲连接因 NAT 或路由器超时而断开，但真正断网时仍需依靠 Screen 恢复。

## 5. 公钥报错

出现：

```text
No supported authentication methods available
server sent: publickey
```

说明 MobaXterm 没有使用与 GitHub 公钥对应的私钥。

重新选择：

```text
C:\Users\你的用户名\.ssh\id_ed25519
```

也可以在 MobaXterm 本地终端执行：

```bash
ssh -o IdentitiesOnly=yes \
  -i /drives/c/Users/你的用户名/.ssh/id_ed25519 \
  ABCDEFGHIJK@sfo2.tmate.io
```
