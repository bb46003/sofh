const { ObjectField, StringField,HTMLField, BooleanField, NumberField, SchemaField, ArrayField } =
  foundry.data.fields;

export default class ClueDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
actorID: new ObjectField(
  new SchemaField({
    name: new StringField({ initial: "" }),
    img: new StringField({ initial: "" }),
  })
)
    }
  }
}