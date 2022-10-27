import { assetManager, Component, Texture2D, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TexMgr')
export class TexMgr extends Component {

    /** TODO 目前直接引用指定路径的 */
    public static loadTexture(name: string) {

        return new Promise<Texture2D>((resolve, reject) => {

            assetManager.loadBundle("textures", null, (err, bundle) => {
                bundle.load(name + "/texture", Texture2D, (err, res) => {
                    if (err) {
                        console.log(assetManager.assets)
                        console.error(err)
                        resolve(null)
                    }

                    res.addRef()
                    console.log(res.refCount)
                    resolve(res)
                    // res.decRef()
                })
            })
        })
    }

    public static releaseTex(res: Texture2D) {

        res?.decRef()
        // assetManager.releaseAsset(res)
    }

}

