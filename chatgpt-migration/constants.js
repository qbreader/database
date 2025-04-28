const SUBCATEGORY_TO_CATEGORY = {
  'American Literature': 'Literature',
  'British Literature': 'Literature',
  'Classical Literature': 'Literature',
  'European Literature': 'Literature',
  'World Literature': 'Literature',
  'Other Literature': 'Literature',
  'American History': 'History',
  'Ancient History': 'History',
  'European History': 'History',
  'World History': 'History',
  'Other History': 'History',
  Biology: 'Science',
  Chemistry: 'Science',
  Physics: 'Science',
  'Other Science': 'Science',
  'Visual Fine Arts': 'Fine Arts',
  'Auditory Fine Arts': 'Fine Arts',
  'Other Fine Arts': 'Fine Arts',
  Religion: 'Religion',
  Mythology: 'Mythology',
  Philosophy: 'Philosophy',
  'Social Science': 'Social Science',
  'Current Events': 'Current Events',
  Geography: 'Geography',
  'Other Academic': 'Other Academic',
  Trash: 'Trash'
};
export const SUBCATEGORIES = Object.keys(SUBCATEGORY_TO_CATEGORY);

const CATEGORY_TO_ALTERNATE_SUBCATEGORY = {
  Literature: [
    'Drama',
    'Long Fiction',
    'Poetry',
    'Short Fiction',
    'Misc Literature'
  ]
};

const SUBCATEGORY_TO_SUBSUBCATEGORY = {
  'Other Science': [
    'Math',
    'Astronomy',
    'Computer Science',
    'Earth Science',
    'Engineering',
    'Misc Science'
  ],
  'Other Fine Arts': [
    'Architecture',
    'Dance',
    'Film',
    'Jazz',
    'Opera',
    'Photography',
    'Misc Arts'
  ],
  'Social Science': [
    'Anthropology',
    'Economics',
    'Linguistics',
    'Psychology',
    'Sociology',
    'Other Social Science'
  ]
};

export {
  SUBCATEGORY_TO_CATEGORY,
  CATEGORY_TO_ALTERNATE_SUBCATEGORY,
  SUBCATEGORY_TO_SUBSUBCATEGORY
};
