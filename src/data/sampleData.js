export const facultyMembers = [
  { id: 1, name: 'Dr. Imad Moukadam', rank: 'Professor', department: 'CCE', email: 'imad.moukadam@aub.edu.lb' },
  { id: 2, name: 'Dr. Lina Saab', rank: 'Associate Professor', department: 'CCE', email: 'lina.saab@aub.edu.lb' },
  { id: 3, name: 'Dr. Ali Hassan', rank: 'Assistant Professor', department: 'CCE', email: 'ali.hassan@aub.edu.lb' }
];

export const courses = [
  {
    id: 1,
    code: 'EECE 210',
    name: 'Circuits I',
    instructors: [
      { id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' },
      { id: 2, name: 'Dr. Lina Saab', term: 'Spring 2026' }
    ]
  },
  {
    id: 2,
    code: 'EECE 311',
    name: 'Signals & Systems',
    instructors: [
      { id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' }
    ]
  },
  {
    id: 3,
    code: 'EECE 320',
    name: 'Digital Systems',
    instructors: [
      { id: 3, name: 'Dr. Ali Hassan', term: 'Spring 2026' }
    ]
  }
];
