use crate::muscles::*;
use crate::{
    equipment::{self, EquipmentType, Weight, WeightType},
    muscles::MuscleSubGroup,
};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// A Single Excercise, allows for metadata such as affected muscle groups, equipment used, etc.
#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
pub struct Exercise<'a> {
    #[serde(borrow)]
    pub name: &'a str,
    pub muscle_sub_groups: [MuscleSubGroup<'a>; 2], // Has to be statically sized in order to implement Copy trait (will have to do for now)
    pub recommended_rep_range: [u32; 2],
    pub equipment: EquipmentType<'a>,
}

/// "Set" as in a set of reps, not the verb "set"
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SetEntry<'a> {
    #[serde(borrow)]
    pub exercise: Exercise<'a>,
    pub reps: u32,
    pub weight: Weight,
    pub reps_in_reserve: f32, // how many more reps you feel you could've done
}

/// ExerciseEntry is a collection of Set Entries
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ExerciseEntry<'a> {
    #[serde(borrow)]
    pub exercise: Exercise<'a>,
    pub comments: String,
    #[serde(borrow)]
    pub sets: Vec<SetEntry<'a>>,
}

/// WorkoutEntry is a collection of exercise entries
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WorkoutEntry<'a> {
    pub start_time: u64,
    pub end_time: u64,
    #[serde(borrow)]
    pub exercises: Vec<ExerciseEntry<'a>>,
    pub comments: String,
    pub user: String,
}

// Absolutely scuffed, feel free to PR :D
impl ExerciseEntry<'_> {
    pub fn from_string(string: &str) -> ExerciseEntry {
        // iter over string, separated by;
        let split = string.split_terminator(';').collect::<Vec<_>>();
        let mut gen_set_entry: ExerciseEntry = ExerciseEntry {
            exercise: Exercise {
                name: "",
                muscle_sub_groups: [crate::muscles::NONE, crate::muscles::NONE],
                recommended_rep_range: [0, 0],
                equipment: equipment::NONE,
            },
            comments: "".to_string(),
            sets: vec![],
        };

        // iterate over excercises, see if "split[0]" is in the name of an exercise
        // could be very taxing as list of exercises grows.. maybe use a hashmap?
        for excercise in EXCERCISES_LIST.iter() {
            let mut gen_vec = Vec::new();
            if excercise.name == split[0] {
                for set in split[1..].iter() {
                    let proc_set = set.split_terminator(',').collect::<Vec<_>>();
                    let gen_set = SetEntry {
                        exercise: *excercise,
                        reps: proc_set[0].parse::<u32>().unwrap(),
                        weight: Weight::from_string(proc_set[1]).expect("Invalid weight"),
                        reps_in_reserve: proc_set[2].parse::<f32>().unwrap(),
                    };
                    gen_vec.push(gen_set);
                }
                gen_set_entry = ExerciseEntry {
                    exercise: *excercise,
                    comments: split[1].to_string(),
                    sets: gen_vec,
                };
                break;
            }
        }
        gen_set_entry
    }

    pub fn to_string(&self) -> String {
        let mut stringified_exercise = self.exercise.name.to_string();
        for set in self.sets.iter() {
            let _a = format!(
                ";{},{}{},{}",
                set.reps,
                set.weight.weight,
                WeightType::from_string(&set.weight.weight_unit)
                    .expect("Invalid Weight Type!")
                    .short_name,
                set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_string_summary(&self) -> String {
        let mut stringified_exercise = self.exercise.name.to_string();
        for set in self.sets.iter() {
            let _a = format!(
                "- {}x{}{},{}RiR",
                set.reps,
                set.weight.weight,
                WeightType::from_string(&set.weight.weight_unit)
                    .expect("Invalid Weight Type!")
                    .short_name,
                set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_json(&self) -> serde_json::Value {
        json! {self}
    }

    pub fn from_json(string: &str) -> ExerciseEntry {
        let exercise: ExerciseEntry = serde_json::from_str(string).unwrap();
        exercise
    }
}

impl WorkoutEntry<'_> {
    pub fn to_json(&self) -> serde_json::Value {
        json! {self}
    }

    pub fn from_json(string: &str) -> WorkoutEntry {
        let workout: WorkoutEntry = serde_json::from_str(string).unwrap();
        workout
    }
}

lazy_static! {
    #[derive(Clone, Copy, Serialize, Deserialize)]
    pub static ref EXCERCISES_LIST: [Exercise<'static>; 2] = [EXERCISE_BENCH_PRESS.to_owned(), EXERCISE_DUMBBELL_BENCH_PRESS.to_owned()];
}

lazy_static! {
    pub static ref EXERCISE_BLANK: Exercise<'static> = Exercise {
        name: "",
        muscle_sub_groups: [crate::muscles::NONE, crate::muscles::NONE],
        recommended_rep_range: [0, 0],
        equipment: equipment::NONE,
    };
}

lazy_static! {
    pub static ref EXERCISE_BENCH_PRESS: Exercise<'static> = Exercise {
        name: "Bench Press",
        muscle_sub_groups: [PECTORALIS_MAJOR, PECTORALIS_MINOR].into(),
        recommended_rep_range: [8, 12],
        equipment: equipment::BARBELL,
    };
}

lazy_static! {
    pub static ref EXERCISE_DUMBBELL_BENCH_PRESS: Exercise<'static> = Exercise {
        name: "Dumbbell Bench Press",
        muscle_sub_groups: [PECTORALIS_MAJOR, PECTORALIS_MINOR].into(),
        recommended_rep_range: [8, 12],
        equipment: equipment::DUMBBELLS,
    };
}
