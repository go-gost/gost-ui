const e="简体中文",t={title:"GOST API Manage",description:"连接API服务",form:{username:"用户名",password:"密码",local:"保存到本地",name:"名称",details:"详情"},cmd:{connect:"连接",controls:"操作",enabled:"启用",disable:"禁用",copy:"复制",edit:"修改",del:"删除",reset:"重置"}},s={warn:"警告",deleteing:"确定要删除吗？",doubleClickEdit:"双击修改"},i={admission:{title:"准入控制器(Admission)",subTitle:"准入控制器"},auther:{title:"认证器(Auther)",subTitle:"认证器"},bypass:{title:"分流器(Bypass)",subTitle:"分流器"},chain:{title:"转发链(Chain)",subTitle:"转发链"},climiter:{title:"并发连接数限制",subTitle:""},limiter:{title:"流量速率限制",subTitle:""},rlimiter:{title:"请求速率限制",subTitle:""},hop:{title:"跳跃点(Hop)",subTitle:"跳跃点"},host:{title:"主机映射器(Hosts)",subTitle:"主机映射器"},ingress:{title:"Ingress",subTitle:"Ingress"},resolver:{title:"域名解析器(Resolver)",subTitle:"域名解析器"},service:{title:"服务(Service)",subTitle:"服务"},sd:{title:"服务发现(SD)",subTitle:"服务发现"},observer:{title:"观测器(Observer)",subTitle:"观测器"}},l={baseURL:{required:"请输入API地址"},require:"不能为空！",success:"操作成功！",unknown:"出现未知错误！",connectionFailed:"连接失败！",wordWrap:"自动换行",invalidName:"name无效",autofixName:"是否自动分配name？",autofix:"自动修正提醒",fixName:"新分配 name 为  {{name}}",formatError:"{{name}}格式错误!"},a={baseURL:"API baseURL",savePath:"默认保存到上下文目录"},o={quickConnect:"快速连接"},n={cmd:{reload:"刷新配置",save:"保存到服务器",download:"下载当前配置",logout:"退出",switch:"切换服务",new:"连接新服务"},label:{autoSave:"自动保存",format:"格式",path:"保存路径",limit:"限速限流",allConfig:"完整配置"}},r={edit:"修改 {{name}}",add:"添加 {{name}}",copied:"复制自 {{name}}"},m={default:"默认",inline:"内联"},c={template:"模板",forwarder:"转发/反代",key0:"远程端口转发"},d={language:e,base:t,text:s,modules:i,msg:l,placeholder:a,home:o,manage:n,title:r,template:m,terms:c};export{t as base,d as default,o as home,e as language,n as manage,i as modules,l as msg,a as placeholder,m as template,c as terms,s as text,r as title};