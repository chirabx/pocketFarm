(function () {
  'use strict';

  const SAVE_KEY = 'farm_game_save_v4';
  const MARKET_SIZE = 4;
  const MARKET_REFRESH_COST = 40;
  const GRID_SIZE = 5;
  const PLOT_COUNT = GRID_SIZE * GRID_SIZE;
  const TASK_ORDER = ['watered', 'weeded', 'fertilized'];
  const TASK_LABELS = {
    watered: '浇水',
    weeded: '除虫',
    fertilized: '施肥'
  };

  const ASSET = {
    bg: './assets/bg/farm_scene_main.png',
    tileLocked: './assets/tiles/plot_locked.png',
    tileOpen: './assets/tiles/plot_open.png',
    iconHarvest: './assets/fx/icon_harvest_star.png',
    iconWater: './assets/fx/icon_water_can.png',
    iconBug: './assets/fx/icon_bug_purple.png',
    iconFertilize: './assets/fx/icon_fertilizer_bag.png',
    warehouse: {
      wheat: './assets/warehouse/wheat.png',
      cabbage: './assets/warehouse/cabbage.png',
      corn: './assets/warehouse/corn.png',
      tomato: './assets/warehouse/tomato.png',
      potato: './assets/warehouse/potato.png',
      strawberry: './assets/warehouse/strawberry.png',
      carrot: './assets/warehouse/carrot.png',
      pumpkin: './assets/warehouse/pumpkin.png',
      watermelon: './assets/warehouse/watermelon.png',
      eggplant: './assets/warehouse/eggplant.png'
    },
    stage: {
      1: './assets/crops/shared/stage_1.png',
      2: './assets/crops/shared/stage_2.png',
      3: './assets/crops/shared/stage_3.png',
      4: './assets/crops/shared/stage_4.png'
    }
  };

  const CROPS = [
    { id: 'wheat', name: '小麦', growMonths: 4, seedBuy: 18, cropSellBase: 26, yield: 3 },
    { id: 'cabbage', name: '白菜', growMonths: 3, seedBuy: 16, cropSellBase: 24, yield: 3 },
    { id: 'corn', name: '玉米', growMonths: 5, seedBuy: 24, cropSellBase: 34, yield: 3 },
    { id: 'tomato', name: '番茄', growMonths: 3, seedBuy: 20, cropSellBase: 30, yield: 2 },
    { id: 'potato', name: '土豆', growMonths: 6, seedBuy: 28, cropSellBase: 40, yield: 4 },
    { id: 'strawberry', name: '草莓', growMonths: 8, seedBuy: 40, cropSellBase: 58, yield: 4 },
    { id: 'carrot', name: '胡萝卜', growMonths: 4, seedBuy: 22, cropSellBase: 31, yield: 3 },
    { id: 'pumpkin', name: '南瓜', growMonths: 9, seedBuy: 48, cropSellBase: 76, yield: 4 },
    { id: 'watermelon', name: '西瓜', growMonths: 10, seedBuy: 55, cropSellBase: 90, yield: 5 },
    { id: 'eggplant', name: '茄子', growMonths: 7, seedBuy: 32, cropSellBase: 48, yield: 3 }
  ];

  const CROP_BY_ID = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));
  const ICONS = {
    tools: {
      plant: '🌱',
      water: '💧',
      fertilize: '🧪',
      weed: '🐛',
      harvest: '⭐',
      clear: '🧹'
    },
    crops: {
      wheat: '🌾',
      cabbage: '🥬',
      corn: '🌽',
      tomato: '🍅',
      potato: '🥔',
      strawberry: '🍓',
      carrot: '🥕',
      pumpkin: '🎃',
      watermelon: '🍉',
      eggplant: '🍆'
    }
  };

  const dom = {
    monthValue: document.getElementById('monthValue'),
    goldValue: document.getElementById('goldValue'),
    bagCount: document.getElementById('bagCount'),
    bagCap: document.getElementById('bagCap'),
    seedSelectList: document.getElementById('seedSelectList'),
    farmGrid: document.getElementById('farmGrid'),
    hintText: document.getElementById('hintText'),
    shopSeedList: document.getElementById('shopSeedList'),
    marketCards: document.getElementById('marketCards'),
    bagList: document.getElementById('bagList'),
    refreshMarket: document.getElementById('refreshMarket'),
    endMonth: document.getElementById('endMonth'),
    saveNow: document.getElementById('saveNow'),
    resetGame: document.getElementById('resetGame'),
    lockLandscape: document.getElementById('lockLandscape'),
    toast: document.getElementById('toast'),
    appRoot: document.getElementById('appRoot'),
    shopToggle: document.getElementById('shopToggle'),
    bagToggle: document.getElementById('bagToggle'),
    settingsToggle: document.getElementById('settingsToggle'),
    shopPanel: document.getElementById('shopPanel'),
    bagPanel: document.getElementById('bagPanel'),
    settingsPanel: document.getElementById('settingsPanel'),
    shopTabBuy: document.getElementById('shopTabBuy'),
    shopTabSell: document.getElementById('shopTabSell'),
    shopBuyView: document.getElementById('shopBuyView'),
    shopSellView: document.getElementById('shopSellView'),
    seedDetailName: document.getElementById('seedDetailName'),
    seedDetailPrice: document.getElementById('seedDetailPrice'),
    seedDetailOwned: document.getElementById('seedDetailOwned'),
    seedDetailQty: document.getElementById('seedDetailQty'),
    seedDetailTotal: document.getElementById('seedDetailTotal'),
    seedPreviewImg: document.getElementById('seedPreviewImg'),
    seedKnowledge: document.getElementById('seedKnowledge'),
    buySeedConfirm: document.getElementById('buySeedConfirm'),
    shopSeedPrev: document.getElementById('shopSeedPrev'),
    shopSeedNext: document.getElementById('shopSeedNext'),
    shopSeedPageInfo: document.getElementById('shopSeedPageInfo'),
    marketPrev: document.getElementById('marketPrev'),
    marketNext: document.getElementById('marketNext'),
    marketPageInfo: document.getElementById('marketPageInfo'),
    marketTotalPrice: document.getElementById('marketTotalPrice'),
    seedSelectPanel: document.getElementById('seedSelectPanel'),
    unlockConfirmPanel: document.getElementById('unlockConfirmPanel'),
    unlockConfirmText: document.getElementById('unlockConfirmText'),
    unlockCancel: document.getElementById('unlockCancel'),
    unlockConfirm: document.getElementById('unlockConfirm')
  };

  const SEED_PAGE_SIZE = 3;
  const MARKET_PAGE_SIZE = 2;

  let toastTimer = null;
  const state = loadState() || createInitialState();
  const ui = {
    shopMode: 'buy',
    selectedShopCrop: 'wheat',
    buyQty: {},
    sellQty: {},
    shopSeedPage: 0,
    marketPage: 0,
    pendingUnlock: null
  };

  const KNOWLEDGE = {
    wheat: '小麦是禾本科的重要谷物，富含淀粉与植物蛋白，是全球三大主粮之一。它起源于约一万年前中东的“新月沃地”，直接推动了人类从狩猎走向农业定居的文明演进。传入中国后，随着汉代石磨的普及，面粉加工技术成熟，促使面食逐渐兴起，深刻塑造了以面条、馒头为主的北方饮食文化。小麦不仅是饱腹的粮食，更是见证人类文明发展的金色史诗。',
    cabbage: '大白菜属十字花科，原产于中国，富含维生素，是极耐寒的国民级蔬菜。它曾是北方冬季的绝对“当家菜”，承载着一代人深厚的冬储记忆。在传统文化中，“白菜”谐音“百财”，寓意招财进宝与清白传家，著名的国宝“翠玉白菜”便源于这种民间期许。它是兼具实用价值与美好祥瑞的田园珍品。',
    corn: '玉米属禾本科，是全球总产量最高的“黄金谷物”。它原产于美洲，由印第安人历经数千年驯化，曾是支撑玛雅与阿兹特克文明繁荣的农业基石。16世纪大航海时代，玉米随哥伦布的船队走向世界，并在明朝时期传入中国。因其极其耐旱、不挑土地的顽强生命力，它在古代常被作为“救荒作物”，极大推动了全球人口的增长。玉米不仅是多功能的粮食与饲料，更象征着坚韧、开拓与丰收。',
    tomato: '番茄属茄科，富含维生素C与番茄红素，是跨越蔬果界限的奇妙作物。它原产于南美洲，因色彩过于艳丽，最初传入欧洲时被误认为有毒的“狼桃”，仅供贵族庭院观赏。直到有勇者大胆品尝后，它才华丽转身，风靡全球餐桌，成为无数经典美食的灵魂。番茄不仅酸甜可口，更象征着打破偏见与探索未知的勇气。',
    potato: '土豆属茄科块茎植物，富含淀粉，是全球第四大主粮。它原产于南美安第斯山脉，曾是印加文明的瑰宝。大航海时代传遍全球后，因其极其耐贫瘠与高产量，迅速成为改变世界人口格局的“救命粮”。它深埋地下、不事张扬，既是餐桌上的百变星君，更象征着踏实与奉献。',
    strawberry: '草莓属蔷薇科，是富含维生素C的聚合果，因其鲜红多汁、酸甜诱人而广受喜爱。现代大果草莓并非古老物种，而是18世纪在法国由北美弗吉尼亚草莓与南美智利草莓偶然杂交诞生的“混血儿”。在西方文化中，它常被视作爱与纯洁的象征，更是初夏田园里最精致、最浪漫的浆果馈赠。',
    carrot: '胡萝卜属伞形科，其肉质根富含胡萝卜素，是护眼明目的健康佳品。它原产于亚洲西南部，最初多为紫色或白色。直到17世纪，荷兰园艺家为了向“奥兰治家族”（Orange，意为橙色）致敬，精心培育出了亮橙色的变种，并迅速风靡全球。从异域野草到餐桌常客，胡萝卜是人类农业育种史上的经典杰作。',
    pumpkin: '南瓜属葫芦科，耐旱好养且极易储存，是度过荒年与寒冬的“宝藏作物”。它原产于中南美洲，大航海时代后传遍世界。在西方文化中，南瓜不仅是感恩节餐桌上的丰收象征，更在万圣节化身为驱散邪恶的“杰克灯”。它那金黄耀眼的巨大果实，蕴含着脚踏实地的田园智慧与祈求平安的民俗温情。',
    watermelon: '西瓜属葫芦科，以其清甜多汁的红色果肉成为当之无愧的“盛夏之王”。它原产于干旱的非洲沙漠，早在古埃及时代便被法老种植。后经由丝绸之路传入中国，因来自西域而得名“西瓜”。从古代文人笔下的“碧蔓凌霜，绿裹红瓤”，到现代人空调房里的消暑标配，西瓜承载了跨越千年的清凉记忆。',
    eggplant: '茄子属茄科，是为数不多呈现鲜艳紫色的蔬菜，肉质软糯，极易吸收汤汁的鲜美。它原产于古印度，在晋代前传入中国。古代称其为“落苏”，因其味美且易于烹饪，迅速成为寻常百姓家与宫廷御宴的常客。茄子圆润或修长的形态，在传统民俗中常带有长寿、安康的吉祥寓意，是充满东方烟火气的独特食材。'
  };

  if (!Array.isArray(state.marketOffers) || state.marketOffers.length !== MARKET_SIZE) {
    state.marketOffers = createMarketOffers();
  }

  bindEvents();
  renderAll();
  autoSave();

  function createInitialState() {
    const seeds = {};
    const produce = {};
    CROPS.forEach((crop) => {
      seeds[crop.id] = crop.id === 'wheat' ? 4 : 0;
      produce[crop.id] = 0;
    });

    return {
      version: 4,
      month: 1,
      gold: 420,
      bagCap: 150,
      selectedTool: 'harvest',
      selectedSeed: 'wheat',
      plots: Array.from({ length: PLOT_COUNT }, (_, idx) => createEmptyPlot(isDefaultLocked(idx))),
      inventory: { seeds, produce },
      marketOffers: createMarketOffers()
    };
  }

  function createEmptyPlot(locked) {
    return {
      locked: Boolean(locked),
      cropId: null,
      progressMonths: 0,
      requiredMonths: 0,
      ready: false,
      tasks: createTasks()
    };
  }

  function createTasks() {
    return {
      queue: [],
      done: []
    };
  }

  function assignMonthlyTasks(plot) {
    plot.tasks.queue = [];
    plot.tasks.done = [];
    if (Math.random() > 0.3) {
      return;
    }
    const task = TASK_ORDER[Math.floor(Math.random() * TASK_ORDER.length)];
    plot.tasks.queue = [task];
  }

  function bindEvents() {
    dom.farmGrid.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url('${ASSET.bg}')`;

    dom.appRoot.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tool]');
      if (!button) {
        return;
      }
      state.selectedTool = button.dataset.tool;
      renderToolbar();
      renderHint();
      if (state.selectedTool === 'plant') {
        openSeedSelect();
      }
    });

    dom.seedSelectList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-seed]');
      if (!button) {
        return;
      }
      state.selectedSeed = button.dataset.seed;
      renderSeedSelector();
      renderHint();
      closePanel(dom.seedSelectPanel);
    });

    dom.farmGrid.addEventListener('click', (event) => {
      const plotEl = event.target.closest('.plot');
      if (!plotEl) {
        return;
      }
      handlePlotAction(Number(plotEl.dataset.idx));
    });

    dom.endMonth.addEventListener('click', handleEndMonth);
    dom.refreshMarket.addEventListener('click', () => refreshMarket(true, 'manual'));

    dom.shopToggle.addEventListener('click', () => togglePanel(dom.shopPanel));
    dom.bagToggle.addEventListener('click', () => togglePanel(dom.bagPanel));
    dom.settingsToggle.addEventListener('click', () => togglePanel(dom.settingsPanel));

    document.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.close;
        const panel = document.getElementById(targetId);
        if (panel) {
          panel.classList.remove('show');
        }
      });
    });

    dom.shopTabBuy.addEventListener('click', () => setShopMode('buy'));
    dom.shopTabSell.addEventListener('click', () => setShopMode('sell'));

    dom.shopSeedPrev.addEventListener('click', () => {
      ui.shopSeedPage = Math.max(0, ui.shopSeedPage - 1);
      renderShop();
    });
    dom.shopSeedNext.addEventListener('click', () => {
      ui.shopSeedPage = Math.min(getMaxPage(CROPS.length, SEED_PAGE_SIZE), ui.shopSeedPage + 1);
      renderShop();
    });
    dom.marketPrev.addEventListener('click', () => {
      ui.marketPage = Math.max(0, ui.marketPage - 1);
      renderMarket();
    });
    dom.marketNext.addEventListener('click', () => {
      ui.marketPage = Math.min(getMaxPage(state.marketOffers.length, MARKET_PAGE_SIZE), ui.marketPage + 1);
      renderMarket();
    });

    dom.shopSeedList.addEventListener('click', (event) => {
      const row = event.target.closest('[data-seed]');
      if (!row) {
        return;
      }
      ui.selectedShopCrop = row.dataset.seed;
      renderShop();
    });

    dom.shopPanel.addEventListener('click', (event) => {
      const qtyBtn = event.target.closest('button[data-qty]');
      if (qtyBtn) {
        const mode = qtyBtn.dataset.qty;
        const step = Number(qtyBtn.dataset.step || 0);
        adjustQuantity(mode, step, qtyBtn.dataset.seed);
        return;
      }
      const sellBtn = event.target.closest('button[data-sell]');
      if (sellBtn) {
        sellProduce(sellBtn.dataset.sell, getSellQty(sellBtn.dataset.sell));
      }
    });

    dom.unlockCancel.addEventListener('click', () => closePanel(dom.unlockConfirmPanel));
    dom.unlockConfirm.addEventListener('click', () => {
      if (ui.pendingUnlock === null) {
        closePanel(dom.unlockConfirmPanel);
        return;
      }
      unlockPlot(ui.pendingUnlock);
      closePanel(dom.unlockConfirmPanel);
      ui.pendingUnlock = null;
    });

    dom.buySeedConfirm.addEventListener('click', () => {
      const cropId = ui.selectedShopCrop;
      buySeed(cropId, getBuyQty(cropId));
    });

    dom.saveNow.addEventListener('click', () => {
      autoSave();
      showToast('已手动存档');
    });

    dom.resetGame.addEventListener('click', () => {
      if (!window.confirm('确定要重置存档吗？')) {
        return;
      }
      const fresh = createInitialState();
      Object.assign(state, fresh);
      renderAll();
      autoSave();
      showToast('存档已重置');
    });

    dom.lockLandscape.addEventListener('click', async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
          showToast('已尝试锁定横屏');
          return;
        }
        showToast('当前环境不支持自动锁定，请手动横屏');
      } catch (_) {
        showToast('锁定失败，请手动横屏');
      }
    });

    window.addEventListener('beforeunload', autoSave);
    window.addEventListener('resize', () => {
      renderFarm();
    });
  }

  function togglePanel(panel) {
    if (!panel) {
      return;
    }
    const open = panel.classList.toggle('show');
    if (!open) {
      return;
    }
    [dom.shopPanel, dom.bagPanel, dom.settingsPanel].forEach((item) => {
      if (item && item !== panel) {
        item.classList.remove('show');
      }
    });
  }

  function openSeedSelect() {
    renderSeedSelector();
    dom.seedSelectPanel.classList.add('show');
    [dom.shopPanel, dom.bagPanel, dom.settingsPanel, dom.unlockConfirmPanel].forEach((item) => {
      if (item && item !== dom.seedSelectPanel) {
        item.classList.remove('show');
      }
    });
  }

  function closePanel(panel) {
    if (panel) {
      panel.classList.remove('show');
    }
  }

  function getUnlockCost(index) {
    const col = index % GRID_SIZE;
    const step = col;
    const costs = [0, 50, 100, 200, 400];
    return costs[Math.min(step, costs.length - 1)];
  }

  function isDefaultLocked(index) {
    const col = index % GRID_SIZE;
    return col !== 0;
  }

  function handlePlotAction(index) {
    const plot = state.plots[index];
    if (!plot) {
      return;
    }

    if (plot.locked) {
      const cost = getUnlockCost(index);
      dom.unlockConfirmText.textContent = `是否确认开垦这块地？需要 ${cost} 金币`;
      ui.pendingUnlock = index;
      dom.unlockConfirmPanel.classList.add('show');
      return;
    }

    const tool = state.selectedTool;
    if (tool === 'plant') {
      if (plot.cropId) {
        showToast('这块地已有作物');
        return;
      }
      plantOnPlot(plot);
      return;
    }

    if (tool === 'water') {
      markTask(plot, 'watered', '已浇水');
      return;
    }

    if (tool === 'fertilize') {
      markTask(plot, 'fertilized', '已施肥');
      return;
    }

    if (tool === 'weed') {
      markTask(plot, 'weeded', '已除草');
      return;
    }

    if (tool === 'harvest') {
      harvestPlot(plot);
      return;
    }

    if (tool === 'clear') {
      clearPlot(plot);
    }
  }

  function unlockPlot(index) {
    const plot = state.plots[index];
    if (!plot || !plot.locked) {
      return;
    }
    const cost = getUnlockCost(index);
    if (state.gold < cost) {
      showToast(`金币不足，开垦需要${cost}`);
      return;
    }
    state.gold -= cost;
    plot.locked = false;
    renderAll();
    showToast(`已开垦新地块，花费${cost}金币`);
  }

  function plantOnPlot(plot) {
    const seedId = state.selectedSeed;
    const crop = CROP_BY_ID[seedId];
    if (!crop) {
      showToast('请先选择种子');
      return;
    }

    if ((state.inventory.seeds[seedId] || 0) < 1) {
      showToast('该种子不足，请先购买');
      return;
    }

    state.inventory.seeds[seedId] -= 1;
    plot.cropId = seedId;
    plot.progressMonths = 0;
    plot.requiredMonths = crop.growMonths;
    plot.ready = false;
    plot.tasks = createTasks();
    assignMonthlyTasks(plot);
    renderAll();
    showToast(`已种下${crop.name}`);
  }

  function markTask(plot, taskKey, message) {
    if (!plot.cropId || plot.ready) {
      showToast('只能对成长中的作物操作');
      return;
    }

    const current = plot.tasks.queue[0];
    if (!current) {
      showToast('本月无需进行该操作');
      return;
    }
    if (current !== taskKey) {
      showToast(`请先完成${TASK_LABELS[current]}`);
      return;
    }

    plot.tasks.queue.shift();
    plot.tasks.done.push(taskKey);
    renderFarm();
    showToast(message);
  }

  function harvestPlot(plot) {
    if (!plot.cropId || !plot.ready) {
      showToast('还不能收获');
      return;
    }

    const crop = CROP_BY_ID[plot.cropId];
    if (state.bagCap - getBagUsed() < crop.yield) {
      showToast(`仓库空间不足，需要空出${crop.yield}格`);
      return;
    }

    state.inventory.produce[crop.id] += crop.yield;
    resetPlot(plot);
    renderAll();
    showToast(`收获${crop.name} x${crop.yield}`);
  }

  function clearPlot(plot) {
    if (!plot.cropId) {
      showToast('空地无需铲除');
      return;
    }
    resetPlot(plot);
    renderAll();
    showToast('地块已清空');
  }

  function resetPlot(plot) {
    plot.cropId = null;
    plot.progressMonths = 0;
    plot.requiredMonths = 0;
    plot.ready = false;
    plot.tasks = createTasks();
  }

  function handleEndMonth() {
    let grownCount = 0;
    let blockedCount = 0;
    let maturedCount = 0;

    state.plots.forEach((plot) => {
      if (plot.locked || !plot.cropId || plot.ready) {
        return;
      }

      const finished = plot.tasks.queue.length === 0;
      if (finished) {
        plot.progressMonths += 1;
        grownCount += 1;
        if (plot.progressMonths >= plot.requiredMonths) {
          plot.ready = true;
          maturedCount += 1;
        }
      } else {
        blockedCount += 1;
      }

      plot.tasks = createTasks();
      if (!plot.ready) {
        assignMonthlyTasks(plot);
      }
    });

    state.month += 1;
    refreshMarket(false, 'month-end');
    renderAll();

    if (maturedCount > 0) {
      showToast(`进入第${state.month}月：成长${grownCount}块，成熟${maturedCount}块，未成长${blockedCount}块`);
    } else {
      showToast(`进入第${state.month}月：成长${grownCount}块，未成长${blockedCount}块`);
    }

    autoSave();
  }

  function buySeed(cropId, quantity) {
    const crop = CROP_BY_ID[cropId];
    if (!crop || quantity <= 0) {
      return;
    }

    const cost = crop.seedBuy * quantity;
    if (state.gold < cost) {
      showToast('金币不足');
      return;
    }

    if (state.bagCap - getBagUsed() < quantity) {
      showToast('仓库空间不足');
      return;
    }

    state.gold -= cost;
    state.inventory.seeds[cropId] += quantity;
    renderAll();
    showToast(`购买${crop.name}种子 x${quantity}`);
  }

  function sellProduce(cropId, maxQty) {
    const offer = state.marketOffers.find((item) => item.id === cropId);
    if (!offer) {
      showToast('该作物当前不在收购列表');
      return;
    }

    const have = state.inventory.produce[cropId] || 0;
    if (have <= 0) {
      showToast('仓库里没有该作物');
      return;
    }

    const qty = Math.min(have, maxQty);
    state.inventory.produce[cropId] -= qty;
    state.gold += qty * offer.price;
    renderAll();
    showToast(`卖出${CROP_BY_ID[cropId].name} x${qty}`);
  }

  function refreshMarket(withCost, reason) {
    if (withCost) {
      if (state.gold < MARKET_REFRESH_COST) {
        showToast('金币不足，无法刷新');
        return;
      }
      state.gold -= MARKET_REFRESH_COST;
    }

    state.marketOffers = createMarketOffers();
    ui.marketPage = 0;
    renderMarket();
    renderTopStats();

    if (reason === 'month-end') {
      showToast('月末已强制刷新市场收购列表');
      return;
    }
    if (withCost) {
      showToast('市场收购列表已刷新');
    }
  }

  function createMarketOffers() {
    const picks = pickUnique(CROPS, MARKET_SIZE);
    return picks.map((crop) => {
      const factor = 0.9 + Math.random() * 0.7;
      return {
        id: crop.id,
        price: Math.max(1, Math.floor(crop.cropSellBase * factor))
      };
    });
  }

  function pickUnique(source, size) {
    const pool = [...source];
    const result = [];
    while (pool.length && result.length < size) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  }

  function getFarmMetrics() {
    const rect = dom.farmGrid.getBoundingClientRect();
    const cols = GRID_SIZE; // 5
    const rows = GRID_SIZE; // 5

    // 原始素材的宽高比
    const tileRatio = 898 / 482;

    // 留出一定的外边距，避免贴边
    const padX = rect.width * 0.05;
    const padY = rect.height * 0.12;

    // 计算可用最大宽度。5x5 的等距网格的总宽度正好是 cols * tileW
    const maxW = Math.max(0, rect.width - padX * 2);
    let tileW = maxW / cols * 0.6;
    let tileH = tileW / tileRatio;

    //根据实际图片的物理高度计算 Y 轴步长，保证它们边缘完美贴合
    let stepY = tileH / 2;
    let gridTotalH = (cols + rows - 2) * stepY + tileH;
    const maxH = Math.max(0, rect.height - padY * 2);

    // 如果网格整体高度超出了容器可用高度，则等比例缩小瓦片
    if (gridTotalH > maxH) {
      const scale = maxH / gridTotalH;
      tileW *= scale;
      tileH *= scale;
      stepY = tileH / 2;
      gridTotalH = (cols + rows - 2) * stepY + tileH;
    }

    // 将网格的原点 (row=0, col=0) 定位到正中央
    const originX = rect.width / 2;
    // 将整个网格的总高度在屏幕垂直居中
    const offsetY = rect.height * 0.2;
    const originY = (rect.height - gridTotalH) / 2 + offsetY;

    return {
      cols,
      rows,
      tileW,
      tileH,
      originX,
      originY,
      stepY
    };
  }

  function getPlotLayout(index, metrics) {
    const { cols, tileW, tileH, originX, originY, stepY } = metrics;
    const row = Math.floor(index / cols);
    const col = index % cols;

    // X轴步长
    const stepX = tileW / 2;

    // 计算瓦片顶点的绝对中心坐标
    // col 增加向右偏，row 增加向左偏
    const centerX = originX + (col - row) * stepX;
    // row 和 col 增加都会使 Y 轴往下走
    const centerY = originY + (col + row) * stepY;

    // 转换为 CSS 定位 (centerX 为瓦片横向中心点，centerY 直接贴合瓦片图像顶部)
    const x = centerX - tileW / 2;
    const y = centerY;

    // 图层 Z 轴排序逻辑 (靠下的瓦片必须覆盖靠上的瓦片)
    const z = 20 + (row + col) * 10 + col;

    return {
      row,
      col,
      x,
      y,
      w: tileW,
      h: tileH,
      z
    };
  }

  function getPlotLayout(index, metrics) {
    const cols = GRID_SIZE;
    const row = Math.floor(index / cols);
    const col = index % cols;

    // 45度等距坐标: centerX = originX + (col-row)*W/2, centerY = originY + (col+row)*H/2
    const tileW = metrics.tileW;
    const tileH = metrics.tileH;
    const originX = metrics.originX;
    const originY = metrics.originY;
    const centerX = originX + (col - row) * (tileW / 2);
    const centerY = originY + (col + row) * (tileH / 2);
    const x = centerX - tileW / 2;
    const y = centerY - tileH / 2;
    const z = 20 + (row + col) * 10 + col;

    return {
      row,
      col,
      x,
      y,
      w: tileW,
      h: tileH,
      z
    };
  }

  function getStageImage(plot) {
    if (!plot.cropId) {
      return '';
    }
    if (plot.ready) {
      return ASSET.stage[4];
    }
    if (plot.progressMonths <= 0) {
      return ASSET.stage[1];
    }

    const ratio = plot.progressMonths / Math.max(1, plot.requiredMonths);
    if (ratio < 0.34) {
      return ASSET.stage[1];
    }
    if (ratio < 0.67) {
      return ASSET.stage[2];
    }
    return ASSET.stage[3];
  }

  function renderPlotIcons(plot) {
    if (!plot.cropId) {
      return '';
    }

    const chunks = [];
    if (plot.ready) {
      chunks.push(`<img class="status-icon" src="${ASSET.iconHarvest}" alt="可收获" />`);
      return chunks.join('');
    }

    const current = plot.tasks.queue[0];
    if (current === 'watered') {
      chunks.push(`<img class="status-icon" src="${ASSET.iconWater}" alt="需浇水" />`);
    } else if (current === 'weeded') {
      chunks.push(`<img class="status-icon" src="${ASSET.iconBug}" alt="需除虫" />`);
    } else if (current === 'fertilized') {
      chunks.push(`<img class="status-icon" src="${ASSET.iconFertilize}" alt="需施肥" />`);
    }

    return chunks.join('');
  }

  function renderAll() {
    renderTopStats();
    renderToolbar();
    renderSeedSelector();
    renderFarm();
    renderShop();
    renderMarket();
    renderBag();
    renderHint();
    setShopMode(ui.shopMode);
  }

  function renderTopStats() {
    dom.monthValue.textContent = String(state.month);
    dom.goldValue.textContent = String(state.gold);
    dom.bagCount.textContent = String(getBagUsed());
    dom.bagCap.textContent = String(state.bagCap);
  }

  function renderToolbar() {
    document.querySelectorAll('button[data-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === state.selectedTool);
    });
  }

  function renderSeedSelector() {
    dom.seedSelectList.innerHTML = CROPS.map((crop) => {
      const count = state.inventory.seeds[crop.id] || 0;
      const active = state.selectedSeed === crop.id ? 'active' : '';
      return `
        <button class="seed-select ${active}" data-seed="${crop.id}" title="${crop.name}">
          <img class="shop-item-img" src="${ASSET.warehouse[crop.id] || ASSET.stage[4]}" alt="${crop.name}" />
          <div>
            <strong>${crop.name}</strong>
            <div class="small">库存 ${count}</div>
          </div>
          <div class="badge">x${count}</div>
        </button>
      `;
    }).join('');
  }

  function renderFarm() {
    const metrics = getFarmMetrics();
    dom.farmGrid.innerHTML = state.plots.map((plot, idx) => {
      const layout = getPlotLayout(idx, metrics);
      const style = `style="--x:${layout.x}px;--y:${layout.y}px;--w:${layout.w}px;--h:${layout.h}px;z-index:${layout.z}"`;

      if (plot.locked) {
        const cost = getUnlockCost(idx);
        return `
          <div class="plot locked" data-idx="${idx}" ${style} title="开垦 ${cost} 金币">
            <img class="tile" src="${ASSET.tileLocked}" alt="未开垦" />
            <span class="lock-tag" aria-hidden="true">
              <span class="icon">🪙</span>
              <span class="num">${cost}</span>
            </span>
          </div>
        `;
      }

      const tileSrc = ASSET.tileOpen;
      if (!plot.cropId) {
        return `
          <div class="plot open" data-idx="${idx}" ${style} title="空地">
            <img class="tile" src="${tileSrc}" alt="已开垦地块" />
          </div>
        `;
      }

      const crop = CROP_BY_ID[plot.cropId];
      const cropImg = getStageImage(plot);
      const label = plot.ready
        ? `${crop.name} 成熟 可收获x${crop.yield}`
        : `${crop.name} ${plot.progressMonths}/${plot.requiredMonths}月`;

      return `
        <div class="plot ${plot.ready ? 'ready' : 'growing'}" data-idx="${idx}" ${style} title="${label}">
          <img class="tile" src="${tileSrc}" alt="地块" />
          <img class="crop" src="${cropImg}" alt="${crop.name}" />
          <div class="status-icons">${renderPlotIcons(plot)}</div>
        </div>
      `;
    }).join('');
  }

  function renderShop() {
    const crop = CROP_BY_ID[ui.selectedShopCrop] || CROPS[0];
    if (!crop) {
      return;
    }

    dom.seedDetailName.textContent = crop.name;
    dom.seedDetailPrice.textContent = String(crop.seedBuy);
    dom.seedDetailOwned.textContent = String(state.inventory.seeds[crop.id] || 0);
    const buyQty = getBuyQty(crop.id);
    dom.seedDetailQty.textContent = String(buyQty);
    dom.seedDetailTotal.textContent = String(buyQty * crop.seedBuy);
    dom.seedPreviewImg.src = ASSET.warehouse[crop.id] || ASSET.stage[4];
    dom.seedKnowledge.textContent = KNOWLEDGE[crop.id] || '这是常见作物，可以用心照料收获好收益。';

    const start = ui.shopSeedPage * SEED_PAGE_SIZE;
    const pageItems = CROPS.slice(start, start + SEED_PAGE_SIZE);
    const pageCount = Math.max(1, Math.ceil(CROPS.length / SEED_PAGE_SIZE));
    dom.shopSeedPageInfo.textContent = `${ui.shopSeedPage + 1}/${pageCount}`;
    dom.shopSeedPrev.disabled = ui.shopSeedPage <= 0;
    dom.shopSeedNext.disabled = ui.shopSeedPage >= pageCount - 1;

    dom.shopSeedList.innerHTML = pageItems.map((item) => {
      const active = item.id === crop.id ? 'active' : '';
      return `
        <div class="seed-select ${active}" data-seed="${item.id}">
          <img class="shop-item-img" src="${ASSET.warehouse[item.id] || ASSET.stage[4]}" alt="${item.name}" />
          <div>
            <strong>${item.name}</strong>
            <div class="small">种子 ${item.seedBuy} 金币</div>
          </div>
          <div class="badge">已有 ${state.inventory.seeds[item.id] || 0}</div>
        </div>
      `;
    }).join('');
  }

  function renderMarket() {
    const pageCount = Math.max(1, Math.ceil(state.marketOffers.length / MARKET_PAGE_SIZE));
    ui.marketPage = Math.min(getMaxPage(state.marketOffers.length, MARKET_PAGE_SIZE), ui.marketPage);
    const start = ui.marketPage * MARKET_PAGE_SIZE;
    const pageOffers = state.marketOffers.slice(start, start + MARKET_PAGE_SIZE);
    dom.marketPageInfo.textContent = `${ui.marketPage + 1}/${pageCount}`;
    dom.marketPrev.disabled = ui.marketPage <= 0;
    dom.marketNext.disabled = ui.marketPage >= pageCount - 1;

    dom.marketCards.innerHTML = pageOffers.map((offer) => {
      const crop = CROP_BY_ID[offer.id];
      const have = state.inventory.produce[offer.id] || 0;
      const qty = getSellQty(offer.id);
      return `
        <div class="market-card">
          <div class="card-hero">
            <img class="market-item-img" src="${ASSET.warehouse[offer.id] || ASSET.stage[4]}" alt="${crop.name}" />
            <strong>${crop.name}</strong>
          </div>
          <div class="card-row"><span>价格</span><strong>${offer.price}</strong></div>
          <div class="card-row">
            <span>售出数量</span>
            <div class="qty-control">
              <button class="icon-btn qty-btn" data-qty="sell" data-seed="${offer.id}" data-step="-1" title="减少">
                <span class="icon" aria-hidden="true">➖</span>
              </button>
              <span class="qty-value">${qty}</span>
              <button class="icon-btn qty-btn" data-qty="sell" data-seed="${offer.id}" data-step="1" title="增加">
                <span class="icon" aria-hidden="true">➕</span>
              </button>
            </div>
          </div>
          <div class="card-row"><span>仓库已有</span><strong>${have}</strong></div>
          <button class="icon-btn" data-sell="${offer.id}" title="售出">
            <span class="icon" aria-hidden="true">💰</span>
            <span class="btn-label" aria-hidden="true">售出</span>
            <span class="sr-only">售出</span>
          </button>
        </div>
      `;
    }).join('');

    const total = pageOffers.reduce((sum, offer) => {
      return sum + getSellQty(offer.id) * offer.price;
    }, 0);
    dom.marketTotalPrice.textContent = String(total);
  }

  function renderBag() {
    let seedTotal = 0;
    let produceTotal = 0;
    const seedCards = CROPS.map((crop) => {
      const qty = state.inventory.seeds[crop.id] || 0;
      seedTotal += qty;
      return `
        <div class="bag-card" title="种子 ${crop.name}">
          <img class="bag-item-img" src="${ASSET.warehouse[crop.id] || ASSET.stage[4]}" alt="${crop.name}" />
          <div class="bag-meta">
            <strong>${crop.name}</strong>
            <div class="small">种子</div>
          </div>
          <div class="bag-qty">x${qty}</div>
        </div>
      `;
    });

    const produceCards = CROPS.map((crop) => {
      const qty = state.inventory.produce[crop.id] || 0;
      produceTotal += qty;
      return `
        <div class="bag-card" title="作物 ${crop.name}">
          <img class="bag-item-img" src="${ASSET.warehouse[crop.id] || ASSET.stage[4]}" alt="${crop.name}" />
          <div class="bag-meta">
            <strong>${crop.name}</strong>
            <div class="small">作物</div>
          </div>
          <div class="bag-qty">x${qty}</div>
        </div>
      `;
    });

    dom.bagList.innerHTML = `
      <div class="bag-wrap">
        <div class="bag-section-head">
          <span>种子</span>
          <span class="bag-count">共 ${seedTotal}</span>
        </div>
        <div class="bag-grid">
          ${seedCards.join('')}
        </div>
        <div class="bag-section-head">
          <span>作物</span>
          <span class="bag-count">共 ${produceTotal}</span>
        </div>
        <div class="bag-grid">
          ${produceCards.join('')}
        </div>
      </div>
    `;
  }

  function renderHint() {
    dom.hintText.textContent = '';
  }

  function getMaxPage(total, size) {
    return Math.max(0, Math.ceil(total / size) - 1);
  }

  function setShopMode(mode) {
    ui.shopMode = mode === 'sell' ? 'sell' : 'buy';
    dom.shopTabBuy.classList.toggle('active', ui.shopMode === 'buy');
    dom.shopTabSell.classList.toggle('active', ui.shopMode === 'sell');
    dom.shopBuyView.classList.toggle('show', ui.shopMode === 'buy');
    dom.shopSellView.classList.toggle('show', ui.shopMode === 'sell');
  }

  function getBuyQty(cropId) {
    return Math.max(1, ui.buyQty[cropId] || 1);
  }

  function getSellQty(cropId) {
    const have = state.inventory.produce[cropId] || 0;
    if (have <= 0) {
      return 0;
    }
    return Math.min(have, Math.max(1, ui.sellQty[cropId] || 1));
  }

  function adjustQuantity(mode, step, cropId) {
    if (mode === 'buy') {
      const id = ui.selectedShopCrop;
      const crop = CROP_BY_ID[id];
      const haveSpace = state.bagCap - getBagUsed();
      const maxByGold = Math.floor(state.gold / crop.seedBuy);
      const max = Math.max(1, Math.min(haveSpace, maxByGold));
      const next = Math.min(max, Math.max(1, getBuyQty(id) + step));
      ui.buyQty[id] = next;
      dom.seedDetailQty.textContent = String(next);
      dom.seedDetailTotal.textContent = String(next * crop.seedBuy);
      return;
    }

    if (mode === 'sell' && cropId) {
      const have = state.inventory.produce[cropId] || 0;
      const max = Math.max(0, have);
      const next = Math.min(max, Math.max(0, getSellQty(cropId) + step));
      ui.sellQty[cropId] = next;
      renderMarket();
    }
  }

  function getBagUsed() {
    let total = 0;
    CROPS.forEach((crop) => {
      total += state.inventory.seeds[crop.id] || 0;
      total += state.inventory.produce[crop.id] || 0;
    });
    return total;
  }

  function autoSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {
      showToast('存档失败：本地空间不足');
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.inventory || !Array.isArray(parsed.plots)) {
        return null;
      }

      CROPS.forEach((crop) => {
        if (typeof parsed.inventory.seeds[crop.id] !== 'number') {
          parsed.inventory.seeds[crop.id] = 0;
        }
        if (typeof parsed.inventory.produce[crop.id] !== 'number') {
          parsed.inventory.produce[crop.id] = 0;
        }
      });

      while (parsed.plots.length < PLOT_COUNT) {
        parsed.plots.push(createEmptyPlot(isDefaultLocked(parsed.plots.length)));
      }

      parsed.plots = parsed.plots.slice(0, PLOT_COUNT).map((plot, idx) => ({
        locked: typeof plot.locked === 'boolean' ? plot.locked : isDefaultLocked(idx),
        cropId: plot.cropId || null,
        progressMonths: Number(plot.progressMonths) || 0,
        requiredMonths: Number(plot.requiredMonths) || 0,
        ready: Boolean(plot.ready),
        tasks: normalizeTasks(plot.tasks)
      }));

      parsed.plots.forEach((plot) => {
        if (plot.cropId && !plot.ready && plot.tasks.queue.length === 0) {
          assignMonthlyTasks(plot);
        }
      });

      if (!CROP_BY_ID[parsed.selectedSeed]) {
        parsed.selectedSeed = CROPS[0].id;
      }
      if (!['plant', 'water', 'fertilize', 'weed', 'harvest', 'clear'].includes(parsed.selectedTool)) {
        parsed.selectedTool = 'harvest';
      }

      parsed.month = Number(parsed.month) > 0 ? Number(parsed.month) : 1;
      parsed.gold = Number(parsed.gold) >= 0 ? Number(parsed.gold) : 200;
      parsed.bagCap = Number(parsed.bagCap) > 0 ? Number(parsed.bagCap) : 150;
      if (!Array.isArray(parsed.marketOffers) || parsed.marketOffers.length !== MARKET_SIZE) {
        parsed.marketOffers = createMarketOffers();
      }

      return parsed;
    } catch (_) {
      return null;
    }
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 1800);
  }

  function normalizeTasks(tasks) {
    if (tasks && Array.isArray(tasks.queue)) {
      return {
        queue: [...tasks.queue],
        done: Array.isArray(tasks.done) ? [...tasks.done] : []
      };
    }

    const legacy = {
      watered: Boolean(tasks && tasks.watered),
      weeded: Boolean(tasks && tasks.weeded),
      fertilized: Boolean(tasks && tasks.fertilized)
    };
    const queue = TASK_ORDER.filter((key) => !legacy[key]);
    const done = TASK_ORDER.filter((key) => legacy[key]);
    return { queue, done };
  }
})();
