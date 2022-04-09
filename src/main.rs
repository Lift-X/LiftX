pub mod equipment;
mod exercises;
pub mod muscles;

use axum::{
    body::Body,
    http::Request,
    Router,
    service
};
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
    let mut bench_set = ExerciseEntry {
        exercise: EXERCISE_BENCH_PRESS,
        sets: vec![bench_press],
        comments: String::from(""),
    };
    for i in 0..2 {
        bench_set.sets.push(bench_press);
    }
    /*println!(
        "{} was done for {} reps with {}{} and {} reps in reserve",
        bench_press.exercise.name,
        bench_press.reps,
        bench_press.weight,
        GLOBAL_WEIGHT_UNIT.short_name,
        bench_press.reps_in_reserve
    );*/
    println!("{}", exercises::exercise_to_string_summary(&bench_set));
    let stringed_bench = exercises::exercise_to_string_summary(&bench_set);

    let mut router = Router::new().route(
        "/",
        service::any(service_fn(|_: Request<Body>| async {
            let res = Response::new(Body::from("Hi from `GET /`"));
            Ok(res)
        })),
    );
}
