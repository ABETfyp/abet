export const facultyMembers = [
  { id: 5,  name: 'Dr. Imad Moukadem',  rank: 'Professor',           department: 'Computer and Communications Engineering', email: 'imad.moukadem@aub.edu.lb' },
  { id: 6,  name: 'Dr. Lina Saab',      rank: 'Associate Professor', department: 'Computer and Communications Engineering', email: 'lina.saab@aub.edu.lb' },
  { id: 7,  name: 'Dr. Ali Hassan',     rank: 'Assistant Professor', department: 'Computer and Communications Engineering', email: 'ali.hassan@aub.edu.lb' },
  { id: 8,  name: 'Dr. Rami Zein',      rank: 'Associate Professor', department: 'Computer and Communications Engineering', email: 'rami.zein@aub.edu.lb' },
  { id: 9,  name: 'Dr. Maya Khouri',    rank: 'Assistant Professor', department: 'Computer and Communications Engineering', email: 'maya.khouri@aub.edu.lb' },
  { id: 10, name: 'Dr. Tarek Mansour',  rank: 'Professor',           department: 'Computer and Communications Engineering', email: 'tarek.mansour@aub.edu.lb' },
  { id: 11, name: 'Dr. Nadia Farhat',   rank: 'Associate Professor', department: 'Computer and Communications Engineering', email: 'nadia.farhat@aub.edu.lb' },
  { id: 12, name: 'Dr. Karim Wehbe',    rank: 'Assistant Professor', department: 'Computer and Communications Engineering', email: 'karim.wehbe@aub.edu.lb' },
  { id: 13, name: 'Dr. Rola Naja',      rank: 'Professor',           department: 'Computer and Communications Engineering', email: 'rola.naja@aub.edu.lb' },
  { id: 14, name: 'Dr. Hassan Artail',  rank: 'Professor',           department: 'Computer and Communications Engineering', email: 'hassan.artail@aub.edu.lb' },
  { id: 15, name: 'Dr. Mariette Awad',  rank: 'Associate Professor', department: 'Computer and Communications Engineering', email: 'mariette.awad@aub.edu.lb' },
  { id: 16, name: 'Dr. Fadi Karameh',   rank: 'Associate Professor', department: 'Computer and Communications Engineering', email: 'fadi.karameh@aub.edu.lb' },
  { id: 17, name: 'Dr. Samer Saab',     rank: 'Assistant Professor', department: 'Computer and Communications Engineering', email: 'samer.saab@aub.edu.lb' },
];

export const courses = [
  {
    id: 1,
    code: 'EECE 210',
    name: 'Electric Circuits',
    instructors: [
      { id: 5, name: 'Dr. Imad Moukadem', term: 'Fall 2026' },
      { id: 6, name: 'Dr. Lina Saab',     term: 'Fall 2027' },
    ]
  },
  {
    id: 2,
    code: 'EECE 230',
    name: 'Introduction to Programming and Problem Solving',
    instructors: [
      { id: 5, name: 'Dr. Imad Moukadem', term: 'Fall 2026' },
    ]
  },
  {
    id: 3,
    code: 'EECE 455',
    name: 'Computer Communication Networks',
    instructors: [
      { id: 6, name: 'Dr. Lina Saab', term: 'Fall 2026' },
    ]
  },
  {
    id: 9,
    code: 'EECE 301',
    name: 'Electromagnetics',
    instructors: [
      { id: 8, name: 'Dr. Rami Zein', term: 'Spring 2027' },
    ]
  },
  {
    id: 10,
    code: 'EECE 310',
    name: 'Digital Signal Processing',
    instructors: [
      { id: 8, name: 'Dr. Rami Zein', term: 'Fall 2026' },
    ]
  },
  {
    id: 11,
    code: 'EECE 340',
    name: 'Probability and Random Processes',
    instructors: [
      { id: 10, name: 'Dr. Tarek Mansour', term: 'Spring 2027' },
    ]
  },
  {
    id: 12,
    code: 'EECE 350',
    name: 'Computer Architecture',
    instructors: [
      { id: 9, name: 'Dr. Maya Khouri', term: 'Fall 2026' },
    ]
  },
  {
    id: 13,
    code: 'EECE 420',
    name: 'Wireless Communications',
    instructors: [
      { id: 10, name: 'Dr. Tarek Mansour', term: 'Spring 2027' },
    ]
  },
  {
    id: 14,
    code: 'EECE 435',
    name: 'Operating Systems',
    instructors: [
      { id: 9, name: 'Dr. Maya Khouri', term: 'Spring 2027' },
    ]
  },
  {
    id: 15,
    code: 'EECE 470',
    name: 'Network Security',
    instructors: [
      { id: 12, name: 'Dr. Karim Wehbe', term: 'Fall 2026' },
    ]
  },
  {
    id: 16,
    code: 'EECE 480',
    name: 'Machine Learning for Engineers',
    instructors: [
      { id: 11, name: 'Dr. Nadia Farhat', term: 'Spring 2027' },
    ]
  },
];
