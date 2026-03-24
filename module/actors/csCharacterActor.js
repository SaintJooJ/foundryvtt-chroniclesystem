import {ChronicleSystem} from "../system/ChronicleSystem.js";
import {CSActor} from "./csActor.js";
import SystemUtils from "../utils/systemUtils.js";
import LOGGER from "../utils/logger.js";
import {CSConstants} from "../system/csConstants.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {CSActor}
 */
export class CSCharacterActor extends CSActor {
    modifiers;
    penalties;

    prepareDerivedData() {
        super.prepareDerivedData();

        this.calculateMovementData();
        this.calculateDerivedValues();
    }

    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();
    }

    prepareDerivedData() {
        super.prepareDerivedData()
        this.calculateDerivedValues()

    }

    /** @override */
    getRollData() {
        return super.getRollData();
    }


    calculateDerivedValues() {
        let data = this.getCSData();
        const system = this.system;
        system.derivedStats.intrigueDefense.value = this.calcIntrigueDefense();
        system.derivedStats.intrigueDefense.total = system.derivedStats.intrigueDefense.value + parseInt(system.derivedStats.intrigueDefense.modifier);
        system.derivedStats.composure.value = this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.WILL)) * 3;
        system.derivedStats.composure.total = system.derivedStats.composure.value + parseInt(system.derivedStats.composure.modifier);
        system.derivedStats.combatDefense.value = this.calcCombatDefense();


        system.derivedStats.combatDefense.total = system.derivedStats.combatDefense.value + parseInt(system.derivedStats.combatDefense.modifier);
        system.derivedStats.health.value = this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.ENDURANCE)) * 3;
        system.derivedStats.health.total = system.derivedStats.health.value + parseInt(system.derivedStats.health.modifier);
        system.derivedStats.frustration.value = this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.WILL));
        system.derivedStats.frustration.total = system.derivedStats.frustration.value + parseInt(system.derivedStats.frustration.modifier);
        system.derivedStats.fatigue.value = this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.ENDURANCE));
        system.derivedStats.fatigue.total = system.derivedStats.fatigue.value + parseInt(system.derivedStats.fatigue.modifier);
    }

    getAbilities() {
        let items = this.items;
        return items.filter((item) => item.type === 'ability');
    }

    getAbility(abilityName) {
        let items = this.items;
        const ability = items.find((item) => item.name.toLowerCase() === abilityName.toString().toLowerCase() && item.type === 'ability');
        return [ability, undefined];
    }

    getAbilityBySpecialty(abilityName, specialtyName) {
        let items = this.items;
        const system = this.system;
        let specialty = null;
        const ability = items.filter((item) => item.type === 'ability' && item.name.toLowerCase() === abilityName.toString().toLowerCase()).find(function (ability) {
            let data = ability.getCSData();
            if (system.specialties === undefined)
                return false;

            // convert specialties list to array
            let specialties = system.specialties;
            let specialtiesArray = Object.keys(specialties).map((key) => specialties[key]);

            specialty = specialtiesArray.find((specialty) => specialty.name.toLowerCase() === specialtyName.toString().toLowerCase());
            if (specialty !== null && specialty !== undefined) {
                return true;
            }
        });

        return [ability, specialty];
    }

    getModifier(type, includeDetail = false, includeModifierGlobal = false) {
        this.updateTempModifiers();

        let total = 0;
        let detail = [];

        if (this.modifiers[type]) {
            this.modifiers[type].forEach((modifier) => {
                total += modifier.mod;
                if (includeDetail) {
                    let tempItem = modifier._id;
                    if (modifier.isDocument) {
                        tempItem = this.getEmbeddedDocument('Item', modifier._id);
                    }
                    if (tempItem) {
                        detail.push({docName: tempItem.name, mod: modifier.mod});
                    }
                }
            });
        }

        if (includeModifierGlobal && this.modifiers[ChronicleSystem.modifiersConstants.ALL]) {
            this.modifiers[ChronicleSystem.modifiersConstants.ALL].forEach((modifier) => {
                total += modifier.mod;
                if (includeDetail) {
                    let tempItem = modifier._id;
                    if (modifier.isDocument) {
                        tempItem = this.getEmbeddedDocument('Item', modifier._id);
                    }
                    if (tempItem)
                        detail.push({docName: tempItem.name, mod: modifier.mod});
                }
            });
        }

        return { total: total, detail: detail};
    }

    getPenalty(type, includeDetail = false, includeModifierGlobal = false) {
        this.updateTempPenalties();

        let total = 0;
        let detail = [];

        if (this.penalties[type]) {
            this.penalties[type].forEach((penalty) => {
                total += penalty.mod;
                if (includeDetail) {
                    let tempItem = penalty._id;
                    if (penalty.isDocument) {
                        tempItem = this.getEmbeddedDocument('Item', penalty._id);
                    }
                    if (tempItem) {
                        detail.push({docName: tempItem.name, mod: penalty.mod});
                    }
                }
            });
        }

        if (includeModifierGlobal && this.penalties[ChronicleSystem.modifiersConstants.ALL]) {
            this.penalties[ChronicleSystem.modifiersConstants.ALL].forEach((penalty) => {
                total += penalty.mod;
                if (includeDetail) {
                    let tempItem = penalty._id;
                    if (penalty.isDocument) {
                        tempItem = this.getEmbeddedDocument('Item', penalty._id);
                    }
                    if (tempItem)
                        detail.push({docName: tempItem.name, mod: penalty.mod});
                }
            });
        }

        return { total: total, detail: detail};
    }

    addModifier(type, documentId, value, isDocument = true, save = false) {
        LOGGER.trace(`add ${documentId} modifier to ${type} | csCharacterActor.js`);

        console.assert(this.modifiers, "call actor.updateTempModifiers before adding a modifier!");

        if (!this.modifiers[type]) {
            this.modifiers[type] = [];
        }

        let index = this.modifiers[type].findIndex((mod) => {
            return mod._id === documentId
        });
        if (index >= 0) {
            this.modifiers[type][index].mod = value;
        } else {
            this.modifiers[type].push({_id: documentId, mod: value, isDocument: isDocument});
        }

        if (save) {
            this.update({"system.modifiers": this.modifiers});
        }
    }

    addPenalty(type, documentId, value, isDocument = true, save = false) {
        LOGGER.trace(`add ${documentId} penalty to ${type} | csCharacterActor.js`);

        console.assert(this.penalties, "call actor.updateTempPenalties before adding a penalty!");

        if (!this.penalties[type]) {
            this.penalties[type] = [];
        }

        let index = this.penalties[type].findIndex((mod) => {
            return mod._id === documentId
        });

        if (index >= 0) {
            this.penalties[type][index].mod = value;
        } else {
            this.penalties[type].push({
                _id: documentId,
                mod: value,
                isDocument: isDocument
            });
        }

        if (save) {
            this.update({"system.penalties": this.penalties});
        }
    }

    removeModifier(type, documentId, save = false) {
        LOGGER.trace(`remove ${documentId} modifier to ${type} | csCharacterActor.js`);

        console.assert(this.modifiers, "call actor.updateTempModifiers before removing a modifier!");

        if (this.modifiers[type]) {
            let index = this.modifiers[type].indexOf((mod) => mod._id === documentId);
            this.modifiers[type].splice(index, 1);
        }
        if (save)
            this.update({"system.modifiers" : this.modifiers});
    }

    removePenalty(type, documentId, save = false) {
        LOGGER.trace(`remove ${documentId} penalty to ${type} | csCharacterActor.js`);

        console.assert(this.penalties, "call actor.updateTempPenalties before removing a penalty!");

        if (this.penalties[type]) {
            let index = this.penalties[type].indexOf((mod) => mod._id === documentId);
            this.penalties[type].splice(index, 1);
        }
        if (save)
            this.update({"system.penalties" : this.penalties});
    }

    getMaxInjuries() {
        return this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.ENDURANCE));
    }

    getMaxWounds() {
        return this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.ENDURANCE));
    }

    saveModifiers() {
        console.assert(this.modifiers, "call actor.updateTempModifiers before saving the modifiers!");
        this.update({"system.modifiers" : this.modifiers}, {diff:false});
    }

    savePenalties() {
        console.assert(this.penalties, "call actor.updateTempPenalties before saving the penalties!");
        this.update({"system.penalties" : this.penalties}, {diff:false});
    }

    getAbilityValue(abilityName) {
        const [ability,] = this.getAbility(abilityName);
        return ability !== undefined? ability.getCSData().rating : 2;
    }

    calcIntrigueDefense() {
        return this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.AWARENESS)) +
            this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.CUNNING)) +
            this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.STATUS));
    }

    calcCombatDefense() {
        let value = this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.AWARENESS)) +
            this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.AGILITY)) +
            this.getAbilityValue(SystemUtils.localize(ChronicleSystem.keyConstants.ATHLETICS));

        if (game.settings.get(CSConstants.Settings.SYSTEM_NAME, CSConstants.Settings.ASOIAF_DEFENSE_STYLE)){
            let mod = this.getModifier(ChronicleSystem.modifiersConstants.COMBAT_DEFENSE);
            value += mod.total;
        }

        return value;
    }

    calculateMovementData() {
        let data = this.getCSData();
        const system = this.system;
        system.movement.base = ChronicleSystem.defaultMovement;
        let runFormula = ChronicleSystem.getActorAbilityFormula(this, SystemUtils.localize(ChronicleSystem.keyConstants.ATHLETICS), SystemUtils.localize(ChronicleSystem.keyConstants.RUN));
        system.movement.runBonus = Math.floor(runFormula.bonusDice / 2);
        let bulkMod = this.getModifier(SystemUtils.localize(ChronicleSystem.modifiersConstants.BULK));
        system.movement.bulk = Math.floor(bulkMod.total/2);
        system.movement.total = Math.max(system.movement.base + system.movement.runBonus - system.movement.bulk + parseInt(system.movement.modifier), 1);
        system.movement.sprintTotal = system.movement.total * system.movement.sprintMultiplier - system.movement.bulk;
    }

    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
        this.updateTempModifiers();
        for (let i = 0; i < documents.length; i++) {
            documents[i].onDiscardedFromActor(this, result[0]);
        }
        this.saveModifiers();
    }

    _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
        this.updateTempModifiers();
        for (let i = 0; i < documents.length; i++) {
            documents[i].onObtained(this);
        }

        this.saveModifiers();
    }

    _onUpdateDescendantDocuments(embeddedName, documents, result, options, userId) {
        super._onUpdateDescendantDocuments(embeddedName, documents, result, options, userId);
        this.updateTempModifiers();
        result.forEach((doc) => {
            let item = this.items.find((item) => item._id === doc._id);
            if (item) {
                item.onObtained(this);
                item.onEquippedChanged(this, item.getCSData().equipped > 0);
            }
        })
        this.saveModifiers();
    }

    updateTempModifiers() {
        let data = this.getCSData()
        this.modifiers = system.modifiers;
    }

    updateTempPenalties() {
        let data = this.getCSData()
        this.penalties = system.penalties;
    }
}
