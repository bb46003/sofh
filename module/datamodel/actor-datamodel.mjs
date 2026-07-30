const { StringField, BooleanField, NumberField, SchemaField, ArrayField } =
  foundry.data.fields;

export default class ActorDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      bloodType: new StringField({
        initial: "0",
      }),
      advancement: new BooleanField({
        initial: false,
      }),
      amountOfAdvancement: new NumberField({
        initial: 0,
        integer: true,
      }),
      favoriteTopic: new StringField({
        initial: "",
      }),

      secondaryTopic: new StringField({
        initial: "",
      }),

      personagoal: new StringField({
        initial: "",
      }),

      schoolyear: new SchemaField({
        value: new NumberField({
          initial: 1,
          integer: true,
          min: 1,
          max: 7,
        }),
        min: new NumberField({
          initial: 1,
          integer: true,
        }),
        max: new NumberField({
          initial: 7,
          integer: true,
        }),
      }),

      changedYear: new BooleanField({
        initial: false,
      }),

      condition: new SchemaField({
        1: conditionSchema(),
        2: conditionSchema(),
        3: conditionSchema(),
        4: conditionSchema(),
        5: conditionSchema(),
      }),

      is7conditions: new BooleanField({
        initial: false,
      }),

      home: new StringField({
        initial: "",
      }),

      gosip: new StringField({
        initial: "",
      }),

      xp: new SchemaField({
        value: new SchemaField({
          1: new BooleanField({ initial: false }),
          2: new BooleanField({ initial: false }),
          3: new BooleanField({ initial: false }),
          4: new BooleanField({ initial: false }),
          5: new BooleanField({ initial: false }),
          6: new BooleanField({ initial: false }),
          7: new BooleanField({ initial: false }),
        }),
      }),

      relation: new SchemaField({
        name1: new StringField({ initial: "" }),
        value1: new NumberField({ initial: 0 }),

        name2: new StringField({ initial: "" }),
        value2: new NumberField({ initial: 0 }),

        name3: new StringField({ initial: "" }),
        value3: new NumberField({ initial: 0 }),

        name4: new StringField({ initial: "" }),
        value4: new NumberField({ initial: 0 }),
      }),

      reputation: new SchemaField({
        value: new SchemaField({
          1: new BooleanField({ initial: false }),
          2: new BooleanField({ initial: false }),
          3: new BooleanField({ initial: false }),
          4: new BooleanField({ initial: false }),
          5: new BooleanField({ initial: false }),
          6: new BooleanField({ initial: false }),
          7: new BooleanField({ initial: false }),
        }),

        rank: new NumberField({
          initial: 0,
          integer: true,
        }),

        timeToShine: new NumberField({
          initial: 0,
          integer: true,
        }),
      }),

      goal: new StringField({
        initial: "",
      }),

      housequestion: new StringField({
        initial: "",
      }),

      equipment: new StringField({
        initial: "",
      }),

      strings: new ArrayField(
        new SchemaField({
          name: new StringField({
            initial: "",
          }),

          description: new StringField({
            initial: "",
          }),
        }),
      ),

      advantage: new ArrayField(
        new SchemaField({
          description: new StringField({
            initial: "",
          }),
        }),
      ),
    };
  }
}

function conditionSchema() {
  return new SchemaField({
    type: new StringField({
      initial: "",
    }),

    text: new StringField({
      initial: "",
    }),

    fixed: new BooleanField({
      initial: false,
    }),
  });
}
