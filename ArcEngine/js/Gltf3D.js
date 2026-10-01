// Gltf3D.js — glTF/GLB models: skeleton, animation clips, textures. Called through Model3D
// (load / build / dispose pick the loader by the file extension); the clips of a built model —
// Model3D.clips(root). Needs libs/babylonjs.loaders.min.js; without it the model fails to
// load like a missing file, the scene doesn't crash.
//
// UNITS: glTF is meters, the kit's world is px = centimeters — the model is scaled by 100.
// AXES: the glTF front is +Z, the kit's model nose is +X — the model is turned by 90° about Y.
// MATERIALS: glTF gives PBR, the toon shader lives on StandardMaterial — every build gets its
// own StandardMaterial: base color (linear -> gamma, like FBX), base color texture, normal map,
// alpha, culling and sideOrientation (glTF front faces are counter-clockwise — the loader
// sets the flag on the material, losing it turns the model inside out).
// Colour textures are loaded WITHOUT sRGB buffers: with them the GPU decodes texels to linear,
// which is right for PBR but makes a StandardMaterial (gamma space) render the texture too dark.
// CLIPS: glTF animations by name — Clips3D: play('run') cross-fades from the current clip.
// MOUNT: Model3D.mount(rider, horse, 'saddle') seats one built model on a joint (bone) of another;
// the rider keeps its own clips and follows the joint through the mount's animation.

/** @satisfies {Record<string, any>} */
const Gltf3D = {
    UNITS: 100,              // glTF meters -> world px (1 cm = 1 px, like FBX)
    _cache: new Map(),       // scene uid + url -> Promise<model>: the file is loaded once per scene
    _clips: new WeakMap(),   // model root -> Clips3D
    _joints: new WeakMap(),  // model root -> Map(joint name -> TransformNode)

    is(url) {
        return /\.(glb|gltf)(\?|$)/i.test(String(url));
    },

    // url -> Promise<{ gltf: true, container, clips: [names] }>. The container stays out of the
    // scene: build() instantiates it. It dies with the scene.
    load(url, scene) {
        const key = scene.uid + '|' + url;
        let p = this._cache.get(key);
        if (!p) {
            p = BABYLON.LoadAssetContainerAsync(url, scene, { pluginOptions: { gltf: { useSRGBBuffers: false } } }).then((container) => {
                for (const g of container.animationGroups) g.stop();   // the loader starts the first one
                scene.onDisposeObservable.addOnce(() => {
                    this._cache.delete(key);
                    container.dispose();
                });
                return { gltf: true, container, clips: container.animationGroups.map(g => g.name) };
            });
            this._cache.set(key, p);
            p.catch(() => this._cache.delete(key));   // errors are not cached: the file may be added later
        }
        return p;
    },

    // Model -> root mesh without geometry; each call gets its own meshes, skeleton, clips and
    // materials. opts: { name }.
    build(model, scene, opts) {
        const name = (opts && opts.name) || 'model';
        const root = new BABYLON.Mesh(name, scene);
        const fit = new BABYLON.TransformNode(name + '/gltf', scene);
        fit.scaling.setAll(Gltf3D.UNITS);
        fit.rotation.y = Math.PI / 2;
        fit.parent = root;
        const inst = model.container.instantiateModelsToScene((n) => name + '/' + n, false, { doNotInstantiate: true });
        for (const node of inst.rootNodes) node.parent = fit;

        const joints = new Map(), prefix = name + '/';
        for (const node of fit.getChildTransformNodes(false)) joints.set(node.name.startsWith(prefix) ? node.name.slice(prefix.length) : node.name, node);
        this._joints.set(root, joints);

        const mats = new Map();
        for (const mesh of root.getChildMeshes(false)) {
            if (!mesh.material) continue;
            if (!mats.has(mesh.material)) mats.set(mesh.material, this._standard(mesh.material, name, scene));
            mesh.material = mats.get(mesh.material);
        }

        const clips = new Clips3D(scene, inst.animationGroups, model.clips);
        this._clips.set(root, clips);
        root.onDisposeObservable.addOnce(() => {
            clips.dispose();
            for (const s of inst.skeletons) s.dispose();
        });
        return root;
    },

    clips(root) {
        return (root && this._clips.get(root)) || null;
    },

    // Seat the model `rider` on the joint named `joint` of the model `mount` (both from build).
    // The joint lives inside the mount's meters-to-px node, so the rider's root gets the inverse
    // scale and turn: its origin sits at the joint, its nose looks where the mount's does, its
    // size is the mount's scale (set the scale on the mount only). false — no such joint.
    // A mount's dispose takes its rider with it: dismount first to keep it.
    mount(rider, mount, joint) {
        const node = (this._joints.get(mount) || new Map()).get(joint);
        if (!rider || !node) return false;
        rider.parent = node;
        rider.position.setAll(0);
        rider.rotationQuaternion = null;
        rider.rotation.set(0, -Math.PI / 2, 0);
        rider.scaling.setAll(1 / Gltf3D.UNITS);
        return true;
    },

    // Take a seated model off: it stays where it is in the world, the parent link is gone.
    dismount(rider) {
        if (!rider || !rider.parent) return false;
        const scale = new BABYLON.Vector3(), rot = new BABYLON.Quaternion(), pos = new BABYLON.Vector3();
        rider.computeWorldMatrix(true).decompose(scale, rot, pos);
        rider.parent = null;
        rider.position.copyFrom(pos);
        rider.scaling.copyFrom(scale);
        rider.rotationQuaternion = null;
        rider.rotation.copyFrom(rot.toEulerAngles());
        return true;
    },

    // glTF material (PBR) -> StandardMaterial for the toon shader.
    _standard(src, name, scene) {
        const m = new BABYLON.StandardMaterial(name + '/' + src.name, scene);
        const pbr = /** @type {BABYLON.PBRMaterial} */ (src);
        if (pbr.albedoColor) m.diffuseColor = pbr.albedoColor.toGammaSpace();
        if (pbr.albedoTexture) {
            m.diffuseTexture = pbr.albedoTexture;
            m.useAlphaFromDiffuseTexture = pbr.useAlphaFromAlbedoTexture;
        }
        if (pbr.bumpTexture) {
            m.bumpTexture = pbr.bumpTexture;
            m.invertNormalMapX = pbr.invertNormalMapX;
            m.invertNormalMapY = pbr.invertNormalMapY;
        }
        m.alpha = src.alpha;
        m.transparencyMode = src.transparencyMode;
        m.alphaCutOff = pbr.alphaCutOff != null ? pbr.alphaCutOff : m.alphaCutOff;
        m.backFaceCulling = src.backFaceCulling;
        m.sideOrientation = src.sideOrientation;
        return m;
    }
};

