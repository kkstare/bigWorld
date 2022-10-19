import { Component, EventTouch, misc, Node, Tween, tween, Vec2, Vec3, _decorator } from 'cc';
import { CameraCtrl } from './CameraCtrl';
const { ccclass, property } = _decorator;



const maxDis: number = 80


const v2_1: Vec2 = new Vec2();
const v2_2: Vec2 = new Vec2();
const v2_3: Vec2 = new Vec2(maxDis, maxDis);

const v3_1: Vec3 = new Vec3()
let tween_1: Tween<Node> = null!

@ccclass('Joystick')
export class Joystick extends Component {

    @property(Node)
    bgNode!: Node

    @property(Node)
    touchNode!: Node

    @property(Node)
    moveNode!: Node

    @property(Node)
    playerNode!: Node

    touchPos: Vec2 = null!

    start() {
        this.touchNode.on(Node.EventType.TOUCH_START, this._onTouchStart, this)
        this.touchNode.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this)
        this.touchNode.on(Node.EventType.TOUCH_END, this._onTouchEnd, this)
        this.touchNode.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this)
    }

    private _onTouchStart() {
        tween_1?.stop()
    }

    private _onTouchMove(event: EventTouch) {
        event.getUILocation(v2_1);
        v2_2.set(this.touchNode.worldPosition.x, this.touchNode.worldPosition.y)
        v2_1.subtract(v2_2)
        if (v2_1.length() == 0) {
            return;
        }

        let dPos = v2_1.length() > maxDis ? v2_1.normalize().multiplyScalar(maxDis) : v2_1;
        // console.log(dPos)
        // let tanValue = dPos.y / dPos.x
        // let angl = Math.atan(tanValue) * 180 / Math.PI
        let angl = Math.atan2(dPos.y, dPos.x) * 180 / Math.PI - 90

        this.bgNode.angle = angl
        dPos = dPos.divide(v2_3)
        this.touchPos = dPos
    }

    private _onTouchEnd() {
        if (!tween_1) {
            // console.log("no tween")
            tween_1 = tween(this.moveNode)
                .to(0.1, { position: Vec3.ZERO })
        }

        tween_1.start()
        this.onEnd?.()

        this.touchPos = null!
    }
    onMove(v2: Vec2) {
        let rotate = new Vec3(v2.x, 0, -v2.y).negative()
        let rotY = misc.radiansToDegrees(new Vec2(rotate.x, rotate.z).signAngle(new Vec2(0, -1)));
        this.playerNode.eulerAngles = new Vec3(0, rotY, 0);


        let v3 = CameraCtrl.ins.uiOffsetTo3d(v2)

        this.playerNode.setWorldPosition(this.playerNode.worldPosition.add(v3.multiplyScalar(0.1)))
    }
    onEnd() {

    }

    update() {
        if (!this.touchPos) {
            return
        }
        v3_1.set(this.touchPos.x * maxDis, this.touchPos.y * maxDis, 0)
        this.moveNode.setPosition(v3_1)
        this.onMove(this.touchPos)
    }

}

