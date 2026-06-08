from __future__ import annotations

"""Static curriculum seed data (ported from frontend/lib/mock-data.ts)."""

ASL_ALPHABET_VIDEO = "tbYVH7jUX0A"

LETTER_DESCRIPTIONS = {
    "A": "Make a fist with thumb resting alongside.",
    "B": "Flat hand, fingers together, thumb across palm.",
    "C": "Curved hand like holding a cup.",
    "D": "Index up, other fingers touch thumb tip.",
    "E": "Fingers curled down, thumb across fingertips.",
    "F": "Index and thumb form a circle, other fingers up.",
    "G": "Index and thumb point sideways like a gun.",
    "H": "Index and middle finger point sideways together.",
    "I": "Pinky finger up, other fingers in fist.",
    "J": "Pinky traces a J shape in the air.",
    "K": "Index and middle up in V, thumb between them.",
    "L": "Index and thumb form an L shape.",
    "M": "Three fingers over thumb tucked in palm.",
    "N": "Index and middle over thumb in palm.",
    "O": "Fingers and thumb form a round O shape.",
    "P": "Like K but pointing down.",
    "Q": "Index and thumb point down sideways.",
    "R": "Index and middle crossed.",
    "S": "Fist with thumb over fingers.",
    "T": "Thumb between index and middle in fist.",
    "U": "Index and middle up together.",
    "V": "Index and middle up in a V shape.",
    "W": "Index, middle, and ring fingers up.",
    "X": "Index finger hooks over bent middle finger.",
    "Y": "Thumb and pinky out, other fingers down.",
    "Z": "Index finger draws a Z in the air.",
}


def _demo(letter: str, desc: str | None = None) -> dict:
    return {
        "id": f"demo-{letter.lower()}",
        "type": "demo",
        "sign_word": letter,
        "sign_description": desc or LETTER_DESCRIPTIONS.get(letter, ""),
        "content_type": "letter",
    }


def _camera(letter: str, desc: str | None = None) -> dict:
    return {
        "id": f"camera-{letter.lower()}",
        "type": "camera",
        "sign_word": letter,
        "sign_description": desc or LETTER_DESCRIPTIONS.get(letter, ""),
        "content_type": "letter",
    }


def _quiz(letter: str, distractors: list[str]) -> dict:
    options = sorted([letter] + distractors)
    return {
        "id": f"quiz-{letter.lower()}",
        "type": "quiz",
        "sign_word": letter,
        "sign_description": LETTER_DESCRIPTIONS.get(letter, ""),
        "content_type": "letter",
        "options": options,
        "correct_answer": letter,
    }


def _name_demo(name: str, desc: str) -> dict:
    return {
        "id": f"demo-{name.lower()}",
        "type": "demo",
        "sign_word": name,
        "sign_description": desc,
        "content_type": "name",
    }


def _name_camera(name: str, desc: str) -> dict:
    return {
        "id": f"camera-{name.lower()}",
        "type": "camera",
        "sign_word": name,
        "sign_description": desc,
        "content_type": "name",
    }


UNITS_DATA: list[dict] = [
    {
        "id": "unit-1",
        "title": "Alphabet I",
        "description": "Letters A through I",
        "sort_order": 0,
        "lessons": [
            {
                "id": "lesson-1",
                "title": "A – E",
                "description": "Learn your first five letters",
                "xp_reward": 50,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("A"),
                    _camera("A", "Make a fist — thumb alongside."),
                    _demo("B"),
                    _quiz("B", ["D", "P", "R"]),
                    _demo("C"),
                    _camera("C", "Curved hand like a cup."),
                    _demo("D"),
                    _quiz("D", ["B", "F", "T"]),
                    _demo("E"),
                    _camera("E", "Fingertips to thumb."),
                ],
            },
            {
                "id": "lesson-2",
                "title": "F – I",
                "description": "Finish the first half of the alphabet",
                "xp_reward": 50,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("F"),
                    _camera("F", "Index and thumb circle."),
                    _demo("G"),
                    _quiz("G", ["H", "Q", "P"]),
                    _demo("H"),
                    _camera("H", "Two fingers point sideways."),
                    _demo("I"),
                    _quiz("I", ["J", "Y", "L"]),
                    _camera("I", "Pinky up, fist closed."),
                ],
            },
        ],
    },
    {
        "id": "unit-2",
        "title": "Alphabet II",
        "description": "Letters J through R",
        "sort_order": 1,
        "lessons": [
            {
                "id": "lesson-3",
                "title": "J – N",
                "description": "Mid-alphabet letters",
                "xp_reward": 50,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("J"),
                    _camera("J", "Pinky traces a J in the air."),
                    _demo("K"),
                    _quiz("K", ["U", "V", "P"]),
                    _demo("L"),
                    _camera("L", "Index and thumb form L."),
                    _demo("M"),
                    _quiz("M", ["N", "T", "S"]),
                    _demo("N"),
                    _camera("N", "Two fingers over thumb."),
                ],
            },
            {
                "id": "lesson-4",
                "title": "O – R",
                "description": "Round and crossed shapes",
                "xp_reward": 50,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("O"),
                    _camera("O", "Round O with fingers and thumb."),
                    _demo("P"),
                    _quiz("P", ["K", "Q", "G"]),
                    _demo("Q"),
                    _camera("Q", "Index and thumb point down."),
                    _demo("R"),
                    _quiz("R", ["U", "V", "K"]),
                    _camera("R", "Crossed index and middle."),
                ],
            },
        ],
    },
    {
        "id": "unit-3",
        "title": "Alphabet III & Names",
        "description": "Letters S through Z, then spell names",
        "sort_order": 2,
        "lessons": [
            {
                "id": "lesson-5",
                "title": "S – X",
                "description": "The home stretch of the alphabet",
                "xp_reward": 50,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("S"),
                    _camera("S", "Fist with thumb over fingers."),
                    _demo("T"),
                    _quiz("T", ["N", "M", "S"]),
                    _demo("U"),
                    _camera("U", "Two fingers up together."),
                    _demo("V"),
                    _quiz("V", ["U", "W", "K"]),
                    _demo("W"),
                    _camera("W", "Three fingers up."),
                    _demo("X"),
                    _camera("X", "Index crosses bent middle finger."),
                ],
            },
            {
                "id": "lesson-6",
                "title": "Y, Z & Names",
                "description": "Finish the alphabet and spell names",
                "xp_reward": 60,
                "youtube_id": ASL_ALPHABET_VIDEO,
                "exercises": [
                    _demo("Y"),
                    _camera("Y", "Thumb and pinky out."),
                    _demo("Z"),
                    _quiz("Z", ["J", "G", "S"]),
                    _camera("Z", "Draw a Z in the air."),
                    _name_demo("ALEX", "Spell each letter: A-L-E-X slowly."),
                    _name_camera("ALEX", "Fingerspell the name ALEX."),
                    _name_demo("SAM", "Three letters: S-A-M with clear transitions."),
                    _name_camera("SAM", "Fingerspell the name SAM."),
                ],
            },
        ],
    },
]
