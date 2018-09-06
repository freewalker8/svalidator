# svalidator
Directive of angular,use to validator form.

val:等待校验的值，必选参数
 * type:校验类型，默认值为text,可选参数
 * type的值有：w,text,empty,password,tel,mobile,email,digit,digitP,float,ip,IdCard,url,english,chinese;
 * 检查类型合法性示例：
 * [sValidator]="'w'"
 * 检查字符串类型和长度、范围合法性示例：
 * 限制字符串长度：
 * [sValidator]="'w,6*32'"
 * [sValidator]="'w,32'"
 * 限制数字范围：
 * [sValidator]="'digit,-6*32'" //取值范围
 * [sValidator]="'digit,32'"   //最大值
