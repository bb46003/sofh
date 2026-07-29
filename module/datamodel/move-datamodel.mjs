const {
  StringField,
  BooleanField,
  SchemaField,
} = foundry.data.fields;

function moveSchema() {
  return new SchemaField({
    triggers: new StringField({
      initial: "",
    }),

    housequestion: new BooleanField({
      initial: false,
    }),

    description: new StringField({
      initial: "",
    }),

    houserelated: new BooleanField({
      initial: false,
    }),

    relationrelated: new BooleanField({
      initial: false,
    }),

    havequestion: new BooleanField({
      initial: false,
    }),

    realtedtoothermoves: new BooleanField({
      initial: false,
    }),

    isrolled: new BooleanField({
      initial: false,
    }),

    stringsrelated: new BooleanField({
      initial: false,
    }),

    cluerelated: new BooleanField({
      initial: false,
    }),

    result12: new BooleanField({
      initial: false,
    }),
  });
}

export default class MoveDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      triggers: new StringField({ initial: "" }),
      housequestion: new BooleanField({ initial: false }),
      description: new StringField({ initial: "" }),
      houserelated: new BooleanField({ initial: false }),
      relationrelated: new BooleanField({ initial: false }),
      havequestion: new BooleanField({ initial: false }),
      realtedtoothermoves: new BooleanField({ initial: false }),
      isrolled: new BooleanField({ initial: false }),
      stringsrelated: new BooleanField({ initial: false }),
      cluerelated: new BooleanField({ initial: false }),
      result12: new BooleanField({ initial: false }),
    };
  }
}