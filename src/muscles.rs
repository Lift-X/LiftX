use serde::{Serialize, Deserialize};

#[allow(dead_code)]
type MuscleGroup = Vec<&'static str>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct MuscleSubGroup {
    pub name: &'static str,
}

pub const NONE: MuscleSubGroup = MuscleSubGroup { name: "None" };
pub const PECTORALIS_MAJOR: MuscleSubGroup = MuscleSubGroup {
    name: "Pectoralis Major",
};
pub const PECTORALIS_MINOR: MuscleSubGroup = MuscleSubGroup {
    name: "Pectoralis Minor",
};
pub const DELTOID: MuscleSubGroup = MuscleSubGroup {
    name: "Deltoid",
};
pub const LATISSIMUS_DORSI: MuscleSubGroup = MuscleSubGroup {
    name: "Latissimus Dorsi",
};
pub const TRAPEZIUS: MuscleSubGroup = MuscleSubGroup {
    name: "Trapezius",
};
pub const BICEPS: MuscleSubGroup = MuscleSubGroup {
    name: "Biceps",
};
pub const TRICEPS: MuscleSubGroup = MuscleSubGroup {
    name: "Triceps",
};
pub const FOREARMS: MuscleSubGroup = MuscleSubGroup {
    name: "Forearms",
};
pub const QUADRICEPS: MuscleSubGroup = MuscleSubGroup {
    name: "Quadriceps",
};
pub const CALVES: MuscleSubGroup = MuscleSubGroup {
    name: "Calves",
};
pub const HAMSTRINGS: MuscleSubGroup = MuscleSubGroup {
    name: "Hamstrings",
};
pub const GLUTES: MuscleSubGroup = MuscleSubGroup {
    name: "Glutes",
};
pub const OBLIQUES: MuscleSubGroup = MuscleSubGroup {
    name: "Obliques",
};



// just an example for now. Complete this later
#[allow(dead_code)]
pub const MUSCLE_SUB_GROUPS: [MuscleSubGroup; 14] = [
    PECTORALIS_MAJOR, // Chest, Shoulders
    PECTORALIS_MINOR, // Chest
    DELTOID,          // Shoulders
    LATISSIMUS_DORSI, // Back
    TRAPEZIUS,        // Back
    BICEPS,           // Arms
    TRICEPS,          // Arms
    FOREARMS,         // Arms
    QUADRICEPS,       // Legs
    CALVES,           // Legs
    HAMSTRINGS,       // Legs
    GLUTES,           // Legs
    OBLIQUES,         // Abdominals
    NONE,
];

#[allow(dead_code)]
const CHEST: [MuscleSubGroup; 2] = [PECTORALIS_MAJOR, PECTORALIS_MINOR];
#[allow(dead_code)]
const SHOULDERS: [MuscleSubGroup; 2] = [PECTORALIS_MINOR, DELTOID];
#[allow(dead_code)]
const BACK: [MuscleSubGroup; 2] = [LATISSIMUS_DORSI, TRAPEZIUS];
#[allow(dead_code)]
const ARMS: [MuscleSubGroup; 3] = [BICEPS, TRICEPS, FOREARMS];
#[allow(dead_code)]
const LEGS: [MuscleSubGroup; 4] = [QUADRICEPS, CALVES, HAMSTRINGS, GLUTES];
#[allow(dead_code)]
const ABDOMINALS: [MuscleSubGroup; 1] = [OBLIQUES];
