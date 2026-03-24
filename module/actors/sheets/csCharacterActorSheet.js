/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import { ChronicleSystem } from "../../system/ChronicleSystem.js";
import { Technique } from "../../technique.js";
import {CSActorSheet} from "./csActorSheet.js";
import LOGGER from "../../utils/logger.js";
import SystemUtils from "../../utils/systemUtils.js";
import {CSConstants} from "../../system/csConstants.js";


export class CSCharacterActorSheet extends CSActorSheet {
  itemTypesPermitted = [
      "ability",
      "weapon",
      "armor",
      "equipment",
      "benefit",
      "drawback",
      "technique"
  ]

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["chroniclesystem", "character", "sheet", "actor"],
      template: "systems/chroniclesystem/templates/actors/characters/character-sheet.hbs",
      width: 700,
      height: 900,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "abilities"
        }
      ],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    const system = this.actor.system;
    system.dtypes = ["String", "Number", "Boolean"];
    this.splitItemsByType(data);

    let character = system.actor.getCSData();
    this.isOwner = this.actor.isOwner;

    character.owned.equipments = this._checkNull(system.itemsByType['equipment']);
    character.owned.weapons = this._checkNull(system.itemsByType['weapon']);
    character.owned.armors = this._checkNull(system.itemsByType['armor']);
    character.owned.benefits = this._checkNull(system.itemsByType['benefit']);
    character.owned.drawbacks = this._checkNull(system.itemsByType['drawback']);
    character.owned.abilities = this._checkNull(system.itemsByType['ability']).sort((a, b) => a.name.localeCompare(b.name));
    character.owned.techniques = this._checkNull(system.itemsByType['technique']).sort((a, b) => a.name.localeCompare(b.name));

    system.dispositions = ChronicleSystem.dispositions;

    system.notEquipped = ChronicleSystem.equippedConstants.IS_NOT_EQUIPPED;

    system.techniquesTypes = CSConstants.TechniqueType;
    system.techniquesCosts = CSConstants.TechniqueCost;

    character.owned.weapons.forEach((weapon) => {
      let weaponData = weapon.system;
      let info = weaponsystem.specialty.split(':');
      if (info.length < 2)
        return "";
      let formula = ChronicleSystem.getActorAbilityFormula(system.actor, info[0], info[1]);
      formula = ChronicleSystem.adjustFormulaByWeapon(system.actor, formula, weapon);
      weapon.updateDamageValue(this.actor);
      weapon.formula = formula;
    });

    character.owned.techniques.forEach((technique) => {
      let techniqueData = technique.system;
      let works = system.currentInjuries = Object.values(techniquesystem.works);
      works.forEach((work) => {
        if (work.type === "SPELL") {
          work.test.spellcastingFormula = ChronicleSystem.getActorAbilityFormula(system.actor, work.test.spellcasting, null);
        } else {
          work.test.alignmentFormula = ChronicleSystem.getActorAbilityFormula(system.actor, work.test.alignment, null);
          work.test.invocationFormula = ChronicleSystem.getActorAbilityFormula(system.actor, work.test.invocation, null);
          work.test.unleashingFormula = ChronicleSystem.getActorAbilityFormula(system.actor, work.test.unleashing, null);
        }
      });
    });

    this._calculateIntrigueTechniques(data);

    system.currentInjuries = Object.values(character.injuries).length;
    system.currentWounds = Object.values(character.wounds).length;
    system.maxInjuries = this.actor.getMaxInjuries();
    system.maxWounds = this.actor.getMaxWounds();
    system.character = character;
    return data;
  }

  _calculateIntrigueTechniques(data) {
    let cunningValue = system.actor.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.CUNNING));
    let willValue = system.actor.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.WILL));
    let persuasionValue = system.actor.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION));
    let awarenessValue = system.actor.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.AWARENESS));

    let bluffFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.DECEPTION), SystemUtils.localize(ChronicleSystem.keyConstants.BLUFF));
    let actFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.DECEPTION), SystemUtils.localize(ChronicleSystem.keyConstants.ACT));
    let bargainFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.BARGAIN));
    let charmFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.CHARM));
    let convinceFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.CONVINCE));
    let inciteFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.INCITE));
    let intimidateFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.INTIMIDATE));
    let seduceFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.SEDUCE));
    let tauntFormula = ChronicleSystem.getActorAbilityFormula(system.actor, SystemUtils.localize(ChronicleSystem.keyConstants.PERSUASION), SystemUtils.localize(ChronicleSystem.keyConstants.TAUNT));

    let intimidateDeceptionFormula = actFormula.bonusDice + actFormula.modifier > bluffFormula.bonusDice + bluffFormula.modifier ? actFormula : bluffFormula;

    system.techniques = {
      bargain: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.BARGAIN), cunningValue, bargainFormula, bluffFormula),
      charm: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.CHARM), persuasionValue, charmFormula, actFormula),
      convince: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.CONVINCE), willValue, convinceFormula, actFormula),
      incite: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.INCITE), cunningValue, inciteFormula, bluffFormula),
      intimidate: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.INTIMIDATE), willValue, intimidateFormula, intimidateDeceptionFormula),
      seduce: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.SEDUCE), persuasionValue, seduceFormula, bluffFormula),
      taunt: new Technique(SystemUtils.localize(ChronicleSystem.keyConstants.TAUNT), awarenessValue, tauntFormula, bluffFormula)
    };
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find('.item .item-name').on('click', (ev) => {
      $(ev.currentTarget).parents('.item').find('.description').slideToggle();
    });

    html.find('.disposition.option').click(this._onDispositionChanged.bind(this));

    html.find('.equipped').click(this._onEquippedStateChanged.bind(this));

    html.find('.injury-create').on("click", this._onClickInjuryCreate.bind(this));
    html.find(".injuries-list").on("click", ".injury-control", this._onclickInjuryControl.bind(this));

    html.find('.wound-create').on("click", this._onClickWoundCreate.bind(this));
    html.find(".wounds-list").on("click", ".wound-control", this._onclickWoundControl.bind(this));

    html.find(".square").on("click", this._onClickSquare.bind(this));

    // Add or Remove Attribute
  }

  async setFrustrationValue(newValue) {
    let value = Math.max(Math.min(parseInt(newValue), this.actor.getCSData().derivedStats.frustration.total), 0);

    this.actor.updateTempPenalties();

    if (value > 0) {
      this.actor.addPenalty(ChronicleSystem.modifiersConstants.DECEPTION, ChronicleSystem.keyConstants.FRUSTRATION, value, false);
      this.actor.addPenalty(ChronicleSystem.modifiersConstants.PERSUASION, ChronicleSystem.keyConstants.FRUSTRATION, value, false);
    } else {
      this.actor.removePenalty(ChronicleSystem.modifiersConstants.DECEPTION, ChronicleSystem.keyConstants.FRUSTRATION);
      this.actor.removePenalty(ChronicleSystem.modifiersConstants.PERSUASION, ChronicleSystem.keyConstants.FRUSTRATION);
    }

    this.actor.update({
      "system.derivedStats.frustration.current" : value,
      "system.penalties": this.actor.penalties
    });
  }

  async setFatigueValue(newValue) {
    let value = Math.max(Math.min(parseInt(newValue), this.actor.getCSData().derivedStats.fatigue.total), 0);

    this.actor.updateTempModifiers();

    if (value > 0) {
      this.actor.addModifier(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.FATIGUE, -value, false);
    } else {
      this.actor.removeModifier(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.FATIGUE);
    }

    this.actor.update({
      "system.derivedStats.fatigue.current" : value,
      "system.modifiers": this.actor.modifiers
    });
  }

  async setStressValue(newValue) {
    let value = Math.max(Math.min(parseInt(newValue), this.actor.getCSData().derivedStats.frustration.total), 0);

    this.actor.updateTempPenalties();

    if (value > 0) {
      this.actor.addPenalty(ChronicleSystem.modifiersConstants.AWARENESS, ChronicleSystem.keyConstants.STRESS, value, false);
      this.actor.addPenalty(ChronicleSystem.modifiersConstants.CUNNING, ChronicleSystem.keyConstants.STRESS, value, false);
      this.actor.addPenalty(ChronicleSystem.modifiersConstants.STATUS, ChronicleSystem.keyConstants.STRESS, value, false);
    } else {
      this.actor.removePenalty(ChronicleSystem.modifiersConstants.AWARENESS, ChronicleSystem.keyConstants.STRESS);
      this.actor.removePenalty(ChronicleSystem.modifiersConstants.CUNNING, ChronicleSystem.keyConstants.STRESS);
      this.actor.removePenalty(ChronicleSystem.modifiersConstants.STATUS, ChronicleSystem.keyConstants.STRESS);
    }

    this.actor.update({
      "system.currentStress" : value,
      "system.penalties": this.actor.penalties
    });
  }

  async _onClickSquare(ev) {
    ev.preventDefault();
    let method = `set${ev.currentTarget.dataset.type}Value`;
    await this[method](ev.currentTarget.id);
  }

  async _onClickWoundCreate(ev) {
    ev.preventDefault();
    const data = this.actor.getCSData();
    let wound = "";
    let wounds = Object.values(system.wounds);
    if (wounds.length >= this.actor.getMaxWounds())
      return;
    wounds.push(wound);
    this.actor.updateTempPenalties();
    this.actor.addPenalty(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.WOUNDS, wounds.length, false);
    this.actor.update({
      "system.wounds" : wounds,
      "system.penalties" : this.actor.penalties
    });
  }

  async _onclickWoundControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const index = parseInt(a.dataset.id);
    const action = a.dataset.action;

    if ( action === "delete" ) {
      const data = this.actor.getCSData();
      let wounds = Object.values(system.wounds);
      wounds.splice(index,1);

      this.actor.updateTempPenalties();
      if (wounds.length === 0) {
        this.actor.removePenalty(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.WOUNDS);
      } else {
        this.actor.addPenalty(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.WOUNDS, wounds.length, false);
      }
      this.actor.update({
        "system.wounds" : wounds,
        "system.penalties" : this.actor.penalties
      });
    }
  }

  async _onClickInjuryCreate(ev) {
    ev.preventDefault();
    const data = this.actor.getCSData();
    let injury = "";
    let injuries = Object.values(system.injuries);
    if (injuries.length >= this.actor.getMaxInjuries())
      return;

    injuries.push(injury);

    this.actor.updateTempModifiers();
    this.actor.addModifier(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.INJURY, -injuries.length, false);

    this.actor.update({
      "system.injuries" : injuries,
      "system.modifiers" : this.actor.modifiers
    });
  }

  async _onclickInjuryControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const index = parseInt(a.dataset.id);
    const action = a.dataset.action;

    if ( action === "delete" ) {
      const data = this.actor.getCSData();
      let injuries = Object.values(system.injuries);
      injuries.splice(index,1);

      this.actor.updateTempModifiers();
      if (injuries.length === 0) {
        this.actor.removeModifier(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.INJURY);
      } else {
        this.actor.addModifier(ChronicleSystem.modifiersConstants.ALL, ChronicleSystem.keyConstants.INJURY, -injuries.length, false);
      }

      this.actor.update({
        "system.injuries" : injuries,
        "system.modifiers" : this.actor.modifiers
      });
    }
  }

  async _onEquippedStateChanged(event) {
    event.preventDefault();
    const eventData = event.currentTarget.dataset;
    let currentItem = this.actor.getEmbeddedDocument('Item', eventsystem.itemId);
    let collection = [];
    let tempCollection = [];

    let isArmor = parseInt(eventsystem.hand) === ChronicleSystem.equippedConstants.WEARING;
    let isUnequipping = parseInt(eventsystem.hand) === 0;

    this.actor.updateTempModifiers();

    if (isUnequipping) {
      let adaptableQuality = Object.values(currentItem.getCSData().qualities).filter((quality) => quality.name.toLowerCase() === "adaptable");
      if (adaptableQuality.length > 0 && parseInt(eventsystem.hand) === ChronicleSystem.equippedConstants.IS_NOT_EQUIPPED && currentItem.getCSData().equipped !== ChronicleSystem.equippedConstants.BOTH_HANDS) {
        collection = this.UnequipsAllItemsInTheSlots([ ChronicleSystem.equippedConstants.MAIN_HAND, ChronicleSystem.equippedConstants.OFFHAND, ChronicleSystem.equippedConstants.BOTH_HANDS], collection);
        collection = this.ChangeItemEquippedStatus(collection, currentItem, ChronicleSystem.equippedConstants.BOTH_HANDS);
      } else {
        collection = this.ChangeItemEquippedStatus(collection, currentItem);
      }
    } else {
      if (isArmor) {
        collection = this.UnequipsAllItemsInTheSlots([ ChronicleSystem.equippedConstants.WEARING], collection);
        collection = this.ChangeItemEquippedStatus(collection, currentItem, ChronicleSystem.equippedConstants.WEARING);
      } else {
        let twoHandedQuality = Object.values(currentItem.getCSData().qualities).filter((quality) => quality.name.toLowerCase() === "two-handed");
        if (twoHandedQuality.length > 0) {
          collection = this.UnequipsAllItemsInTheSlots([ ChronicleSystem.equippedConstants.MAIN_HAND, ChronicleSystem.equippedConstants.OFFHAND, ChronicleSystem.equippedConstants.BOTH_HANDS], collection);
          collection = this.ChangeItemEquippedStatus(collection, currentItem, ChronicleSystem.equippedConstants.BOTH_HANDS);
        } else {
          collection = this.UnequipsAllItemsInTheSlots([ parseInt(eventsystem.hand), ChronicleSystem.equippedConstants.BOTH_HANDS], collection);
          collection = this.ChangeItemEquippedStatus(collection, currentItem, parseInt(eventsystem.hand));
        }
      }
    }

    this.actor.saveModifiers();

    this.actor.updateEmbeddedDocuments('Item', collection);
  }

  UnequipsAllItemsInTheSlots(slots = [], collection = []) {
    let tempCollection = this.actor.items.filter((item) => slots.includes(item.getCSData().equipped));

    tempCollection.forEach((item) => {
      collection.push({_id: item._id, "system.equipped": ChronicleSystem.equippedConstants.IS_NOT_EQUIPPED});
      item.onEquippedChanged(this.actor, false);
    });

    return collection;
  }

  ChangeItemEquippedStatus(collection = [], item, equippedStatus = ChronicleSystem.equippedConstants.IS_NOT_EQUIPPED) {
    item.getCSData().equipped = equippedStatus;

    collection.push({_id: item._id, "system.equipped": item.getCSData().equipped});

    item.onEquippedChanged(this.actor, equippedStatus > 0);

    return collection;
  }

  async _onDispositionChanged(event, targets) {
    event.preventDefault();
    if (!ChronicleSystem.dispositions.find((disposition) => disposition.rating === parseInt(event.target.dataset.id))) {
      LOGGER.warn("the informed disposition does not exist.");
      return;
    }
    this.actor.update({"system.currentDisposition": event.target.dataset.id});
  }

  /* -------------------------------------------- */

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));

    }
    catch (err) {
      return;
    }
    return super._onDrop(event);
  }

  isItemPermitted(type) {
    return this.itemTypesPermitted.includes(type);
  }

}
