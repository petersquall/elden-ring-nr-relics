// ==================== RELIC MANAGER ====================

// Shop relic effects → itemId lookup (from items spreadsheet)
const SHOP_RELIC_LOOKUP = {
  "7000400": 11004,
  "7040200": 1050,
  "7120000": 1010,
  "7121100": 1000,
  "7122400": 1020,
  "7123300": 1030,
  "7040300,7040400": 1040,
  "7000202,7030900": 1060,
  "7000002,7030700": 1070,
  "7000901,7002600": 1080,
  "7000801,7002700": 1090,
  "7000801,7002800": 1100,
  "7000901,7002900": 1110,
  "7040500,7121000": 1120,
  "7010200,7090100": 1130,
  "7003000,7003400": 1140,
  "7003100,7003500": 1150,
  "7003200,7003600": 1160,
  "7000102,7003300": 1170,
  "7000301,7000401,7010500": 1180,
  "7000001,7000201,7033400": 1190,
  "7000401,7000501,7290000": 1200,
  "7000101,7000501,7032900": 1210,
  "7000201,7000401,7280000": 1220,
  "7000001,7000301,7030000": 1230,
  "7000601,7000701,7011200": 1240,
  "7000401,7000701,7011700": 1250,
  "7110000,7120900,7230000": 1260,
  "7000001,7001001,7005600": 1270,
  "7001602,7010500,7122900": 1400,
  "7000202,7030600,7033400": 1410,
  "7000801,7031800,7040200": 1420,
  "7001500,7060100,7082500": 1430,
  "7000902,7034600,7260000": 1440,
  "7000202,7310000,7332300": 1450,
  "7031200,7050100,7126000": 1460,
  "7030600,7034400,7036100": 1470,
  "7000002,7012200,7012300": 1480,
  "7001002,7006000,7040000": 1490,
  "7000202,7006100,7100100": 1500,
  "7060000,7070000,7120900": 1510,
  "7126000,7126000,7126000": 1520,
};

const RelicManager = {
  STORAGE_KEY: 'relic-scanner-collection',

  // Generate relics.pro compatible ID
  generateId() {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 11);
    return `relic-${ts}-${rand}`;
  },

  // Resolve itemId from effects + optional relic name
  resolveItemId(effectIds, relicName) {
    // 1. Try quest relic name match (RELICS_NAME_DB has itemId)
    if (relicName && typeof RELICS_NAME_DB !== 'undefined') {
      const entry = RELICS_NAME_DB.find(r => r.name === relicName);
      if (entry && entry.itemId) return entry.itemId;
    }

    // 2. Try effects-based match against quest relics
    if (typeof RELICS_NAME_DB !== 'undefined') {
      const sortedEffects = effectIds.slice().sort((a, b) => a - b).join(',');
      const questMatch = RELICS_NAME_DB.find(r =>
        r.effects.slice().sort((a, b) => a - b).join(',') === sortedEffects
      );
      if (questMatch && questMatch.itemId) return questMatch.itemId;
    }

    // 3. Try shop relic lookup by effects
    const key = effectIds.slice().sort((a, b) => a - b).join(',');
    if (SHOP_RELIC_LOOKUP[key]) return SHOP_RELIC_LOOKUP[key];

    // 4. Unknown relic
    return -1000000;
  },

  // Create a new relic
  createRelic(color, effectIds, isDeepNight, relicName) {
    const itemId = this.resolveItemId(effectIds, relicName);
    const relic = {
      id: this.generateId(),
      itemId: itemId,
      color: color,       // "Red" | "Green" | "Blue" | "Yellow"
      dn: isDeepNight,    // boolean
      effects: effectIds,  // array of effect ID numbers
    };
    if (relicName) relic.name = relicName;
    return relic;
  },

  // Get all relics
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  // Save relic
  save(relic) {
    const relics = this.getAll();
    relics.push(relic);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(relics));
    return relics;
  },

  // Delete relic by ID
  delete(relicId) {
    let relics = this.getAll();
    relics = relics.filter(r => r.id !== relicId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(relics));
    return relics;
  },

  // Clear all
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    return [];
  },

  // Get count
  count() {
    return this.getAll().length;
  },

  // Get stats
  getStats() {
    const relics = this.getAll();
    const colors = { Red: 0, Green: 0, Blue: 0, Yellow: 0 };
    let dnCount = 0;
    relics.forEach(r => {
      if (colors[r.color] !== undefined) colors[r.color]++;
      if (r.dn) dnCount++;
    });
    return {
      total: relics.length,
      colors,
      deepNight: dnCount,
      normal: relics.length - dnCount,
    };
  },

  // Import relics from JSON (merge)
  import(jsonArray) {
    const existing = this.getAll();
    const existingIds = new Set(existing.map(r => r.id));
    let added = 0;
    jsonArray.forEach(r => {
      if (!existingIds.has(r.id)) {
        existing.push(r);
        added++;
      }
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    return added;
  },
};
