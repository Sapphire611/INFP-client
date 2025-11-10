# 微信登录配置指南

## 当前配置状态

✅ 小程序 APPID 已配置：`wx90cd24909870fbf2`
✅ 后端微信配置已完成
✅ 登录流程已实现

## 开发环境配置

### 1. 微信开发者工具设置

打开微信开发者工具后，需要进行以下配置：

#### 关闭域名校验（仅开发环境）
- 点击右上角"详情"
- 找到"本地设置"
- 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

这样才能在开发环境下请求 `http://localhost:3000` 的后端接口。

### 2. 后端服务启动

确保 CMS 后端服务已启动：

```bash
cd /Users/liuliyi/code/jxrays-cms
npm run dev
```

### 3. 小程序编译

```bash
cd /Users/liuliyi/code/jxrays-client
npm run dev:weapp
```

编译完成后，使用微信开发者工具打开 `dist` 目录。

## 生产环境配置

### 1. 配置服务器域名

在微信公众平台（https://mp.weixin.qq.com/）配置合法域名：

- 登录微信公众平台
- 进入"开发" → "开发管理" → "开发设置"
- 找到"服务器域名"
- 添加 request 合法域名：你的生产服务器域名（如：`https://api.example.com`）

### 2. 更新 API 配置

修改 `src/shared/utils/request/api.js`：

```javascript
export default {
  test_api: "http://localhost:3000/api",
  prod_api: "https://your-production-domain.com/api", // 改为你的生产域名
  img_url: "https://your-production-domain.com/static",
};
```

### 3. 后端环境变量

确保生产环境的 `.env` 文件已配置：

```env
WECHAT_APPID="wx90cd24909870fbf2"
WECHAT_SECRET="4e31c060b0ea60163561ab42b76e9924"
```

## 登录流程说明

### 当前实现的登录方式

1. **静默登录**：用户点击"微信一键登录"后，直接使用微信 openid 完成登录
2. **无需授权**：不需要用户主动授权获取昵称和头像
3. **自动创建账号**：首次登录会自动创建家长账号

### 用户信息获取

根据微信最新规范（2022年后），获取用户头像和昵称的方式：

- **头像**：使用 `<button open-type="chooseAvatar">` 让用户选择头像
- **昵称**：使用 `<input type="nickname">` 让用户输入昵称

建议在个人中心页面添加用户信息完善功能。

## 测试步骤

1. 启动后端服务（CMS）
2. 编译小程序并在开发者工具中打开
3. 确保已关闭域名校验
4. 点击登录页面的"微信一键登录"按钮
5. 查看控制台和网络请求，确认登录流程

## 常见问题

### 1. 登录失败：获取 openid 失败

- 检查 APPID 和 SECRET 是否正确
- 确认后端服务已启动
- 查看后端日志中的微信 API 返回错误

### 2. 请求失败：域名不合法

开发环境：确保已关闭域名校验
生产环境：确保已在微信公众平台配置合法域名

### 3. code 无效

微信登录 code 只能使用一次，如果重复使用会失败。每次登录都会生成新的 code。

## 调试技巧

### 查看网络请求

在微信开发者工具中：
- 点击"调试器"
- 切换到"Network"标签
- 观察 `/api/auth/wechat-login` 接口的请求和响应

### 查看本地存储

在控制台执行：
```javascript
Taro.getStorageSync('jxrays_token')
Taro.getStorageSync('jxrays_user_info')
```

### 清除登录状态

如需重新测试登录流程：
```javascript
Taro.clearStorage()
```
