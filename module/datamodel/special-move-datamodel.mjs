export default class SpecialMovesDataModel extends foundry.abstract
  .TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};
    const actionFields = {};
    for (const [key, label] of Object.entries(
      CONFIG.SOFHCONFIG.typeOfSpecialMoves,
    )) {
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
      }),
    );
    schema.relatedMoves = new fields.ArrayField(
      new fields.SchemaField({ moves: new fields.StringField() }),
    );
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
