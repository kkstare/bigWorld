import { assetManager, Button, Camera, Component, director, EventHandler, game, geometry, ImageAsset, Label, lerp, Mask, MeshRenderer, Node, renderer, RenderTexture, Sprite, SpriteFrame, Texture2D, tween, UIRenderer, UITransform, v3, Vec3, view, Widget } from "cc";

/**
 * 面片节点
 */
interface IPlaneNode extends Node {
    $ltScale?: Vec3;
}

// 临时变量
const _vec30 = v3(), _vec31 = v3(), _vec6 = Array.from(Array(8), v3);

export default class ComFun {

    /**
     * 纹理框架缓存
     */
    private static _spfCache: { [key: string]: SpriteFrame } = {};
    /**
     * 图片后缀列表
     */
    private static _imageSuf: Set<string> = new Set(['tiff', 'pjp', 'jfif', 'bmp', 'webp', 'gif', 'svg', 'jpg', 'svgz', 'png', 'xbm', 'dib', 'jxl', 'jpeg', 'ico', 'tif', 'pjpeg', 'avif']);
    /**
     * 视频后缀列表
     */
    private static _videoSuf: Set<string> = new Set(['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi']);
    /**
     * 音频后缀列表
     */
    private static _audioSuf: Set<string> = new Set(['opus', 'flac', 'webm', 'weba', 'wav', 'ogg', 'm4a', 'mp3', 'oga', 'mid', 'amr', 'aiff', 'wma', 'au', 'acc']);
    /**
     * 文档后缀列表
     */
    private static _fileSuf: Set<string> = new Set(['pdf', 'ppt', 'pptx']);
    /**
     * 压缩包文件后缀列表
     */
    private static _zipSuf: Set<string> = new Set(['zip', 'rar', 'gzip']);
    /**
     * 临时变量
     */
    private static _tmpNode: Node = new Node;
    /**
     * 置灰数据缓存属性
     */
    private static _grayAttr: string = '$gray$';
    /**
     * 2D节点灰度材质属性
     */
    private static _grayMat: string = '_instanceMaterialType'

    /**
     * 生成从min到max之间的随机数，其中min和max都必须大于0的整数
     * 若为一个参数，则生成1到min之间的随机数
     * 若为两个参数，则生成min到max之间的随机数
     * 其他参数个数，返回错误0
     */
    public static random(min: number, max?: number): number {
        // body...
        if (min < 0 || max! <= 0) {
            return 0;
        }

        switch (arguments.length) {
            case 1:
                return Math.floor(Math.random() * min + 1);
            case 2:
                return Math.floor(Math.random() * (max! - min + 1) + min);
            default:
                return 0;
        }
    }

    /**生成随机数 [minNum, maxNum]*/
    public static randomNum(minNum: number, maxNum: number) {
        return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
    }

    /**
     * 获得随机数
     *@param num:随机值
     *@param type:范围,0:0-(num-1),-1:(-num+1)-(num-1),-2:-num/num;
     **/
    public static getRandNum(num: number, type: number = 0): number {
        let _value: number = 0;
        if (type == 0) {
            _value = Math.random() * num >> 0;
        } else if (type == -1) {
            _value = (Math.random() * num >> 0) - (Math.random() * num >> 0);
        } else if (type == -2) {
            _value = num * (Math.random() * 1 > 0.5 ? 1 : -1);
        }
        return _value;
    }

    /**从列表中随机获取N个元素 */
    public static getRandList(list: any[], count: number = 1): any[] {
        if (list.length < count) {
            return list;
        }
        let _tempList: any[] = list.concat();
        let _getList: any[] = [];
        for (let i = 0; i < count; i++) {
            _getList.push(_tempList.splice(ComFun.getRandNum(_tempList.length), 1)[0]);
        }
        return _getList;
    }


