import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const DEFAULT_SNACKING_CONTENT = Object.freeze({
  corePrinciples: [],
  managingCravings: [],
  whenToSnack: [],
  snackIdeas: [],
  portionControl: {
    visualGuides: [],
    prePortioningStrategies: [],
  },
  warningSign: {
    title: '',
    intro: '',
    signs: [],
    footer: '',
  },
});

const mapFoodAlternative = (doc) => ({
  altId: doc.altId || doc.alt_id || doc.id || String(doc._id || ''),
  category: doc.category || '',
  original: doc.original || '',
  alternative: doc.alternative || '',
  benefit: doc.benefit || '',
  calorieSaving: doc.calorieSaving || doc.calorie_saving || '',
  icon: doc.icon || '',
});

const mapMindfulSnackingTip = (doc) => ({
  tipId: doc.tipId || doc.tip_id || doc.id || String(doc._id || ''),
  title: doc.title || '',
  content: doc.content || '',
  category: doc.category || '',
  icon: doc.icon || '',
});

const asString = (value, fallback = '') => String(value ?? fallback);
const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const asStringArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (value && typeof value === 'object') {
    const vals = Object.values(value);
    if (vals.length > 0) return vals;
  }
  return [];
};

const mapSnackIdea = (doc = {}) => ({
  id: String(doc.id || doc.snackId || doc.snack_id || doc._id || ''),
  name: String(doc.name || ''),
  calories: Number(doc.calories ?? 0),
  protein: Number(doc.protein ?? 0),
  fiber: Number(doc.fiber ?? 0),
  timing: String(doc.timing || ''),
  benefits: Array.isArray(doc.benefits) ? doc.benefits.map((b) => String(b)) : [],
  ingredients: Array.isArray(doc.ingredients) ? doc.ingredients.map((i) => String(i)) : [],
  steps: Array.isArray(doc.steps) ? doc.steps.map((s) => String(s)) : [],
  recipeId: String(doc.recipeId || doc.recipe_id || doc.recipeMongoId || ''),
  recipeQuery: String(doc.recipeQuery || doc.recipe_query || doc.recipeName || doc.recipe_name || ''),
});

const mapAlternative = (doc = {}) => ({
  id: String(doc.id || doc.altId || doc.alt_id || doc._id || ''),
  name: String(doc.name || doc.alternative || ''),
  goal: String(doc.goal || doc.target || doc.category || ''),
  calories: asNumber(doc.calories ?? doc.nutrition?.calories ?? doc.macros?.calories ?? doc.kcal ?? 0),
  protein: asNumber(doc.protein ?? doc.nutrition?.protein ?? doc.macros?.protein ?? 0),
  carbs: asNumber(doc.carbs ?? doc.nutrition?.carbs ?? doc.macros?.carbs ?? 0),
  fat: asNumber(doc.fat ?? doc.nutrition?.fat ?? doc.macros?.fat ?? 0),
  benefits: asStringArray(doc.benefits).length > 0
    ? asStringArray(doc.benefits)
    : asStringArray(doc.benefit || doc.advantage || doc.advantages),
});

const normalizeSnackingContent = (doc = {}) => ({
  corePrinciples: Array.isArray(doc.corePrinciples)
    ? doc.corePrinciples.map((item) => ({
        id: String(item?.id || ''),
        title: String(item?.title || ''),
        description: String(item?.description || ''),
      }))
    : [],
  managingCravings: Array.isArray(doc.managingCravings)
    ? doc.managingCravings.map((item) => ({
        id: String(item?.id || ''),
        title: String(item?.title || ''),
        description: String(item?.description || ''),
        borderColor: String(item?.borderColor || '#7C3AED'),
      }))
    : [],
  whenToSnack: Array.isArray(doc.whenToSnack)
    ? doc.whenToSnack.map((item) => ({
        id: String(item?.id || ''),
        period: String(item?.period || ''),
        description: String(item?.description || ''),
        best: String(item?.best || ''),
        bg: String(item?.bg || '#EDE9FE'),
        bestColor: String(item?.bestColor || '#7C3AED'),
      }))
    : [],
  snackIdeas: Array.isArray(doc.snackIdeas) ? doc.snackIdeas.map(mapSnackIdea) : [],
  portionControl: {
    visualGuides: Array.isArray(doc?.portionControl?.visualGuides)
      ? doc.portionControl.visualGuides.map((item) => ({
          food: String(item?.food || ''),
          size: String(item?.size || ''),
        }))
      : [],
    prePortioningStrategies: Array.isArray(doc?.portionControl?.prePortioningStrategies)
      ? doc.portionControl.prePortioningStrategies.map((item) => String(item))
      : [],
  },
  warningSign: {
    title: String(doc?.warningSign?.title || ''),
    intro: String(doc?.warningSign?.intro || ''),
    signs: Array.isArray(doc?.warningSign?.signs) ? doc.warningSign.signs.map((s) => String(s)) : [],
    footer: String(doc?.warningSign?.footer || ''),
  },
});

