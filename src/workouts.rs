#[derive(Debug)]
pub enum WeightUnit {
    Pounds,
    Kilograms,
}

#[derive(Debug)]
pub struct Exercise {
    pub name: String,
    pub MUSCLE_SUB_GROUPS: Vec<String>,
    pub recommended_rep_range: [u32; 2],
}

#[derive(Debug)]
pub struct ExerciseEntry {
    pub exercise: Exercise,
    pub reps: u32,
    pub weight: f32,
    pub weight_unit: WeightUnit,
    pub comments: String,
}

type MUSCLE_GROUP = Vec<String>;

// just an example for now. Complete this later
const MUSCLE_SUB_GROUPS: [&str; 13] = [
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
