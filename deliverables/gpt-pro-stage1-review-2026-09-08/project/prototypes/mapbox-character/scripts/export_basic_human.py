"""Export the bundled Blender source as a complete, animated GLB.

Run from this prototype directory:
  /Applications/Blender.app/Contents/MacOS/Blender \
    -b public/models/basic-human/human.blend \
    --python scripts/export_basic_human.py

The source mesh uses a Mirror modifier. Blender's glTF exporter did not include
the mirrored half in the first conversion, so the modifier must be applied
before export while the Armature modifier remains live.
"""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/models/basic-human/human.glb"

mesh = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)

mirror = next((modifier for modifier in mesh.modifiers if modifier.type == "MIRROR"), None)
if mirror is None:
    raise RuntimeError("Expected a Mirror modifier on the source character mesh")

bpy.ops.object.modifier_apply(modifier=mirror.name)

material = bpy.data.materials.get("Prototype White") or bpy.data.materials.new("Prototype White")
material.diffuse_color = (0.8, 0.8, 0.8, 1.0)
if mesh.data.materials:
    mesh.data.materials[0] = material
else:
    mesh.data.materials.append(material)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_extra_animations=True,
    export_skins=True,
    export_morph=True,
)

print(f"Exported complete character to {OUTPUT}")
