"""Generate 16x16 Minecraft-style PNG textures for the game."""
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(OUT, exist_ok=True)

SIZE = 16

def make(name, pixels, palette):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(pixels):
        for x, ch in enumerate(row):
            if ch == " " or ch == ".":
                continue
            px[x, y] = palette[ch]
    img = img.resize((SIZE * 4, SIZE * 4), Image.NEAREST)
    img.save(os.path.join(OUT, name + ".png"))
    print("wrote", name)

# ---- STEVE (front) ----
steve_palette = {
    "S": (139, 90, 43, 255),   # hair brown
    "F": (245, 201, 160, 255), # face
    "E": (255, 255, 255, 255), # eye white
    "P": (60, 90, 180, 255),   # pupil blue
    "M": (120, 60, 40, 255),   # mouth
    "C": (0, 180, 210, 255),   # cyan shirt
    "A": (245, 201, 160, 255), # arms skin
    "B": (80, 50, 170, 255),   # pants
    "K": (0, 0, 0, 255),       # outline
}
steve = [
    "................",
    "................",
    "...KKKKKKKK.....",
    "..KSSSSSSSSK....",
    "..KSSSSSSSSK....",
    "..KFFFFFFFFK....",
    "..KFEPFFEPFK....",
    "..KFFFFFFFFK....",
    "..KFFFMMFFFK....",
    "..KKKKKKKKKK....",
    "..KACCCCCCAK....",
    "..KACCCCCCAK....",
    "..KACCCCCCAK....",
    "..KKBBBBBBKK....",
    "...KBB..BBK.....",
    "...KK....KK.....",
]
make("steve", steve, steve_palette)

# ---- ZOMBIE ----
zombie_palette = {
    "G": (70, 130, 70, 255),   # green skin
    "D": (50, 100, 50, 255),   # dark green
    "E": (255, 0, 0, 255),     # red eyes
    "M": (30, 60, 30, 255),
    "C": (50, 80, 140, 255),   # shirt
    "B": (60, 40, 100, 255),   # pants
    "K": (0, 0, 0, 255),
}
zombie = [
    "................",
    "................",
    "...KKKKKKKK.....",
    "..KDDDDDDDDK....",
    "..KDGGGGGGDK....",
    "..KGGGGGGGGK....",
    "..KGEEGGEEGK....",
    "..KGGGGGGGGK....",
    "..KGGGMMGGGK....",
    "..KKKKKKKKKK....",
    "..KGCCCCCCGK....",
    "..KGCCCCCCGK....",
    "..KGCCCCCCGK....",
    "..KKBBBBBBKK....",
    "...KBB..BBK.....",
    "...KK....KK.....",
]
make("zombie", zombie, zombie_palette)

# ---- ZOMBIE SCARED (blue flashing) ----
scared_palette = dict(zombie_palette)
scared_palette["G"] = (80, 120, 220, 255)
scared_palette["D"] = (50, 80, 180, 255)
scared_palette["C"] = (40, 60, 160, 255)
scared_palette["E"] = (255, 255, 255, 255)
make("zombie_scared", zombie, scared_palette)

# ---- WALL (cobblestone) ----
wall_palette = {
    "L": (130, 130, 130, 255),
    "M": (100, 100, 100, 255),
    "D": (70, 70, 70, 255),
    "H": (160, 160, 160, 255),
    "K": (40, 40, 40, 255),
}
wall = [
    "KKKKKKKKKKKKKKKK",
    "KLLMMDLLHHMLLDMK",
    "KLHHMDDLHMMLLDDK",
    "KMMDDLLHHMMLLDMK",
    "KDDLLHHMMLLDDMMK",
    "KLLHHMDDLHMMLLDK",
    "KHHMDDLLHMMLLDDK",
    "KMDDLLHHMMLLDMMK",
    "KDLLHHMDDMLLLDMK",
    "KLHHMDDLHMMDDLMK",
    "KHMDDLLHMMLLDDMK",
    "KMDDLLHMMLLDDLMK",
    "KDLLHHMMDLLHHDMK",
    "KLLHHMMDDLLHMMDK",
    "KLHHMMDDLLHHMMDK",
    "KKKKKKKKKKKKKKKK",
]
make("wall", wall, wall_palette)

# ---- CARROT ----
carrot_palette = {
    "O": (255, 140, 0, 255),
    "D": (200, 90, 0, 255),
    "G": (60, 160, 40, 255),
    "H": (40, 120, 30, 255),
    "K": (0, 0, 0, 255),
}
carrot = [
    "................",
    "................",
    "......KGK.......",
    ".....KGHGK......",
    "....KGHHGK......",
    ".....KGKK.......",
    "......KOK.......",
    ".....KOOOK......",
    ".....KODOK......",
    "....KOODOK......",
    "....KODDOK......",
    "....KOODOK......",
    ".....KODK.......",
    "......KOK.......",
    ".......K........",
    "................",
]
make("carrot", carrot, carrot_palette)

# ---- GOLDEN APPLE ----
gold_palette = {
    "Y": (255, 215, 0, 255),
    "O": (230, 170, 0, 255),
    "W": (255, 255, 200, 255),
    "G": (60, 160, 40, 255),
    "B": (100, 60, 20, 255),
    "K": (0, 0, 0, 255),
}
gapple = [
    "................",
    "................",
    "........KBK.....",
    ".......KBGK.....",
    "......KKKKKK....",
    ".....KYYYYYYK...",
    "....KYWYYYOYK...",
    "....KYWYYYOYK...",
    "....KYYYYYOYK...",
    "....KYYYYOOYK...",
    "....KYYYYOOYK...",
    "....KYYYOOYYK...",
    ".....KYOOOYK....",
    "......KKKKK.....",
    "................",
    "................",
]
make("golden_apple", gapple, gold_palette)

# ---- DIAMOND ----
diamond_palette = {
    "C": (100, 230, 255, 255),
    "B": (50, 160, 220, 255),
    "W": (220, 250, 255, 255),
    "K": (0, 40, 80, 255),
}
diamond = [
    "................",
    "................",
    "................",
    ".....KKKKKK.....",
    "....KCWWCCBK....",
    "...KCWCCCCBBK...",
    "..KCWCCCCCCBBK..",
    ".KCCCCCCCCCCBBK.",
    ".KBCCCCCCCCCBBK.",
    "..KBCCCCCCCBBK..",
    "...KBCCCCCBBK...",
    "....KBCCCBBK....",
    ".....KBCBBK.....",
    "......KBBK......",
    ".......KK.......",
    "................",
]
make("diamond", diamond, diamond_palette)

# ---- HEART ----
heart_palette = {
    "R": (220, 30, 30, 255),
    "D": (140, 10, 10, 255),
    "W": (255, 200, 200, 255),
    "K": (0, 0, 0, 255),
}
heart = [
    "................",
    "................",
    "..KKK....KKK....",
    ".KRRRK..KRRRK...",
    "KRWRRRKKRRRRRK..",
    "KRWRRRRRRRRRRK..",
    "KRRRRRRRRRRRRK..",
    "KDRRRRRRRRRRDK..",
    ".KDRRRRRRRRDK...",
    "..KDRRRRRRDK....",
    "...KDRRRRDK.....",
    "....KDRRDK......",
    ".....KDDK.......",
    "......KK........",
    "................",
    "................",
]
make("heart", heart, heart_palette)

print("All textures generated in", OUT)