const normalizeAlternativesGrouped = (doc = {}) => ({
  groups: toArray(doc.groups || doc.foodGroups).map((group) => ({
        id: String(group?.id || group?._id || group?.groupId || ''),
        original: String(group?.original || group?.name || ''),
        alternatives: toArray(group?.alternatives).map((alt, idx) => {
              if (typeof alt === 'string') {
                return {
                  id: `${String(group?.id || group?._id || 'group')}-alt-${idx + 1}`,
                  name: alt,
                  goal: '',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  benefits: [],
                };
              }
              return mapAlternative(alt);
            }),
      }))
    ,
  tips: Array.isArray(doc.tips) ? doc.tips.map((tip) => String(tip)) : [],
});

const normalizeAlternativesTips = (doc = {}) => {
  if (Array.isArray(doc.tips)) {
    return doc.tips.map((tip) => String(tip));
  }
  if (Array.isArray(doc.items)) {
    return doc.items.map((tip) => String(tip));
  }
  return [];
};

const normalizeSectionName = (value = '') => String(value).trim().toLowerCase().replace(/[\s_-]+/g, '');

const toSectionItems = (doc = {}) => {
  if (Array.isArray(doc.items)) return doc.items;
  if (Array.isArray(doc.data)) return doc.data;
  if (Array.isArray(doc.list)) return doc.list;
  if (Array.isArray(doc.alternatives)) return doc.alternatives;
  return [];
};

