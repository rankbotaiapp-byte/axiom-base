/**
 * Tactical Drone Hub — Three.js background scene.
 *
 * Renders: falling snow, a low-poly wireframe terrain (point + line mesh),
 * a sweeping scan wall, and a deployable flight route. Exposes a tiny
 * imperative controller so React never touches Three objects directly.
 *
 * This module is loaded with a dynamic import() from a client-only effect,
 * so `three` never runs during SSR and is split out of the main bundle.
 */
import * as THREE from 'three'
import gsap from 'gsap'

export type HubMode = 'standby' | 'diagnostic' | 'thermal' | 'route'

export interface DroneSceneOptions {
  reducedMotion?: boolean
}

export interface DroneSceneController {
  setMode: (mode: HubMode) => void
  setPointer: (x: number, y: number) => void
  dispose: () => void
}

/* ---------- deterministic noise (no deps) ---------- */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function terrainHeight(x: number, z: number) {
  let amp = 1
  let freq = 0.11
  let h = 0
  for (let i = 0; i < 4; i++) {
    // ridged fbm → sharp peaks like the reference renders
    const n = 1 - Math.abs(valueNoise(x * freq + 10, z * freq + 3) * 2 - 1)
    h += n * n * amp
    amp *= 0.5
    freq *= 2.1
  }
  // flatten a valley through the middle so the hero stays readable
  const valley = Math.min(1, Math.abs(x) / 7)
  // raise peaks toward the horizon
  const depth = THREE.MathUtils.clamp((-z + 4) / 16, 0.25, 1.35)
  return h * 2.6 * (0.35 + 0.65 * valley) * depth
}

/* ---------- thermal ramp (matches the heightmap reference) ---------- */
const RAMP = ['#1e3a8a', '#0891b2', '#22c55e', '#eab308', '#f97316', '#dc2626'].map(
  (c) => new THREE.Color(c),
)
function rampColor(t: number, out: THREE.Color) {
  const x = THREE.MathUtils.clamp(t, 0, 1) * (RAMP.length - 1)
  const i = Math.min(Math.floor(x), RAMP.length - 2)
  return out.copy(RAMP[i]).lerp(RAMP[i + 1], x - i)
}

function makeDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeScanTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 128
  const g = canvas.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, 'rgba(34,211,238,0)')
  grad.addColorStop(0.75, 'rgba(34,211,238,0.35)')
  grad.addColorStop(0.97, 'rgba(165,243,252,1)')
  grad.addColorStop(1, 'rgba(165,243,252,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 4, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createDroneScene(
  container: HTMLElement,
  { reducedMotion = false }: DroneSceneOptions = {},
): DroneSceneController {
  const isSmall = window.matchMedia('(max-width: 767px)').matches
  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o)

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSmall,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.25 : 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.className = 'dh-canvas'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x030712, 0.055)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80)
  const camBase = new THREE.Vector3(0, 2.2, 9)
  const lookAt = new THREE.Vector3(0, -0.4, -4)
  camera.position.copy(camBase)

  /* ---------- terrain ---------- */
  const segX = isSmall ? 44 : 72
  const segZ = isSmall ? 28 : 44
  const terrainGeo = track(new THREE.PlaneGeometry(44, 26, segX, segZ))
  terrainGeo.rotateX(-Math.PI / 2)
  const pos = terrainGeo.attributes.position as THREE.BufferAttribute
  let hMax = 0
  for (let i = 0; i < pos.count; i++) {
    const h = terrainHeight(pos.getX(i), pos.getZ(i))
    pos.setY(i, h)
    hMax = Math.max(hMax, h)
  }
  terrainGeo.computeVertexNormals()

  const baseColors = new Float32Array(pos.count * 3)
  const heatColors = new Float32Array(pos.count * 3)
  const tmp = new THREE.Color()
  const icy = new THREE.Color('#38bdf8')
  const deep = new THREE.Color('#1d4ed8')
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / hMax
    tmp.copy(deep).lerp(icy, Math.pow(t, 0.7))
    tmp.toArray(baseColors, i * 3)
    rampColor(t, tmp).toArray(heatColors, i * 3)
  }
  const liveColors = new THREE.BufferAttribute(baseColors.slice(), 3)
  terrainGeo.setAttribute('color', liveColors)

  const terrain = new THREE.Group()
  terrain.position.set(0, -2.6, -6)
  scene.add(terrain)

  // Solid dark faces so wire lines occlude correctly
  const faceMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x030712,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  )
  terrain.add(new THREE.Mesh(terrainGeo, faceMat))

  const wireGeo = track(new THREE.WireframeGeometry(terrainGeo))
  // WireframeGeometry drops custom attributes → rebuild colors per line vertex
  const wirePos = wireGeo.attributes.position as THREE.BufferAttribute
  const wireIndexMap = new Int32Array(wirePos.count)
  {
    const lookup = new Map<string, number>()
    for (let i = 0; i < pos.count; i++)
      lookup.set(`${pos.getX(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`, i)
    for (let i = 0; i < wirePos.count; i++)
      wireIndexMap[i] = lookup.get(`${wirePos.getX(i).toFixed(3)}|${wirePos.getZ(i).toFixed(3)}`) ?? 0
  }
  const wireColors = new THREE.BufferAttribute(new Float32Array(wirePos.count * 3), 3)
  wireGeo.setAttribute('color', wireColors)
  const wireMat = track(
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32 }),
  )
  terrain.add(new THREE.LineSegments(wireGeo, wireMat))

  const dotTex = track(makeDotTexture())
  const vertMat = track(
    new THREE.PointsMaterial({
      size: isSmall ? 0.14 : 0.11,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  terrain.add(new THREE.Points(terrainGeo, vertMat))

  const heat = { mix: 0, glow: 0 }
  function paintTerrain() {
    const arr = liveColors.array as Float32Array
    const k = 1 + heat.glow * 0.8
    for (let i = 0; i < arr.length; i++) arr[i] = (baseColors[i] + (heatColors[i] - baseColors[i]) * heat.mix) * k
    liveColors.needsUpdate = true
    const w = wireColors.array as Float32Array
    for (let i = 0; i < wireIndexMap.length; i++) {
      const s = wireIndexMap[i] * 3
      w[i * 3] = arr[s]
      w[i * 3 + 1] = arr[s + 1]
      w[i * 3 + 2] = arr[s + 2]
    }
    wireColors.needsUpdate = true
  }
  paintTerrain()

  /* ---------- scan wall ---------- */
  const scanTex = track(makeScanTexture())
  const scanMat = track(
    new THREE.MeshBasicMaterial({
      map: scanTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  )
  const scanGeo = track(new THREE.PlaneGeometry(44, 4))
  const scan = new THREE.Mesh(scanGeo, scanMat)
  scan.position.set(0, 0.2, -18)
  terrain.add(scan)

  /* ---------- flight route ---------- */
  const routeXZ: Array<[number, number]> = [
    [-9, 5], [-6, 1], [-7.5, -4], [-3, -8], [2, -6], [5.5, -10], [8.5, -5], [7, 1],
  ]
  const routePts = routeXZ.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + 0.55, z))
  const curve = new THREE.CatmullRomCurve3(routePts, false, 'catmullrom', 0.4)
  const tubular = 240
  const radial = 6
  const routeGeo = track(new THREE.TubeGeometry(curve, tubular, 0.045, radial, false))
  const routeTotal = routeGeo.index!.count
  routeGeo.setDrawRange(0, 0)
  const routeMat = track(
    new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  terrain.add(new THREE.Mesh(routeGeo, routeMat))

  const wpGeo = track(new THREE.OctahedronGeometry(0.22, 0))
  const wpMat = track(
    new THREE.MeshBasicMaterial({ color: '#ef4444', wireframe: true, transparent: true, opacity: 1 }),
  )
  const waypoints = [0, 2, 3, 5, 7].map((idx) => {
    const m = new THREE.Mesh(wpGeo, wpMat)
    m.position.copy(routePts[idx]).add(new THREE.Vector3(0, 0.25, 0))
    m.scale.setScalar(0.0001)
    terrain.add(m)
    return m
  })
  const route = { progress: 0 }
  function paintRoute() {
    const count = Math.floor((routeTotal * route.progress) / (radial * 6)) * radial * 6
    routeGeo.setDrawRange(0, count)
  }

  /* ---------- snow ---------- */
  const flakeCount = reducedMotion ? 300 : isSmall ? 700 : 1800
  const snowGeo = track(new THREE.BufferGeometry())
  const snowPos = new Float32Array(flakeCount * 3)
  const snowVel = new Float32Array(flakeCount * 2) // fall speed, drift phase
  const BOX = { x: 16, yTop: 9, yBot: -4, zNear: 7, zFar: -14 }
  for (let i = 0; i < flakeCount; i++) {
    snowPos[i * 3] = (Math.random() * 2 - 1) * BOX.x
    snowPos[i * 3 + 1] = BOX.yBot + Math.random() * (BOX.yTop - BOX.yBot)
    snowPos[i * 3 + 2] = BOX.zFar + Math.random() * (BOX.zNear - BOX.zFar)
    snowVel[i * 2] = 0.35 + Math.random() * 0.7
    snowVel[i * 2 + 1] = Math.random() * Math.PI * 2
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3))
  const snowMat = track(
    new THREE.PointsMaterial({
      size: isSmall ? 0.09 : 0.07,
      map: dotTex,
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      fog: false,
    }),
  )
  const snow = new THREE.Points(snowGeo, snowMat)
  scene.add(snow)

  /* ---------- sizing ---------- */
  function resize() {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // portrait viewports: widen FOV and lift camera so terrain still frames
    camera.fov = camera.aspect < 0.8 ? 72 : camera.aspect < 1.2 ? 60 : 50
    camBase.set(0, camera.aspect < 0.8 ? 3 : 2.2, camera.aspect < 0.8 ? 10 : 9)
    camera.updateProjectionMatrix()
    render()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  /* ---------- loop with visibility pausing ---------- */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  let last = 0
  let raf = 0
  let onScreen = true
  let elapsed = 0

  function render() {
    renderer.render(scene, camera)
  }

  function tick() {
    raf = requestAnimationFrame(tick)
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    elapsed += dt

    // snow
    const p = snowGeo.attributes.position as THREE.BufferAttribute
    const arr = p.array as Float32Array
    for (let i = 0; i < flakeCount; i++) {
      const i3 = i * 3
      arr[i3 + 1] -= snowVel[i * 2] * dt
      arr[i3] += Math.sin(elapsed * 0.6 + snowVel[i * 2 + 1]) * 0.12 * dt + 0.05 * dt
      if (arr[i3 + 1] < BOX.yBot) {
        arr[i3 + 1] = BOX.yTop
        arr[i3] = (Math.random() * 2 - 1) * BOX.x
      }
      if (arr[i3] > BOX.x) arr[i3] = -BOX.x
    }
    p.needsUpdate = true

    // camera drift + pointer parallax
    pointer.sx += (pointer.x - pointer.sx) * 0.04
    pointer.sy += (pointer.y - pointer.sy) * 0.04
    camera.position.set(
      camBase.x + Math.sin(elapsed * 0.08) * 0.6 + pointer.sx * 0.8,
      camBase.y + pointer.sy * 0.35,
      camBase.z,
    )
    camera.lookAt(lookAt)

    for (const w of waypoints) w.rotation.y += dt * 1.4

    render()
  }

  function start() {
    if (reducedMotion || raf) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    onScreen && !document.hidden ? start() : stop()
  })
  io.observe(container)
  const onVisibility = () => (document.hidden || !onScreen ? stop() : start())
  document.addEventListener('visibilitychange', onVisibility)

  resize()
  camera.lookAt(lookAt)
  render()
  start()

  /* ---------- mode transitions (GSAP, scoped for clean teardown) ---------- */
  const ctx = gsap.context(() => {})
  const d = (s: number) => (reducedMotion ? 0 : s)
  // In reduced-motion mode there is no RAF loop, so tweens render on update
  const onUpd = (fn: () => void) => () => {
    fn()
    if (!raf) render()
  }

  function sweep(color: string, repeat = 0) {
    scanMat.color.set(color)
    gsap.killTweensOf([scan.position, scanMat])
    if (reducedMotion) return
    gsap.fromTo(
      scan.position,
      { z: -16 },
      { z: 12, duration: 2.4, ease: 'power1.inOut', repeat, repeatDelay: 0.3 },
    )
    gsap.fromTo(scanMat, { opacity: 0 }, { opacity: 0.85, duration: 0.4, yoyo: true, repeat: repeat * 2 + 1, repeatDelay: 1.6 })
  }

  function setMode(mode: HubMode) {
    ctx.add(() => {
      gsap.killTweensOf([heat, route])
      waypoints.forEach((w) => gsap.killTweensOf(w.scale))

      const thermal = mode === 'thermal'
      gsap.to(heat, { mix: thermal ? 1 : 0, duration: d(1.6), ease: 'power2.inOut', onUpdate: onUpd(paintTerrain) })
      gsap.to(wireMat, { opacity: thermal ? 0.55 : mode === 'route' ? 0.2 : 0.32, duration: d(1) })

      if (mode === 'diagnostic') {
        sweep('#22d3ee', 1)
        gsap.fromTo(heat, { glow: 0 }, { glow: 1, duration: d(0.35), yoyo: true, repeat: 5, onUpdate: onUpd(paintTerrain) })
      } else if (mode === 'thermal') {
        sweep('#f97316', 0)
      }

      if (mode === 'route') {
        route.progress = 0
        gsap.to(route, { progress: 1, duration: d(3.2), ease: 'power2.inOut', delay: d(0.3), onUpdate: onUpd(paintRoute) })
        waypoints.forEach((w, i) =>
          gsap.to(w.scale, { x: 1, y: 1, z: 1, duration: d(0.5), ease: 'back.out(3)', delay: d(0.4 + i * 0.6), onUpdate: onUpd(() => {}) }),
        )
      } else {
        gsap.to(route, { progress: 0, duration: d(0.6), ease: 'power2.in', onUpdate: onUpd(paintRoute) })
        waypoints.forEach((w) => gsap.to(w.scale, { x: 0.0001, y: 0.0001, z: 0.0001, duration: d(0.3), onUpdate: onUpd(() => {}) }))
      }
    })
  }

  function setPointer(x: number, y: number) {
    pointer.x = x
    pointer.y = y
  }

  function dispose() {
    stop()
    ctx.revert() // kills every tween created through setMode
    gsap.killTweensOf([heat, route, scan.position, scanMat, wireMat])
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    disposables.forEach((o) => o.dispose())
    scene.clear()
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  return { setMode, setPointer, dispose }
}
