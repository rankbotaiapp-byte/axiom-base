"""Axiom Cyber-Obsidian master scene. Run: blender -b -P master_scene.py -- params.json"""
import json
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Vector
except ImportError as exc:
    raise SystemExit("bpy is only available inside Blender") from exc


def load_params():
    path = Path(sys.argv[-1])
    return json.loads(path.read_text(encoding="utf-8"))


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)


def emission(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*color, 1)
    emit.inputs["Strength"].default_value = strength
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def metal():
    mat = bpy.data.materials.new("ObsidianMetal")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.02, 0.03, 0.045, 1)
    bsdf.inputs["Metallic"].default_value = 1
    bsdf.inputs["Roughness"].default_value = 0.22
    return mat


def hud_bracket(loc, rot, cyan):
    bpy.ops.mesh.primitive_cube_add(size=0.08, location=loc)
    bar = bpy.context.active_object
    bar.scale = (1.8, 0.12, 0.12)
    bar.rotation_euler = rot
    bar.data.materials.append(emission("HudCyan", cyan, 18))


def particles(obj, effect, count, gravity=-9.8, viscosity=0.2):
    ps = obj.modifiers.new(name="FX", type="PARTICLE_SYSTEM").particle_system.settings
    ps.count = count
    ps.frame_start = 1
    ps.frame_end = 48
    ps.lifetime = 28
    ps.mass = max(0.01, viscosity)
    try:
        scene = bpy.context.scene
        scene.gravity = (0, 0, float(gravity))
    except Exception:
        pass
    if effect == "hydro-splash":
        ps.normal_factor = 4.2
        ps.particle_size = 0.04
    elif effect == "frost-crystals":
        ps.normal_factor = 0.6
        ps.particle_size = 0.03
        ps.brownian_factor = 0.4
    else:
        ps.normal_factor = 2.8
        ps.particle_size = 0.025
        ps.brownian_factor = 1.2


def build(params):
    clear_scene()
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 48
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = params["output"]
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.016, 0.028, 1)
    bg.inputs["Strength"].default_value = 0.35

    cyan = (0.0, 0.95, 0.997)
    crimson = (1.0, 0.165, 0.239)

    bpy.ops.mesh.primitive_cube_add(size=2.4, location=(0, 0, 0.2))
    plate = bpy.context.active_object
    plate.name = "BrandPlate"
    plate.scale = (1.6, 0.08, 1.0)
    plate.data.materials.append(metal())

    logo = params.get("logo") or ""
    if params.get("plateEtch") and logo and Path(logo).exists():
        img = bpy.data.images.load(logo)
        tex = bpy.data.textures.new("LogoEtch", type="IMAGE")
        tex.image = img
        disp = plate.modifiers.new("Etch", type="DISPLACE")
        disp.texture = tex
        disp.strength = 0.12

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.35, location=(0, 0.4, 0.7))
    core = bpy.context.active_object
    core.data.materials.append(emission("Core", cyan, 12 * float(params.get("cyanEnergy", 0.8))))
    particles(
        core,
        params.get("effect") or "hydro-splash",
        900,
        float(params.get("gravity", -9.2)),
        float(params.get("viscosity", 0.2)),
    )

    for loc, rot in (
        ((-1.7, -1.1, 1.2), (0, 0, math.radians(40))),
        ((1.7, -1.1, 1.2), (0, 0, math.radians(-40))),
        ((-1.7, 1.1, -0.9), (0, 0, math.radians(-40))),
        ((1.7, 1.1, -0.9), (0, 0, math.radians(40))),
    ):
        hud_bracket(loc, rot, cyan)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.05, 0.2))
    frame = bpy.context.active_object
    frame.scale = (2.05, 0.02, 1.35)
    frame.data.materials.append(emission("HudBorder", cyan, 6))

    bpy.ops.object.light_add(type="AREA", location=(2.4, -2.2, 3.2))
    key = bpy.context.active_object
    key.data.energy = 180 * float(params.get("keyLight", 1.1))
    key.data.color = cyan
    bpy.ops.object.light_add(type="POINT", location=(-2.1, 1.6, 1.4))
    rim = bpy.context.active_object
    rim.data.energy = 90 * float(params.get("rimLight", 2.2))
    rim.data.color = crimson

    bpy.ops.object.camera_add(location=(0, -4.6, 1.7))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(72), 0, 0)
    scene.camera = cam
    cam.keyframe_insert("location", frame=1)
    cam.location = Vector((0.35, -4.2, 1.55))
    cam.keyframe_insert("location", frame=48)

    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    build(load_params())
