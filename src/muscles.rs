type MUSCLE_GROUP = Vec<&'static str>;

// just an example for now. Complete this later
const MUSCLE_SUB_GROUPS: [&'static str; 13] = [
    "Pectoralis Major", // Chest, Shoulders
    "Pectoralis Minor", // Chest
    "Deltoid",          // Shoulders
    "Latissimus Dorsi", // Back
    "Trapezius",        // Back
    "Biceps",           // Arms
    "Triceps",          // Arms
    "Forearms",         // Arms
    "Quadriceps",       // Legs
    "Calves",           // Legs
    "Hamstrings",       // Legs
    "Glutes",           // Legs
    "Obliques",         // Abdominals
];
const Chest: [&str; 2] = ["Pectoralis Major", "Pectoralis Minor"];
const Shoulders: [&str; 2] = ["Pectoralis Minor", "Deltoid"];
const Back: [&str; 2] = ["Latissimus Dorsi", "Trapezius"];
const Arms: [&str; 3] = ["Biceps", "Triceps", "Forearms"];
const Legs: [&str; 4] = ["Quadriceps", "Calves", "Hamstrings", "Glutes"];
const Abdominals: [&str; 1] = ["Obliques"];
