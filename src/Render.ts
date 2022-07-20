import THREE, { 
    Mesh, PlaneGeometry, SphereGeometry, BoxGeometry, 
    Vector2, Vector3, Raycaster, 
    MeshBasicMaterial, MeshPhongMaterial, ShaderMaterial, 
    UniformsUtils, ShaderLib, ShaderChunk, HalfFloatType, WebGLRenderTarget, ClampToEdgeWrapping, NearestFilter, RGBAFormat, UnsignedByteType, 
    HemisphereLight, FogExp2, LightProbe, sRGBEncoding, 
    PerspectiveCamera, Scene, TextureLoader, CubeTextureLoader, WebGLRenderer } from "three";

// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js'
import { Water2 } from 'three/examples/jsm/objects/Water2.js'

import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'

// components
import { heightmapFragmentShader, smoothFragmentShader, readWaterLevelFragmentShader, waterVertexShader } from './Shaders'

import { Controls } from './Controls' 

// models
import { Space } from './models/Space'
import { Sailboat } from './models/Sailboat'
import { Kraken } from './models/Kraken'


export class Render 
{
    // public getRender: Render

    private camera: PerspectiveCamera
    private scene: Scene
    private renderer: WebGLRenderer
    // private controls: OrbitControls

    // private mesh: Mesh
    private Map: Space
    private Sailer: Sailboat
    private water: any

    private controls: any
    private keyControls: any
    // private container: any
    // private stats: any
    private mouseMoved = false
    private mouseCoords = new Vector2()
    private raycaster = new Raycaster()

    private waterMesh: any
    private meshRay: any
    private gpuCompute: any //GPUComputationRenderer;
    private heightmapVariable: any
    private waterUniforms: any
    private smoothShader: any
    private readWaterLevelShader: any
    private readWaterLevelRenderTarget: any
    private readWaterLevelImage: any
    private waterNormal = new Vector3()

    private NUM_SPHERES = 5
    private spheresEnabled = true
	private spheres: Mesh<SphereGeometry, MeshPhongMaterial>[] = []

    private readonly effectController = {
        mouseSize: 200.0,
        viscosity: .997,
        // spheresEnabled: spheresEnabled
    }

    private readonly WIDTH = 128*6
    private readonly BOUNDS = 512*3.35
    private readonly BOUNDS_HALF = this.BOUNDS * 0.5

    private simplex = new SimplexNoise();

    /**
     * Based off the three.js docs: https://threejs.org/examples/?q=cube#webgl_geometry_cube
     */
    constructor()
    {
        // this.getRender = this
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 20000);
        this.camera.position.z = 400;

        this.scene = new Scene();

        const light = new HemisphereLight(0xffffbb, 0x080820, 1.6);
        light.position.set(-30, 9, -30);
        this.scene.add(light);
        this.scene.fog = new FogExp2(0x555555, 0.0002);