const composeSnackingContentFromSectionDocs = (docs = []) => {
  const sectionDocsMap = new Map();
  for (const doc of docs) {
    const raw = doc?.section;
    if (!raw) continue;
    const key = normalizeSectionName(raw);
    if (!sectionDocsMap.has(key)) sectionDocsMap.set(key, []);
    sectionDocsMap.get(key).push(doc);
  }

  const getDocsByAliases = (aliases = []) => {
    const out = [];
    for (const alias of aliases) {
      const arr = sectionDocsMap.get(alias);
      if (Array.isArray(arr) && arr.length > 0) out.push(...arr);
    }
    return out;
  };

  const mergeItemsByAliases = (aliases = []) => {
    const docsForSection = getDocsByAliases(aliases);
    if (docsForSection.length === 0) return [];

    const merged = [];
    const byId = new Map();

    // docs already come in newest-first order from query sort.
    for (const sectionDoc of docsForSection) {
      const items = toSectionItems(sectionDoc);
      for (const item of items) {
        const key = String(item?.id || item?._id || item?.name || merged.length);
        if (!byId.has(key)) {
          const copy = { ...(item || {}) };
          byId.set(key, copy);
          merged.push(copy);
        } else {
          // Fill missing fields from older docs without clobbering newer values.
          const target = byId.get(key);
          for (const [field, value] of Object.entries(item || {})) {
            const existing = target[field];
            const existingMissing =
              existing === undefined ||
              existing === null ||
              existing === '' ||
              (Array.isArray(existing) && existing.length === 0);
            if (existingMissing && value !== undefined && value !== null) {
              target[field] = value;
            }
          }
        }
      }
    }
    return merged;
  };

  const coreItems = mergeItemsByAliases(['coreprinciples', 'mindfulsnackingcoreprinciples']);
  const cravingsItems = mergeItemsByAliases(['managingcravings', 'cravings', 'craving']);
  const whenItems = mergeItemsByAliases(['whentosnack', 'whensnack', 'whentosnacking']);
  const ideasItems = mergeItemsByAliases(['snackideas', 'ideas']);
  const portionItems = mergeItemsByAliases(['portioncontrol', 'portion']);
  const portionDocs = getDocsByAliases(['portioncontrol', 'portion']);
  const portionDoc = portionDocs[0];
  const visualItems = mergeItemsByAliases(['portionvisualguides', 'visualguides']);
  const strategyItems = mergeItemsByAliases(['preportioningstrategies', 'portionstrategies']);
  const warningDocs = getDocsByAliases(['warningsign', 'warning', 'warningsigns']);
  const warningDoc = warningDocs[0];

  return {
    corePrinciples: coreItems.map((item) => ({
      id: asString(item?.id || item?.coreId || item?._id),
      title: asString(item?.title),
      description: asString(item?.description || item?.content),
    })),
    managingCravings: cravingsItems.map((item) => ({
      id: asString(item?.id || item?.cravingId || item?._id),
      title: asString(item?.title),
      description: asString(item?.description || item?.content),
      borderColor: asString(item?.borderColor || item?.border_color || '#7C3AED'),
    })),
    whenToSnack: whenItems.map((item) => ({
      id: asString(item?.id || item?.whenId || item?._id),
      period: asString(item?.period || item?.time),
      description: asString(item?.description || item?.content),
      best: asString(item?.best || item?.bestChoice || item?.best_choice),
      bg: asString(item?.bg || item?.backgroundColor || item?.background_color || '#EDE9FE'),
      bestColor: asString(item?.bestColor || item?.best_color || '#7C3AED'),
    })),
    snackIdeas: ideasItems.map((item) => ({
      id: asString(item?.id || item?.snackId || item?._id),
      name: asString(item?.name || item?.title),
      calories: asNumber(item?.calories ?? item?.kcal ?? 0),
      protein: asNumber(item?.protein ?? 0),
      fiber: asNumber(item?.fiber ?? 0),
      timing: asString(item?.timing || item?.time || 'Anytime'),
      benefits: asStringArray(item?.benefits).length > 0 ? asStringArray(item?.benefits) : asStringArray(item?.benefit),
      ingredients: asStringArray(item?.ingredients),
      steps: asStringArray(item?.steps),
      recipeId: asString(item?.recipeId || item?.recipe_id || item?.recipeMongoId || ''),
      recipeQuery: asString(item?.recipeQuery || item?.recipe_query || item?.recipeName || item?.recipe_name || item?.name || item?.title),
    })),
    portionControl: {
      visualGuides:
        visualItems.length > 0
          ? visualItems.map((item) => ({
              food: asString(item?.food || item?.name),
              size: asString(item?.size || item?.portion || item?.description),
            }))
          : portionItems.map((item) => ({
              food: asString(item?.food || item?.name),
              size: asString(item?.size || item?.portion || item?.description),
            })),
      prePortioningStrategies:
        strategyItems.length > 0
          ? strategyItems.map((item) => asString(item?.strategy || item?.text || item?.description)).filter(Boolean)
          : asStringArray(portionDoc?.prePortioningStrategies || portionDoc?.strategies),
    },
    warningSign: {
      title: asString(warningDoc?.title),
      intro: asString(warningDoc?.intro),
      signs: asStringArray(warningDoc?.signs || warningDoc?.items),
      footer: asString(warningDoc?.footer),
    },
  };
};

const shuffleArray = (items = []) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const loadFirstNonEmptyCollectionDocs = async (db, names = []) => {
  for (const name of names) {
    const docs = await db
      .collection(name)
      .find({})
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();
    if (docs.length > 0) {
      return { name, docs };
    }
  }
  return { name: null, docs: [] };
};

// UC #74 - GET healthier food alternatives (MongoDB: food_alternatives)
router.get('/alternatives', async (_req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection('food_alternatives').find({}).toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapFoodAlternative),
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/alternatives]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load food alternatives.',
    });
  }
});

