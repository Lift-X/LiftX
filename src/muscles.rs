use serde::{Serialize, Deserialize};

#[allow(dead_code)]
type MuscleGroup = Vec<&'static str>;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MuscleSubGroup {
    pub name: &'static str,
}

pub const PectoralisMajor: MuscleSubGroup = MuscleSubGroup {
    name: "Pectoralis Major",
};
pub const PectoralisMinor: MuscleSubGroup = MuscleSubGroup {
    name: "Pectoralis Minor",
};
pub const Deltoid: MuscleSubGroup = MuscleSubGroup {
    name: "Deltoid",
};
pub const LatissimusDorsi: MuscleSubGroup = MuscleSubGroup {
    name: "Latissimus Dorsi",
};
pub const Trapezius: MuscleSubGroup = MuscleSubGroup {
    name: "Trapezius",
};
pub const Biceps: MuscleSubGroup = MuscleSubGroup {
    name: "Biceps",
};
pub const Triceps: MuscleSubGroup = MuscleSubGroup {
    name: "Triceps",
};
pub const Forearms: MuscleSubGroup = MuscleSubGroup {
    name: "Forearms",
};
pub const Quadriceps: MuscleSubGroup = MuscleSubGroup {
    name: "Quadriceps",
};
pub const Calves: MuscleSubGroup = MuscleSubGroup {
    name: "Calves",
};
pub const Hamstrings: MuscleSubGroup = MuscleSubGroup {
    name: "Hamstrings",
};
pub const Glutes: MuscleSubGroup = MuscleSubGroup {
    name: "Glutes",
};
pub const Obliques: MuscleSubGroup = MuscleSubGroup {
    name: "Obliques",
};



// just an example for now. Complete this later
#[allow(dead_code)]
pub const MUSCLE_SUB_GROUPS: [MuscleSubGroup; 13] = [
    PectoralisMajor, // Chest, Shoulders
    PectoralisMinor, // Chest
    Deltoid,          // Shoulders
    LatissimusDorsi, // Back
    Trapezius,        // Back
    Biceps,           // Arms
    Triceps,          // Arms
    Forearms,         // Arms
    Quadriceps,       // Legs
    Calves,           // Legs
    Hamstrings,       // Legs
    Glutes,           // Legs
    Obliques,         // Abdominals
];

#[allow(dead_code)]
const CHEST: [MuscleSubGroup; 2] = [PectoralisMajor, PectoralisMinor];
#[allow(dead_code)]
const SHOULDERS: [MuscleSubGroup; 2] = [PectoralisMinor, Deltoid];
#[allow(dead_code)]
const BACK: [MuscleSubGroup; 2] = [LatissimusDorsi, Trapezius];
#[allow(dead_code)]
const ARMS: [MuscleSubGroup; 3] = [Biceps, Triceps, Forearms];
#[allow(dead_code)]
const LEGS: [MuscleSubGroup; 4] = [Quadriceps, Calves, Hamstrings, Glutes];
#[allow(dead_code)]
const ABDOMINALS: [MuscleSubGroup; 1] = [Obliques];
