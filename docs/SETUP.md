# 首次设置

这些步骤通常只需要完成一次。

## 1. 项目文件

仓库需要保留：

```text
README.md
docs/
.github/workflows/menuconfig-ssh.yml
```

源码由 Actions 临时下载，不需要上传。

## 2. Git 上传

在项目目录打开 PowerShell：

```powershell
git init
git branch -M main
git add .
git commit -m "Add OpenWrt Menuconfig SSH workflow"
git remote remove origin 2>$null
git remote add origin https://github.com/weigefenxiang/OpenWrt-Menuconfig-SSH.git
git push -u origin main
```

后续更新：

```powershell
git add .
git commit -m "Update workflow and docs"
git push
```

## 3. 添加 SSH 公钥

工作流限制为只有触发 Actions 的 GitHub 用户能够通过已登记公钥登录。

检查本机密钥：

```powershell
Get-ChildItem $env:USERPROFILE\.ssh
```

常见文件：

```text
id_ed25519       私钥
id_ed25519.pub   公钥
```

没有密钥时：

```powershell
ssh-keygen -t ed25519 -C "github-actions"
```

查看公钥：

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

添加到：

```text
GitHub 头像
→ Settings
→ SSH and GPG keys
→ New SSH key
```

## 4. 公开仓库是否会泄露公钥

不会因为公开仓库或 GitHub 账号中登记公钥而泄露对应私钥。

可以公开或登记：

```text
id_ed25519.pub
```

必须保密：

```text
id_ed25519
```

不要把私钥提交到 Git、上传到仓库、截图或发给别人。

公开仓库中的 `.config` 也不要写入密码、Token、私钥、订阅地址等敏感内容。
