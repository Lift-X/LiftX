mod weight;
mod workouts;

use weight::WeightType;
use workouts::Exercise;
use workouts::ExerciseEntry;

// Global Preference for weight, implement configuration later
const global_weight_unit: WeightType = weight::Pounds;

fn main() {
    let bench_press = ExerciseEntry {
        exercise: Exercise {
            name: "Bench Press".to_string(),
            MUSCLE_SUB_GROUPS: vec!["Pectoralis Major".to_string()],
            recommended_rep_range: [8, 12],
        },
        reps: 8,
        weight: 135.0,
        comments: "".to_string(),
        weight_unit: global_weight_unit,
    };
    println!(
        "{} was done for {} reps with {}{}",
        bench_press.exercise.name,
        bench_press.reps,
        bench_press.weight,
        global_weight_unit.short_name
    );
}
