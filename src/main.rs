mod workouts;

use workouts::ExerciseEntry;
use workouts::Exercise;
use workouts::WeightUnit;

// Global Preference for weight, implement configuration later
const global_weight_unit: WeightUnit = crate::workouts::WeightUnit::Pounds;

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
    println!("{} was done for {} reps with {} lbs", bench_press.exercise.name, bench_press.reps, bench_press.weight);
}