// UC #74 Sprint 9 - GET grouped alternatives and shared tips
router.get('/alternatives/grouped', async (_req, res) => {
  try {
    const db = getDB();
    // Preferred collection for grouped docs
    const groupedDocsFromDedicatedCollection = await db
      .collection('food_alternatives_grouped')
      .find({})
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();
    // Your current collection name
    const groupedDocsFromPrimaryCollection = await db
      .collection('food_alternatives')
      .find({})
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();
    const groupedDocs =
      groupedDocsFromDedicatedCollection.length > 0
        ? groupedDocsFromDedicatedCollection
        : groupedDocsFromPrimaryCollection;
    const tipsDoc = await db
      .collection('food_alternatives_tips')
      .find({})
      .sort({ updatedAt: -1, _id: -1 })
      .limit(1)
      .next();

    if (groupedDocs.length > 0) {
      let groups = [];
      let groupedDocTips = [];

      const firstDoc = groupedDocs[0];
      const firstDocHasGroupsArray = Array.isArray(firstDoc?.groups || firstDoc?.foodGroups);
      const firstDocHasDataArray = Array.isArray(firstDoc?.data || firstDoc?.items) || toArray(firstDoc?.data || firstDoc?.items).length > 0;
      const docsArePerGroup = groupedDocs.some((doc) => doc?.original && toArray(doc?.alternatives).length > 0);

      if (firstDocHasGroupsArray) {
        const normalized = normalizeAlternativesGrouped(firstDoc);
        groups = normalized.groups;
        groupedDocTips = normalized.tips;
      } else if (firstDocHasDataArray) {
        const wrapped = { groups: toArray(firstDoc.data || firstDoc.items), tips: firstDoc.tips || [] };
        const normalized = normalizeAlternativesGrouped(wrapped);
        groups = normalized.groups;
        groupedDocTips = normalized.tips;
      } else if (docsArePerGroup) {
        groups = groupedDocs
          .filter((doc) => doc?.original && toArray(doc?.alternatives).length > 0)
          .map((doc) => ({
            id: String(doc.id || doc.groupId || doc.group_id || doc._id || ''),
            original: String(doc.original || ''),
            alternatives: toArray(doc.alternatives).map((alt) => mapAlternative(alt)),
          }));
      } else {
        // Last fallback for mixed shapes.
        const normalized = normalizeAlternativesGrouped(firstDoc);
        groups = normalized.groups;
        groupedDocTips = normalized.tips;
      }

      const tipsFromDedicatedCollection = normalizeAlternativesTips(tipsDoc);
      const tips = tipsFromDedicatedCollection.length > 0
        ? tipsFromDedicatedCollection
        : groupedDocTips;

      return res.status(200).json({
        success: true,
        data: {
          groups,
          // Prefer dedicated tips collection; fallback to grouped doc for compatibility.
          tips: shuffleArray(tips),
        },
        message: '',
      });
    }

    // Backward-compatible fallback: handle flat docs in food_alternatives.
    const legacyRows = await db.collection('food_alternatives').find({}).toArray();
    const legacyRowsArePerGroup = legacyRows.some(
      (row) => row?.original && toArray(row?.alternatives).length > 0
    );

    let groups = [];
    if (legacyRowsArePerGroup) {
      groups = legacyRows
        .filter((row) => row?.original && toArray(row?.alternatives).length > 0)
        .map((row) => ({
          id: String(row.id || row.groupId || row.group_id || row._id || ''),
          original: String(row.original || ''),
          alternatives: toArray(row.alternatives).map((alt) => mapAlternative(alt)),
        }));
    } else {
      const groupMap = new Map();
      for (const row of legacyRows) {
        const original = String(row.original || 'Other');
        if (!groupMap.has(original)) {
          groupMap.set(original, {
            id: String(row.groupId || row.group_id || original.toLowerCase().replace(/\s+/g, '-')),
            original,
            alternatives: [],
          });
        }
        groupMap.get(original).alternatives.push(mapAlternative(row));
      }
      groups = [...groupMap.values()];
    }

    return res.status(200).json({
      success: true,
      data: {
        groups,
        tips: shuffleArray(normalizeAlternativesTips(tipsDoc)),
      },
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/alternatives/grouped]', err);
    return res.status(500).json({
      success: false,
      data: { groups: [], tips: [] },
      message: 'Unable to load grouped food alternatives.',
    });
  }
});

// UC #75 - GET mindful snacking tips (MongoDB: mindful_snacking)
router.get('/mindful-snacking', async (_req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection('mindful_snacking').find({}).toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapMindfulSnackingTip),
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/mindful-snacking]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load mindful snacking tips.',
    });
  }
});

