pub mod equipment;
pub mod muscles;
mod exercises;

use equipment::WeightType;

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

fn main() {
    let bench_press = SetEntry {
        exercise: EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: 135.0,
        weight_unit: GLOBAL_WEIGHT_UNIT,
        reps_in_reserve: 1.5,
    };
    println!(
        "{} was done for {} reps with {}{} and {} reps in reserve",
        bench_press.exercise.name,
        bench_press.reps,
        bench_press.weight,
        GLOBAL_WEIGHT_UNIT.short_name,
        bench_press.reps_in_reserve
    );
}
