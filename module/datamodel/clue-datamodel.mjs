const {
  ObjectField,
  StringField,
  HTMLField,
  BooleanField,
  NumberField,
  SchemaField,
  ArrayField,
} = foundry.data.fields;

export default class ClueDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      actorID: new ArrayField(
        new ObjectField({
          initial: {},
        }),
      ),
      // Clues list
      clue: new ArrayField(
        new SchemaField({
          description: new StringField({ initial: "" }),
          
        }),
        { initial: [] },
      ),

      solutions: new ArrayField(
        new SchemaField({
          solution: new StringField({ initial: "" }),
          question: new StringField({ initial: "" }),
          complexity: new NumberField({ initial: 0 }),
          showToPlayer: new BooleanField({ initial: false }),
        }),
        { initial: [] },
      ),
    };
  }

  async removeMember(actorId) {
    const partyMembers = [...this.actorID];

    // Find index of member to remove
    const index = partyMembers.findIndex((member) => member.id === actorId);
    if (index === -1) return;

    // Remove selected member
    partyMembers.splice(index, 1);

    // Keep only valid members (must have id, name, img)
    const cleanedMembers = partyMembers.filter(
      (member) =>
        member &&
        typeof member === "object" &&
        member.id &&
        member.name &&
        member.img,
    );

    await this.parent.update({
      "system.actorID": cleanedMembers,
    });
  }
}
