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

  mana: 1000,
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

  getManaCost(discId, civId) {
    const disc =
      this.world.state.discs.find(disc => disc.id === discId) ||
      this.state.spells.find(disc => disc.id === discId);
    const isActive = typeof disc.index === 'number';
    const isConnected = this.civs.state.civList
      .find(civ => civ.id === civId)
      ?.connect.includes(discId);
    let mana = 0;
    if (isActive) {
      const durMult =
        (disc.durations?.[civId] || disc.duration) / disc.duration;
      mana = isConnected
        ? (disc.removeCivMana || disc.mana * (disc.type === 'boon' ? 1 : 0.8)) *
          (disc.duration ? durMult : 1)
        : disc.addCivMana || disc.mana * (disc.type === 'boon' ? 1 : 0.7);
    } else {
      mana = disc.mana;
    }
    mana *= this.state.spellDiscounts[disc?.category] || 1;
    mana = Math.max(mana, 1);
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

  castSpell(spellId, civId) {
    const spell = this.state.spells.find(spell => spell.id === spellId);

    if (spell.type !== 'spell' || spell.createDisc) {
      return this.modifyDisc(spell.createDisc || spellId, civId);
    }

    const manaCost = this.getManaCost(spell.id, civId);

    if (manaCost > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }

    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });
    this.system.showMessage(
      this.world.logEvent({ type: 'sparkSpell', civId, spellId })
    );
    this.updateManaCharges(manaCost, spell.category);
    return true;
  }

  modifyDisc(discId, civId) {
    const disc =
      this.world.state.discs.find(disc => disc.id === discId) ||
      this.world.state.allDisclike.find(disc => disc.id === discId);
    const civ = this.civs.state.civList.find(civ => civ.id === civId);
    const isActive = typeof disc.index === 'number';
    const isConnect = !civ.connect.includes(discId);
    const isRemove =
      isActive &&
      !['biome'].includes(disc.type) &&
      !this.civs.state.civList.find(
        civ => civ.id !== civId && civ.connect.includes(discId)
      );
    const manaCost = this.getManaCost(discId, civId);

    if (manaCost > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }

    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });

    if (!isActive || isConnect) {
      this.world.createDisc(discId, civId);
    } else if (!isConnect) {
      this.civs.disconnectDisc(civId, discId);
    }

    if (isRemove) {
      this.system.showMessage(
        this.world.logEvent({ type: 'removeDisc', discId, civId })
      );
      this.world.removeDisc(discId);
    } else {
      this.system.showMessage(
        this.world.logEvent({
          type: 'modifyDisc',
          discId,
          civChanges: [
            { id: civId, type: isConnect ? 'connect' : 'disconnect' },
          ],
        })
      );
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
      this.world.logEvent({ type: 'sparkSkillLearned', skillId });
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

      const newSpells = [
        ...allSpells,
        ...allDiscs,
        ...allBoons,
        ...allTechs,
      ].filter(spell => spell.skill === skillId);
      this.setState({ spells: [...this.state.spells, ...newSpells] });
    }
  }
}

export default Spark;
