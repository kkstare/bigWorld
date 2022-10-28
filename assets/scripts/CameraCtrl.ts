import { Camera, Component, EventMouse, EventTouch, game, geometry, input, Input, Node, PhysicsSystem, tween, Vec2, Vec3, _decorator } from 'cc';
import ComFun from './ComFun';

const { ccclass, property } = _decorator;

const outRay: geometry.Ray = new geometry.Ray;



const v3_1: Vec3 = new Vec3();
const v3_2: Vec3 = new Vec3();

const v2_1: Vec2 = new Vec2();
const v2_2: Vec2 = new Vec2()


const v2_3: Vec2 = new Vec2()
const v2_4: Vec2 = new Vec2()

const maxCameraScale: number = 3
const minCameraScale: number = 0.2

const minPitchAngle: number = -180
const maxPitchAngle: number = 180

// TO
@ccclass('CameraCtrl')
export class CameraCtrl extends Component {


    private static _ins: CameraCtrl;
    public static get ins(): CameraCtrl {
        return CameraCtrl._ins;
    }


    /** 相机的初始位置 */
    private initPos!: Vec3

    /** 摄像机距离焦点的距离 */
    private _cameraScale: number = 1

    @property()
    minScale: number = 0.2;
    @property()
    maxScale: number = 2;

    @property()
    minPitchAngle: number = 1;
    @property()
    maxPitchAngle: number = 50;

    @property(Node)
    focus!: Node;

    @property(Node)
    follow!: Node;

    @property(Node)
    camera!: Node
    @property(Node)
    cameraParent!: Node