// Animation clips of one built model. play(name) starts the clip and cross-fades to it from
// whatever is playing; the weights move by themselves every frame (before the scene's animations).
class Clips3D {
    // groups — this model's AnimationGroups, names — their clip names in the file.
    constructor(scene, groups, names) {
        this.scene = scene;
        this.current = '';
        /** @type {Map<string, { group: BABYLON.AnimationGroup, weight: number }>} */
        this.tracks = new Map();
        groups.forEach((group, i) => this.tracks.set(names[i] || group.name, { group, weight: 0 }));
        this.blend = Clips3D.blendSec();
        this._then = '';
        this._observer = scene.onBeforeAnimationsObservable.add(() => this._tick(scene.getEngine().getDeltaTime() / 1000));
    }

    static blendSec() {
        return typeof MODEL_CLIP_BLEND_SEC !== 'undefined' ? MODEL_CLIP_BLEND_SEC : 0.2;
    }

    names() {
        return [...this.tracks.keys()];
    }

    has(name) {
        return this.tracks.has(name);
    }

    // opts: { loop = true, speed = 1, blend = MODEL_CLIP_BLEND_SEC, then — the clip to play after a
    // non-looped one ends }. false — the model has no such clip.
    play(name, opts) {
        const t = this.tracks.get(name), o = opts || {};
        if (!t) return false;
        const loop = o.loop !== false, speed = o.speed > 0 ? o.speed : 1;
        this.blend = o.blend >= 0 ? o.blend : Clips3D.blendSec();
        this._then = loop ? '' : String(o.then || '');
        if (this.current !== name || !t.group.isPlaying) {
            const first = ![...this.tracks.values()].some(x => x.weight > 0);
            t.group.start(loop, speed, t.group.from, t.group.to, false);
            t.weight = first ? 1 : t.weight;
            t.group.setWeightForAllAnimatables(t.weight);
            if (!loop) t.group.onAnimationGroupEndObservable.addOnce(() => { if (this.current === name && this._then) this.play(this._then); });
        } else {
            t.group.speedRatio = speed;
        }
        this.current = name;
        return true;
    }

    // Stop everything: the model returns to its rest pose.
    stop() {
        this.current = '';
        for (const t of this.tracks.values()) {
            t.weight = 0;
            t.group.stop();
            t.group.reset();
        }
    }

    // Weights: the current clip rises to 1, the rest fall to 0 over blend seconds; the sum is kept at 1.
    _tick(dt) {
        if (!this.current) return;
        const step = this.blend > 0 ? Math.max(0, dt) / this.blend : 1;
        let sum = 0;
        for (const [name, t] of this.tracks) {
            t.weight = Math.max(0, Math.min(1, t.weight + (name === this.current ? step : -step)));
            sum += t.weight;
        }
        for (const [name, t] of this.tracks) {
            if (t.weight <= 0) {
                if (name !== this.current && t.group.isPlaying) t.group.stop();
                continue;
            }
            t.group.setWeightForAllAnimatables(t.weight / sum);
        }
    }

    dispose() {
        this.scene.onBeforeAnimationsObservable.remove(this._observer);
        for (const t of this.tracks.values()) t.group.dispose();
        this.tracks.clear();
        this.current = '';
    }
}
