export default class BasicMoveDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const questionSchema = new foundry.data.fields.SchemaField({
      description: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),

      impact: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
      }),
    });

    return {
      triggers: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),

      description: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),

      // Options
      housequestion: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      houserelated: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      relationrelated: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      havequestion: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      realtedtoothermoves: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      isrolled: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      stringsrelated: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      cluerelated: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      result12: new foundry.data.fields.BooleanField({
        initial: false,
      }),

      // Questions
      question: new foundry.data.fields.ArrayField(questionSchema, {
        initial: [],
      }),

      // Results
      above10: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),

      "7to9": new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),

      below7: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "",
      }),
    };
  }
}
