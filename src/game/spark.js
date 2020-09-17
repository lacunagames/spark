import StateHandler from './statehandler';
import allSkills from './data/skills';
import utils from '@/game/utils';

const defaultState = {
  skills: allSkills.map(skill => ({ ...skill, isDisabled: !skill.isStarter })),
  skillPoints: 1,
  level: 1,

  spellDiscounts: {},
  spells: [],

  xpToLevel: 12,
  xp: 0,
  xpNextTurn: 0,

  mana: 10,
  maxMana: 15,
  manaPerTurn: 5,
  manaRestoreMultiplier: 0,
  manaToRestore: 0,
  manaToXpMultiplier: 0.2,
  manaLock: 0, // Mana to be removed from manaPerTurn gains

  manaCharges: 0,
  maxManaCharges: 3,
  manaChargeSkills: [],
  manaChargeStep: 0, // Stores progress to next charge
  maxManaChargeStep: 100,
  chargeToMana: 15,

  discUpgradedFrom: {}, // Stores source disc to fall back to when upgrade is removed
  discRecharge: {},
};

class Spark extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
  }

  initSpark() {
    this.setState({
      spells: [
        ...this.state.spells,
        ...this.world.state.allDisclike.filter(
          disc => this._find('skills', disc.skill)?.isActive
        ),
      ],
    });
    this.system.setState({ isSparkTurn: true, muteMessages: false });
  }

  cheatSpark() {
    this.setState({
      mana: this.state.mana + 50,
      manaCharges: this.state.manaCharges + 1,
      skillPoints: this.state.skillPoints + 8,
    });
    if (
      this._find('skills', 'earth3')?.isActive &&
      !this._find('skills', 'nature')?.isActive
    ) {
      [
        'mana3',
        'mana4',
        'fire',
        'water',
        'mana2',
        'air',
        'mana37',
        'nature',
      ].forEach(skillId => this.learnSkill(skillId));
    } else if (this._find('skills', 'earth')?.isActive) {
      [
        'mana20',
        'mana21',
        'earth2',
        'mana22',
        'mana23',
        'mana24',
        'earth3',
      ].forEach(skillId => this.learnSkill(skillId));
    } else {
      this.learnSkill('earth');
    }
  }

  updateStats(stats, canOverflow) {
    const realStatChange = {};
    Object.keys(stats).forEach(stat => {
      let value = this.state[stat] + stats[stat];
      const maxStatName = `max${stat.charAt(0).toUpperCase()}${stat.slice(1)}`;
      if ({}.hasOwnProperty.call(this.state, maxStatName) && !canOverflow) {
        value = Math.max(Math.min(this.state[maxStatName], value), 0);
      }
      realStatChange[stat] = value - this.state[stat];
      this.setState({ [stat]: value });
    });
    return realStatChange;
  }

  sparkTurn() {
    const xpThisTurn = utils.round(this.state.xpNextTurn);
    let hasLeveled = false;
    let manaLock = this.state.manaLock;
    let manaPerTurn = this.state.manaPerTurn;
    if (manaLock > 0) {
      manaLock = manaLock > manaPerTurn ? manaLock - manaPerTurn : 0;
      manaPerTurn =
        this.state.manaLock > manaPerTurn
          ? 0
          : manaPerTurn - this.state.manaLock;
    }
    const newMana = Math.min(this.state.maxMana, this.state.mana + manaPerTurn);

    this.setState({
      mana: this.state.mana > this.state.maxMana ? this.state.mana : newMana,
      manaLock,
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

  getManaCost(discId, targetId) {
    const disc =
      this.world._find('discs', discId) || this._find('spells', discId);
    const isActive = typeof disc.index === 'number';
    const isRemove = this.getIsDiscRemove(discId, targetId);
    const isConnected =
      this.civs._find('civList', targetId)?.connect.includes(discId) ||
      this.world.state.discs.find(
        disc =>
          (disc.id === discId && disc.connect?.includes(targetId)) ||
          (disc.id === targetId && disc.connect?.includes(discId))
      );
    const countTarget =
      (this.world.state.discs.filter(disc => disc.connect?.includes(discId))
        .length ?? 0) + (disc.connect?.length ?? 0);
    let mana = 0;
    const durMult =
      (disc.durations?.[targetId] || disc.currentDuration) / disc.duration;
    let charge = isRemove || !isActive ? disc.chargeCreate || 0 : 0;
    if (isRemove && disc.chargeConnect && !targetId) {
      this.civs.state.civList.forEach(civ => {
        if (civ.connect.includes(discId)) {
          charge += disc.chargeConnect;
        }
      });
      charge += disc.chargeConnect * countTarget;
    }

    charge += targetId ? disc.chargeConnect || 0 : 0;

    if (targetId === undefined) {
      mana = isRemove ? disc.removeMana ?? disc.mana ?? 0 : disc.mana ?? 0;
      if (isActive && ['biome', 'beast'].includes(disc?.type)) {
        this.civs.state.civList.forEach(civ => {
          if (civ.connect.includes(discId)) {
            mana +=
              (disc.removeCivMana || disc.mana * 0.8) *
              (disc.duration ? durMult : 1);
          }
        });
        mana +=
          (disc.removeCivMana || disc.mana * 0.8) *
          (disc.duration ? durMult : 1) *
          countTarget;
      }
    } else {
      if (isActive) {
        mana = isConnected
          ? (disc.removeCivMana ||
              disc.mana * (disc.type === 'boon' ? 1 : 0.8)) *
            (disc.duration ? durMult : 1)
          : disc.addCivMana || disc.mana * (disc.type === 'boon' ? 1 : 0.8);
      } else {
        mana = disc.mana || 0;
        if (['biome', 'beast'].includes(disc.type)) {
          mana += disc.addCivMana || disc.mana * 0.8;
        }
      }
    }
    mana *= this.state.spellDiscounts[disc?.category] || 1;
    mana = utils.round(Math.max(mana, mana === 0 ? 0 : 1), 0);
    return { mana, charge };
  }

  updateManaCharges(manaCost, category) {
    if (this.state.manaChargeSkills.includes(category)) {
      this.setState({ manaChargeStep: this.state.manaChargeStep + manaCost });
    }
    if (this.state.manaChargeStep >= this.state.maxManaChargeStep) {
      const oldCharges = this.state.manaCharges;
      this.setState({
        manaCharges:
          this.state.manaCharges +
          Math.floor(this.state.manaChargeStep / this.state.maxManaChargeStep),
        manaChargeStep:
          this.state.manaChargeStep % this.state.maxManaChargeStep,
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

  castSpell(spellId, targetId) {
    const spell = this._find('spells', spellId);

    if (spell.type !== 'spell') {
      return this.modifyDisc(spellId, targetId);
    }

    const manaCost = this.getManaCost(spell.id, targetId);
    const civ = targetId && this.civs._find('civList', targetId);

    if (manaCost.mana > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (manaCost.charge > this.state.manaCharges) {
      this.system.showMessage({ type: 'notEnoughManaCharge' });
      return false;
    }
    if (civ?.influence < spell.influence) {
      this.system.showMessage({ type: 'notEnoughInfluence' });
      return false;
    }

    if (spell.onCast) {
      this.world.executeActions({
        actions: spell.onCast,
        civId: civ?.id,
        targetId: !civ && targetId,
        disc: spell,
      });
    }

    this.setState({
      mana: this.state.mana - manaCost.mana,
      manaCharges: this.state.manaCharges - manaCost.charge,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost.mana * this.state.manaToXpMultiplier, 2),
    });
    if (!spell.skipLog) {
      this.system.showMessage(
        this.world.logEvent({ type: 'sparkSpell', targetId, spellId })
      );
    }
    if (spell.rechargeTurns) {
      this._updateStateKey(
        'discRecharge',
        spellId,
        this.world.state.turn + spell.rechargeTurns
      );
    }
    this.updateManaCharges(manaCost.mana, spell.category);
    return true;
  }

  getIsDiscRemove(discId, targetId) {
    const disc =
      this.world._find('discs', discId) ||
      this.world._find('allDisclike', discId);
    const isActive = typeof disc.index === 'number';

    return (
      (isActive && !targetId) ||
      (isActive &&
        !['biome', 'beast'].includes(disc.type) &&
        !disc.isGlobal &&
        !this.civs.state.civList.find(
          civ => civ.id !== targetId && civ.connect.includes(discId)
        ) &&
        !disc.connect?.filter(conn => conn !== targetId)?.length &&
        !this.world.state.discs.find(
          disc => disc.id !== targetId && disc.connect?.includes(discId)
        ))
    );
  }

  modifyDisc(discId, targetId) {
    const disc =
      this.world._find('discs', discId) ||
      this.world._find('allDisclike', discId);
    const civ = this.civs._find('civList', targetId);
    const target = !civ && this.world._find('discs', targetId);
    const isActive = typeof disc.index === 'number';
    const isConnect =
      (civ && !civ.connect.includes(discId)) ||
      (target &&
        !target.connect?.includes(discId) &&
        !disc.connect?.includes(targetId));
    const isRemove = this.getIsDiscRemove(discId, targetId);
    const upgradedDiscId =
      !targetId &&
      disc.upgrades?.filter(id => this.world._find('discs', id))[0];
    const upgradedTargetIds = upgradedDiscId && [
      ...this.civs.state.civList
        .filter(civ => civ.connect.includes(upgradedDiscId))
        .map(civ => civ.id),
      ...this.world.state.discs
        .filter(disc => disc.connect?.includes(upgradedDiscId))
        .map(disc => disc.id),
    ];
    const manaCost = this.getManaCost(discId, targetId);

    if (manaCost.mana > this.state.mana) {
      this.system.showMessage({ type: 'notEnoughMana' });
      return false;
    }
    if (manaCost.charge > this.state.manaCharges) {
      this.system.showMessage({ type: 'notEnoughManaCharge' });
      return false;
    }
    if (civ?.influence < disc.influence) {
      this.system.showMessage({ type: 'notEnoughInfluence' });
      return false;
    }

    this.setState({
      mana: this.state.mana - manaCost.mana,
      manaCharges: this.state.manaCharges - manaCost.charge,
      xpNextTurn:
        this.state.xpNextTurn +
        utils.round(manaCost.mana * this.state.manaToXpMultiplier, 2),
    });

    if (!isActive || isConnect) {
      this.world.createDisc(
        discId,
        upgradedTargetIds?.length ? upgradedTargetIds : targetId
      );
      if (!isActive && disc.onCast) {
        this.world.executeActions({
          actions: disc.onCast,
          civId: civ?.id,
          targetId: target?.id,
          disc,
        });
      }
      if (upgradedDiscId) {
        this._updateStateKey(
          'discUpgradedFrom',
          discId,
          this.state.discUpgradedFrom[upgradedDiscId] || upgradedDiscId
        );
      }
      [...(disc.createRequires || []), ...(disc.requires || [])].forEach(
        reqId => {
          if (isActive && disc.createRequires.includes(reqId)) {
            return;
          }
          if (this.world._find('discs', reqId)?.isResource) {
            this.world.removeDisc(reqId);
          }
        }
      );
    } else if (!isConnect && !isRemove) {
      if (civ) {
        this.civs.disconnectDisc(targetId, discId);
      } else {
        this.world.disconnectDisc(targetId, discId);
      }
    }

    if (isRemove) {
      this.world.removeDisc(discId);
      this.system.showMessage(
        this.world.logEvent({ type: 'removeDisc', discId, targetId })
      );
      if (disc.onCancel) {
        this.civs.state.civList.forEach(civFind => {
          if (civFind.connect.includes(discId)) {
            this.world.executeActions({
              actions: disc.onCancel,
              civId: civFind.id,
              disc,
            });
          }
        });
        if (!targetId) {
          this.world.executeActions({
            actions: disc.onCancel,
            disc,
          });
        }
      }
    } else {
      this.system.showMessage(
        this.world.logEvent({
          type: 'modifyDisc',
          discId,
          targetChanges:
            targetId === undefined
              ? undefined
              : [{ id: targetId, type: isConnect ? 'connect' : 'disconnect' }],
        })
      );
    }
    if (
      disc.rechargeTurns &&
      (!isActive || (isConnect && disc.type === 'boon'))
    ) {
      this._updateStateKey(
        'discRecharge',
        disc.type === 'boon' ? `${discId}|${targetId}` : discId,
        this.world.state.turn + disc.rechargeTurns
      );
    }
    this.updateManaCharges(manaCost.mana, disc.category);
    return { isRemove, discUpgradedFrom: this.state.discUpgradedFrom[disc.id] };
  }

  learnSkill(skillId) {
    const skill = this._find('skills', skillId);
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
            otherId => this._find('skills', otherId)?.isActive
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

  getSpellButtons(spellId) {
    const getDisabledText = (target, upg) => {
      const disc = upg || spell;
      const isConnected =
        target?.connect?.includes(spellId) ||
        spell?.connect?.includes(target?.id);

      if (!activeDisc && upg) {
        return `${spell.title} has to be active to upgrade.`;
      }

      const skillCheck = upg ? this._find('skills', disc.skill) : skill;

      if (!skillCheck) {
        return `Can not modify.`;
      }
      if (skillCheck && !skillCheck.isActive) {
        return `Requires the ${skill.title} power.`;
      }
      const matchIdFn = discId =>
        !this.world.state.discs.find(
          disc => disc.id === discId || disc.labels?.includes(discId)
        ) &&
        (!target ||
          !target.connect?.includes(discId) ||
          spell.connect?.includes(target?.id));
      const missingRequiredId =
        disc.requires?.find(matchIdFn) ||
        ((!activeDisc || upg) && disc.createRequires?.find(matchIdFn));

      if (missingRequiredId) {
        return `Requires ${
          this.world._find('allDisclike', missingRequiredId)?.title
        }.`;
      }

      const disabledByDisc =
        (target || upg) &&
        this.world.state.discs.find(
          discFind =>
            target?.connect?.find(
              conn =>
                conn === discFind.id && discFind.disables?.includes(spell.id)
            ) ||
            spell.connect?.find(
              conn =>
                conn === discFind.id && discFind.disables?.includes(target?.id)
            ) ||
            (isGlobalCastSpell &&
              discFind.disables?.includes(target?.id || upg?.id))
        );
      if (disabledByDisc) {
        return `Disabled by ${disabledByDisc.title}`;
      }
      const upgradedBy =
        target && this.world.getDiscUpgrade(spellId, target.id);
      if (upgradedBy) {
        return `Upgraded by ${upgradedBy.title}`;
      }

      const rechargeTurns =
        this.state.discRecharge[`${disc.id}${target ? `|${target.id}` : ''}`] -
        this.world.state.turn;

      if (
        rechargeTurns > 0 &&
        (!activeDisc || upg || (target && !isConnected))
      ) {
        return `Recharging, ${rechargeTurns} turn${
          rechargeTurns > 1 ? 's' : ''
        } left.`;
      }

      if (
        spell.removeDisabled &&
        !upg &&
        activeDisc &&
        (!target || isConnected)
      ) {
        return `Remove is disabled for ${spell.title}.`;
      }

      return '';
    };
    const buttons = [];
    const spell =
      this.world._find('discs', spellId) ||
      this._find('spells', spellId) ||
      this.world._find('allDisclike', spellId);
    if (!spell) {
      return [];
    }
    const isGlobalCastSpell =
      spell.isGlobal ||
      (spell.type === 'spell' &&
        !spell.onCast?.some(
          action => action.damageCiv || action.damageAny || action.addStat
        ));
    const canTargetBeasts =
      !isGlobalCastSpell &&
      (spell.onCast?.some(action => action.damageAny) || spell.turnDamage) &&
      !['knowledge', 'boon'].includes(spell.type);
    const skill = this._find('skills', spell.skill);
    const canCreate =
      (['biome', 'beast'].includes(spell.type) &&
        (!spell.skillCreate ||
          this._find('skills', spell.skillCreate)?.isActive)) ||
      isGlobalCastSpell;
    const activeDisc = this.world._find('discs', spellId);
    const getRechargePercent = rechargeId =>
      this.state.discRecharge[rechargeId] > 0 &&
      Math.max(
        0.03,
        utils.round(
          1 -
            (this.state.discRecharge[rechargeId] - this.world.state.turn) /
              spell.rechargeTurns
        )
      );

    // BTN Create/Destroy
    if (skill?.isActive && canCreate) {
      buttons.push({
        id: 'create',
        title: activeDisc
          ? 'Destroy'
          : spell.type === 'spell'
          ? 'Cast'
          : 'Create',
        isActive: !!activeDisc,
        icon: activeDisc ? 'destroy' : 'create',
        manaCost: this.getManaCost(spellId),
        disabledText: getDisabledText(),
        rechargePercent:
          !activeDisc &&
          this.state.discRecharge[spell.id] > 0 &&
          getRechargePercent(spell.id),
      });
    }
    // BTN Civ Connect/Disconnect
    if (!isGlobalCastSpell) {
      this.civs.state.civList.map(civ => {
        const isConnected = civ.connect.includes(spellId);
        const disabledText = getDisabledText(civ);
        if (skill?.isActive || isConnected) {
          buttons.push({
            id: civ.id,
            civId: civ.id,
            title: civ.title,
            isActive: isConnected,
            icon: civ.icon || civ.id,
            manaCost: this.getManaCost(spellId, civ.id),
            disabledText,
            duration: activeDisc?.durations?.[civ.id],
            influence: civ.influence,
            rechargePercent:
              !isConnected && getRechargePercent(`${spell.id}|${civ.id}`),
          });
        }
      });
    }

    // BTN Target Beasts
    if (canTargetBeasts) {
      this.world.state.discs.forEach(disc => {
        const isActive =
          spell.connect?.includes(disc.id) || disc.connect?.includes(spellId);
        if (
          disc.type === 'beast' &&
          disc.id !== spellId &&
          (skill?.isActive || isActive)
        ) {
          buttons.push({
            id: disc.id,
            targetId: disc.id,
            title: disc.title,
            isActive,
            icon: disc.icon || disc.id,
            manaCost: this.getManaCost(spellId, disc.id),
            disabledText: getDisabledText(disc),
            rechargePercent:
              !isActive && getRechargePercent(`${spell.id}|${disc.id}`),
          });
        }
      });
    }

    // BTN Upgrade
    if (
      skill?.isActive &&
      !['knowledge', 'boon', 'spell'].includes(spell.type)
    ) {
      this.world.state.allDisclike
        .filter(disc => disc.upgrades?.includes(spellId))
        .forEach(upg => {
          const disabledText = getDisabledText(undefined, upg);
          buttons.push({
            id: upg.id,
            upgId: upg.id,
            title: `Upgrade to ${upg.title}`,
            icon: upg.icon || upg.id,
            manaCost: disabledText ? {} : this.getManaCost(upg.id),
            disabledText,
            rechargePercent: getRechargePercent(upg.id),
          });
        });
    }

    return buttons;
  }
}

export default Spark;
