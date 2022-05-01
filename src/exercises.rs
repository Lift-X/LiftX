use crate::equipment::{self, EquipmentType, Weight};

#[derive(Debug, Copy, Clone)]
pub struct Exercise {
    pub name: &'static str,
    pub muscle_sub_groups: &'static [&'static str], // https://stackoverflow.com/questions/42764016/creating-a-static-const-vecstring
    pub recommended_rep_range: [u32; 2],
    pub equipment: &'static EquipmentType,
}

// "Set" as in a set of reps, not the verb "set"
#[derive(Debug, Clone, Copy)]
pub struct SetEntry {
    pub exercise: Exercise,
    pub reps: u32,
    pub weight: Weight,
    pub reps_in_reserve: f32, // how many more reps you feel you could've done
}

// ExerciseEntry is a set of sets
#[derive(Debug, Clone)]
pub struct ExerciseEntry {
    pub exercise: Exercise,
    pub sets: Vec<SetEntry>,
    pub comments: String,
}

// WorkoutEntry is a set of exercise entries
#[derive(Debug, Clone)]
pub struct WorkoutEntry {
    pub date: String,
    pub exercises: Vec<ExerciseEntry>,
    pub comments: String,
    pub user: String,
}

pub fn exercise_to_string_summary(exercise: &ExerciseEntry) -> String {
    //format!("{} {}", exercise.name, exercise.equipment)
    let mut stringified_exercise = format!("{}", exercise.exercise.name);
    for set in exercise.sets.iter() {
        let _a = format!(
            " - {} Reps ({}{}, {}RiR)",
            set.reps, set.weight.weight, set.weight.weight_unit.short_name, set.reps_in_reserve
        );
        stringified_exercise.push_str(&_a);
    }
    return stringified_exercise;
}

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
