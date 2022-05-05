use ordered_float::OrderedFloat;


/// Either Kilograms or Pounds.
/// Contains a long and short name for the weight unit
#[derive(PartialEq, Debug, Clone, Copy, Eq)]
pub struct WeightType {
    pub long_name: &'static str,
    pub short_name: &'static str,
}

pub const KILOGRAMS: WeightType = WeightType {
    long_name: "Kilograms",
    short_name: "kgs",
};

pub const POUNDS: WeightType = WeightType {
    long_name: "Pounds",
    short_name: "lbs",
};

/* deserializable *kind of*
lazy_static!(
    #[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
    pub static ref POUNDS: WeightType = WeightType {
        long_name: "Pounds",
        short_name: "lbs",
    };
);

lazy_static!(
    #[derive(PartialEq, Debug, Clone, Copy)]
    pub static ref KILOGRAMS: WeightType = WeightType {
        long_name: "Kilograms",
        short_name: "kgs",
    };
);
*/

#[derive(PartialEq, Debug, Clone)]
pub struct Weight {
    pub weight: f32,
    pub weight_unit: WeightType,
}

impl Weight {
    pub fn from_string(string: &str) -> Result<Weight, String> {
        // collect only alphabetical characters
        let split = string
            .chars()
            .filter(|c| c.is_alphabetic())
            .collect::<String>();
        match split.as_ref() {
            "kgs" => Ok(Weight {
                weight: string.split_terminator("kgs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap(),
                weight_unit: KILOGRAMS,
            }),
            "lbs" => Ok(Weight {
                weight: string.split_terminator("lbs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .unwrap(),
                weight_unit: POUNDS,
            }),
            _ => Err("Invalid weight unit!".to_string()),
        }
    }

    pub fn to_kilograms(&self) -> f32 {
        match self.weight_unit {
            KILOGRAMS => self.weight,
            POUNDS => self.weight * 0.45359237,
            _ => self.weight, // For now, just return the original weight
        }
    }

    pub fn to_pounds(&self) -> f32 {
        match self.weight_unit {
            KILOGRAMS => self.weight * 2.204623,
            POUNDS => self.weight,
            _ => self.weight, // For now, just return the original weight
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_weight_from_string_lbs() {
        let weight = Weight::from_string("100lbs").unwrap();
        assert_eq!(weight.weight, 100.0);
        assert_eq!(weight.weight_unit, POUNDS);
    }

    #[test]
    fn test_weight_from_string_kgs() {
        let weight = Weight::from_string("100kgs").unwrap();
        assert_eq!(weight.weight, 100.0);
        assert_eq!(weight.weight_unit, KILOGRAMS);
    }


    #[test]
    fn test_weight_to_kilograms() {
        let weight = Weight {
            weight: 45.0,
            weight_unit: POUNDS,
        };
        assert_eq!(OrderedFloat(weight.to_kilograms()),  OrderedFloat(20.411655));
    }

    #[test]
    fn test_weight_to_pounds() {
        let weight = Weight {
            weight: 25.0,
            weight_unit: KILOGRAMS,
        };
        assert_eq!(OrderedFloat(weight.to_pounds()), OrderedFloat(55.115574));
    }
}

/// EquipmentType allows for accurate total rep count when accounting for various types of equipment
/// (i.e. dumbbells, kettlebells, barbells, etc.)
#[derive(Debug, PartialEq, Clone)]
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
