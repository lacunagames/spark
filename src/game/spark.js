import StateHandler from './statehandler';
import allSkills from './data/skills';
import allSpells from './data/spells';
import allDiscs from './data/discs';

const defaultState = {
  skills: allSkills.map(skill => ({ ...skill, isDisabled: !skill.isStarter })),
  skillPoints: 1,
  level: 1,
  xpToLevel: 12,
  xp: 0,
  mana: 0,
  maxMana: 10,
  manaPerTurn: 3,
  manaCharges: 0,
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

  castSpell(spellId, civs) {
    const spell = this.state.spells.find(spell => spell.id === spellId);
    const createDiscId = spell.createDisc || spell.id;

    if (civs.length === 0) {
      this.system.showMessage({ type: 'noRaceSelected' });
      return false;
    }
    if (this.state.mana < spell.mana * civs.length) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (this.world.state.discs.find(disc => disc.id === createDiscId))
      return false;

    this.setState({ mana: this.state.mana - spell.mana });
    this.world.createDisc(createDiscId, civs);
    this.world.logEvent({ type: 'sparkSpell', disc: createDiscId, civs });
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
      this.setState({ skillPoints: this.state.skillPoints - 1 });
      this._updateStateObj('skills', skillId, { isActive: true });
      this.system.showMessage({ type: 'skillLearned', title: skill.title });
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
