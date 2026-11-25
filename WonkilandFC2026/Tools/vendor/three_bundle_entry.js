// 원기랜드의 FC 2026 — three.js r149 + 사용하는 부가 모듈을 하나의 일반 스크립트로 묶음 (file:// 실행 지원)
import * as THREE_NS from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const THREE = Object.assign({}, THREE_NS);
THREE.Addons = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, SAOPass, GammaCorrectionShader, FXAAShader, RoomEnvironment, Sky, BufferGeometryUtils };
window.THREE = THREE;
