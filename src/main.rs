#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;

use std::sync::Arc;

use equipment::WeightType;
use rocket_db_pools::Database;

use crate::{equipment::Weight, handlers::hello};

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;
const DATABASE_IP: &str = "127.0.0.1";
const DATABASE_PORT: u16 = 2003;

#[launch]
async fn rocket() -> _ {
    let bench_press = SetEntry {
        exercise: EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: GLOBAL_WEIGHT_UNIT,
        },
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

    // connect to DB

    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount("/", routes![hello])
}
