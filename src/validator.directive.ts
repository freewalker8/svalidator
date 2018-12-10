/**
 * Created by stongLiang on 2018-09-05
 * 表单项数据合规性验证指令
 * 用法示例
 * 示例：    "text::6~32"     表示输入长度为6到32个字符的字符串
 *             |  |  |
 * 解释：     (T) (S)(R)  T = 验证类型， S = 分隔符，连接符   R = 范围大小（长度范围，数字范围，最大值，最小值，）
 * 支持的快捷验证类型有：
 * ['empty','text','text+','w','w+','password','tel','tel+','mobile','mobile+','email','email+','digit','digit+','digitP','digitP+',
 * 'float','float+','floatP','floatP+','ip','ip+','IDCard','IDCard+','url','url+','en','en+','cn','cn+','port','port+']
 * 如果快捷验证类型不能满足你的需求，那么你可以自定义正则表达式进行验证，如下所示。

 * [sValidator]="w" // 检查内容合法性
 * [sValidator]="w::32" \w字符串类型，限定最大长度为32
 * [sValidator]="w::6~32" \w字符串类型，限定最大长度范围为6——32个字符
 * digit和float支持最大最小值和范围限定
 * [sValidator]="digit::32" or [sValidator]="digit::32+" 限定数字最大值为32,数字后面的符号表示最大(+)和最小(-)，默认为最大
 * [sValidator]="digit::-32" 限定数字最大值为-32
 * [sValidator]="digit::32-" 限定数字最小值为32
 * [sValidator]="digit::-32-" 限定数字最小值为-32
 * [sValidator]="digit::-6~32" 限定数字范围为-6到32
 * [sValidator]="^\\w+$" 自定义正则表达式，特殊字符需要转义，如\需要写成\\
 */
import { Directive, Input, HostListener, ElementRef, Renderer, OnInit, OnDestroy } from '@angular/core';


@Directive({
  selector: '[sValidator]'
})

export class SValidatorDirective implements OnInit, OnDestroy {
  @Input('sValidator') rule: string = ''; // 传入的检查规则
  @Input() sErrorMessage: string = ''; // 自定义的错误提示信息
  @Input() sDelay: number = 200; // 消除抖动，延迟响应事件
  private timerRef;
  @HostListener('keyup', ['$event']) onkeyup($e: Event) {
    clearTimeout(this.timerRef);
    this.timerRef = setTimeout(() => {
      this.validator($e);
    }, this.sDelay);
    this.stopPropagation($e);
  }
  @HostListener('blur', ['$event']) onblur($e: Event) {
    this.validator($e);
    this.stopPropagation($e);
    this.removeError(false); // Delete error bubble, keep red border of input
  }
  @HostListener('focus', ['$event']) onfocus($e: Event) { 
    $e.target['value'] && this.validator($e); 
  }

  private fileInputElement: any;
  constructor(
    private el: ElementRef,
    private render: Renderer,
  ) { }


  ngOnInit() {
  }

  /**
   * Stop propagation
   * @param e 
   */
  stopPropagation(e: Event): void {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }

  validator($e: Event): void {
    this.fileInputElement = $e.target;
    if (this.fileInputElement) {
      this.check(this.fileInputElement.value, this.rule);
    }
  }