// UC #75 Sprint 9 - GET full mindful snacking content
router.get('/mindful-snacking/content', async (_req, res) => {
  try {
    const db = getDB();
    const { docs: contentDocs } = await loadFirstNonEmptyCollectionDocs(db, [
      'mindful_snacking_content',
      'mindful_snacking',
      'mindfulsnacking',
      'mindful_snacking_sections',
      'mindful_snacking_data',
    ]);

    if (contentDocs.length > 0) {
      const hasSectionedDocs = contentDocs.some((doc) => typeof doc?.section === 'string');
      if (hasSectionedDocs) {
        const composed = composeSnackingContentFromSectionDocs(contentDocs);
        return res.status(200).json({
          success: true,
          data: normalizeSnackingContent(composed),
          message: '',
        });
      }

      const contentDoc = contentDocs[0];
      return res.status(200).json({
        success: true,
        data: normalizeSnackingContent(contentDoc),
        message: '',
      });
    }

    // Split-collection fallback:
    // mindful_snacking_core_principles
    // mindful_snacking_craving
    // mindful_snacking_when_snack
    // mindful_snacking_ideas
    // mindful_snacking_portion_visual_guides
    // mindful_snacking_portion_strategies
    // mindful_snacking_warning (or mindful_snacking_warning_signs)
    const [
      coreDocs,
      cravingDocs,
      whenSnackDocs,
      ideaDocs,
      visualGuideDocs,
      strategyDocs,
      warningDoc,
      warningSignDocs,
    ] = await Promise.all([
      db.collection('mindful_snacking_core_principles').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_craving').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_when_snack').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_ideas').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_portion_visual_guides').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_portion_strategies').find({}).sort({ order: 1, _id: 1 }).toArray(),
      db.collection('mindful_snacking_warning').find({}).sort({ updatedAt: -1, _id: -1 }).limit(1).next(),
      db.collection('mindful_snacking_warning_signs').find({}).sort({ order: 1, _id: 1 }).toArray(),
    ]);

    const hasSplitData =
      coreDocs.length > 0 ||
      cravingDocs.length > 0 ||
      whenSnackDocs.length > 0 ||
      ideaDocs.length > 0 ||
      visualGuideDocs.length > 0 ||
      strategyDocs.length > 0 ||
      !!warningDoc ||
      warningSignDocs.length > 0;

    if (hasSplitData) {
      const splitContent = {
        corePrinciples: coreDocs.map((d) => ({
          id: asString(d.id || d.coreId || d.core_id || d._id),
          title: asString(d.title),
          description: asString(d.description || d.content),
        })),
        managingCravings: cravingDocs.map((d) => ({
          id: asString(d.id || d.cravingId || d.craving_id || d._id),
          title: asString(d.title),
          description: asString(d.description || d.content),
          borderColor: asString(d.borderColor || d.border_color || d.color || '#7C3AED'),
        })),
        whenToSnack: whenSnackDocs.map((d) => ({
          id: asString(d.id || d.whenId || d.when_id || d._id),
          period: asString(d.period || d.time),
          description: asString(d.description || d.content),
          best: asString(d.best || d.bestChoice || d.best_choice),
          bg: asString(d.bg || d.backgroundColor || d.background_color || '#EDE9FE'),
          bestColor: asString(d.bestColor || d.best_color || '#7C3AED'),
        })),
        snackIdeas: ideaDocs.map((d) => ({
          id: asString(d.id || d.snackId || d.snack_id || d._id),
          name: asString(d.name || d.title),
          calories: asNumber(d.calories ?? d.kcal ?? 0),
          protein: asNumber(d.protein ?? 0),
          fiber: asNumber(d.fiber ?? 0),
          timing: asString(d.timing || d.time || 'Anytime'),
          benefits: asStringArray(d.benefits).length > 0 ? asStringArray(d.benefits) : asStringArray(d.benefit),
          recipeId: asString(d.recipeId || d.recipe_id || d.recipeMongoId || ''),
          recipeQuery: asString(d.recipeQuery || d.recipe_query || d.recipeName || d.recipe_name || d.name || d.title),
        })),
        portionControl: {
          visualGuides: visualGuideDocs.map((d) => ({
            food: asString(d.food || d.name),
            size: asString(d.size || d.portion || d.description),
          })),
          prePortioningStrategies: strategyDocs
            .map((d) => asString(d.strategy || d.text || d.description))
            .filter(Boolean),
        },
        warningSign: {
          title: asString(warningDoc?.title),
          intro: asString(warningDoc?.intro),
          signs: warningSignDocs.length > 0
            ? warningSignDocs
                .map((d) => asString(d.text || d.sign || d.description))
                .filter(Boolean)
            : asStringArray(warningDoc?.signs),
          footer: asString(warningDoc?.footer),
        },
      };

      return res.status(200).json({
        success: true,
        data: normalizeSnackingContent(splitContent),
        message: '',
      });
    }

    return res.status(200).json({
      success: true,
      data: DEFAULT_SNACKING_CONTENT,
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/mindful-snacking/content]', err);
    return res.status(500).json({
      success: false,
      data: DEFAULT_SNACKING_CONTENT,
      message: 'Unable to load mindful snacking content.',
    });
  }
});

export default router;
