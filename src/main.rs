// clippy
#![allow(clippy::dead_code)]

#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;

use equipment::WeightType;
use rocket_db_pools::Database;
use sqlx::ConnectOptions;

use crate::{database::create_connection, equipment::Weight, handlers::hello};

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

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
        comments: String::from(""),
        sets: vec![bench_press],
    };
    for i in 0..2 {
        bench_set.sets.push(bench_press);
    }
    //println!("{}", exercises::exercise_to_string_summary(&bench_set));
    let stringed_bench = exercises::exercise_to_string_summary(&bench_set);

    // connect to DB
    let mut conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect()
            .await
            .unwrap();

    //28fcad1c-0f5b-49d1-8d5c-2286f15ff99a

    println!("{}", exercise_to_string_parseable(&bench_set));

    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount("/", routes![hello])
}
