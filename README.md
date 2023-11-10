# GOST V3 API Manage

官方的 web-ui 还没完成，先弄个简单的用一下，好过在 postMan 上捣腾；  
纯前端的项目，部署在`github-pages`上, 放心[试用](https://blog.whyoop.com/gost-ui/);

## 使用方式

1. 启动 API 服务

   > `gost -api :18080` 或者 `gost -api admin:123456@:18080`

2. 打开 web 端管理地址 [点击打开](https://blog.whyoop.com/gost-ui/)

   - API 地址 `http://IP:PORT`， 如果配置了`pathPrefix`，加上`pathPrefix`路径；
   - (如果有) 填写 用户，密码;
   - 点击 `连接` 按钮;

3. 管理面板，动态管理GOST
