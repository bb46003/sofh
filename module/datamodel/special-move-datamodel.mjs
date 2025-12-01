const BaseDataModel =
  foundry.abstract?.TypeDataModel ?? foundry.data?.DataModel;

export default class SpecialMovesDataModel extends BaseDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};
    const actionFields = {};
    for (const [key, label] of Object.entries(
      CONFIG.SOFHCONFIG.typeOfSpecialMoves,
    )) {
      if (key === "riseRollResults") {
        actionFields[key] = new fields.SchemaField({
          causeComplication: new fields.BooleanField({
            label: "Cause Complication",
            initial: false,
          }),
          useNumber: new fields.NumberField({
            label: "Use per Sesion",
            initial: 1,
          }),
          label: new fields.StringField({
            label: "Localized Label",
            required: true,
            initial: label,
          }),
          isUse: new fields.BooleanField({
            label: "Is Used",
            initial: false,
          }),
          "7to9": new fields.BooleanField({
            initial: false,
          }),
          above10: new fields.BooleanField({
            label: "Is Used",
            initial: false,
          }),
          above12: new fields.BooleanField({
            label: "Is Used",
            initial: false,
          }),
        });
      } else {
        actionFields[key] = new fields.SchemaField({
          label: new fields.StringField({
            label: "Localized Label",
            required: true,
            initial: label,
          }),
          isUse: new fields.BooleanField({
            label: "Is Used",
            initial: false,
          }),
        });
      }
    }
    schema.isHouseRelated = new fields.BooleanField({ initial: false });
    schema.relationRelated = new fields.BooleanField({ initial: false });
    schema.stringRelated = new fields.BooleanField({ initial: false });
    schema.culeRelated = new fields.BooleanField({ initial: false });
    schema.action = new fields.SchemaField(actionFields);
    schema.description = new fields.StringField({ initial: "" });
    schema.resultsChange = new fields.SchemaField({
      below7: new fields.HTMLField({ initial: "" }),
      "7to9": new fields.HTMLField({ initial: "" }),
      above10: new fields.HTMLField({ initial: "" }),
      above12: new fields.HTMLField({ initial: "" }),
    });
    schema.additionalQuestion = new fields.ArrayField(
      new fields.SchemaField({
        question: new fields.HTMLField({ initial: "" }),
        impact: new fields.BooleanField({ initial: true }),
      }),
    );
    schema.relatedMoves = new fields.ArrayField(
      new fields.SchemaField({ moves: new fields.StringField() }),
    );
    schema.description = new fields.HTMLField({ initial: "" });
    schema.triggers = new fields.HTMLField({ initial: "" });
    return schema;
  }
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
  }
  /** @inheritDoc */
  static migrateData(source) {
    super.migrateData(source);
  }
}
