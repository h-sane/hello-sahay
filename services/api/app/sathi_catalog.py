"""What a Sahay Sathi helper can offer: the service categories, their skills, and the default price of one booking."""
import re

SKILLS_CATALOG: dict[str, list[str]] = {
    "Personal Caretaker": [
        "Elderly Care",
        "Bedridden Patient Care",
        "Post-Surgery Assistance",
        "Mobility & Walking Support",
        "Vital Signs Monitoring",
        "Medication Reminders",
        "Bathing & Grooming",
        "Feeding Assistance",
        "Special Needs Care",
        "Companionship",
    ],
    "House Cleaning": [
        "Deep Cleaning",
        "Kitchen Sanitization",
        "Bathroom Disinfection",
        "Floor Mopping & Polishing",
        "Dusting & Vacuuming",
        "Balcony & Window Cleaning",
        "Appliance Cleaning",
        "Garbage Disposal",
        "Post-Renovation Cleaning",
    ],
    "Technical Support": [
        "Plumbing Repairs",
        "Water Pipe Leakage Fix",
        "Water Filter Installation & Service",
        "Electrical Wiring & Switches",
        "Appliance Repair (Mixer, Fan, Geyser)",
        "Drain Cleaning",
        "Basic Household Maintenance",
        "Carpentry & Door Lock Repair",
        "RO Plant Servicing",
    ],
    "Care Support": [
        "Hospital Escort & Transport",
        "Night Attendant",
        "Medicine & Lab Pickup",
        "Ambulance & Emergency Coordination",
    ],
}

ALL_PREDEFINED_SKILLS: list[dict[str, str]] = [
    {"category": cat, "skill": skill} for cat, skills in SKILLS_CATALOG.items() for skill in skills
]

# One booking's price when the helper has set none: (rupees, label shown to the patient).
CATEGORY_RATE: dict[str, tuple[int, str]] = {
    "Personal Caretaker": (750, "₹750 / day"),
    "House Cleaning": (3999, "₹3,999 / month"),
    "Technical Support": (299, "₹299 / visit"),
    "Care Support": (0, "Price agreed with the helper"),
}

KEYWORDS: dict[str, list[str]] = {
    "Elderly Care": ["elderly", "old age", "senior", "grandma", "grandpa", "elder"],
    "Bedridden Patient Care": ["bedridden", "paralyzed", "bed rest", "stroke", "immobile"],
    "Post-Surgery Assistance": ["surgery", "operation", "post-op", "recovery", "dressing"],
    "Mobility & Walking Support": ["walking", "mobility", "wheelchair", "walker", "exercise"],
    "Vital Signs Monitoring": ["bp", "blood pressure", "pulse", "sugar", "vital signs", "temperature"],
    "Medication Reminders": ["medicine", "medicines", "pills", "tablet", "dosage", "remind"],
    "Bathing & Grooming": ["bath", "bathing", "sponge", "grooming", "diaper", "hygiene"],
    "Feeding Assistance": ["feeding", "feed", "food", "cook", "liquid diet", "meal"],
    "Special Needs Care": ["dementia", "alzheimer", "special needs", "autism", "disability"],
    "Deep Cleaning": ["deep clean", "deep cleaning", "thorough clean", "heavy cleaning"],
    "Kitchen Sanitization": ["kitchen", "grease", "chimney", "dish", "utensil"],
    "Bathroom Disinfection": ["bathroom", "toilet", "washroom", "tiles", "disinfect"],
    "Floor Mopping & Polishing": ["mopping", "floor", "sweeping", "broom", "polish"],
    "Dusting & Vacuuming": ["dusting", "vacuum", "cobweb", "curtain", "sofa cleaning"],
    "Plumbing Repairs": ["plumbing", "plumber", "water pipe", "tap", "faucet", "valve"],
    "Water Pipe Leakage Fix": ["leak", "leakage", "pipe leak", "burst pipe", "joint leak"],
    "Water Filter Installation & Service": ["water filter", "purifier", "filter install", "filter repair"],
    "Electrical Wiring & Switches": ["electric", "electrical", "wiring", "switch", "mcb", "fuse"],
    "Appliance Repair (Mixer, Fan, Geyser)": ["fan", "geyser", "mixer", "heater", "appliance"],
    "Drain Cleaning": ["drain", "blockage", "clog", "sink block", "drainage"],
    "Basic Household Maintenance": ["maintenance", "household", "handyman"],
    "Carpentry & Door Lock Repair": ["carpenter", "door", "lock", "hinges", "wood", "furniture"],
    "Hospital Escort & Transport": ["escort", "hospital visit", "transport", "ambulance standby"],
    "Night Attendant": ["night duty", "night attendant", "overnight"],
    "Medicine & Lab Pickup": ["pickup", "courier", "delivery", "lab sample"],
}


def category_of(skill: str) -> str | None:
    return next((cat for cat, skills in SKILLS_CATALOG.items() if skill in skills), None)


def match_skills(description: str) -> list[str]:
    """Catalog skills whose keywords appear in the helper's free-form description, as whole words."""
    text = description.lower()
    return [skill for skill, words in KEYWORDS.items() if any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)]
