use serde::{Deserialize, Serialize};
use lazy_static::lazy_static;

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
pub struct WeightType<'a, 'b> {
    #[serde(borrow)]
    pub long_name: &'a str,
    #[serde(borrow)]
    pub short_name: &'b str,
}

/*
pub const KILOGRAMS: WeightType = WeightType {
    long_name: "Kilograms".to_string(),
    short_name: "kgs".to_string(),
};

pub const POUNDS: WeightType = WeightType {
    long_name: "Pounds".to_string(),
    short_name: "lbs".to_string(),
};
*/

lazy_static!(
    #[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
    pub static ref POUNDS: WeightType<'static, 'static> = WeightType {
        long_name: "Pounds",
        short_name: "lbs",
    };
);

lazy_static!(
    #[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
    pub static ref KILOGRAMS: WeightType<'static, 'static> = WeightType {
        long_name: "Kilograms",
        short_name: "kgs",
    };
);

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize)]
pub struct Weight<'a> {
    pub weight: f32,
    pub weight_unit: &'a WeightType<'a, 'a>,
}

impl Weight<'_> {
    pub fn from_string(string: &str) -> Weight {
        // collect only alphabetical characters
        let split = string
            .chars()
            .filter(|c| c.is_alphabetic())
            .collect::<String>();
        match split.as_ref() {
            "kgs" => Weight {
                weight: string.split_terminator("kgs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap(),
                weight_unit: &KILOGRAMS,
            },
            "lbs" => Weight {
                weight: string.split_terminator("lbs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap(),
                weight_unit: &POUNDS,
            },
            _ => panic!("Invalid weight unit!"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_weight_from_string_lbs() {
        let weight = Weight::from_string("100lbs");
        assert_eq!(weight.weight, 100.0);
        assert_eq!(weight.weight_unit, *POUNDS);
    }

    #[test]
    fn test_weight_from_string_kgs() {
        let weight = Weight::from_string("100kgs");
        assert_eq!(weight.weight, 100.0);
        assert_eq!(weight.weight_unit, *KILOGRAMS);
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct EquipmentType {
    pub name: &'static str,
    rep_multiplier: u8, // 1 for barbells, 2 for dumbbells. Could be used for a total rep count. double basically for anything you need to do twice including some cables
}

pub const NONE: EquipmentType = EquipmentType {
    name: "None",
    rep_multiplier: 0,
};

pub const BARBELL: EquipmentType = EquipmentType {
    name: "Barbell",
    rep_multiplier: 1,
};

// perhaps make equipment struct have an amount of equipment instead of making multiple variants
// or.. just have the exercise struct have an amount of equipment
pub const DUMBBELL: EquipmentType = EquipmentType {
    name: "Dumbbell",
    rep_multiplier: 1,
};

pub const DUMBBELLS: EquipmentType = EquipmentType {
    name: "Dumbbells",
    rep_multiplier: 2,
};

pub const CABLE: EquipmentType = EquipmentType {
    name: "Cable",
    rep_multiplier: 1,
};

pub const CABLE_SEPARATE: EquipmentType = EquipmentType {
    name: "Cables (separate)",
    rep_multiplier: 2,
};
