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

    pub fn to_kilograms(&self) -> Result<f32, String> {
        match self.weight_unit {
            KILOGRAMS => Ok(self.weight),
            POUNDS => Ok(self.weight * 0.45359237),
            _ => Err("Invalid Weight Type!".to_string()),
        }
    }

    pub fn to_pounds(&self) -> Result<f32, String> {
        match self.weight_unit {
            KILOGRAMS => Ok(self.weight * 2.204623),
            POUNDS => Ok(self.weight),
            _ => Err("Invalid Weight Type!".to_string()),
        }
    }
}

/// EquipmentType allows for accurate total rep count when accounting for various types of equipment
/// (i.e. dumbbells, kettlebells, barbells, etc.)
#[derive(Debug, PartialEq, Clone)]
pub struct EquipmentType {
    pub name: &'static str,
    pub rep_multiplier: u8, // 1 for barbells, 2 for dumbbells. Could be used for a total rep count. double basically for anything you need to do twice including some cables
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

pub const EQUIPMENT_LIST: [EquipmentType; 6] =
    [NONE, BARBELL, DUMBBELL, DUMBBELLS, CABLE, CABLE_SEPARATE];
