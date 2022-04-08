pub mod weight;
pub mod muscles;
mod exercises;

use weight::WeightType;

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = weight::POUNDS;

fn main() {
    let bench_press = ExerciseEntry {
        exercise: EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: 135.0,
        comments: "".to_string(),
        weight_unit: GLOBAL_WEIGHT_UNIT,
    };
    println!(
        "{} was done for {} reps with {}{}",
        bench_press.exercise.name,
        bench_press.reps,
        bench_press.weight,
        GLOBAL_WEIGHT_UNIT.short_name
    );
}
