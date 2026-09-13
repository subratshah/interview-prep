// Roadmap data for interview preparation (used by the roadmap pane in the detail
// panel, and available statically to anything else that wants a path).
//
// Milestones are DERIVED, never hand-listed: the unit of the path is a
// question's real `section`, so each topic below only declares the *order* of
// its bands. The id map this replaces had drifted hard — it covered 47 of 146
// Android ids, 41/68 behavioural, 23/46 data structures, 38/97 system design,
// and put `sd-14` in two milestones — because every edit to /data needed a
// matching edit here. Deriving removes the failure mode: a question with a
// section is on the path, and `getQuestionIds(topic)` is the topic's full id set.
const RoadmapDB = (() => {
  // Band order per topic, verified against this branch's data. Question counts
  // per band at the time of writing: android 14,29,21,16,12,11,25,18 = 146;
  // behavioral 12,9,13,17,17 = 68; data-structures 7,4,4,6,6,11,7,1 = 46;
  // system-design 12,24,34,9,10,8 = 97.
  //
  // A section that exists in the data but not in this list is appended in data
  // order (see build()), so forgetting to edit this array costs nothing but the
  // position of the new band — it can never hide a question. A listed section
  // that has no questions left is dropped rather than rendering an empty band.
  const SECTION_ORDER = {
    android: [
      'Kotlin',
      'Android Core',
      'Jetpack',
      'Concurrency',
      'Networking & Data',
      'Architecture',
      'Performance & Security',
      'Engineering',
    ],
    behavioral: [
      'Ownership',
      'Delivery',
      'Collaboration',
      'Growth & Culture',
      'Leadership',
    ],
    'data-structures': [
      'Arrays & Strings',
      'Hash Maps',
      'Linked Lists',
      'Stacks & Queues',
      'Sorting & Searching',
      'Trees & Graphs',
      'Dynamic Programming',
      'Concurrency',
    ],
    'system-design': [
      'Mobile',
      'Classic',
      'Infrastructure',
      'Architecture',
      'Frontend',
      'Staff / Platform',
    ],
  };

  // Built lazily and cached per topic. index.template.html loads every data file
  // before this one, so the first read normally sees the full registry; the
  // "nothing loaded yet" guard in getRoadmap() keeps a cache built against an
  // empty registry from ever being written.
  const cache = Object.create(null);

  function questionList() {
    const db = (typeof window !== 'undefined' && window.QuestionDB)
      || (typeof QuestionDB !== 'undefined' ? QuestionDB : null);
    return db && typeof db.all === 'function' ? db.all() : [];
  }

  function build(topic) {
    const bySection = new Map();
    (SECTION_ORDER[topic] || []).forEach(section => bySection.set(section, []));
    questionList().forEach(q => {
      if (q.type !== topic) return;
      const section = q.section;
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push(q.id);
    });
    const bands = [];
    bySection.forEach((ids, section) => {
      if (ids.length) bands.push({ milestone: section, questions: ids });
    });
    return bands;
  }

  function getRoadmap(topic) {
    if (!topic || !Object.prototype.hasOwnProperty.call(SECTION_ORDER, topic)) return [];
    if (!Object.prototype.hasOwnProperty.call(cache, topic)) {
      if (!questionList().length) return [];
      cache[topic] = build(topic);
    }
    return cache[topic];
  }

  function getAllRoadmaps() {
    const out = {};
    Object.keys(SECTION_ORDER).forEach(topic => { out[topic] = getRoadmap(topic); });
    return out;
  }

  function getQuestionIds(topic) {
    return getRoadmap(topic).reduce((ids, band) => ids.concat(band.questions), []);
  }

  return {
    getRoadmap(t) { return getRoadmap(t); },
    getAllRoadmaps() { return getAllRoadmaps(); },
    getQuestionIds(t) { return getQuestionIds(t); },
  };
})();
