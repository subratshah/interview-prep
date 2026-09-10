// Roadmap data for interview preparation (used by reference docs and available statically).
const RoadmapDB = (() => {
  const m = {
    android: [
      { milestone: 'Foundations', questions: ['tech-1','tech-2','tech-3','tech-6','tech-14','tech-15','tech-16','tech-17'] },
      { milestone: 'UI and state', questions: ['tech-11','tech-12','tech-13','tech-28','tech-41','tech-43','tech-44','tech-47'] },
      { milestone: 'Architecture and performance', questions: ['tech-7','tech-18','tech-19','tech-20','tech-22','tech-25','tech-26','tech-35','tech-37','tech-45','tech-49'] },
      { milestone: 'Advanced Android', questions: ['tech-27','tech-30','tech-31','tech-32','tech-33','tech-36','tech-38','tech-39','tech-40','tech-42','tech-46','tech-48','tech-50','tech-51','tech-52','tech-53','tech-54','tech-55','tech-56','tech-57'] },
    ],
    behavioral: [
      { milestone: 'Ownership and delivery', questions: ['behav-1','behav-2','behav-3','behav-10','behav-11','behav-12','behav-23','behav-28','behav-39','behav-40'] },
      { milestone: 'Collaboration', questions: ['behav-4','behav-5','behav-6','behav-22','behav-38','behav-41','behav-42'] },
      { milestone: 'Growth and culture', questions: ['behav-7','behav-8','behav-9','behav-13','behav-14','behav-15','behav-16','behav-17','behav-18','behav-19','behav-24','behav-25','behav-27','behav-29'] },
      { milestone: 'Leadership', questions: ['behav-20','behav-21','behav-30','behav-31','behav-32','behav-33','behav-34','behav-35','behav-36','behav-37'] },
    ],
    'data-structures': [
      { milestone: 'Basics', questions: ['ds-1','ds-2','ds-3','ds-4','ds-5','ds-6'] },
      { milestone: 'Intermediate', questions: ['ds-7','ds-8','ds-9','ds-10','ds-11','ds-12','ds-13','ds-14'] },
      { milestone: 'Advanced', questions: ['ds-15','ds-16','ds-17','ds-18','ds-19','ds-20','ds-21','ds-22','ds-23'] },
    ],
    'system-design': [
      { milestone: 'Core foundations', questions: ['sd-1','sd-2','sd-3','sd-4','sd-5','sd-6','sd-7','sd-8','sd-9','sd-10','sd-11','sd-12'] },
      { milestone: 'Distributed systems', questions: ['sd-13','sd-14','sd-15','sd-16','sd-17','sd-18','sd-19','sd-20'] },
      { milestone: 'Mobile-specific', questions: ['sd-14'] },
      { milestone: 'Platform/staff', questions: ['sd-21','sd-22','sd-23','sd-24','sd-25'] },
    ],
  };
  return {
    getRoadmap(t) { return m[t] || []; },
    getAllRoadmaps() { return m; },
    getQuestionIds(t) { return m[t]?.flatMap(s => s.questions) || []; },
  };
})();