        const lightProbe = new LightProbe();
        this.scene.add(lightProbe);
        // envmap
        const genCubeUrls = function (prefix: string, postfix: string) {
            return [
                prefix + 'px' + postfix, prefix + 'nx' + postfix,
                prefix + 'py' + postfix, prefix + 'ny' + postfix,
                prefix + 'pz' + postfix, prefix + 'nz' + postfix
            ];
        };
        const urls = genCubeUrls('./src/assets/textures/cube/sky/', '.jpg');
        const cubeTextureLoader = new CubeTextureLoader();
        cubeTextureLoader.load(urls, (cubeTexture) => {
            cubeTexture.encoding = sRGBEncoding;
            this.scene.background = cubeTexture;
            lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture));
            const params = {
                color: '#58b0bd',//'#00ACBD',
                scale: 8,
                flowX: 0.2,
                flowY: 0.2
            };
            const waterGeometry = new PlaneGeometry(9000, 9000);
            this.water = new Water2(waterGeometry, {
                color: params.color,
                scale: params.scale,
                flowDirection: new Vector2(params.flowX, params.flowY),
                textureWidth: 1024,
                textureHeight: 1024,
                reflectivity: 0.1,
                // shininess: 80
            });
            this.water.position.y = 1;
            this.water.rotation.x = Math.PI * - 0.5;
            // this.scene.water.fog = new THREE.FogExp2(0xdddddd,10.1);
            //this.scene.water.fog = false;
            this.scene.add(this.water);
        });

        // const texture = new TextureLoader().load("images/textures/crate.gif");
        // const geometry = new BoxGeometry(200, 200, 200);
        // const material = new MeshBasicMaterial({ map: texture });

        // this.mesh = new Mesh(geometry, material);
        // this.scene.add(this.mesh);

        this.Map = new Space();
        this.Sailer = new Sailboat();

        this.keyControls = new Controls();
        // this.setControls()

        const _Kraken = new Kraken();

        this.Sailer.mesh.userData.velocity = new Vector3();
        
        this.scene.add(this.Map.mesh);
        this.scene.add(this.Sailer.mesh);
        this.scene.add(_Kraken.mesh);

        // this.Sailer.vel = 1;

        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0); // the default
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        // helpers
        const controls = new OrbitControls (this.camera, this.renderer.domElement);
        // var gridXZ = new GridHelper(100, 10);
        // this.scene.add(gridXZ);

        


        //
        // document.body.style.touchAction = 'none';
        document.body.addEventListener('pointermove', (e) => this.onPointerMove(e));
        
        document.addEventListener('keydown', (e) => this.keyControls.keyDown(e, this.Sailer));
        document.addEventListener('keyup', (e) => this.keyControls.keyUp(e, this.Sailer));
        
        // const en = {
        //     x: 1,
        //     y: 1
        // }
        // this.onPointerMove(en);

        // document.addEventListener('keydown', function (event) {

        //     // W Pressed: Toggle wireframe
        //     if (event.keyCode === 87) {

        //         waterMesh.material.wireframe = !waterMesh.material.wireframe;
        //         waterMesh.material.needsUpdate = true;

        //     }

        // });

        // window.addEventListener('resize', onWindowResize);


        // const gui = new GUI();

        // const effectController = {
        //     mouseSize: 20.0,
        //     viscosity: 0.98,
        //     spheresEnabled: spheresEnabled
        // };

        // const valuesChanger = function () {

        //     heightmapVariable.material.uniforms['mouseSize'].value = effectController.mouseSize;
        //     heightmapVariable.material.uniforms['viscosityConstant'].value = effectController.viscosity;
        //     spheresEnabled = effectController.spheresEnabled;
        //     for (let i = 0; i < NUM_SPHERES; i++) {

        //         if (spheres[i]) {

        //             spheres[i].visible = spheresEnabled;

        //         }

        //     }

        // };

        // gui.add(effectController, 'mouseSize', 1.0, 100.0, 1.0).onChange(valuesChanger);
        // gui.add(effectController, 'viscosity', 0.9, 0.999, 0.001).onChange(valuesChanger);
        // gui.add(effectController, 'spheresEnabled', 0, 1, 1).onChange(valuesChanger);
        // const buttonSmooth = {
        //     smoothWater: function () {

        //         this.smoothWater();

        //     }
        // };
        // gui.add(buttonSmooth, 'smoothWater');


        this.initWater();

        this.createSpheres();
        //


        window.addEventListener("resize", this.onWindowResize.bind(this), false);

        this.animate();
    }

    //////////////////

    // public getSailer() {
    //     return this.Sailer
    // }

    private sailerDynamics() {

        const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable);

        this.readWaterLevelShader.uniforms['levelTexture'].value = currentRenderTarget.texture;

        // for (let i = 0; i < this.NUM_SPHERES; i++) {

            // const sphere = this.spheres[i];

            // if (sphere) {
                const sensitivity = 0.5
                const distance = 0.5
                
                const waterScalar = 0.01 //0.1

                const position = 0.001
                const velocity = 0.3
                
                // Read water level and orientation
                const u = sensitivity * this.Sailer.mesh.position.x / this.BOUNDS_HALF + distance;
                const v = 1 - (sensitivity * this.Sailer.mesh.position.z / this.BOUNDS_HALF + distance);
                this.readWaterLevelShader.uniforms['point1'].value.set(u, v);
                this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);

                this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
                const pixels = new Float32Array(this.readWaterLevelImage.buffer);

                // Get orientation
                this.waterNormal.set(pixels[1], 0, - pixels[2]);

                const pos = this.Sailer.mesh.position;

                // Set height
                pos.y = pixels[0];

                // Move sphere
                this.waterNormal.multiplyScalar(waterScalar);
                this.Sailer.mesh.userData.velocity.add(this.waterNormal);
                this.Sailer.mesh.userData.velocity.multiplyScalar(0.998);
                pos.add(this.Sailer.mesh.userData.velocity);

                if (pos.x < - this.BOUNDS_HALF) {

                    pos.x = - this.BOUNDS_HALF + position;
                    this.Sailer.mesh.userData.velocity.x *= - velocity;

                } else if (pos.x > this.BOUNDS_HALF) {

                    pos.x = this.BOUNDS_HALF - position;
                    this.Sailer.mesh.userData.velocity.x *= - velocity;

                }

                if (pos.z < - this.BOUNDS_HALF) {

                    pos.z = - this.BOUNDS_HALF + position;
                    this.Sailer.mesh.userData.velocity.z *= - velocity;

                } else if (pos.z > this.BOUNDS_HALF) {

                    pos.z = this.BOUNDS_HALF - position;
                    this.Sailer.mesh.userData.velocity.z *= - velocity;

                }

            // }

        // }

    }

    private initWater() {

        const materialColor = 0x0040C0;

        const geometry = new PlaneGeometry(this.BOUNDS, this.BOUNDS, this.WIDTH - 1, this.WIDTH - 1);
    
        // material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
        const _waterVertexShader = new waterVertexShader();
        const material = new ShaderMaterial({
            uniforms: UniformsUtils.merge([
                ShaderLib['phong'].uniforms,
                {
                    'heightmap': { value: null }
                }
            ]),
            vertexShader: _waterVertexShader.init,
            fragmentShader: ShaderChunk['meshphong_frag']
    
        });
    
        material.lights = true;
    
        //~~ Material attributes from MeshPhongMaterial
        // material.color = new Color(materialColor);
        // material.specular = new Color(0x111111);
        // material.shininess = 50;
    
        //~~ Sets the uniforms with the material values
        // material.uniforms['diffuse'].value = material.color;
        material.uniforms.diffuse.value.setHex( 0x58b0bd );
        // material.uniforms['specular'].value = material.specular;
        material.uniforms.specular.value.setHex( 0x111111 );
        // material.uniforms['shininess'].value = Math.max(material.shininess, 1e-4);
        material.uniforms.shininess.value = Math.max(20, 1e-4);
        // material.uniforms['opacity'].value = material.opacity;
        material.uniforms.opacity.value = 1;
    
        // Defines
        material.defines.WIDTH = this.WIDTH.toFixed(1);
        material.defines.BOUNDS = this.BOUNDS.toFixed(1);
    
        this.waterUniforms = material.uniforms;
    
        this.waterMesh = new Mesh(geometry, material);
        this.waterMesh.rotation.x = - Math.PI / 2;
        this.waterMesh.matrixAutoUpdate = false;
        this.waterMesh.updateMatrix();
    
        this.scene.add(this.waterMesh);
    
        // Mesh just for mouse raycasting
        const geometryRay = new PlaneGeometry(this.BOUNDS, this.BOUNDS, 1, 1);
        this.meshRay = new Mesh(geometryRay, new MeshBasicMaterial({ color: 0xFFFFFF, visible: false }));
        this.meshRay.rotation.x = - Math.PI / 2;
        this.meshRay.matrixAutoUpdate = false;
        this.meshRay.updateMatrix();
        this.scene.add(this.meshRay);
    
    
        // Creates the gpu computation class and sets it up
    
        this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, this.renderer);
    
        if (this.renderer.capabilities.isWebGL2 === false) {
    
            this.gpuCompute.setDataType(HalfFloatType);
    
        }
    
        const heightmap0 = this.gpuCompute.createTexture();
    
        this.fillTexture(heightmap0);
    
        const _heightmapFragmentShader = new heightmapFragmentShader();
        this.heightmapVariable = this.gpuCompute.addVariable('heightmap', _heightmapFragmentShader.init, heightmap0);
    
        this.gpuCompute.setVariableDependencies(this.heightmapVariable, [this.heightmapVariable]);
    
        this.heightmapVariable.material.uniforms['mousePos'] = { value: new Vector2(10000, 10000) };
        this.heightmapVariable.material.uniforms['mouseSize'] = { value: this.effectController.mouseSize };
        this.heightmapVariable.material.uniforms['viscosityConstant'] = { value: this.effectController.viscosity };
        this.heightmapVariable.material.uniforms['heightCompensation'] = { value: 0 };
        this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed(1);
    
        const error = this.gpuCompute.init();
        if (error !== null) {
    
            console.error(error);
    
        }
    
        // Create compute shader to smooth the water surface and velocity
        const _smoothFragmentShader = new smoothFragmentShader();
        this.smoothShader = this.gpuCompute.createShaderMaterial(_smoothFragmentShader.init, { smoothTexture: { value: null } });
    
        // Create compute shader to read water level
        const _readWaterLevelFragmentShader = new readWaterLevelFragmentShader();
        this.readWaterLevelShader = this.gpuCompute.createShaderMaterial(_readWaterLevelFragmentShader.init, {
            point1: { value: new Vector2() },
            levelTexture: { value: null }
        });
        this.readWaterLevelShader.defines.WIDTH = this.WIDTH.toFixed(1);
        this.readWaterLevelShader.defines.BOUNDS = this.BOUNDS.toFixed(1);
    
        // Create a 4x1 pixel image and a render target (Uint8, 4 channels, 1 byte per channel) to read water height and orientation
        this.readWaterLevelImage = new Uint8Array(4 * 1 * 4);
    
        this.readWaterLevelRenderTarget = new WebGLRenderTarget(4, 1, {
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            type: UnsignedByteType,
            depthBuffer: false
        });
    }

    private fillTexture(texture: any) {

        const waterMaxHeight = 10;
    
        const noise = (x: any, y: any) => {
    
            let multR = waterMaxHeight;
            let mult = 0.025;
            let r = 0;
            for (let i = 0; i < 15; i++) {
    
                r += multR * this.simplex.noise(x * mult, y * mult);
                multR *= 0.53 + 0.025 * i;
                mult *= 1.25;
    
            }
    
            return r;
    
        }
    
        const pixels = texture.image.data;
    
        let p = 0;
        for (let j = 0; j < this.WIDTH; j++) {
    
            for (let i = 0; i < this.WIDTH; i++) {
    
                const x = i * 128 / this.WIDTH;
                const y = j * 128 / this.WIDTH;
    
                pixels[p + 0] = noise(x, y);
                pixels[p + 1] = pixels[p + 0];
                pixels[p + 2] = 0;
                pixels[p + 3] = 1;
    
                p += 4;
    
            }
    
        }
    
    }
    
    private smoothWater() {
    
        const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable);
        const alternateRenderTarget = this.gpuCompute.getAlternateRenderTarget(this.heightmapVariable);
    
        for (let i = 0; i < 10; i++) {
    
            this.smoothShader.uniforms['smoothTexture'].value = currentRenderTarget.texture;
            this.gpuCompute.doRenderTarget(this.smoothShader, alternateRenderTarget);
    
            this.smoothShader.uniforms['smoothTexture'].value = alternateRenderTarget.texture;
            this.gpuCompute.doRenderTarget(this.smoothShader, currentRenderTarget);
    
        }
    
    }
    
    private createSpheres() {
    
        const sphereTemplate = new Mesh(new SphereGeometry(4, 24, 12), new MeshPhongMaterial({ color: 0xFFFF00 }));
    
        for (let i = 0; i < this.NUM_SPHERES; i++) {
    
            let sphere = sphereTemplate;
            if (i < this.NUM_SPHERES - 1) {
                // @ts-ignore
                sphere = sphereTemplate.clone();
    
            }
    
            sphere.position.x = (Math.random() - 0.5) * this.BOUNDS * 0.7;
            sphere.position.z = (Math.random() - 0.5) * this.BOUNDS * 0.7;
    
            sphere.userData.velocity = new Vector3();
    
            this.scene.add(sphere);
    
            this.spheres[i] = sphere;
    
        }
    
    }
    
    private sphereDynamics() {

        const currentRenderTarget = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable);

        this.readWaterLevelShader.uniforms['levelTexture'].value = currentRenderTarget.texture;

        for (let i = 0; i < this.NUM_SPHERES; i++) {

            const sphere = this.spheres[i];

            if (sphere) {

                // Read water level and orientation
                const u = 0.5 * sphere.position.x / this.BOUNDS_HALF + 0.5;
                const v = 1 - (0.5 * sphere.position.z / this.BOUNDS_HALF + 0.5);
                this.readWaterLevelShader.uniforms['point1'].value.set(u, v);
                this.gpuCompute.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);

                this.renderer.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
                const pixels = new Float32Array(this.readWaterLevelImage.buffer);

                // Get orientation
                this.waterNormal.set(pixels[1], 0, - pixels[2]);

                const pos = sphere.position;

                // Set height
                pos.y = pixels[0];

                // Move sphere
                this.waterNormal.multiplyScalar(0.1);
                sphere.userData.velocity.add(this.waterNormal);
                sphere.userData.velocity.multiplyScalar(0.998);
                pos.add(sphere.userData.velocity);

                if (pos.x < - this.BOUNDS_HALF) {

                    pos.x = - this.BOUNDS_HALF + 0.001;
                    sphere.userData.velocity.x *= - 0.3;

                } else if (pos.x > this.BOUNDS_HALF) {

                    pos.x = this.BOUNDS_HALF - 0.001;
                    sphere.userData.velocity.x *= - 0.3;

                }

                if (pos.z < - this.BOUNDS_HALF) {

                    pos.z = - this.BOUNDS_HALF + 0.001;
                    sphere.userData.velocity.z *= - 0.3;

                } else if (pos.z > this.BOUNDS_HALF) {

                    pos.z = this.BOUNDS_HALF - 0.001;
                    sphere.userData.velocity.z *= - 0.3;

                }

            }

        }

    }

    // private onWindowResize() {

    //     camera.aspect = window.innerWidth / window.innerHeight;
    //     camera.updateProjectionMatrix();

    //     renderer.setSize(window.innerWidth, window.innerHeight);

    // }

    private setMouseCoords(x: number, y: number) {

        this.mouseCoords.set((x / this.renderer.domElement.clientWidth) * 2 - 1, - (y / this.renderer.domElement.clientHeight) * 2 + 1);
        this.mouseMoved = true;

    }

    private onPointerMove(event: any) {

        if (event.isPrimary === false) return;

        this.setMouseCoords(event.clientX, event.clientY);

    }

    // private animate() {

    //     requestAnimationFrame(animate);

    //     render();
    //     stats.update();

    // }

    private render() {

        // Set uniforms: mouse interaction
        const uniforms = this.heightmapVariable.material.uniforms;
        if (this.mouseMoved) {

            this.raycaster.setFromCamera(this.mouseCoords, this.camera);

            const intersects = this.raycaster.intersectObject(this.meshRay);

            if (intersects.length > 0) {

                const point = intersects[0].point;
                uniforms['mousePos'].value.set(point.x, point.z);

            } else {

                uniforms['mousePos'].value.set(10000, 10000);

            }

            this.mouseMoved = false;

        } else {

            uniforms['mousePos'].value.set(10000, 10000);

        }

        // Do the gpu computation
        this.gpuCompute.compute();

        this.sailerDynamics();

        if (this.spheresEnabled) this.sphereDynamics();

        // Get compute output in custom uniform
        this.waterUniforms['heightmap'].value = this.gpuCompute.getCurrentRenderTarget(this.heightmapVariable).texture;

        // Render
        // this.renderer.render(scene, camera);

    }

    /////////////////

    private onWindowResize(): void
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void
    {
        requestAnimationFrame(this.animate.bind(this));

        // this.mesh.rotation.x += 0.005;
        // this.mesh.rotation.y += 0.01;

        this.render();

        this.renderer.render(this.scene, this.camera);
    }
}
