import StateHandler from './statehandler';
import allSkills from './data/skills';
import allSpells from './data/spells';
import allDiscs from './data/discs';
import { allBoons } from './data/civList';
import allTechs from './data/civTech';
import utils from '@/game/utils';

const defaultState = {
  skills: allSkills.map(skill => ({ ...skill, isDisabled: !skill.isStarter })),
  skillPoints: 8,
  level: 1,

  spellDiscounts: {},
  spells: [],

  xpToLevel: 12,
  xp: 0,
  xpNextTurn: 0,

  mana: 10,
  maxMana: 15,
  manaPerTurn: 3,
  manaToXpMultiplier: 0.2,

  manaCharges: 1,
  maxManaCharges: 3,
  manaChargeSkills: [],
  manaChargeStep: 0,
  manaChargeMaxStep: 10,
  manaToChargeMultiplier: 0.1,
  chargeToMana: 15,
};

class Spark extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
  }

  sparkTurn() {
    const xpThisTurn = utils.round(this.state.xpNextTurn);
    let hasLeveled = false;
    const newMana = Math.min(
      this.state.maxMana,
      this.state.mana + this.state.manaPerTurn
    );

    this.setState({
      mana: this.state.mana > this.state.maxMana ? this.state.mana : newMana,
      xp: this.state.xp + this.state.xpNextTurn,
      xpNextTurn: 0,
    });

    while (this.state.xp >= this.state.xpToLevel) {
      this.setState({
        xp: this.state.xp - this.state.xpToLevel,
        level: this.state.level + 1,
        skillPoints: this.state.skillPoints + 1,
        xpToLevel: this.state.xpToLevel + 1,
      });
      this.world.logEvent({
        type: 'sparkLevelUp',
        level: this.state.level,
      });
      hasLeveled = true;
    }
    if (!hasLeveled && xpThisTurn) {
      this.world.logEvent({
        type: 'sparkXpGained',
        xpThisTurn,
      });
    }
  }

  getManaCost({ discId, boonId, isActive, civChanges }) {
    const disc =
      this.world.state.discs.find(disc => disc.id === discId) ||
      this.state.spells.find(disc => disc.id === discId);
    const boon =
      this.civs.state.boons.find(boon => boon.id === boonId) ||
      this.state.spells.find(boon => boon.id === boonId);
    let mana = isActive
      ? 0
      : disc?.mana || (!civChanges.length && boon?.mana) || 0;
    const addCivMana = disc
      ? disc.addCivMana || disc.mana * 0.7
      : boon.addCivMana || boon.mana;
    const removeCivMana = disc
      ? disc.removeCivMana || disc.mana * 0.7
      : boon.removeCivMana || boon.mana;

    civChanges.forEach(change => {
      const currentDur =
        boon?.durations?.[boon?.civs?.indexOf(change.id)] || boon?.duration;
      mana +=
        change.type === 'connect'
          ? addCivMana
          : boon?.duration
          ? (currentDur / boon.duration) * removeCivMana
          : removeCivMana;
    });
    if (disc && !isActive && civChanges.length) {
      mana -= addCivMana;
    }
    mana *= this.state.spellDiscounts[disc?.category || boon?.category] || 1;
    return utils.round(mana, 0);
  }

  updateManaCharges(manaCost, category) {
    if (this.state.manaChargeSkills.includes(category)) {
      this.setState({
        manaChargeStep:
          this.state.manaChargeStep +
          utils.round(manaCost * this.state.manaToChargeMultiplier, 2),
      });
    }
    if (this.state.manaChargeStep >= this.state.manaChargeMaxStep) {
      const oldCharges = this.state.manaCharges;
      this.setState({
        manaCharges:
          this.state.manaCharges +
          Math.floor(this.state.manaChargeStep / this.state.manaChargeMaxStep),
        manaChargeStep:
          this.state.manaChargeStep % this.state.manaChargeMaxStep,
      });
      if (this.state.manaCharges > this.state.maxManaCharges) {
        this.popManaCharge(this.state.manaCharges - this.state.maxManaCharges);
      }
      if (oldCharges < this.state.manaCharges) {
        this.system.showMessage({
          type: 'newManaCharge',
          count: this.state.manaCharges - oldCharges,
        });
      }
    }
  }

  popManaCharge(popCount = 1) {
    if (this.state.manaCharges >= popCount) {
      this.setState({
        mana: this.state.mana + this.state.chargeToMana * popCount,
        manaCharges: this.state.manaCharges - popCount,
      });
      this.system.showMessage({
        type: 'sparkManaGained',
        amount: this.state.chargeToMana * popCount,
      });
    }
  }

  castSpell(spellId, civs) {
    const spell = this.state.spells.find(spell => spell.id === spellId);

    if (spell.type === 'boon') {
      return this.modifyBoon(
        spellId,
        civs.map(id => ({ id, type: 'connect' }))
      );
    }

    const createDiscId = spell.createDisc || spell.id;
    const civsTitle = this.civs.state.civList
      .filter(civ => civs.includes(civ.id))
      .map(civ => civ.title)
      .join(', ');
    const manaCost = this.getManaCost({
      isActive: false,
      discId: spell.id,
      civChanges: civs.map(civ => ({ type: 'connect', id: civ })),
    });

    if (civs.length === 0) {
      this.system.showMessage({ type: 'noRaceSelected' });
      return false;
    }
    if (manaCost > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (this.world.state.discs.find(disc => disc.id === createDiscId))
      return false;

    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });
    this.world.createDisc(createDiscId, civs);
    this.system.showMessage({
      type: 'sparkSpell',
      title: spell.title,
      civs: civsTitle,
    });
    this.world.logEvent({ type: 'sparkSpell', disc: createDiscId, civs });
    this.updateManaCharges(manaCost, spell.category);
    return true;
  }

  modifyBoon(boonId, civChanges) {
    const boon =
      this.civs.state.boons.find(boon => boon.id === boonId) ||
      allBoons.find(boon => boon.id === boonId);
    const manaCost = this.getManaCost({ boonId, civChanges });

    if (
      !boon ||
      !this.state.skills.find(
        skill => skill.id === boon.skill && skill.isActive
      )
    ) {
      return false;
    }

    if (manaCost > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (civChanges.length === 0) {
      this.system.showMessage({ type: 'noCivChanges' });
      return false;
    }
    civChanges.forEach(change => {
      this.civs[change.type === 'connect' ? 'addBoon' : 'removeBoon'](
        boonId,
        change.id
      );
    });
    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });
    let log = this.world.logEvent({
      type: 'modifyBoon',
      boon: boonId,
      civChanges,
    });
    this.system.showMessage({
      type: 'modifyBoon',
      text: log.text,
    });
    this.updateManaCharges(manaCost, boon.category);
    return true;
  }

  modifyDisc(discId, civChanges) {
    const disc = this.world.state.discs.find(disc => disc.id === discId);
    const isRemove =
      !civChanges.find(change => change.type === 'connect') &&
      this.civs.state.civList.filter(civ => {
        const removing = civChanges.find(
          change => change.type === 'disconnect' && change.id === civ.id
        );
        return !removing && civ.connect.includes(discId);
      }).length === 0;
    const manaCost = this.getManaCost({ discId, isActive: true, civChanges });

    if (manaCost > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (civChanges.length === 0) {
      this.system.showMessage({ type: 'noCivChanges' });
      return false;
    }

    civChanges.forEach(change => {
      const civ = this.civs.state.civList.find(civ => civ.id === change.id);

      this.civs._updateStateObj('civList', change.id, {
        connect:
          change.type === 'connect'
            ? [...civ.connect, discId]
            : civ.connect.filter(conn => conn !== discId),
      });
    });
    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });
    if (isRemove) {
      this.system.showMessage({ type: 'removeDisc', title: disc.title });
      this.world.logEvent({ type: 'removeDisc', disc: discId, civChanges });
      this.world.removeDisc(discId);
    } else {
      this.system.showMessage({ type: 'modifyDisc', title: disc.title });
      this.world.logEvent({ type: 'modifyDisc', disc: discId, civChanges });
    }
    this.updateManaCharges(manaCost, disc.category);
    return true;
  }

  learnSkill(skillId) {
    const skill = this.state.skills.find(skill => skill.id === skillId);
    const hasActiveSkills = this.state.skills.some(skill => skill.isActive);

    if (skill.isActive) {
      this.system.showMessage({
        type: 'skillAlreadyLearnt',
        title: skill.title,
      });
    } else if (skill.isDisabled) {
      this.system.showMessage({ type: 'skillDisabled', title: skill.title });
    } else if (this.state.skillPoints === 0) {
      this.system.showMessage({ type: 'notEnoughSkillPoints' });
    }

    if (this.state.skillPoints > 0 && !skill.isActive && !skill.isDisabled) {
      this.setState({
        skillPoints: this.state.skillPoints - 1,
        manaPerTurn: this.state.manaPerTurn + (skill.effect?.manaPerTurn || 0),
        maxMana: this.state.maxMana + (skill.effect?.maxMana || 0),
        manaChargeSkills: [
          ...this.state.manaChargeSkills,
          ...(skill.effect?.manaCharge ? [skill.effect?.manaCharge] : []),
        ],
        spellDiscounts: {
          ...this.state.spellDiscounts,
          ...(skill.effect?.discount
            ? {
                [skill.effect?.discount[0]]:
                  skill.effect?.discount[1] *
                  (this.state.spellDiscounts[skill.effect?.discount[0]] || 1),
              }
            : {}),
        },
      });
      this._updateStateObj('skills', skillId, { isActive: true });
      this.system.showMessage({ type: 'skillLearned', title: skill.title });
      this.world.logEvent({ type: 'sparkSkillLearned', skill: skillId });
      if (!hasActiveSkills) {
        this.state.skills.forEach(checkSkill => {
          if (
            checkSkill.id !== skillId &&
            checkSkill.isStarter &&
            !checkSkill.connect?.includes(skillId)
          ) {
            this._updateStateObj('skills', checkSkill.id, { isDisabled: true });
          }
        });
      }
      skill.connect?.forEach(otherId =>
        this._updateStateObj('skills', otherId, { isDisabled: false })
      );
      this.state.skills.forEach(checkSkill => {
        if (checkSkill.connect?.includes(skillId)) {
          this._updateStateObj('skills', checkSkill.id, { isDisabled: false });
        }
        if (
          checkSkill.requires?.includes(skillId) &&
          checkSkill.requires.every(
            otherId =>
              this.state.skills.find(findSkill => findSkill.id === otherId)
                .isActive
          )
        ) {
          this._updateStateObj('skills', checkSkill.id, { isDisabled: false });
        }
      });

      const newSpells = [];
      [...allSpells, ...allDiscs, ...allBoons, ...allTechs].forEach(spell => {
        if (spell.skill === skillId) {
          newSpells.push(spell);
        }
      });
      this.setState({ spells: [...this.state.spells, ...newSpells] });
    }
  }
}

export default Spark;
