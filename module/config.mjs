export const SOFHCONFIG = {};

SOFHCONFIG.bloodType = {
  pureblood: "sofh.ui.actor.pureblood",
  halfblood: "sofh.ui.actor.halfblood",
  mugoleborn: "sofh.ui.actor.mugleborn",
};
SOFHCONFIG.favoriteTopic = {
  astronomy: "sofh.ui.actor.favoriteTopic.astronomy",
  spells: "sofh.ui.actor.favoriteTopic.spells",
  herbology: "sofh.ui.actor.favoriteTopic.herbology",
  history_of_magic: "sofh.ui.actor.favoriteTopic.history_of_magic",
  defense_against_dark_arts:
    "sofh.ui.actor.favoriteTopic.defense_against_dark_arts",
  potions: "sofh.ui.actor.favoriteTopic.potions",
  transmutation: "sofh.ui.actor.favoriteTopic.transmutation",
};

SOFHCONFIG.favoriteTopic2 = {
  care_of_magical_creatures:
    "sofh.ui.actor.favoriteTopic2.care_of_magical_creatures",
  muggle_studies: "sofh.ui.actor.favoriteTopic2.muggle_studies",
  numerology: "sofh.ui.actor.favoriteTopic2.numerology",
  divination: "sofh.ui.actor.favoriteTopic2.divination",
  ancient_runes: "sofh.ui.actor.favoriteTopic2.ancient_runes",
};

SOFHCONFIG.House = {
  gryffindor: "sofh.ui.actor.gryffindor",
  hufflepuff: "sofh.ui.actor.hufflepuff",
  ravenclaw: "sofh.ui.actor.ravenclaw",
  slytherin: "sofh.ui.actor.slytherin",
};
SOFHCONFIG.conditionstype = {
  mental: "sofh.ui.actor.mental",
  physical: "sofh.ui.actor.physical",
  social: "sofh.ui.actor.social",
};
SOFHCONFIG.equipment = {
  gryffindor: "sofh.ui.actor.gryffindoreq",
  hufflepuff: "sofh.ui.actor.hufflepuffreq",
  slytherin: "sofh.ui.actor.slytherinreq",
  ravenclaw: "sofh.ui.actor.ravenclawreq",
};
SOFHCONFIG.houseeq = {
  hufflepuff: {
    racing_broomstick: "sofh.ui.actor.hufflepuffracing_broomstick",
    pet: "sofh.ui.actor.hufflepuffpet",
    large_box_chocolates: "sofh.ui.actor.hufflepufflarge_box_chocolates",
    small_herb_garden: "sofh.ui.actor.hufflepuffsmall_herb_garden",
    pouch_medicinal_herbs: "sofh.ui.actor.hufflepuffpouch_medicinal_herbs",
    potted_plant: "sofh.ui.actor.hufflepuffpotted_plant",
    musical_instrument: "sofh.ui.actor.hufflepuffmusical_instrument",
    box_charm: "sofh.ui.actor.hufflepuffbox_charm",
    muggle_item: "sofh.ui.actor.hufflepuffmuggle_item",
  },
  slytherin: {
    racing_broomstick: "sofh.ui.actor.slytherinracing_broomstick",
    pet: "sofh.ui.actor.slytherinpet",
    signet_ring: "sofh.ui.actor.slytherinsignet_ring",
    charmed_parchment: "sofh.ui.actor.slytherincharmed_parchment",
    book_dark_magic: "sofh.ui.actor.slytherinbook_dark_magic",
    sleekeazy_hair_potion: "sofh.ui.actor.slytherinsleekeazy_hair_potion",
    fine_wizarding_robes: "sofh.ui.actor.slytherinfine_wizarding_robes",
    useful_contact: "sofh.ui.actor.slytherinuseful_contact",
  },
  ravenclaw: {
    racing_broomstick: "sofh.ui.actor.ravenclawracing_broomstick",
    pet: "sofh.ui.actor.ravenclawpet",
    mechanical_device: "sofh.ui.actor.ravenclawmechanical_device",
    odd_jewelry: "sofh.ui.actor.ravenclawodd_jewelry",
    record_player: "sofh.ui.actor.ravenclawrecord_player",
    chess_set: "sofh.ui.actor.ravenclawchess_set",
    musical_instrument: "sofh.ui.actor.ravenclawmusical_instrument",
    muggle_device: "sofh.ui.actor.ravenclawmuggle_device",
    bag_of_notes: "sofh.ui.actor.ravenclawbag_of_notes",
  },
  gryffindor: {
    racing_broomstick: "sofh.ui.actor.gryffindorracing_broomstick",
    pet: "sofh.ui.actor.gryffindorpet",
    cool_sunglasses: "sofh.ui.actor.gryffindorcool_sunglasses",
    exploding_snap: "sofh.ui.actor.gryffindorexploding_snap",
    subscription: "sofh.ui.actor.gryffindorsubscription",
    muggle_clothing: "sofh.ui.actor.gryffindormuggle_clothing",
    partial_map: "sofh.ui.actor.gryffindorpartial_map",
    quidditch_equipment: "sofh.ui.actor.gryffindorquidditch_equipment",
    bertie_botts_beans: "sofh.ui.actor.gryffindorbertie_botts_beans",
  },
};

export async function characterRelation() {
  const actors = game.actors;
  const character = Array.from(actors.entries()).filter(
    ([key, actor]) => actor.type === "character",
  );

  let characterRelation = {};

  character.forEach(([key, actor]) => {
    characterRelation[actor._id] = actor.name;
  });

  SOFHCONFIG.characterRelation = characterRelation;
}
