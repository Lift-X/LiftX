use ordered_float::OrderedFloat;

use crate::{
    equipment::{self, Weight, WeightType, EQUIPMENT_LIST, KILOGRAMS, POUNDS},
    exercises::{self, ExerciseEntry, SetEntry, WorkoutEntry},
    muscles,
};

/*#[tokio::test]
async fn test_rocket_and_handlers() {
    let rocket = launch_web().await;
    assert!(rocket.is_ok());
}
*/

#[test]
fn test_weight_from_string_lbs() {
    let weight = Weight::from_string("100lbs").unwrap();
    assert_eq!(weight.weight, 100.0);
    assert_eq!(
        WeightType::from_string(&weight.weight_unit).unwrap(),
        POUNDS
    );
}

#[test]
fn test_weight_from_string_kgs() {
    let weight = Weight::from_string("100kgs").unwrap();
    assert_eq!(weight.weight, 100.0);
    assert_eq!(
        WeightType::from_string(&weight.weight_unit).unwrap(),
        KILOGRAMS
    );
}

#[test]
fn test_weight_from_string_fail() {
    let weight = Weight::from_string("FAIL");
    assert!(weight.is_err());
}

#[test]
fn test_weight_to_kilograms() {
    let weight = Weight {
        weight: 45.0,
        weight_unit: "lbs".to_string(),
    };
    assert_eq!(
        OrderedFloat(weight.to_kilograms().unwrap()),
        OrderedFloat(20.411655)
    );
}

#[test]
fn test_weight_to_pounds() {
    let weight = Weight {
        weight: 25.0,
        weight_unit: "kgs".to_string(),
    };
    assert_eq!(
        OrderedFloat(weight.to_pounds().unwrap()),
        OrderedFloat(55.115574)
    );
}

#[test]
fn test_weight_type_from_string() {
    assert_eq!(WeightType::from_string("kgs").unwrap(), KILOGRAMS);
    assert_eq!(WeightType::from_string("lbs").unwrap(), POUNDS);
    assert!(WeightType::from_string("ERROR").is_err());
}

#[test]
fn test_parse_equipment() {
    for equipment in EQUIPMENT_LIST {
        assert!(equipment.name.is_ascii());
        match equipment.rep_multiplier {
            0 => assert_eq!(equipment.rep_multiplier, 0),
            1 => assert_eq!(equipment.rep_multiplier, 1),
            2 => assert_eq!(equipment.rep_multiplier, 2),
            3 => assert_eq!(equipment.rep_multiplier, 3),
            4 => assert_eq!(equipment.rep_multiplier, 4),
            _ => panic!("Invalid rep_multiplier!"),
        }
    }
}

#[test]
fn test_exercise_string_to_exercise() {
    let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5";
    let e = ExerciseEntry::from_string(t);
    assert_eq!(e.exercise, "Bench Press");
    assert_eq!(e.sets[0].reps, 8);
    assert_eq!(e.sets.len(), 3);
    assert_eq!(e.sets[0].weight.weight, 135.0);
    assert_eq!(
        WeightType::from_string(&e.sets[0].weight.weight_unit).unwrap(),
        equipment::POUNDS
    );
    assert_eq!(e.sets[0].reps_in_reserve, 1.5);
}

#[test]
fn test_exercise_to_string() {
    let t = "Bench Press;8,135lbs,1.5;8,135lbs,1.5;8,135lbs,1.5";
    let bench_press = SetEntry {
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: "lbs".to_string(),
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: "Bench Press".to_string(),
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for _i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    assert_eq!(bench_set.to_string(), t);
}

#[test]
fn test_exercise_to_string_summary() {
    let bench_press = SetEntry {
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: "lbs".to_string(),
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: "Bench Press".to_string(),
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for _i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    assert_eq!(
        bench_set.to_string_summary(),
        "Bench Press - 8x135lbs,1.5RiR - 8x135lbs,1.5RiR - 8x135lbs,1.5RiR"
    );
}

#[test]
fn test_workout() {
    let time = std::time::UNIX_EPOCH.elapsed().unwrap().as_secs();
    let time_1hr = time + 3600;
    let uuid = uuid::Uuid::new_v4();
    let bench_press = SetEntry {
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: "lbs".to_string(),
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: "Bench Press".to_string(),
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for _i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    let bench_workout = WorkoutEntry {
        start_time: time,
        end_time: time_1hr,
        exercises: vec![bench_set.clone()],
        user: "John Doe".to_string(),
        uuid: uuid.to_string(),
        title: "test".to_string(),
    };
    assert_eq!(bench_workout.start_time, time);
    assert_eq!(bench_workout.end_time, time_1hr);
    assert_eq!(bench_workout.exercises.len(), 1);
    assert_eq!(bench_workout.exercises[0].exercise, "Bench Press");
    assert_eq!(bench_workout.exercises[0].sets.len(), 3);
    assert_eq!(bench_workout.uuid, uuid.to_string());
    assert_eq!(bench_workout.title, "test".to_string());
}

#[test]
fn test_muscles() {
    for muscle in muscles::MUSCLE_SUB_GROUPS.iter() {
        assert!(muscle.name.is_ascii());
    }
}

/* unused
#[test]
fn test_human_duration() {
    let human: String = util::human_duration(1652314241, 1652317841);
    assert_eq!(human, "1h 0m 0s");
}

#[test]
fn test_time_iso8601() {
    let time = 1652314241;
    let time_iso8601 = util::timestamp_to_iso8601(time);
    assert_eq!(time_iso8601, "2022-05-12 00:10");
}
*/

#[test]
fn test_workout_entry_from_json() {
    let uuid = uuid::Uuid::new_v4();
    let json = exercises::WorkoutEntry::default().to_json(uuid);
    let mut def = WorkoutEntry::default();
    def.uuid = uuid.to_string().to_string();
    assert_eq!(exercises::WorkoutEntry::from_json(&json.to_string()), def);
}

#[test]
fn test_workout_entry_default() {
    let default = exercises::WorkoutEntry::default();
    assert_eq!(default.uuid, "");
    assert_eq!(default.start_time, 0);
    assert_eq!(default.end_time, 0);
    assert_eq!(default.exercises.len(), 0);
    assert_eq!(default.user, "");
}
