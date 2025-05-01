export const SUBCATEGORY_TO_CATEGORY = {
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
  Movies: 'Pop Culture',
  Music: 'Pop Culture',
  Sports: 'Pop Culture',
  Television: 'Pop Culture',
  'Video Games': 'Pop Culture',
  'Other Pop Culture': 'Pop Culture'
};
export const SUBCATEGORIES = Object.keys(SUBCATEGORY_TO_CATEGORY);

export const CATEGORY_TO_ALTERNATE_SUBCATEGORY = {
  Literature: [
    'Drama',
    'Long Fiction',
    'Poetry',
    'Short Fiction',
    'Misc Literature'
  ]
};

export const SUBCATEGORY_TO_SUBSUBCATEGORY = {
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