    /**
     * 打乱数组（影响原数组对象）
     * 
     */
    public static shuffleArray(arr: any[]): void {
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                let randomIndex = Math.round(Math.random() * (arr.length - 1 - i)) + i;
                let temp = arr[randomIndex]
                arr[randomIndex] = arr[i]
                arr[i] = temp
            }
        }
    }
    /**
     * 获取字符串中的数字
     * @param _str 
     * @returns 其中的数字
     */
    public static getNumberByStr(_str: string) {
        let value = Number(_str.replace(/[^0-9]/ig, ""));

        // console.log("getNumberByStr", value);
        return value;
    }

    /**
     * 数字转成带单位字符串
     * @param num
     * @param floor
     */
    public static getNumToStr(num: number, floor: number = 2, type: number = 0): string {
        function getDecCount(num: number): string {
            return num.toFixed(floor);
        }

        function getParseInt(num: number): number {
            return parseInt(num.toString());
        }

        if (num < 1000) {
            if (type == 0) {
                return getDecCount(num);
            } else {
                return getParseInt(num).toString();
            }
        }

        if (num < 1000000) {
            num = getParseInt(num);
        }
        return ComFun.getNumEnStr(num, floor);
    }

    /**时间秒数转HH:MM:SS */
    public static getHHMMSSBySecond(second: number) {
        if (second < 0) {
            return '0';
        }
        let hh = Math.floor(second / 3600);
        let strhh = hh < 10 ? "0" + hh : "" + hh;
        let mm = Math.floor((second - hh * 3600) / 60);
        let strmm = mm < 10 ? "0" + mm : "" + mm;
        let ss = second - hh * 3600 - mm * 60;
        let strss = ss < 10 ? "0" + ss : "" + ss;

        return strhh + ":" + strmm + ":" + strss;
    };

    /**时间秒数转MM:SS */
    public static getMMSSBySecond(second: number) {
        if (second < 0) {
            return '0';
        }
        let mm = Math.floor(second / 60);
        let strmm = mm < 10 ? "0" + mm : "" + mm;
        let ss = second - mm * 60;
        let strss = ss < 10 ? "0" + ss : "" + ss;

        return strmm + ":" + strss;
    };

    /**
     * 转换时间格式
     * @param time 时间(秒)
     * @param type 类型,0:"00:00:00",1:"00小时00分钟00秒",2:"00天00小时",3:"00:00",4:"00小时00分";
     * @return
     **/
    public static changeTimeStr(time: number, type: number = 0): string {
        if (time <= 0) {
            if (type == 0) {
                return "00:00:00";
            } else if (type == 1) {
                return "0";
            } else if (type == 2) {
                if (time == 0) {
                    return "永久";
                } else if (time == -1) {
                    return "已过期";
                }
            } else if (type == 3) {
                return "00:00";
            } else if (type == 4) {
                return "无";
            }
        }

        let thisD: number = Math.floor(time / (3600 * 24));
        let _num: number = type == 1 || type == 2 ? time % (3600 * 24) : time;
        let thisH: number = Math.floor(_num / 3600);
        let thisM: number = Math.floor((_num % 3600) / 60);
        let thisS: number = Math.floor((_num % 3600) % 60);
        let _str: string = "";

        if (thisD > 0 && type != 2) {
            // type = 1;
        }
        if (type == 0) {
            if (thisH < 10) {
                _str += "0" + thisH + ":";
            } else {
                _str += thisH + ":";
            }
            if (thisM < 10) {
                _str += "0" + thisM + ":";
            } else {
                _str += thisM + ":";
            }
            if (thisS < 10) {
                _str += "0" + thisS;
            } else {
                _str += "" + thisS;
            }

        } else if (type == 1) {
            if (thisD > 0) {
                _str = thisD + "天";
            }
            if (thisH > 0) {
                _str += thisH + "小时";
            }
            if (thisM > 0) {
                _str += thisM + "分钟";
            } else if (thisH > 0 && thisS > 0) {
                _str += "零";
            }
            if (thisS > 0) {
                _str += thisS + "秒";
            } else if (thisM > 0) {
                _str += thisS + "秒"
            }
        } else if (type == 2) {
            if (thisD > 0) {
                _str = thisD + "天";
            }
            if (thisH == 0 && thisM > 0) {
                thisH = 1;
            }
            if (thisH >= 0) {
                _str += thisH + "小时";
            }
        } else if (type == 3) {

            thisM = Math.floor(time / 60);
            if (thisM < 10) {
                _str += "0" + thisM + ":";
            } else {
                _str += thisM + ":";
            }
            if (thisS < 10) {
                _str += "0" + thisS;
            } else {
                _str += "" + thisS;
            }
        } else if (type == 4) {
            if (thisH > 0) {
                _str += thisH + "小时";
            }
            if (thisM == 0 && thisS > 0) {
                thisM = 1;
            }
            if (thisM > 0) {
                _str += thisM + "分钟";
            }
        }
        return _str;
    }

    /**
     * 小时-分-秒（24小时制）
     */
    public static formatHour(second: number, sufix: string = ':'): string {
        var ten = (num: number) => num > 9 ? num : '0' + num;
        return ten((second / 3600 | 0) % 24 + 8) + sufix + ten((second / 60 | 0) % 60) + sufix + ten(second % 60);
    }

    /**
     *  获取dataArr 指定数据
     *  key data 成员变量
     *  value 该成员变量的内容
     * **/
    public static getDatabyArr(dataArr: any[], keyid: any, value: any) {
        for (let i = 0; i < dataArr.length; i++) {
            let item = dataArr[i];
            if (item[keyid] && item[keyid] == value) {
                return item;
            }
        }
        return null;
    };

    /**获取字符串数值(K,M,B,T...) */
    public static getGoldnumStringby(goldnum: number) {
        let str = "";
        let changenum = goldnum;
        let chunum = 0;

        let goldStrArr = ["K", "M", "B", "T", "P", "E", "G", "Q", "A", "C", "D", "E", "F", "H", "I",
            "KK", "MM", "BB", "TT", "PP", "EE", "GG", "QQ", "AA", "BB", "CC", "DD", "EE"];

        if (goldnum < Math.pow(10, 4)) {
            str = goldnum + '';
        } else {
            for (let x = 0; x < goldStrArr.length; x++) {
                if (goldnum < Math.pow(10, 7 + 3 * x)) {
                    chunum = Math.pow(10, 3 + 3 * x);
                    str = goldStrArr[x];
                    break;
                }
            }
        }

        if (chunum != 0) {
            changenum = goldnum / chunum;
            let zhenshunum = Math.floor(changenum);
            let zhenshustr = "" + zhenshunum;
            let zhenshulength = zhenshustr.length;

            if (zhenshulength < 4) {
                let addxiaoshunum = 4 - zhenshulength;
                str = changenum.toFixed(addxiaoshunum) + str;
            } else {
                str = zhenshunum + str;
            }
        }
        return str;
    }

    /**
     * 数字转成带单位字符串
     * @param num
     * @param floor
     */
    public static getNumEnStr(num: number, floor: number = 2): string {
        let numConfig = ["K", "M", "B", "T", "P", "E", "G", "Q", "A", "C", "D", "E", "F", "H", "I",
            "KK", "MM", "BB", "TT", "PP", "EE", "GG", "QQ", "AA", "BB", "CC", "DD", "EE"];
        let configCount = numConfig.length;
        let index = 0;
        if (num < 1000000) {
            return num + '';
        }
        let powValue = Math.log(num) / Math.log(1000);
        let intPow = parseInt(powValue + '');
        for (index = 1; index < configCount; index++) {
            let curPowNum = index;
            let curPowNuit = numConfig[index];
            if (intPow == curPowNum) {
                let diff = Math.pow(1000, intPow);
                let match = num / diff;
                if (match % 1 == 0) {
                    return parseInt(num / diff + '') + curPowNuit + '';
                } else {
                    return getDecCount(num / diff) + curPowNuit + '';
                }
            }
        }
        return num + '';

        function getDecCount(num: number): string {
            return num.toFixed(floor);
        }
    }

    /**
     * 深度克隆，建议层级2以上对象拷贝，否则可直接使用Object.assign
     */
    public static deepClone<T>(item: T): T {
        // 非空对象
        if (typeof item === 'object' && item !== null) {
            let copy = <T>(item instanceof Array ? [] : {}), deepClone = ComFun.deepClone;
            for (let i in item) {
                copy[i] = deepClone(item[i]);
            }
            return copy;
        }
        return item;
    }


    public static getLocalTime(type: number = 0): number {
        return Math.floor(new Date().getTime() * (type == 0 ? 0.001 : 1));
    }

    /**判断是否需要每日更新 */
    public static isNeedTimeUpdate(lastTime: number, updateTime?: number) {
        if (updateTime) {
            let cTime = (this.getLocalTime() - lastTime);
            // console.log('时间间隔刷新', cTime);
            return cTime >= updateTime;
        } else {
            let cTime = this.getLocalTime();
            let cDate = new Date(cTime * 1000);
            let lDate = new Date(lastTime * 1000);
            let cDateNum = cDate.getUTCFullYear() * 10000 + cDate.getUTCMonth() * 100 + cDate.getUTCDate();
            let lDateNum = lDate.getUTCFullYear() * 10000 + lDate.getUTCMonth() * 100 + lDate.getUTCDate();
            // cc.log('每日凌点刷新', cDateNum, lDateNum);
            return cDateNum > lDateNum;
        }
    }

    /**弧度转角度 角度=180°×弧度÷π */
    public static radianToAngle(radian: number) {
        return radian / Math.PI * 180;
    }

    /**角度转弧度 弧度=角度×π÷180° */
    public static angleToRadian(angle: number) {
        return angle * Math.PI / 180;
    }

    /**获得下一个0点时间戳(秒) */
    public static getNextZeroTime(time: number) {
        let lDate = new Date(time * 1000);
        let start = new Date(new Date(lDate.toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000);
        return Math.floor(start.getTime() * 0.001);
    }

    /**获得下一个月初0点时间戳(秒) */
    public static getNextMonthZeroTime(time: number) {
        let cDate = new Date(time * 1000);
        let year = cDate.getFullYear();
        let month = cDate.getMonth();
        month++;
        if (month >= 12) {
            year++;
            month = 0;
        }
        cDate.setFullYear(year, month, 1);
        cDate.setHours(0, 0, 0, 0);
        return Math.floor(cDate.getTime() * 0.001);
    }

    /**获得本月初0点时间戳(秒) */
    public static getCurMonthZeroTime(time: number) {
        let cDate = new Date(time * 1000);
        let year = cDate.getFullYear();
        let month = cDate.getMonth();
        cDate.setFullYear(year, month, 1);
        cDate.setHours(0, 0, 0, 0);
        return Math.floor(cDate.getTime() * 0.001);
    }

    /**获得下周初0点时间戳(秒) */
    public static getNextWeekZeroTime(time: number) {
        return this.getCurWeekZeroTime(time) + 7 * 86400;
    }

    /**获得本周初0点时间戳(秒) */
    public static getCurWeekZeroTime(time: number) {
        let cDate = new Date(time * 1000);
        let year = cDate.getFullYear();
        let month = cDate.getMonth();
        let day = cDate.getDate();
        let wDay = cDate.getDay();
        if (wDay == 0) {
            wDay = 7;
        }
        cDate.setFullYear(year, month, day);
        cDate.setHours(0, 0, 0, 0);
        return Math.floor(cDate.getTime() * 0.001) - (wDay - 1) * 86400;
    }

    /***对比版本号*/
    static compareVersion(v1: string, v2: string): number {
        let v1StringArray = v1.split('.')
        let v2StringArray = v2.split('.')
        const len = Math.max(v1StringArray.length, v2StringArray.length)

        while (v1StringArray.length < len) {
            v1StringArray.push('0')
        }
        while (v2StringArray.length < len) {
            v2StringArray.push('0')
        }

        for (let i = 0; i < len; i++) {
            const num1 = parseInt(v1StringArray[i])
            const num2 = parseInt(v2StringArray[i])

            if (num1 > num2) {
                return 1
            } else if (num1 < num2) {
                return -1
            }
        }

        return 0
    }

    /**是否是iPhoneX */
    public static isIPhoneX(): boolean {
        let winSize = view.getVisibleSize();
        let max = Math.max(winSize.height, winSize.width);
        let min = Math.min(winSize.height, winSize.width);
        return max / min > 2;
    }

    /**屏幕宽高比 */
    public static winSizeWHPro() {
        let winSize = view.getVisibleSize();
        let max = Math.max(winSize.height, winSize.width);
        let min = Math.min(winSize.height, winSize.width);
        console.log("屏幕宽高比", max / min);
        return max / min;
    }

    /**生成36为uuid */
    static generateUUID() {
        let s: string[] = [];
        let hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((Number(s[19]) & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";
        let uuid = s.join("");
        return uuid;
    }

    public static sliceStrByNum(str: string, num?: number) {
        if (num && str.length > num) {
            str = str.slice(0, num) + '...';
        }
        return str;
    }

    /**生成随机字符串 */
    static randomString(num: number) {
        num = num || 32;
        var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
            a = t.length,
            n = "";
        for (let i = 0; i < num; i++) n += t.charAt(Math.floor(Math.random() * a));
        return n
    }

    /**
     * 模糊搜索
     * @param search 搜索的字符串
     * @param list 被搜索列表
     * @returns 满足搜索条件下的下标列表
     */
    public static likeSearch(search: string, list: string[]): number[] {
        // 扩展格式，记录下标
        interface IData { m: number, s: number, i?: number };
        var array = <IData[]>[], likeMatch = ComFun.likeMatch, len = list.length, obj: IData;
        while (len--) {
            obj = likeMatch(search, list[len]);
            if (obj.m > 0) {
                obj.i = len;
                array.push(obj);
            }
        }
        // 按匹配数从大到小排序
        return array.sort((a, b) => b.m - a.m || b.s - a.s || a.i! - b.i!).map((v) => v.i!);
    }

    /**
     * 单个字符串的模糊匹配，简易版
     * @param search 搜索的字符串
     * @param value 当前检验值
     * @returns {m:string, s:number} m表示成功匹配的字符数，s表示连续匹配成功的字符数，在同等字符数时，连续越多权重越高
     */
    public static likeMatch(search: string, value: string): { m: number, s: number } {
        var len = search.length, m = 0, start = 0, s = 0, idx: number,
            /**
             * 计算连续相同子串
             */
            series = function (idx0: number, idx1: number) {
                var count = 0, len = Math.min(idx0, idx1);
                while (count <= len && search[idx0 - count] == value[idx1 - count]) count++;
                return count;
            };
        while (m < len && (idx = value.indexOf(search[m], start)) != -1) {
            s = Math.max(s, series(m, idx));
            start = idx + 1;
            m++;
        }
        return { m, s };
    }

    /**
     * 字符串限制，当字符串超过一定长度时，后面加上format
     * @param str 字符串
     * @param len 字节长度
     * @param format 超过限制时添加的后缀
     */
    public static limitStr(str: string, len: number, format: string = ''): string {
        var ret = '', realLen = 0, i = 0, size = str.length;
        while (i < size) {
            realLen++;
            if ((str.charCodeAt(i) & 0xff00) != 0)
                realLen++;
            if (realLen > len) {
                ret += format;
                break;
            }
            else {
                ret += str.charAt(i);
            }
            i++;
        }
        return ret;
    }

    /**
     * 数值限制
     * @param value 当前值
     * @param min 最小值
     * @param max 最大值
     */
    public static limitNum(value: number, min: number, max: number): number {
        return value < min ? min : value > max ? max : value;
    }
    /**
     * 是否全部是数字或字母
     * @param str 
     */
    public static isAllNumberAndLetter(str: string) {
        var reg = /^[A-Za-z0-9]*$/;
        return reg.test(str)
    }
    /**
     * 是否全部是数字或字母
     * @param str 
     */
    public static isAllNumber(str: string) {
        var reg = /^[0-9]*$/;
        return reg.test(str)
    }

    /**
     * 刷新Widget组件，当节点自身尺寸变化时，其子节点的Widget并不会触发更新；该方法不同于updateAlignment，只刷新当前节点；
     * @param node 
     */
    public static refreshWidget(node: Node): void {
        node.getComponent(Widget)?.setDirty();
    }

    /**
     * 测量文本宽
     * @param label 文本组件
     * @param str 默认文本组件当前字符串
     */
    public static measureText(label: Label, str?: string): number {
        var assembler = (<any>label)._assembler;
        return assembler._measureText((<any>label)._assemblerData.context, assembler._getFontDesc())(str || label.string);
    }

    /**
     * 给精灵设置渲染纹理，每次调用会新建一个SpriteFrame，故注意会自动清理之前的渲染纹理
     * @param sprite
     * @param render 
     */
    public static setRenderTexture(sprite: Sprite, render: RenderTexture): void {
        var spf = sprite.spriteFrame;
        if (spf) {
            let old = spf.texture;
            // cc.d.ts写的有点垃圾，RenderTexture是子类确不能被认为是子类
            if (old instanceof RenderTexture) {
                (old as RenderTexture).destroy();
                spf.destroy();
            }
        }
        spf = new SpriteFrame;
        spf.texture = <any>render;
        sprite.spriteFrame = spf;
        // 兼容，且解决翻转问题
        sprite['updateMaterial']();
    }

    /**
     * 将node所处的显示区域映射到标签上，并加入游戏canvas所在的父节点上
     * @param element 标签
     * @param node 节点，提供显示区域
     */
    public static reflect(element: HTMLElement, node: Node): void {
        // 这里使用canvas的父节点，而不用body，因为预览模式下，canvas尺寸不一定等于body尺寸
        var parent = game.canvas!.parentNode! as HTMLDivElement, style = element.style, trans = node.getComponent(UITransform)!,
            round = Math.round, wPos = node.worldPosition, wScale = node.worldScale, scale = parent.clientWidth / view.getVisibleSize().width/* 游戏尺寸比例 */,
            rWidth = wScale.x * trans.width, rHeight = wScale.y * trans.height, unit = 'px';
        style.position = 'absolute';
        style.left = round((wPos.x - rWidth * trans.anchorX) * scale) + unit;
        style.top = parent.clientHeight - round((wPos.y + (1 - trans.anchorY) * rHeight) * scale) + unit;
        style.width = round(rWidth * scale) + unit;
        style.height = round(rHeight * scale) + unit;
        parent.appendChild(element);
    }

    /**
     * 
     * @param dropNode 掉落的节点
     * @param time 时间
     * @param height 高度
     */
    public static AniDrop(dropNode: Node, time: number = 0.3, height: number = 1) {
        tween(dropNode)
            .by(time, { position: new Vec3(0, -height, 0) }, { easing: "backOut" })
            .start()
    }

    /**
     * 加载远程图片资源
     * @param url 
     * @returns 
     */
    public static loadRemoteRes(url: string): Promise<SpriteFrame | undefined> {
        return new Promise<SpriteFrame | undefined>(function (resolve) {
            if (url) {
                let spfCache = ComFun._spfCache
                let spf: SpriteFrame | undefined = spfCache[url];
                if (spf) {
                    // 是否销毁
                    if (spf.texture) {
                        resolve(spf);
                        return;
                    }
                    delete spfCache[url];
                }
                // 加载
                assetManager.loadRemote(url, { ext: '.jpg' }, function (_, img: ImageAsset) {
                    if (img) {
                        // 防止连续调起两次加载
                        spf = spfCache[url];
                        if (!spf) {
                            ((spf = new SpriteFrame).texture = new Texture2D).image = img;
                            spfCache[url] = spf;
                        }
                    }
                    else {
                        spf = undefined;
                    }
                    resolve(spf);
                });
            }
            else {
                resolve(undefined);
            }
        });
    }

    /**
     * 设置精灵框架
     * @param sprite 
     * @param url 
     */
    public static setSpriteRemote(sprite: Sprite, url: string, limit?: { width: number, height: number }): void {
        var attr = '__url';
        (<any>sprite)[attr] = url;
        // 先清空
        sprite.spriteFrame = null;
        if (url) {
            ComFun.loadRemoteRes(url).then(function (spf: SpriteFrame | undefined) {
                if ((<any>sprite)[attr] == url && sprite.isValid && spf) {
                    if (limit) {
                        ComFun.limitSpriteSize(sprite, spf, limit.width, limit.height);
                    }
                    else {
                        sprite.spriteFrame = spf;
                    }
                }
            });
        }
    }

    /**
     * 限制精灵的最大尺寸——CUSTOM模式
     * @param sp 精灵
     * @param spf 精灵框架
     * @param maxWidth 限制宽
     * @param maxHeight 限制高
     */
    public static limitSpriteSize(sp: Sprite, spf: SpriteFrame, maxWidth: number, maxHeight: number): void {
        var { width, height } = spf, scale = Math.min(maxWidth / width, maxHeight / height, 1), round = Math.round;
        sp.spriteFrame = spf;
        sp.getComponent(UITransform)?.setContentSize(round(width * scale), round(height * scale));
    }

    /**
     * 
     * @param valueFrom 初始值
     * @param valueTo 目标值
     * @param radio 混合度
     * @returns 
     */
    public static getStepValue(valueFrom: number[], valueTo: number[], radio: number) {
        let res = []

        if (valueFrom.length != valueTo.length) {
            console.error("数据长度不一致")
        } else {
            for (let index = 0; index < valueFrom.length; index++) {
                // const element = array[index];  
                // const element = array[index];
                res[index] = lerp(valueFrom[index], valueTo[index], radio)
            }
        }

        return res as number[]
    }

    /**
     * 检测检测是否存在于舞台
     * @param node 
     */
    public static checkIsShow(node: Node): boolean {
        if (node == <any>director.getScene()) {
            return true;
        }
        var parent = node.parent;
        if (parent && node.active) {
            return ComFun.checkIsShow(parent);
        }
        return false;
    }

    /**
     * 检测点是否在节点上
     * @param vec 
     * @param node 
     */
    public static pointInNode(vec: { x: number, y: number }, node: Node): boolean {
        var trans = node.getComponent(UITransform);
        return trans ? trans.isHit(<any>vec) : false;
    }

    /**
     * 通过名称查找子孙节点
     * @param root 根节点
     * @param name 名称
     * @param cond 除名称外其他对节点的限制条件判定函数
     */
    public static getChildByName(root: Node, name: string, cond?: (node: Node) => boolean): Node | null {
        var child = root.children, len = child.length, getcbn = ComFun.getChildByName;
        cond || (cond = function () { return true });
        while (len--) {
            let item = child[len], plane = item.name == name && cond(item) ? item : getcbn(item, name, cond);
            if (plane) {
                return plane;
            }
        }
        return null;
    }

    /**
     * 获取绝对值的最大值
     * @param params 
     */
    public static getAbsMax(...params: number[]): number {
        return Math.max(...params.map((v) => Math.abs(v)));
    }

    /**
     * 设置对象的属性——主要用于像节点的属性需要改完后再重新赋值
     * @param obj 对象
     * @param name 属性名
     * @param value 修改值
     */
    public static setObjectAttr<T, Z extends keyof T>(obj: T, name: Z, value: Partial<T[Z]>): T[Z] | null {
        if (name in obj) {
            if (typeof value === 'object') {
                let obj2 = obj[name];
                for (let i in value) {
                    (<any>obj2)[i] = value[i];
                }
                obj[name] = obj2;
            }
            else {
                obj[name] = value;
            }
            return obj[name];
        }
        return null;
    }

    /**
     * 设置节点坐标
     * @param node 
     * @param move 
     */
    public static setNodePos(node: Node, move: { x?: number, y?: number, z?: number }) {
        return ComFun.setObjectAttr(node, 'position', move);
    }

    /**
     * 获取对象上存在该值的属性名称
     * @param obj 
     * @param value 
     */
    public static getKeyName(obj: any, value: any): string {
        if (obj) {
            let keys = Object.keys(obj), name = keys[keys.findIndex((v) => obj[v] === value)];
            return name || ComFun.getKeyName(obj.__proto__, value);
        }
        return ''
    }

    /**
     * 给节点添加组件内部函数的点击事件；会自动调用或绑定Button；统一用click监听；
     * @param node 节点，唯一用处是提供Button组件
     * @param call 回调 
     * @param comp 回调所属对象
     */
    public static addClick(node: Node, call: (button: Button) => void, comp?: any): void {
        node.getComponent(Button) || node.addComponent(Button)
        node.on('click', call, comp);
    }

    /**
     * 移除监听，一般不用，节点回收会自动移除，也可以用node.off或targetOff（comp是组件的话）
     * @param node 节点
     * @param call 回调 
     * @param comp 回调所属对象
     */
    public static delClick(node: Node, call: Function, comp?: any): void {
        node.off('click', call, comp);
    }

    /**
     * 将脚本的回调转为EventHandler
     * @param comp 
     * @param call 
     */
    public static getEventHandler(comp: Component, call: Function): EventHandler {
        var handler = new EventHandler;
        handler.target = comp.node;
        handler.component = (<any>comp)['__classname__'];
        handler.handler = ComFun.getFunctionName(call, comp);
        return handler;
    }

    /**
     * 获取函数名——建议非内部函数勿扰
     * @param call 
     * @param caller 函数所属对象，空勿扰
     */
    public static getFunctionName(call: Function, caller: any): string {
        var cache = '$name', name = (<any>call)[cache] || call.name;
        if (caller[name] != call) {
            name = ComFun.getObjKeys(caller).find((v) => caller[v] == call) || name;
            name && ((<any>call)[cache] = name);
        }
        return name;
    }

    /**
     * 获取对象上所有属性名，包含原型链
     * @param obj 
     */
    public static getObjKeys(obj: any, arr: string[] = []): string[] {
        if (obj) {
            arr.push(...Object.keys(obj));
            ComFun.getObjKeys(obj['__proto__'], arr);
        }
        return arr;
    }

    /**
     * 置灰节点及其子节点
     * @param node 
     * @returns 恢复用信息
     */
    public static setNodeGray(node: Node): void {
        var grayAttr = ComFun._grayAttr;
        if (!(<any>node)[grayAttr]) {
            let arr = node.getComponentsInChildren(UIRenderer), render = node.getComponent(UIRenderer), grayMat = ComFun._grayMat, oTypes = [];
            if (render) {
                arr.unshift(render);
            }
            // 过滤掉部分类型
            for (let i = arr.length - 1; i >= 0; i--) {
                let item = arr[i];
                if (item instanceof Mask || (<any>item)[grayMat] == 2) {
                    arr.splice(i, 1);
                }
                else {
                    oTypes.unshift((<any>item)[grayMat]);
                    (<any>item)[grayMat] = 2;
                    item['updateMaterial']();
                }
            }
            (<any>node)[grayAttr] = [arr, oTypes];
        }
    }

    /**
     * 取消置灰——只有经过置灰的节点才有效
     * @param node 
     */
    public static cancelNodeGray(node: Node): void {
        var grayAttr = ComFun._grayAttr, info = (<any>node)[grayAttr] as [UIRenderer[], number[]];
        if (info) {
            let grayMat = ComFun._grayMat;
            delete (<any>node)[grayAttr];
            info[0].forEach((v, i) => {
                (<any>v)[grayMat] = info[1][i];
                v['updateMaterial']();
            });
        }
    }

    /**
     * 往自己及父节点方向寻找脚本
     * @param node 
     * @param comp 
     */
    public static getRootCompont<T extends Component>(node: Node, comp: new (...args: any[]) => T): T | null {
        var base: T;
        while (node) {
            base = node.getComponent(comp)!;
            if (base) {
                return base;
            }
            node = node.parent!;
        }
        return null
    }

    //// 格式分析 ////

    /**
     * 获取后缀，，不含'.'
     * @param url 
     */
    public static getSuffix(url: string): string {
        var idx = url.lastIndexOf('.');
        return idx == -1 ? '' : url.substring(idx + 1).toLowerCase();
    }

    /**
     * 判断是否是图片路径
     * @param url 
     */
    public static isImageUrl(url: string): boolean {
        return ComFun._imageSuf.has(ComFun.getSuffix(url));
    }

    /**
     * 判断是否是视频路径
     * @param url 
     */
    public static isVideoUrl(url: string): boolean {
        return ComFun._videoSuf.has(ComFun.getSuffix(url));
    }

    /**
     * 判断是否是音频路径
     * @param url 
     */
    public static isAudioUrl(url: string): boolean {
        return ComFun._audioSuf.has(ComFun.getSuffix(url));
    }

    /**
     * 判断是否是文档文件
     * @param url 
     */
    public static isFileUrl(url: string): boolean {
        return ComFun._fileSuf.has(ComFun.getSuffix(url));
    }

    /**
     * 判断是否是压缩包文件
     * @param url 
     */
    public static isZIP(url: string): boolean {
        return ComFun._zipSuf.has(ComFun.getSuffix(url));
    }

    //// 模型 ////

    /**
     * 获取模型最值坐标
     * @param node 
     * @returns 
     */
    public static getMMPosition(node: Node, outMin: Vec3 = _vec30, outMax: Vec3 = _vec31): [Vec3, Vec3] {
        var minX = 1e9, minY = minX, minZ = minX, maxX = -minX, maxY = maxX, maxZ = maxX, min = Math.min, max = Math.max, tmpNode = ComFun._tmpNode, state = 0, vec3: Vec3;
        node.getComponents(MeshRenderer).concat(node.getComponentsInChildren(MeshRenderer)).forEach((v) => {
            let { minPosition, maxPosition } = v.mesh!.struct;
            tmpNode.parent = v.node;
            if (minPosition) {
                // 获取缩放后的实际坐标
                tmpNode.position = minPosition;
                vec3 = tmpNode.worldPosition;
                minX = min(minX, vec3.x);
                minY = min(minY, vec3.y);
                minZ = min(minZ, vec3.z);
                state |= 1;
            }
            if (maxPosition) {
                // 获取缩放后的实际坐标
                tmpNode.position = maxPosition;
                vec3 = tmpNode.worldPosition;
                maxX = max(maxX, vec3.x);
                maxY = max(maxY, vec3.y);
                maxZ = max(maxZ, vec3.z);
                state |= 2;
            }
        });
        tmpNode.parent = null;
        return state == 3/* 最小最大值皆有 */ ? [outMin.set(minX, minY, minZ), outMax.set(maxX, maxY, maxZ)] : [outMin.set(), outMax.set()];
    }

    /**
     * 获取当前模型的渲染器对应的材质列表
     * @param node 
     * @returns [渲染器、使用材质列表]
     */
    public static getMaterials(node: Node) {
        var mm = <[MeshRenderer, (renderer.MaterialInstance | null)[]][]>[];
        node.getComponents(MeshRenderer).concat(node.getComponentsInChildren(MeshRenderer)).forEach((m) => {
            mm.push([m, m.materials!]);
        });
        return mm;
    }

    /**
     * 约束模型尺寸
     * @param limit 
     */
    public static limitModelSize(model: Node, limit: number): void {
        if (limit > 0) {
            ComFun.getMMPosition(model, _vec30, _vec31);
            let width = _vec31.x - _vec30.x, height = _vec31.z - _vec30.z, abs = Math.abs, scale = Math.min(abs(limit / width), abs(limit / height), 1);
            // 偏移
            model.position = _vec30.set(-(_vec30.x + _vec31.x) / 2 * scale, -_vec30.y * scale, -(_vec30.z + _vec31.z) / 2 * scale);
            if (scale != 1) {
                model.scale = model.scale.multiplyScalar(Math.abs(scale));
            }
        }
    }

    /**
     * 获取渲染组件是否在屏幕内
     * @param plane 
     * @param camera 
     */
    public static inViewport(plane: MeshRenderer, camera: Camera): boolean {
        var aabb = plane.model!.worldBounds;
        return aabb ? ComFun.aabbInViewport(aabb, camera, plane) : false;
    }

    /**
     * 检测包围盒是否在屏幕内
     * @param aabb 包围盒
     * @param camera 
     */
    public static aabbInViewport(aabb: geometry.AABB, camera: Camera, plane: MeshRenderer): boolean {
        var center = aabb.center, half = aabb.halfExtents, idx = 0;
        [[1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]].forEach((v) => {
            _vec6[idx++].set(center).add3f(v[0] * half.x, v[1] * half.y, v[2] * half.z);
        });
        for (let i = 0, pInV = ComFun.pointInViewport; i < idx; i++) {
            if (pInV(_vec6[i], camera)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检测世界点是否在屏幕内
     * @param point 世界点
     * @param camera 
     */
    public static pointInViewport(point: Vec3, camera: Camera): boolean {
        camera.worldToScreen(point, _vec30);
        if (_vec30.z >= 0) {
            let { x, y } = camera.worldToScreen(point, _vec30), rect = view.getViewportRect(), sub = 20;
            return x > -sub && x < rect.width + sub && y > -sub && y < rect.height + sub;
        }
        return false;
    }

    /**
     * 复制文本到剪贴板
     * @param str 
     */
    public static async webCopyString(str: string): Promise<boolean> {
        let bool = false;
        if (str) {

            try {
                await navigator.clipboard.writeText(str).then(() => bool = true).catch(() => bool = false);
            }
            catch (error) {
                let textarea = document.createElement('textarea');
                textarea.value = str;
                textarea.readOnly = true;
                textarea.style.position = 'absolute';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.selectionStart = 0;
                textarea.selectionEnd = str.length;
                document.execCommand('copy')
                document.body.removeChild(textarea);
                bool = true;
            }
        }
        return bool;
    }

    //// 通用标记处理 ////

    /**
     * 数字数组转字符串
     * @param nums 
     */
    public static numsToStr(nums: number[]): string {
        return nums.join('_');
    }

    /**
     * 字符互传转数字数组
     * @param str 
     */
    public static strToNums(str: string): number[] {
        return str.split('_').map((v) => +v);
    }

    /**
     * 向量坐标转数字数组
     * @param vec 
     */
    public static vecToNums(vec: { x?: number, y?: number, z?: number, w?: number }): number[] {
        var arr: number[] = [], round = Math.round;
        ['x', 'y', 'z', 'w'].forEach((attr) => {
            if (attr in vec) {
                arr.push(round((<any>vec)[attr] + 0.0000005)); // 防精度丢失
            }
        });
        return arr;
    }

    /**
     * 向量坐标转字符串
     * @param vec 
     * @returns 
     */
    public static vecToStr(vec: { x?: number, y?: number, z?: number, w?: number }): string {
        return ComFun.numsToStr(ComFun.vecToNums(vec));
    }

    //// 数组操作 ////

    /**
     * 移除数组子项
     * @param arr 
     * @param item 
     */
    public static removeItem<T>(arr: T[], item: T): void {
        var idx = arr.indexOf(item);
        if (idx != -1) {
            arr.splice(idx, 1);
        }
    }

    /**更新所有节点以及所有子节点的尺寸 */
    // static async updateAlignmentWithChildren(newSize: Size, transform: UITransform, externLimit?: {
    //     addSize?: Size,
    //     minSize?:Size
    // }) {
    //     await TimeUtil.waitFrame();
    //     // console.error("refreshSize",this._contentTransform.contentSize.width,this._contentTransform.contentSize.height);
    //     let addSize =externLimit?.addSize|| Size.ZERO;
    //     let minSize = externLimit?.minSize || Size.ZERO;

    //     let w = newSize.width + addSize.width;
    //     let h = newSize.height + addSize.height;
    //     w = w > minSize.width ? w : minSize.width;
    //     h = h > minSize.height ? h : minSize.height;
    //     transform.setContentSize(w, h);
    //     let refreshWidget = (parentNode: Node) => {
    //         if (!parentNode || parentNode.children.length <= 0) {
    //             return;
    //         }
    //         parentNode.getComponentsInChildren(Widget).forEach(async v => {
    //             v.updateAlignment();
    //             await TimeUtil.waitFrame();
    //             refreshWidget(v.node);
    //         } );
    //     }
    //     refreshWidget(transform.node);

    // }

    static scaleArrayValue(array: number[], scale: number = 1) {
        let newArray = [];
        if (scale != 1) {
            for (let index = 0; index < array.length; index++) {
                newArray[index] = array[index] * scale;
            }
        }
        return newArray;
    }
    /**创建一个3d场景中的texture2d，添加了贴图的过滤设置 */
    static create3dTexture(img?: ImageAsset) {
        let texture = new Texture2D();
        texture.setMipFilter(Texture2D.Filter.LINEAR);
        texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        img && (texture.image = img);
        return texture;
    }

    /** 校验手机号有效性 */
    public static checkPhoneAvailable(phone: string) {
        let reg = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
        if (phone === "" || !reg.test(phone)) {
            return false;
        }
        return true
    }

    //// 新版——面片尺寸功能 ////

    /**
     * 记录面片的当前尺寸
     * @param mesh 
     */
    public static recordPlaneSize(mesh: MeshRenderer): void {
        var node = mesh.node as IPlaneNode;
        if (node.isValid) {
            (node.$ltScale || (node.$ltScale = v3())).set(node.worldScale);
            ComFun.limitPlaneSize(mesh, mesh.material?.getProperty('mainTexture') as Texture2D);
        }
    }

    /**
     * 设置纹理并限制面片的尺寸（缩放比）
     * @param mesh 
     * @param texture 
     */
    public static limitPlaneSize(mesh: MeshRenderer, texture: Texture2D): void {
        var node = mesh.node as IPlaneNode;
        if (node.isValid) {
            mesh.material!.setProperty('mainTexture', texture);
            // if (texture) {
            //     let { width, height } = texture, vec3 = _vec30.set(node.$ltScale || (node.$ltScale = node.worldScale.clone())),
            //         scale0 = height / width, scale1 = vec3.z / vec3.x;
            //     // 纹理高度大，缩放宽
            //     if (scale0 > scale1) {
            //         vec3.x *= scale1 / scale0;
            //     }
            //     // 纹理宽度大，缩放高
            //     if (scale1 > scale0) {
            //         vec3.z *= scale0 / scale1;
            //     }
            //     node.worldScale = vec3;
            // }
        }
    }

    /**
     * KV数组转map，自带清理
     * @param array 
     * @param map 
     */
    public static kvArrayToMap<K, V>(array: [K, V][], map: Map<K, V>): void {
        map.clear();
        if (array) {
            for (let kv of array) {
                map.set(kv[0], kv[1]);
            }
        }
    }
}
