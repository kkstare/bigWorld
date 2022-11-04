import { Component, MeshRenderer, Texture2D, _decorator } from 'cc';
import ComFun from '../scripts/ComFun';
import { PlaneMgr } from './PlaneMgr';
import { TexMgr } from './TexMgr';
const { ccclass, property } = _decorator;

@ccclass('Plane')
export class Plane extends Component {
    index: number

    //2S检测一次镜头变化
    updateTime: number = 2
    addTime: number = 0

    private isShow: boolean
    start() {

    }

    async init(index: number) {
        this.index = index
    }

    async showTex() {

        this.hideTex()

        let tex = await TexMgr.loadTexture("bg" + (this.index + 1))
        this.node.getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", tex)
    }
    hideTex() {
        let tex: Texture2D = this.node.getComponent(MeshRenderer).getMaterialInstance(0).getProperty("mainTexture") as Texture2D
        TexMgr.releaseTex(tex)
        this.node.getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", null)
    }


    checkShow(): boolean {
        let isIn = ComFun.inViewport(this.node.getComponent(MeshRenderer), PlaneMgr.ins.camera)

        if (this.isShow == isIn) {
            return isIn;
        }
        this.isShow = isIn

        if (this.isShow) {
            this.showTex()
        } else {
            this.hideTex()
        }
        return isIn;
    }
    // update(deltaTime: number) {
    //     this.addTime += deltaTime
    //     if (this.addTime > this.updateTime) {
    //         this.addTime = 0
    //         this.checkShow()
    //     }

    // }
}

