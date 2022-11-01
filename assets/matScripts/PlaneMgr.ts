import { Camera, Component, game, instantiate, Node, Vec3, _decorator } from 'cc';
import { Plane } from './Plane';
const { ccclass, property } = _decorator;

@ccclass('PlaneMgr')
export class PlaneMgr extends Component {

    private static _ins: PlaneMgr;
    public static get ins(): PlaneMgr {
        return PlaneMgr._ins;
    }


    @property(Node)
    planeParent!: Node;

    @property(Camera)
    camera!: Camera

    cameraDirty: boolean = false

    //2S检测一次镜头变化
    updateTime: number = 2

    addTime: number = 0

    dirtyPlane: Record<number, Node> = {}

    onLoad() {
        PlaneMgr._ins = this
        // game.on(PipelineEventType.RENDER_FRAME_END, this.checkShow, this)
        // director.on(PipelineEventType.RENDER_FRAME_END, this.checkShow, this)
        // this.camera.node.on(PipelineEventType.RENDER_FRAME_END, this.checkShow, this)
        // director.root.pipeline.on(PipelineEventType.RENDER_CAMERA_END, this.checkShow, this)

        game.on("cameraDirty", () => {
            this.cameraDirty = true
        })
        this.initPlanes()

    }

    async start() {
        let children = this.planeParent.children
        for (let index = 0; index < children.length; index++) {
            children[index].getComponent(Plane).init(index)
        }
    }


    initPlanes() {
        let baseNode = this.planeParent.children[0]
        const dis = Math.sqrt(baseNode.position.x * baseNode.position.x + baseNode.position.z * baseNode.position.z)

        for (let index = 0; index < 16; index++) {
            // const element = array[index];
            let node = instantiate(baseNode)
            node.parent = this.planeParent

            let moveAngele = 360 / 16
            let realAngle = moveAngele * (index + 1)
            let tempAngele = node.eulerAngles.clone()
            tempAngele.y -= realAngle
            node.eulerAngles = tempAngele

            let x = dis * Math.cos(2 * Math.PI * realAngle / 360)
            let z = dis * Math.sin(2 * Math.PI * realAngle / 360)

            node.position = new Vec3(x, baseNode.position.y, z)
        }
    }

    // randDel() {
    //     let randIndex = Math.floor(Math.random() * 5)

    //     let tex: Texture2D = this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).getProperty("mainTexture") as Texture2D
    //     console.log(tex)

    //     TexMgr.releaseTex(tex)
    //     this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", null)
    // }

    // async randUp() {
    //     let randIndex = Math.floor(Math.random() * 5)
    //     let randTexId = Math.floor(Math.random() * 5) + 1


    //     let tex = await TexMgr.loadTexture("bg" + (randTexId))

    //     let oldTex: Texture2D = this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).getProperty("mainTexture") as Texture2D
    //     TexMgr.releaseTex(oldTex)
    //     this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", tex)

    // }

    checkShow() {
        let children = this.planeParent.children, indexs = []
        for (let index = 0; index < children.length; index++) {
            let isIn = children[index].getComponent(Plane).checkShow()
            isIn && indexs.push(index);
        }
        console.log(indexs);
    }

    update(dt: number) {
        this.addTime += dt
        if (this.addTime > this.updateTime) {
            this.addTime = 0
            this.checkShow()
        }

    }

}

