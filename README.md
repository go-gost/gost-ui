# GOST V3 API Manage

[gost](https://github.com/go-gost/gost) 官方的 web-ui 还没完成，先弄个简单的用一下，好过在 Postman 上捣腾；  
纯前端的项目，部署在`github-pages`上, 放心使用;

## 使用方式

1. 启动 API 服务

   > `gost -api :18080`


2. 打开 web 端管理地址 [点击打开](http://blog.whyoop.com/gost-ui/)

   - API 地址 `http://IP:PORT`， 如果配置了`pathPrefix`，加上`pathPrefix`路径；
   - (如果有) 填写 用户，密码;
   - 点击 `连接` 按钮; 
  
   ![home page](https://blog.whyoop.com/gost-ui/page-home.png)

3. 在管理面板，动态管理 GOST

   ![home page](https://blog.whyoop.com/gost-ui/page-manage.png)

## 常见问题

1. 添加配置时必须有`name`字段，修改时`name`字段会被忽略；
2. `GOST`的API是支持跨域的，如碰到跨域问题，检查一下页面和API的协议是否一至
3. 由于`Chrome`安全规则，连接本地`API`(127.0.0.1:xxx 或 localhost:xxx) 需要用[https页面](https://blog.whyoop.com/gost-ui/); 但连接局域网内的`API` 需要修改浏览器配置 [设置方式可以参考这篇博文](https://blog.csdn.net/Flywithdawn/article/details/128253604)
   - 补充：可以本地启一个 http/socks 代理，`Chrome`通过本地代理访问管理页面，再链接本地/局域网API时，不再触发安全规则；
4. `快速连接`和`禁用`的配置数据保存在浏览器的`indexedDB`中,要快速清除本地数据，可以直接删除`indexedDb`中的`GOST-UI`库即可；