  /**
   * exit validator
   * @param val: string input value
   * @param rule: string check rule
   */
  check(val: string, rule: string): void {
    if (undefined === rule || '' === rule || null === rule) return; // not rule paramter,return
    if (undefined === val || null === val) throw TypeError('Parameter of "val" can not be null or undefined');    
    let flag = true;
    val = val.trim();
    rule = rule.trim();
    let errInfo = '';
    // check value range and length is legal
    if (rule.includes('::')) { // has parameter of range or length
      let min, max;
      let range = '';
      let isRange = false;
      range = rule.split('::')[1];
      rule = rule.split('::')[0];
      if (/^(\-?\d+)\~(\-?\d+$)/.test(range)) { // range, like -1~9  1~9 -9~-1
        const between = range.split('~');
        min = Number(between[0]);
        max = Number(between[1]);
        if (min > max) throw TypeError('Parameter of range error, Max must be larger than Min, such as "digit::-6~100"');
        isRange = true;
      } else if (/^(\-?\d+)(\+?)$/.test(range)) { // max value, like 90 , 90+ , -90+ , -90
        max = Number(range.replace(/\+/g,'')); // Delete '+', then convert to number
      } else if (/^(\-?\d+)(\-)$/.test(range)) { // min value, like 90- , -90-
        min = Number(range.replace(/\-+$/g,'')); // Delete the last '-'
      } else {
        throw TypeError('Paramter error, range paramter error');
      }

      if (/^digit(P?)\+?$|^float(P?)\+?$/.test(rule)) { // The parameters after "::" indicate the range of number,  maximum or minimum
        const v = Number(val);
        if (/^digitP\+?$|^floatP\+?$/.test(rule) && v < 0) {
          flag = false;
          errInfo = `Out of range, please input positive value`;
        } else if (isRange) { // range
          if (v > max || v < min) {
            flag = false;
            errInfo = `Out of range, range:"${min}~${max}"`;
          }
        } else {
          if (max && v > max) { // limit max value
            flag = false;
            errInfo = `Exceeds the  value, maximum is ${max}`;
          } else if (min && v < min) {
            flag = false;
            errInfo = `Less than the minimum value, minimum is ${min}`;
          }
        }
      } else { // parameter indicate length
        const len = val.length;
        if (isRange) { // range
          if (len > max || len < min) {
            flag = false;
            errInfo = `Out of range, the range of length is "${min}~${max}"`;
          }
        } else {
          if (max && len > max) { // limit max value
            flag = false;
            errInfo = `Exceeds the maximum length, maximum length is ${max}`;
          } else if (min && len < min) {
            flag = false;
            errInfo = `Less than the minimum length, minimum length is ${min}`;
          }
        }
      }
    }

    // quick check
    if (flag) {
      let reg;
      switch (rule) {
        case 'empty': // can not be empty
          if ('' === val) {
            flag = false;
            errInfo = 'Can not be empty';
          }
          break;
        case 'text': break;
        case 'text+': // any chacter
          reg = /^\w*$/;
          if ('' === val) {
            flag = false;
            errInfo = 'Can not be empty';
          }
          break;
        case 'w': // number, alphabet, underline; can be empty
          reg = /^\w*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Only by number, letter, underline and can be empty';
          }
          break;
        case 'w+': // number, alphabet, underline; can be empty
          reg = /^\w+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Only by number, letter, underline and can not be empty';
          }
          break;
        case 'password': // password 6~32
          reg = /^\S{6-32}$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'The password is 6~32 characters and can not contain spaces';
          }
          break;
        case 'tel': // telphone
          reg = /^\d{3}-\d{8}$|^\d{4}-\d{7}$|^\d{11}$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input phone number, like "02365589999" or "023-65589999"';
          }
          break;
        case 'tel+': // telphone can not be null
          reg = /^\d{3}-\d{8}$|^\d{4}-\d{7}$|^\d{11}$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input phone number and can not be empty, like "02365589999" or "023-65589999"';
          }
          break;
        case 'mobile': // cellphone 
          reg = /^1[3-8]\d{9}$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input mobile phone number, like "13308080606"';
          }
          break;
        case 'mobile+': // cellphone can not be null
          reg = /^1[3-8]\d{9}$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input mobile phone number and can not be empty, like "13308080606"';
          }
          break;
        case 'email':
          reg = /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input E-mail address, like "stone.ll@qq.com"';
          }
          break;
        case 'email+':
          reg = /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input E-mail address and can not be empty, like "stone.ll@qq.com"';
          }
          break;
        case 'digit':
          reg = /^\d*$|^-\d+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input integer, like "8" or "-8"';
          } else {
            const limit = this.maxVal(val, 'int');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'digit+': // can not be empty
          reg = /^-?\d+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input integer and can not be empty, like "8" or "-8"';
          } else {
            const limit = this.maxVal(val, 'int');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'digitP': // positive integer
          reg = /^\d*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input positive integer, like "8"';
          } else {
            const limit = this.maxVal(val, 'int');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'digitP+': // can not be empty
          reg = /^\d+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input positive integer and can not be empty, like "8"';
          } else {
            const limit = this.maxVal(val, 'int');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'float':
          reg = /^(-?\d+)(\.\d+)?$|^\d*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input float, like "8" or "8.8" or "-1"';
          } else {
            const limit = this.maxVal(val, 'float');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'float+': // can not be empty
          reg = /^(-?\d+)(\.\d+)?$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input float and can not be empty, like "8" or "8.8" or "-1"';
          } else {
            const limit = this.maxVal(val, 'float');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'floatP': // positive float
          reg = /^(\d+)(\.\d+)?$|^\d*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input positive float, like "8" or "8.8"';
          } else {
            const limit = this.maxVal(val, 'float');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'floatP+': // can not be empty
          reg = /^(\d+)(\.\d+)?$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input postive float and can not be empty, like "8" or "8.8"';
          } else {
            const limit = this.maxVal(val, 'float');
            if (true !== limit) {
              flag = false;
              errInfo = limit.toString();
            }
          }
          break;
        case 'ip':
          reg = /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input IP address, like "1.2.3.4"';
          }
          break;
        case 'ip+':
          reg = /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input IP address and can not be empty, like "1.2.3.4"';
          }
          break;
        case 'IDCard': // ID card of china
          reg = /^\d{15}(\d{2}[A-Za-z0-9])?$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input ID card, like "500239201801015050"';
          }
          break;
        case 'IDCard+':
          reg = /^\d{15}(\d{2}[A-Za-z0-9])?$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input ID card and can not be empty, like "500239201801015050"';
          }
          break;
        case 'url':
          reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input url, like "http://www.liang-lei.com/"';
          }
          break;
        case 'url+':
          reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input url and can not be empty, like "http://www.liang-lei.com/"';
          }
          break;
        case 'en': // english charctor, not includes number and symbol
          reg = /^[A-Za-z\s]*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input english char, like "I love you"';
          }
          break;
        case 'en+': // english charctor, not includes number and symbol
          reg = /^[A-Za-z\s]+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input english char and can not be empty, like "I love you"';
          }
          break;
        case 'cn': // chinese, not includes number and symbol,space
          reg = /^[\u0391-\uFFE5]*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input chinese char, like "我爱你"';
          }
          break;
        case 'cn+': // chinese, not includes number and symbol,space
          reg = /^[\u0391-\uFFE5]+$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input chinese char and can not be empty, like "我爱你"';
          }
          break;
        case 'port': // port
          reg = /(^[1-9]\d{0,3}$)|(^[1-5]\d{4}$)|(^6[0-4]\d{3}$)|(^65[0-4]\d{2}$)|(^655[0-2]\d$)|(^6553[0-5]$)|^\s*$/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input port between 1-65535';
          }
          break;
        case 'port+': // port, can not be empty
          reg = /(^[1-9]\d{0,3}$)|(^[1-5]\d{4}$)|(^6[0-4]\d{3}$)|(^65[0-4]\d{2}$)|(^655[0-2]\d$)|(^6553[0-5]$)/;
          if (!reg.test(val)) {
            flag = false;
            errInfo = 'Please input port between 1-65535 and can not be empty';
          }
          break;
        default: // custom RegExp
          const types = ['empty','text','text+','w','w+','password','tel','tel+','mobile','mobile+','email','email+','digit','digit+','digitP','digitP+','float','float+','floatP','floatP+','ip','ip+','IDCard','IDCard+','url','url+','en','en+','cn','cn+','port','port+'];
          if(types.indexOf(rule) > -1){
            break;
          }
          try {
            reg = new RegExp(rule);
            if (!reg.test(val)) {
              flag = false;
              errInfo = 'Varification faild, please check your RegExp, Eg:"^\\w+$" => /^\w+$/';
            }
          } catch (error) {
            throw new Error(error);
          }
      }
    }    
    if (!flag) {
      errInfo = this.sErrorMessage || errInfo;
      this.showError(this.fileInputElement, errInfo);
    }else {
      this.removeError();
    }
  }

  /**
   * show error bubble
   * @param dom html element
   * @param msg error info
   */
  showError(dom: any, msg: string): void {    
    const p: HTMLElement = this.el.nativeElement.parentElement.querySelector('.validatorError');
    if (msg) { // has error
      if (!p) { // does not exist dom of P, created it
        const p = this.render.createElement(dom.parentElement, 'p'); // create dom of 'p'
        const label = this.render.createElement(p, 'label');
        const span = this.render.createElement(p, 'span');
        this.render.setElementClass(p, 'validatorError', true);
        this.render.createText(span, msg);
        this.setStyles(p, {
          'width': '100%',
          'height': '0px',
          'position': 'relative'
        });
        this.setStyles(label, {
          'width': 0,
          'height': 0,
          'position': 'absolute',
          'z-index': 100,
          'border-bottom': '8px solid #faa',
          'border-right': '6px solid transparent',
          'border-left': '6px solid transparent',
          'margin-left': '20px',
          'margin-bottom': 0
        });
        this.setStyles(span, {
          'display': 'block',
          'padding': '3px 10px',
          'position': 'absolute',
          'z-index': 100,
          'border': '1px solid #faa',
          'border-radius': '2px',
          'margin-top': '7px',
          'color': '#555',
          'background-color': '#f7cfcf',
        });
        this.render.attachViewAfter(p, dom);// add dom
      } else {
        p.querySelector('span').innerText = msg; // reset text
      }
      // add style for input
      this.setStyles(this.el.nativeElement, { 'border-color': '#F66' }); // change input border color
    }
  }

  /**
   * delete dom of error bubble
   * @param: isDeleteRedBorder 是否删掉输入框的红色标记边框
   */
  removeError(isDeleteRedBorder = true) {
    const p: HTMLElement = this.el.nativeElement.parentElement.querySelector('.validatorError');
    isDeleteRedBorder && (this.el.nativeElement.style.borderColor = ''); // delete border color
    p && this.render.detachView([p]); // delete dom
  }
  /**
   * set dom style
   * @param dom dom Document element
   * @param stys stylesheet format:{key: value}
   */
  setStyles(dom: any, stys: {[key:string]: any}): void {
    for (const key in stys) {
      if (stys.hasOwnProperty(key)) {
        this.render.setElementStyle(dom, key, stys[key]);
      }
    }
  }
  //max value
  maxVal(val, type: string): string | boolean {
    let max = 0;
    let error;
    'int' === type.toLowerCase() ? (max = Math.pow(2, 31) - 1) : (max = Math.pow(2, 63) - 1);
    if (Number(val) > max) {
      error = 'Exceeds the maximum,maximum is ' + max;
    } else if (Number(val) < 0 - max) {
      error = 'Exceeds the minimum,minimum is ' + max;
    }
    return error ? error : true;
  }
  
  ngOnDestroy() {
    this.fileInputElement = null;
  }
}
