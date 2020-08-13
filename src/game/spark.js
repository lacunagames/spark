import StateHandler from './statehandler';
import allSkills from './data/skills';
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
  manaRestoreMultiplier: 0,
  manaToRestore: 0,
  manaToXpMultiplier: 0.2,

  manaCharges: 3,
  maxManaCharges: 3,
  manaChargeSkills: [],
  manaChargeStep: 0, // Stores progress to next charge
  manaChargeMaxStep: 100,
  chargeToMana: 15,

  discUpgradedFrom: {},
};

class Spark extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    setTimeout(() => {
      this.setState({
        spells: [
          ...this.state.spells,
          ...this.world.state.allDisclike.filter(disc =>
            this.state.skills.find(
              skill => skill.id === disc.skill && skill.isActive
            )
          ),
        ],
      });
    }, 0);
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

  isGlobalCastSpell(spellId) {
    const spell = this.state.spells.find(spell => spell.id === spellId);

    return spell
      ? spell.isGlobal ||
          (spell.type === 'spell' &&
            !spell.onCast.some(action => action.damageCiv || action.addStat))
      : false;
  }

  getManaCost(discId, civId) {
    const disc =
      this.world.state.discs.find(disc => disc.id === discId) ||
      this.state.spells.find(disc => disc.id === discId);
    const isActive = typeof disc?.index === 'number';
    const isConnected = this.civs.state.civList
      .find(civ => civ.id === civId)
      ?.connect.includes(discId);
    let mana = 0;
    const durMult =
      (disc.durations?.[civId] || disc.currentDuration) / disc.duration;

    if (civId === undefined) {
      mana = disc?.mana || 0;
      if (isActive && disc?.type === 'biome') {
        this.civs.state.civList.forEach(civ => {
          if (civ.connect.includes(discId)) {
            mana +=
              (disc.removeCivMana || disc.mana * 0.8) *
              (disc.duration ? durMult : 1);
          }
        });
      }
    } else {
      if (isActive) {
        mana = isConnected
          ? (disc.removeCivMana ||
              disc.mana * (disc.type === 'boon' ? 1 : 0.8)) *
            (disc.duration ? durMult : 1)
          : disc.addCivMana || disc.mana * (disc.type === 'boon' ? 1 : 0.8);
      } else {
        mana = disc?.mana || 0;
        if (disc.type === 'biome') {
          mana += disc.addCivMana || disc.mana * 0.8;
        }
      }
    }
    mana *= this.state.spellDiscounts[disc?.category] || 1;
    return utils.round(Math.max(mana, 1), 0);
  }

  updateManaCharges(manaCost, category) {
    if (this.state.manaChargeSkills.includes(category)) {
      this.setState({ manaChargeStep: this.state.manaChargeStep + manaCost });
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
        this.system.showFloater('charge', this.state.manaCharges - oldCharges);
      }
    }
    // Mana restore
    const manaPre = this.state.mana;
    const manaToRestore = utils.round(
      this.state.manaToRestore + manaCost * this.state.manaRestoreMultiplier
    );
    this.setState({
      manaToRestore: utils.round(manaToRestore % 1),
      mana:
        this.state.mana > this.state.maxMana
          ? this.state.mana
          : Math.min(
              Math.floor(this.state.mana + manaToRestore),
              this.state.maxMana
            ),
    });
    if (manaPre < this.state.mana) {
      this.system.showFloater('mana', this.state.mana - manaPre);
    }
  }

  popManaCharge(popCount = 1) {
    if (this.state.manaCharges >= popCount) {
      this.setState({
        mana: this.state.mana + this.state.chargeToMana * popCount,
        manaCharges: this.state.manaCharges - popCount,
      });
      this.system.showFloater('mana', this.state.chargeToMana * popCount);
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

    if (spell.onCast) {
      this.world.executeActions({ actions: spell.onCast, civId, disc: spell });
    }

    this.setState({
      mana: this.state.mana - manaCost,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost * this.state.manaToXpMultiplier, 2),
    });
    if (!spell.skipLog) {
      this.system.showMessage(
        this.world.logEvent({ type: 'sparkSpell', civId, spellId })
      );
    }
    this.updateManaCharges(manaCost, spell.category);
    return true;
  }

  modifyDisc(discId, civId) {
    const disc =
      this.world.state.discs.find(disc => disc.id === discId) ||
      this.world.state.allDisclike.find(disc => disc.id === discId);
    const civ = this.civs.state.civList.find(civ => civ.id === civId);
    const isActive = typeof disc.index === 'number';
    const isConnect = civ && !civ.connect.includes(discId);
    const isRemove =
      (isActive &&
        civ &&
        !['biome'].includes(disc.type) &&
        !disc.isGlobal &&
        !this.civs.state.civList.find(
          civ => civ.id !== civId && civ.connect.includes(discId)
        )) ||
      (isActive && !civ);
    const upgradedDiscId =
      !civId &&
      disc.upgrades
        ?.map(id => this.world.state.discs.find(disc => disc.id === id))
        .filter(disc => disc)[0]?.id;
    const upgradedCivIds =
      upgradedDiscId &&
      this.civs.state.civList
        .filter(civ => civ.connect.includes(upgradedDiscId))
        .map(civ => civ.id);
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
      this.world.createDisc(discId, { civIds: upgradedCivIds || civId });
      if (upgradedDiscId) {
        this.setState({
          discUpgradedFrom: {
            ...this.state.discUpgradedFrom,
            [discId]:
              this.state.discUpgradedFrom[upgradedDiscId] || upgradedDiscId,
          },
        });
      }
    } else if (!isConnect && !isRemove) {
      this.civs.disconnectDisc(civId, discId);
    }

    if (isRemove) {
      this.system.showMessage(
        this.world.logEvent({ type: 'removeDisc', discId, civId })
      );
      if (disc.onCancel) {
        this.civs.state.civList.forEach(civ => {
          if (civ.connect.includes(discId)) {
            this.world.executeActions({
              actions: disc.onCancel,
              civId: civ.id,
              disc,
            });
          }
        });
      }
      this.world.removeDisc(discId);
    } else {
      this.system.showMessage(
        this.world.logEvent({
          type: 'modifyDisc',
          discId,
          civChanges:
            civId === undefined
              ? undefined
              : [{ id: civId, type: isConnect ? 'connect' : 'disconnect' }],
        })
      );
    }
    this.updateManaCharges(manaCost, disc.category);
    return { isRemove, discUpgradedFrom: this.state.discUpgradedFrom[disc.id] };
  }

  learnSkill(skillId) {
    const skill = this.state.skills.find(skill => skill.id === skillId);
    const hasActiveSkills = this.state.skills.some(
      skill => skill.isActive && !skill.isHidden
    );

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
        manaRestoreMultiplier:
          this.state.manaRestoreMultiplier +
          (skill.effect?.manaRestoreMultiplier || 0),
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

      const newSpells = [...this.world.state.allDisclike].filter(
        spell => spell.skill === skillId
      );
      this.setState({ spells: [...this.state.spells, ...newSpells] });
    }
  }
}

export default Spark;