    onLoad() {
        CameraCtrl._ins = this
        this.initPos = this.camera.position.clone()
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this)
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this)
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this)
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this)

        input.on(Input.EventType.MOUSE_WHEEL, this._onScroll, this)
    }


    public changeView() {


    }


    private _onTouchStart(event: EventTouch) {
        // if (event) {
        this.rayCheck(event, 2)
        // }
    }

    private oldTouchDis: number = -1

    private _onTouchMove(event: EventTouch) {

        let touches = event.getTouches();
        if (touches.length == 1) {
            v2_2.set(event.getDelta())
            let rotateDelta = event!.getDelta(v2_1);
            if (rotateDelta.length() > 1) {
                this._rotateByCenter(v3_1.set(rotateDelta.y * 0.5, -rotateDelta.x));
            }
        } else {

            let v2_3 = touches[0].getLocation()
            let v2_4 = touches[1]?.getLocation()
            // let v2_4 = Vec2.ZERO

            let touchDis = v2_3.subtract(v2_4).length()
            if (this.oldTouchDis == touchDis) {

                //多点触控 会多次触发 直接这样暴力判断是不是二次执行
                return
            }
            console.log(this.oldTouchDis)
            if (touchDis > this.oldTouchDis) {
                this._onTouch(-1)
            } else {
                this._onTouch(1)
            }
            this.oldTouchDis = touchDis
        }

    }

    private _onTouchEnd() {
    }

    private _onTouchCancel() {
    }

    private async rayCheck(event: EventTouch, type: number) {
        // console.log(event)
        // console.log(v2_2)
        var pos = event.getLocation(v2_2);
        this.camera.getComponent(Camera)!.screenPointToRay(pos.x, pos.y, outRay);
        PhysicsSystem.instance.raycast(outRay);
        // 检测碰撞结果

        let isClick = false
        // for (let res = PhysicsSystem.instance.raycastResults, index = 0, len = res.length; index < len; index++) {
        //     let ri = res[index]
        //     let collider = res[index].collider;
        //     if (isClick) {
        //         return
        //     }
        //     if (type == 2 && collider.node.name == "other") {
        //         console.log(collider!.node!.getComponent(PlayerRenderer)?.options)
        //         let uid = collider!.node!.getComponent(PlayerRenderer)?.options.initState.id
        //         console.log("点击了", uid)

        //         if (uid) {
        //             isClick = true
        //             let win = await UIUtil.showWindow("CardDetailUI")
        //             let data = await Global.getCardData(uid)
        //             win.getComponent(CardDetailView)?.reOpen(data.res!)
        //         }

        //     }
        // }
    }


    //pc端滚轮触发缩放
    private _onScroll(event: EventMouse) {
        let dis = event.getScrollY()

        //PC端测试 下滑为-500，上滑为500，与滑动速度无关
        //TODO 需要测试Mac电脑 避免出现与用户手势相反的情况
        // let distanceLength = this.options.maxScale - this.options.minScale
        // console.log(this.options.maxScale, this.options.minScale)
        // let addValue = distanceLength / 30

        this._cameraScale += dis < 0 ? -0.1 : 0.1
        this._cameraScale = Math.min(Math.max(this.minScale, this._cameraScale), this.maxScale);
        this._setCameraDis(this._cameraScale)
    }

    //双指触发缩放
    //TODO @kkstare
    private _onTouch(dis: number) {
        this._cameraScale += dis < 0 ? -0.1 : 0.1
        this._cameraScale = Math.min(Math.max(this.minScale, this._cameraScale), this.maxScale);
        this._setCameraDis(this._cameraScale)
    }

    private _onOptionChange() {
        tween(this.cameraParent)
            .to(1, { worldPosition: this.focus.worldPosition })
            .start()
    }

    //饶点旋转 主要用于镜头旋转
    private _rotateByCenter(addVec3: Vec3) {
        let vec3 = this.cameraParent.eulerAngles, mEv = v3_2.set(vec3).add(addVec3.multiplyScalar(3));

        //由于业务层 负角度是朝上看，而当节点角度为负时,实际效果为俯视，故在此处对其反操作
        let minPitchAngle = this.maxPitchAngle ? -this.maxPitchAngle - this.camera.eulerAngles.x : 180
        let maxPitchAngle = this.minPitchAngle ? -this.minPitchAngle - this.camera.eulerAngles.x : -180

        // console.log(maxPitchAngle, minPitchAngle)

        mEv.x = Math.min(Math.max(minPitchAngle, mEv.x), maxPitchAngle);

        game.emit("cameraDirty")
        this.cameraParent.eulerAngles = vec3.lerp(mEv, 0.1);
    }

    /**设置摄像机的高度距离 */
    //TODO @kkstare
    private _setCameraDis(dis: number) {
        console.log(this._cameraScale)
        this.camera.position = this.initPos.clone().multiplyScalar(this._cameraScale)
    }

    // update(deltaTime: number) {
    //     if (!this.options) {
    //         return;
    //     }
    //     if (this.options.focus) {

    //     }
    //     // return
    //     if (this.options.follow) {
    //         let tPos = this.options.follow.worldPosition
    //         tPos = new Vec3(tPos.x, Number(tPos.y.toFixed(2)), tPos.z)
    //         let dist = v3_2.set(tPos).subtract(this.cameraParent.worldPosition).length();
    //         console.log(dist)
    //         if (dist > 0.05) {
    //             this.cameraParent.worldPosition = dist < .05 ? tPos : Vec3.lerp(v3_2, this.cameraParent.worldPosition, tPos, 0.5);
    //             // this.cameraParent.worldPosition = Vec3.lerp(v3_2, this.cameraParent.worldPosition, tPos, 0.5);

    //         }
    //     }
    // }

    lateUpdate() {

        if (this.focus) {

        }
        // return
        if (this.follow) {
            let tPos = this.follow.worldPosition
            tPos = new Vec3(tPos.x, Number(tPos.y.toFixed(2)), tPos.z)
            let dist = v3_2.set(tPos).subtract(this.cameraParent.worldPosition).length();
            // console.log(dist)
            if (dist > 0.02) {
                this.cameraParent.worldPosition = tPos
                // this.cameraParent.worldPosition = dist < .05 ? tPos : Vec3.lerp(v3_2, this.cameraParent.worldPosition, tPos, 0.5);
                // this.cameraParent.worldPosition = Vec3.lerp(v3_2, this.cameraParent.worldPosition, tPos, 0.5);

            }
        }
    }

    /** 将平面旋转转换到摄像机对应角度 */
    uiOffsetTo3d(offset: { x: number, y: number }, up?: Vec3, camera?: Node): Vec3 {
        let v3: Vec3 = new Vec3()
        if (!up) {
            up = Vec3.UP
        }
        if (!camera) {
            camera = this.cameraParent
        }

        // v3.set(-offset.x, 0, offset.y)
        v3.set(offset.x, 0, -offset.y)

        Vec3.rotateY(v3, v3, up, ComFun.angleToRadian(camera.eulerAngles.y));

        return v3
    }


}

