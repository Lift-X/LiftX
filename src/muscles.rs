#[allow(dead_code)]
type MuscleGroup = Vec<&'static str>;

// just an example for now. Complete this later
#[allow(dead_code)]
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

#[allow(dead_code)]
const CHEST: [&str; 2] = ["Pectoralis Major", "Pectoralis Minor"];
#[allow(dead_code)]
const SHOULDERS: [&str; 2] = ["Pectoralis Minor", "Deltoid"];
#[allow(dead_code)]
const BACK: [&str; 2] = ["Latissimus Dorsi", "Trapezius"];
#[allow(dead_code)]
const ARMS: [&str; 3] = ["Biceps", "Triceps", "Forearms"];
#[allow(dead_code)]
const LEGS: [&str; 4] = ["Quadriceps", "Calves", "Hamstrings", "Glutes"];
#[allow(dead_code)]
const ABDOMINALS: [&str; 1] = ["Obliques"];
