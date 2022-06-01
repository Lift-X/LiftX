use serde::{Deserialize, Serialize};

/// Either `KILOGRAMS` or `POUNDS`.
/// Contains a long and short name for the weight unit
/// Strings below can't be indirectly deserialized for some reason. I've tried a bunch of stuff :/
/// For now in indirect use cases the type will be a string and converted back to a `WeightUnit`
#[derive(PartialEq, Debug, Clone, Copy, Eq, Deserialize, Serialize)]
pub struct WeightType<'a> {
    #[serde(borrow)]
    pub long_name: &'a str,
    #[serde(borrow)]
    pub short_name: &'a str,
}

pub const KILOGRAMS: WeightType = WeightType {
    long_name: "Kilograms",
    short_name: "kgs",
};

pub const POUNDS: WeightType = WeightType {
    long_name: "Pounds",
    short_name: "lbs",
};

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize)]
pub struct Weight {
    pub weight: f32,
    pub weight_unit: String,
}

impl Weight {
    pub fn from_string(string: &str) -> Result<Weight, String> {
        // collect only alphabetical characters
        let split: String = string.matches(char::is_alphabetic).collect::<String>();
        match split.as_ref() {
            "kgs" => Ok(Weight {
                weight: string.split_terminator("kgs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .expect("Could not parse weight!"),
                weight_unit: "kgs".to_string(),
            }),
            "lbs" => Ok(Weight {
                weight: string.split_terminator("lbs").collect::<Vec<_>>()[0]
                    .parse::<f32>()
                    .expect("Could not parse weight!"),
                weight_unit: "lbs".to_string(),
            }),
            _ => Err("Invalid weight unit!".to_string()),
        }
    }

    pub fn to_kilograms(&self) -> Result<f32, String> {
        match self.weight_unit.as_str() {
            "kgs" => Ok(self.weight),
            "lbs" => Ok(self.weight * 0.453_592_37),
            _ => Err("Invalid Weight Type!".to_string()),
        }
    }

    pub fn to_pounds(&self) -> Result<f32, String> {
        match self.weight_unit.as_str() {
            "kgs" => Ok(self.weight * 2.204_623),
            "lbs" => Ok(self.weight),
            _ => Err("Invalid Weight Type!".to_string()),
        }
    }

    pub fn default() -> Weight {
        Weight {
            weight: 0.0,
            weight_unit: "lbs".to_string(),
        }
    }
}

impl WeightType<'_> {
    pub fn from_string(string: &str) -> Result<WeightType, String> {
        match string {
            "kgs" => Ok(KILOGRAMS),
            "lbs" => Ok(POUNDS),
            _ => Err("Invalid Weight Type!".to_string()),
        }
    }
}