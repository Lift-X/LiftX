use crate::weight::WeightType;

#[derive(Debug)]
pub struct Exercise {
    pub name: &'static str,
    pub MUSCLE_SUB_GROUPS: &'static [&'static str], // https://stackoverflow.com/questions/42764016/creating-a-static-const-vecstring
    pub recommended_rep_range: [u32; 2],
}

#[derive(Debug)]
pub struct ExerciseEntry {
    pub exercise: Exercise,
    pub reps: u32,
    pub weight: f32,
    pub weight_unit: WeightType,
    pub comments: String,
}

pub const EXERCISE_BENCH_PRESS: Exercise = Exercise {
    name: "Bench Press",
    MUSCLE_SUB_GROUPS: &["Pectoralis Major", "Pectoralis Minor"],
    recommended_rep_range: [8, 12],
};
