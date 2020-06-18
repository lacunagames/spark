import StateHandler from './statehandler';
import allSkills from './data/skills';
import allSpells from './data/spells';
import allDiscs from './data/discs';

const defaultState = {
  skills: allSkills.map(skill => ({ ...skill, isDisabled: !skill.isStarter })),
  skillPoints: 111,
  level: 1,
  xpToLevel: 12,
  xp: 0,
  mana: 10,
  maxMana: 15,
  manaPerTurn: 3,
  manaCharges: 0,
  manaChargeSkills: [],
  spellDiscounts: {},
  spells: [],
};

class Spark extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
  }

  sparkTurn() {
    const newMana = Math.min(
      this.state.maxMana,
      this.state.mana + this.state.manaPerTurn
    );

    this.setState({ mana: newMana, xp: this.state.xp + 2 });
    this.checkLevelUp();
  }

  checkLevelUp() {
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
    }
  }

  getManaCost({ disc, isActive, civChanges }) {
    let mana = isActive ? 0 : disc.mana;
    const addCivMana = disc.addCivMana || disc.mana * 0.7;
    const removeCivMana = disc.removeCivMana || disc.mana * 0.7;

    civChanges.forEach(
      change => (mana += change.type === 'connect' ? addCivMana : removeCivMana)
    );
    if (!isActive && civChanges.length) {
      mana -= addCivMana;
    }
    return mana * (this.state.spellDiscounts[disc.category] || 1);
  }

  castSpell(spellId, civs) {
    const spell = this.state.spells.find(spell => spell.id === spellId);
    const createDiscId = spell.createDisc || spell.id;
    const civsTitle = this.civs.state.civList
      .filter(civ => civs.includes(civ.id))
      .map(civ => civ.title)
      .join(', ');
    const manaCost = this.getManaCost({
      isActive: false,
      disc: spell,
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

    this.setState({ mana: this.state.mana - manaCost });
    this.world.createDisc(createDiscId, civs);
    this.system.showMessage({
      type: 'sparkSpell',
      title: spell.title,
      civs: civsTitle,
    });
    this.world.logEvent({ type: 'sparkSpell', disc: createDiscId, civs });
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
    const manaCost = this.getManaCost({ disc, isActive: true, civChanges });

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
    this.setState({ mana: this.state.mana - manaCost });
    if (isRemove) {
      this.system.showMessage({ type: 'removeDisc', title: disc.title });
      this.world.logEvent({ type: 'removeDisc', disc: discId, civChanges });
      this.world.removeDisc(discId);
    } else {
      this.system.showMessage({ type: 'modifyDisc', title: disc.title });
      this.world.logEvent({ type: 'modifyDisc', disc: discId, civChanges });
    }
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
      [...allSpells, ...allDiscs].forEach(spell => {
        if (spell.skill === skillId) {
          newSpells.push(spell);
        }
      });
      this.setState({ spells: [...this.state.spells, ...newSpells] });
    }
  }
}

export default Spark;
