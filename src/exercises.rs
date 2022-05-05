use crate::equipment::{self, EquipmentType, Weight};

/// A Single Excercise, allows for metadata such as affected muscle groups, equipment used, etc.
#[derive(Debug, Copy, Clone)]
pub struct Exercise {
    pub name: &'static str,
    pub muscle_sub_groups: &'static [&'static str], // https://stackoverflow.com/questions/42764016/creating-a-static-const-vecstring
    pub recommended_rep_range: [u32; 2],
    pub equipment: &'static EquipmentType,
}

/// "Set" as in a set of reps, not the verb "set"
#[derive(Debug, Clone)]
pub struct SetEntry {
    pub exercise: Exercise,
    pub reps: u32,
    pub weight: Weight,
    pub reps_in_reserve: f32, // how many more reps you feel you could've done
}

/// ExerciseEntry is a collection of sets
#[derive(Debug, Clone)]
pub struct ExerciseEntry {
    pub exercise: Exercise,
    pub comments: String,
    pub sets: Vec<SetEntry>,
}

// Absolutely scuffed, feel free to PR :D
impl ExerciseEntry {
    pub fn from_string(string: &str) -> ExerciseEntry {
        // iter over string, separated by;
        let split = string.split_terminator(';').collect::<Vec<_>>();
        let mut gen_set_entry: ExerciseEntry = ExerciseEntry {
            exercise: Exercise {
                name: "",
                muscle_sub_groups: &[],
                recommended_rep_range: [0, 0],
                equipment: &equipment::NONE,
            },
            comments: "".to_string(),
            sets: vec![],
        };

        // iterate over excercises, see if "split[0]" is in the name of an exercise
        // could be very taxing as list of exercises grows.. maybe use a hashmap?
        for excercise in EXCERCISES_LIST {
            let mut gen_vec = Vec::new();
            if excercise.name == split[0] {
                for set in split[1..].iter() {
                    let proc_set = set.split_terminator(',').collect::<Vec<_>>();
                    let gen_set = SetEntry {
                        exercise: excercise,
                        reps: proc_set[0].parse::<u32>().unwrap(),
                        weight: Weight::from_string(proc_set[1]).expect("Invalid weight"),
                        reps_in_reserve: proc_set[2].parse::<f32>().unwrap(),
                    };
                    gen_vec.push(gen_set);
                }
                gen_set_entry = ExerciseEntry {
                    exercise: excercise,
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
                set.reps, set.weight.weight, set.weight.weight_unit.short_name, set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }

    pub fn to_string_readable(&self) -> String {
        let mut stringified_exercise = self.exercise.name.to_string();
        for set in self.sets.iter() {
            let _a = format!(
                " - {} Reps ({}{}, {}RiR)",
                set.reps, set.weight.weight, set.weight.weight_unit.short_name, set.reps_in_reserve
            );
            stringified_exercise.push_str(&_a);
        }
        return stringified_exercise.trim().to_string();
    }
}

/// WorkoutEntry is a collection of exercise entries
#[derive(Debug, Clone)]
pub struct WorkoutEntry {
    pub date: String,
    pub exercises: Vec<ExerciseEntry>,
    pub comments: String,
    pub user: String,
}

pub const EXCERCISES_LIST: [Exercise; 2] = [EXERCISE_BENCH_PRESS, EXERCISE_DUMBBELL_BENCH_PRESS];

pub const EXERCISE_BENCH_PRESS: Exercise = Exercise {
    name: "Bench Press",
    muscle_sub_groups: &["Pectoralis Major", "Pectoralis Minor"],
    recommended_rep_range: [8, 12],
    equipment: &equipment::BARBELL,
};

pub const EXERCISE_DUMBBELL_BENCH_PRESS: Exercise = Exercise {
    name: "Dumbbell Bench Press",
    muscle_sub_groups: &["Pectoralis Major", "Pectoralis Minor"],
    recommended_rep_range: [8, 12],
    equipment: &equipment::DUMBBELLS,
};
