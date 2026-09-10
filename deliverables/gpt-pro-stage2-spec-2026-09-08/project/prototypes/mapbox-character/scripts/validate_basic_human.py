"""Validate the structural properties required by the character demo."""

import json
from pathlib import Path
import struct


ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "public/models/basic-human/human.glb"

with MODEL.open("rb") as handle:
    magic, version, _ = struct.unpack("<4sII", handle.read(12))
    if magic != b"glTF" or version != 2:
        raise RuntimeError("Expected a GLB 2.0 file")
    chunk_length, chunk_type = struct.unpack("<II", handle.read(8))
    if chunk_type != 0x4E4F534A:
        raise RuntimeError("Expected the GLB JSON chunk first")
    document = json.loads(handle.read(chunk_length).decode().rstrip("\0 "))

position = document["accessors"][0]
min_x, max_x = position["min"][0], position["max"][0]
if min_x > -0.4 or max_x < 0.4:
    raise RuntimeError(f"Character is missing a mirrored half: x bounds {min_x}..{max_x}")

animation_names = {animation.get("name") for animation in document.get("animations", [])}
required_animations = {"Idle", "Run", "Walk"}
if not required_animations.issubset(animation_names):
    raise RuntimeError(f"Missing animations: {required_animations - animation_names}")

if len(document.get("skins", [])) != 1:
    raise RuntimeError("Expected exactly one character skin")

print(
    "Validated complete character:",
    f"x={min_x:.3f}..{max_x:.3f}",
    f"animations={sorted(animation_names)}",
    "skins=1",
)
