# svalidator
Directive of angular,use to validator form.
Angular表单输入框数据合法性校验指令，支持快捷校验和自定义正则表达式校验

示例：
<input [sValidator]="w::6~32" [errorMessage]="'自定义的错误提示信息'" />
sValidator: 传给指令的校验规则，格式说明如“* sValidator：校验规则 *”所示
errorMessage：可选，自定义的错误提示信息，设置后校验失败时显示

* sValidator：校验规则 *
  格式1：type::range <——> 快捷校验类型::范围
    -- type: 快捷校验类型
         type的值有：w,empty,password,tel,mobile,email,digit,digitP,float,floatP,ip,IDCard,url,en,cn,port;
         类型后面跟“+”表示不能为空，如：w+(表示只能输入字母、数字、下划线且不能为空)
    -- range: 可选，表示范围（字符串表示长度范围，数字表示取值范围），范围之间用“~”连接，表示最大值/长度时最大值/长    度后面跟“+”   (加号)，如：              digit::100+（表示最大值为100，包含100）;最小值在数值后面跟“-”（减号），如：         digit::-100-（表示最小值为-100）
  格式2：RegExp 自定义正则表达式作为校验规则，特殊字符需要转义，如\需要写成\\

* 表单项数据合规性验证指令
* 用法示例
* [sValidator]="w" // 检查内容合法性——只能输入字母、数字、下划线，可以为空
* [sValidator]="w::32" // 限定最大长度为32
* [sValidator]="w::6~32" // 限定长度范围为6——32个字符
* digit,digitP和float,floatP支持最大最小值和范围限定
* [sValidator]="digit::32" or [sValidator]="digit::32+" 限定数字最大值为32,数字后面的符号表示最大(+)和最小(-)，默认为最大
* [sValidator]="digit::-32" 限定数字最大值为-32
* [sValidator]="digit::32-" 限定数字最小值为32
* [sValidator]="digit::-32-" 限定数字最小值为-32
* [sValidator]="digit::-6~32" 限定数字范围为-6到32
* [sValidator]="^\\w+$" 自定义正则表达式，特殊字符需要转义，如\需要写成\\

快捷校验类型释义：
w => 数字、字母、下划线
w+ => 数字、字母、下划线,不能为空；如下所有类型跟上“+”都表示不能为空

empty => 不能为空
password => 密码，长度6-32位，任意字符组成
tel => 座机号码
mobile => 手机号码
email => 电子邮箱
digit => 整数
digitP => 正整数
float => 浮点数
floatP => 正浮点数
ip => IP地址
IDCard => 身份证号码
url => 网址，包含IP类型的网址
en => 英文字符，不包含标点符号
cn => 中文字符，不包含标点符号
