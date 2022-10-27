import { Component, MeshRenderer, Node, Texture2D, _decorator } from 'cc';
import { TexMgr } from './TexMgr';
const { ccclass, property } = _decorator;

@ccclass('PlaneMgr')
export class PlaneMgr extends Component {
    @property(Node)
    planeParent!: Node;

    async start() {
        // let children = this.planeParent.children
        // for (let index = 0; index < children.length; index++) {
        //     let tex = await TexMgr.loadTexture("bg" + (index + 1))
        //     children[index].getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", tex)
        // }
    }

    randDel() {
        let randIndex = Math.floor(Math.random() * 5)

        let tex: Texture2D = this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).getProperty("mainTexture") as Texture2D
        console.log(tex)

        TexMgr.releaseTex(tex)
        this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", null)
    }

    async randUp() {
        let randIndex = Math.floor(Math.random() * 5)
        let randTexId = Math.floor(Math.random() * 5) + 1


        let tex = await TexMgr.loadTexture("bg" + (randTexId))

        let oldTex: Texture2D = this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).getProperty("mainTexture") as Texture2D
        TexMgr.releaseTex(oldTex)
        this.planeParent.children[randIndex].getComponent(MeshRenderer).getMaterialInstance(0).setProperty("mainTexture", tex)


    }

}

